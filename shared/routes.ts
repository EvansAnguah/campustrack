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
      input: insertCourseSchema.omit({ lecturerId: true }),
      responses: {
        201: z.custom<typeof courses.$inferSelect>(),
        90: z.object({ message: z.string() }), // Generic error type if unauthorized
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/courses/:id',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
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
  },
  students: {
    listWithStatus: {
      method: 'GET' as const,
      path: '/api/students/status',
      responses: {
        200: z.array(z.object({
          student: z.custom<typeof students.$inferSelect>(),
          status: z.enum(['attended', 'absent', 'off']),
          lastSessionId: z.number().optional(),
        })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students',
      input: z.object({
        name: z.string(),
        indexNumber: z.string(),
      }),
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        409: z.object({ message: z.string() }),
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/students/import',
      input: z.object({
        students: z.array(z.object({
          name: z.string(),
          indexNumber: z.string(),
        })),
      }),
      responses: {
        200: z.object({
          added: z.number(),
          updated: z.number(),
          skipped: z.number(),
          errors: z.array(z.string()),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  lecturers: {
    create: {
      method: 'POST' as const,
      path: '/api/lecturers',
      input: z.object({
        name: z.string(),
        username: z.string(),
        password: z.string().min(6),
      }),
      responses: {
        201: z.custom<typeof students.$inferSelect>(), // Using generic user type, reusing existing schema import
        409: z.object({ message: z.string() }),
      },
    },
  },
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
