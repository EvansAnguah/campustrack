import { pgTable, text, serial, integer, boolean, timestamp, real, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ACTORS ===

// Students: Preloaded with Index Number. Password set on first login.
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  indexNumber: text("index_number").notNull().unique(),
  password: text("password"), // Nullable initially, set during onboarding
  name: text("name").notNull(),
  isRegistered: boolean("is_registered").default(false).notNull(), // True after password set
});

// Lecturers: Admins who create sessions
export const lecturers = pgTable("lecturers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

// === ACADEMIC ENTITIES ===

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., CS101
  name: text("name").notNull(),
  lecturerId: integer("lecturer_id").references(() => lecturers.id).notNull(),
});

// === ATTENDANCE LOGIC ===

export const attendanceSessions = pgTable("attendance_sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  latitude: decimal("latitude").notNull(), // High precision for GPS
  longitude: decimal("longitude").notNull(),
  radius: integer("radius").notNull(), // Meters
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"), // Null means active indefinitely until stopped
  isActive: boolean("is_active").default(true).notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => attendanceSessions.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  locationLat: decimal("location_lat").notNull(), // Recorded location at time of marking
  locationLng: decimal("location_lng").notNull(),
});

// === DEVICE & SESSION CONTROL ===

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userType: text("user_type").notNull(), // 'student' | 'lecturer'
  deviceId: text("device_id").notNull(), // Client-generated persistent ID
  socketId: text("socket_id"), // For realtime updates if needed
  isActive: boolean("is_active").default(true).notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// === RELATIONS ===

export const courseRelations = relations(courses, ({ one, many }) => ({
  lecturer: one(lecturers, {
    fields: [courses.lecturerId],
    references: [lecturers.id],
  }),
  sessions: many(attendanceSessions),
}));

export const sessionRelations = relations(attendanceSessions, ({ one, many }) => ({
  course: one(courses, {
    fields: [attendanceSessions.courseId],
    references: [courses.id],
  }),
  records: many(attendanceRecords),
}));

export const recordRelations = relations(attendanceRecords, ({ one }) => ({
  session: one(attendanceSessions, {
    fields: [attendanceRecords.sessionId],
    references: [attendanceSessions.id],
  }),
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, isRegistered: true });
export const insertLecturerSchema = createInsertSchema(lecturers).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertSessionSchema = createInsertSchema(attendanceSessions).omit({ id: true, isActive: true, startTime: true, endTime: true });
export const insertRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, timestamp: true });

// === EXPLICIT TYPES ===

export type Student = typeof students.$inferSelect;
export type Lecturer = typeof lecturers.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Auth Types
export const loginSchema = z.object({
  username: z.string(), // Index Number for students, Username for lecturers
  password: z.string(),
  role: z.enum(["student", "lecturer"]),
  deviceId: z.string(),
});

export const onboardSchema = z.object({
  indexNumber: z.string(),
  newPassword: z.string().min(6),
  deviceId: z.string(),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type OnboardRequest = z.infer<typeof onboardSchema>;

export type UserEntity = { type: 'student', data: Student } | { type: 'lecturer', data: Lecturer };
