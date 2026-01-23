import { z } from 'zod';
import { 
  insertSessionSchema, 
  insertCourseSchema, 
  attendanceSessions, 
  attendanceRecords,
  courses,
  students,
  loginSchema,
  onboardSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.object({ 
          user: z.union([z.custom<typeof students.$inferSelect>(), z.custom<typeof courses.$inferSelect>()]), // Generic user object
          role: z.enum(['student', 'lecturer']),
          token: z.string().optional() // If using tokens, otherwise session cookie
        }),
        401: errorSchemas.unauthorized,
        409: errorSchemas.conflict, // For concurrent session limits
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    onboard: { // Student first-time setup
      method: 'POST' as const,
      path: '/api/auth/onboard',
      input: onboardSchema,
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({ 
          user: z.any(), // Polymorphic user
          role: z.enum(['student', 'lecturer'])
        }).nullable(),
      },
    }
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses',
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/courses',
      input: insertCourseSchema,
      responses: {
        201: z.custom<typeof courses.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  sessions: {
    listActive: {
      method: 'GET' as const,
      path: '/api/sessions/active',
      responses: {
        200: z.array(z.object({
          session: z.custom<typeof attendanceSessions.$inferSelect>(),
          course: z.custom<typeof courses.$inferSelect>(),
        })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sessions',
      input: insertSessionSchema,
      responses: {
        201: z.custom<typeof attendanceSessions.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    stop: {
      method: 'POST' as const,
      path: '/api/sessions/:id/stop',
      responses: {
        200: z.custom<typeof attendanceSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  attendance: {
    mark: {
      method: 'POST' as const,
      path: '/api/attendance',
      input: z.object({
        sessionId: z.number(),
        lat: z.number(),
        lng: z.number(),
        deviceId: z.string(),
      }),
      responses: {
        201: z.custom<typeof attendanceRecords.$inferSelect>(),
        400: z.object({ message: z.string() }), // Out of range, etc.
        409: z.object({ message: z.string() }), // Duplicate
      },
    },
    history: { // For student to view their own
      method: 'GET' as const,
      path: '/api/attendance/history',
      responses: {
        200: z.array(z.object({
          record: z.custom<typeof attendanceRecords.$inferSelect>(),
          session: z.custom<typeof attendanceSessions.$inferSelect>(),
          course: z.custom<typeof courses.$inferSelect>(),
        })),
      },
    },
    report: { // For lecturers
      method: 'GET' as const,
      path: '/api/attendance/report/:sessionId',
      responses: {
        200: z.array(z.object({
          student: z.custom<typeof students.$inferSelect>(),
          record: z.custom<typeof attendanceRecords.$inferSelect>(),
        })),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
