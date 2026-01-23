import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import memorystore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const MemoryStore = memorystore(session);

// Distance Calculation (Haversine Formula)
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Password Hashing Helper
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(stored: string, supplied: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Session Middleware
  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    secret: 'attendance_secret_key_123', // In production, use environment variable
  }));

  // === AUTHENTICATION ROUTES ===

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password, role, deviceId } = api.auth.login.input.parse(req.body);

      // 1. Authenticate Credentials
      let user: any;
      if (role === 'student') {
        user = await storage.getStudentByIndex(username);
        // Special check: if not registered (no password yet), they must Onboard first
        if (user && !user.isRegistered) {
          return res.status(401).json({ message: "Account not activated. Please use 'First Time' onboarding." });
        }
      } else {
        user = await storage.getLecturerByUsername(username);
      }

      if (!user || !(await comparePassword(user.password, password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 2. Device Control Check
      const activeDeviceId = await storage.getActiveUserSession(user.id, role);
      if (activeDeviceId && activeDeviceId !== deviceId) {
         // Strict rule: "If a device already has an active session: Block new login attempts from that device"
         // Wait, requirement says: "One device can not login two different account only if the session starts even when student logs out and tries to login another account" - this is slightly ambiguous.
         // Let's interpret "Block new login attempts from that device" as blocking THIS login if ANOTHER session exists.
         // Actually, standard security is: Invalidate old session OR Block new one.
         // Req: "If a device already has an active session: Block new login attempts from that device" - This usually means if User A is logged in on Device 1, User A cannot login on Device 2.
         // AND "One device may have ONLY ONE active session at a time"
         
         // Let's go with: If user is active elsewhere, block this login.
         return res.status(409).json({ message: "You have an active session on another device. Log out there first." });
      }

      // 3. Create Session
      await storage.createUserSession(user.id, role, deviceId);
      
      // Store in Express Session
      (req.session as any).user = { id: user.id, role, deviceId };
      req.session.save();

      res.json({ user, role });
    } catch (err) {
      res.status(400).json({ message: "Invalid Request" });
    }
  });

  app.post(api.auth.logout.path, async (req, res) => {
    if ((req.session as any).user) {
      const { id, role } = (req.session as any).user;
      await storage.invalidateUserSession(id, role);
      req.session.destroy(() => {});
    }
    res.json({ message: "Logged out" });
  });

  app.post(api.auth.onboard.path, async (req, res) => {
    try {
      const { indexNumber, newPassword, deviceId } = api.auth.onboard.input.parse(req.body);
      
      const student = await storage.getStudentByIndex(indexNumber);
      if (!student) {
        return res.status(404).json({ message: "Index Number not found in system." });
      }

      if (student.isRegistered) {
        return res.status(400).json({ message: "Account already registered. Please login." });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedStudent = await storage.updateStudentPassword(student.id, hashedPassword);

      // Auto-login after onboarding? Or require login? Let's require login for security flow.
      res.json(updatedStudent);

    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if ((req.session as any).user) {
      // In a real app, fetch fresh user data
      res.json({ user: (req.session as any).user, role: (req.session as any).user.role });
    } else {
      res.json(null);
    }
  });


  // === ATTENDANCE & SESSION ROUTES ===

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireLecturer = (req: any, res: any, next: any) => {
    if (req.session.user?.role !== 'lecturer') return res.status(401).json({ message: "Lecturers only" });
    next();
  };

  app.get(api.courses.list.path, requireAuth, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });
  
  app.post(api.courses.create.path, requireAuth, requireLecturer, async (req, res) => {
      try {
        const input = api.courses.create.input.parse(req.body);
        const course = await storage.createCourse(input);
        res.status(201).json(course);
      } catch (err) {
          res.status(400).json({ message: "Validation error" });
      }
  });

  app.get(api.sessions.listActive.path, requireAuth, async (req, res) => {
    const sessions = await storage.getActiveSessions();
    res.json(sessions);
  });

  app.post(api.sessions.create.path, requireAuth, requireLecturer, async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.post(api.sessions.stop.path, requireAuth, requireLecturer, async (req, res) => {
    const id = parseInt(req.params.id);
    const session = await storage.stopSession(id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  });

  app.post(api.attendance.mark.path, requireAuth, async (req, res) => {
    try {
      const { sessionId, lat, lng, deviceId } = api.attendance.mark.input.parse(req.body);
      const user = req.session.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: "Only students can mark attendance" });
      }

      // 1. Validate Session
      const session = await storage.getSession(sessionId);
      if (!session || !session.isActive) {
        return res.status(400).json({ message: "Session is not active" });
      }

      // 2. Validate Device (Must match login device)
      if (user.deviceId !== deviceId) {
        return res.status(401).json({ message: "Device mismatch. Please login again." });
      }

      // 3. Validate Location (Geofence)
      const distance = getDistanceFromLatLonInM(lat, lng, parseFloat(session.latitude), parseFloat(session.longitude));
      if (distance > session.radius) {
        return res.status(400).json({ 
          message: `You are too far away! Distance: ${Math.round(distance)}m. Allowed: ${session.radius}m.` 
        });
      }

      // 4. Check for Duplicate
      const existing = await storage.getAttendanceRecord(sessionId, user.id);
      if (existing) {
        return res.status(409).json({ message: "Attendance already marked for this session." });
      }

      // 5. Mark Attendance
      const record = await storage.createAttendanceRecord({
        sessionId,
        studentId: user.id,
        locationLat: lat.toString(),
        locationLng: lng.toString()
      });

      res.status(201).json(record);
    } catch (err) {
       console.error(err);
       res.status(500).json({ message: "Failed to mark attendance" });
    }
  });
  
  app.get(api.attendance.history.path, requireAuth, async (req, res) => {
      const user = req.session.user;
      if (user.role !== 'student') return res.status(403).json({ message: "Students only" });
      const history = await storage.getStudentHistory(user.id);
      res.json(history);
  });

  app.get(api.attendance.report.path, requireAuth, requireLecturer, async (req, res) => {
     const sessionId = parseInt(req.params.sessionId);
     const records = await storage.getSessionRecords(sessionId);
     res.json(records);
  });

  app.post(api.students.import.path, requireAuth, requireLecturer, async (req, res) => {
    try {
      const { students: studentData } = api.students.import.input.parse(req.body);
      let added = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const data of studentData) {
        try {
          const result = await storage.upsertStudent(data.indexNumber, data.name);
          if (result.type === 'added') added++;
          else if (result.type === 'updated') updated++;
          else skipped++;
        } catch (err) {
          errors.push(`Failed to import ${data.indexNumber}: ${(err as Error).message}`);
        }
      }

      res.json({ added, updated, skipped, errors });
    } catch (err) {
      res.status(400).json({ message: "Invalid student data format" });
    }
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const students = await storage.getStudentByIndex("ST001");
  if (!students) {
    console.log("Seeding database...");
    
    // Seed Lecturers
    const lectPass = await hashPassword("admin123");
    await storage.createLecturer({
      username: "prof.doe",
      password: lectPass,
      name: "Professor John Doe"
    });
    
    const lecturer = await storage.getLecturerByUsername("prof.doe");
    
    if (lecturer) {
        // Seed Courses
        await storage.createCourse({
          code: "CS101",
          name: "Intro to Computer Science",
          lecturerId: lecturer.id
        });
        await storage.createCourse({
          code: "ENG202",
          name: "Advanced Engineering",
          lecturerId: lecturer.id
        });
    }

    // Seed Students (Unregistered)
    await storage.createStudent({
      indexNumber: "ST001",
      name: "Alice Student",
      password: null, // Not set yet
      isRegistered: false
    });

    await storage.createStudent({
      indexNumber: "ST002",
      name: "Bob Scholar",
      password: null,
      isRegistered: false
    });
    
    // Seed a registered student for easy testing
    const stuPass = await hashPassword("student123");
    await storage.createStudent({
      indexNumber: "ST999",
      name: "Test Student (Registered)",
      password: stuPass,
      isRegistered: true
    });
    
    console.log("Seeding complete.");
  }
}
