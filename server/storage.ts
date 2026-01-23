import { db } from "./db";
import { 
  students, lecturers, courses, attendanceSessions, attendanceRecords, userSessions,
  type Student, type Lecturer, type Course, type AttendanceSession, type AttendanceRecord,
  type InsertStudent, type InsertLecturer, type InsertCourse, type InsertSession, type InsertRecord
} from "@shared/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudentByIndex(indexNumber: string): Promise<Student | undefined>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudentPassword(id: number, hash: string): Promise<Student>;
  
  // Lecturers
  getLecturerByUsername(username: string): Promise<Lecturer | undefined>;
  getLecturer(id: number): Promise<Lecturer | undefined>;
  createLecturer(lecturer: InsertLecturer): Promise<Lecturer>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCoursesByLecturer(lecturerId: number): Promise<Course[]>;

  // Sessions
  createSession(session: InsertSession): Promise<AttendanceSession>;
  getSession(id: number): Promise<AttendanceSession | undefined>;
  getActiveSessions(): Promise<(AttendanceSession & { course: Course })[]>;
  stopSession(id: number): Promise<AttendanceSession>;

  // Attendance
  createAttendanceRecord(record: InsertRecord): Promise<AttendanceRecord>;
  getAttendanceRecord(sessionId: number, studentId: number): Promise<AttendanceRecord | undefined>;
  getStudentHistory(studentId: number): Promise<(AttendanceRecord & { session: AttendanceSession, course: Course })[]>;
  getSessionRecords(sessionId: number): Promise<(AttendanceRecord & { student: Student })[]>;

  // User Sessions (Device Control)
  createUserSession(userId: number, userType: 'student' | 'lecturer', deviceId: string): Promise<void>;
  getActiveUserSession(userId: number, userType: 'student' | 'lecturer'): Promise<string | undefined>; // Returns deviceId
  invalidateUserSession(userId: number, userType: 'student' | 'lecturer'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudentByIndex(indexNumber: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.indexNumber, indexNumber));
    return student;
  }
  
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudentPassword(id: number, hash: string): Promise<Student> {
    const [student] = await db.update(students)
      .set({ password: hash, isRegistered: true })
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  // Lecturers
  async getLecturerByUsername(username: string): Promise<Lecturer | undefined> {
    const [lecturer] = await db.select().from(lecturers).where(eq(lecturers.username, username));
    return lecturer;
  }

  async getLecturer(id: number): Promise<Lecturer | undefined> {
    const [lecturer] = await db.select().from(lecturers).where(eq(lecturers.id, id));
    return lecturer;
  }

  async createLecturer(insertLecturer: InsertLecturer): Promise<Lecturer> {
    const [lecturer] = await db.insert(lecturers).values(insertLecturer).returning();
    return lecturer;
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async getCoursesByLecturer(lecturerId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.lecturerId, lecturerId));
  }

  // Sessions
  async createSession(insertSession: InsertSession): Promise<AttendanceSession> {
    const [session] = await db.insert(attendanceSessions).values(insertSession).returning();
    return session;
  }

  async getSession(id: number): Promise<AttendanceSession | undefined> {
    const [session] = await db.select().from(attendanceSessions).where(eq(attendanceSessions.id, id));
    return session;
  }

  async getActiveSessions(): Promise<(AttendanceSession & { course: Course })[]> {
    const results = await db.select({
      session: attendanceSessions,
      course: courses
    })
    .from(attendanceSessions)
    .innerJoin(courses, eq(attendanceSessions.courseId, courses.id))
    .where(and(
      eq(attendanceSessions.isActive, true),
      // Optional: check endTime if strictly enforced by DB query, otherwise logic is in route
    ));
    
    return results.map(r => ({ ...r.session, course: r.course }));
  }

  async stopSession(id: number): Promise<AttendanceSession> {
    const [session] = await db.update(attendanceSessions)
      .set({ isActive: false, endTime: new Date() })
      .where(eq(attendanceSessions.id, id))
      .returning();
    return session;
  }

  // Attendance
  async createAttendanceRecord(insertRecord: InsertRecord): Promise<AttendanceRecord> {
    const [record] = await db.insert(attendanceRecords).values(insertRecord).returning();
    return record;
  }

  async getAttendanceRecord(sessionId: number, studentId: number): Promise<AttendanceRecord | undefined> {
    const [record] = await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.sessionId, sessionId),
        eq(attendanceRecords.studentId, studentId)
      ));
    return record;
  }

  async getStudentHistory(studentId: number): Promise<(AttendanceRecord & { session: AttendanceSession, course: Course })[]> {
    const results = await db.select({
      record: attendanceRecords,
      session: attendanceSessions,
      course: courses
    })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
    .innerJoin(courses, eq(attendanceSessions.courseId, courses.id))
    .where(eq(attendanceRecords.studentId, studentId))
    .orderBy(attendanceRecords.timestamp);

    return results.map(r => ({ ...r.record, session: r.session, course: r.course }));
  }

  async getSessionRecords(sessionId: number): Promise<(AttendanceRecord & { student: Student })[]> {
    const results = await db.select({
      record: attendanceRecords,
      student: students
    })
    .from(attendanceRecords)
    .innerJoin(students, eq(attendanceRecords.studentId, students.id))
    .where(eq(attendanceRecords.sessionId, sessionId));

    return results.map(r => ({ ...r.record, student: r.student }));
  }

  // User Sessions (Device Control)
  async createUserSession(userId: number, userType: 'student' | 'lecturer', deviceId: string): Promise<void> {
    // Invalidate any existing active sessions for this user
    await this.invalidateUserSession(userId, userType);
    
    await db.insert(userSessions).values({
      userId,
      userType,
      deviceId,
      isActive: true,
      lastSeen: new Date()
    });
  }

  async getActiveUserSession(userId: number, userType: 'student' | 'lecturer'): Promise<string | undefined> {
    const [session] = await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.userType, userType),
        eq(userSessions.isActive, true)
      ));
    return session?.deviceId;
  }

  async invalidateUserSession(userId: number, userType: 'student' | 'lecturer'): Promise<void> {
    await db.update(userSessions)
      .set({ isActive: false })
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.userType, userType)
      ));
  }
}

export const storage = new DatabaseStorage();
