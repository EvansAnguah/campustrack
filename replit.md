# CampusTrack - Location-Based Attendance System

## Overview

CampusTrack is a web-based location-based attendance system designed for tertiary institutions. The system enables lecturers to create GPS-bounded attendance sessions, and students can only mark attendance when physically present within a defined radius during an active session.

The application follows a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript (compiled with tsx)
- **API Design**: RESTful endpoints defined in `shared/routes.ts`
- **Session Management**: Express-session with MemoryStore (development) or connect-pg-simple (production)
- **Password Security**: Scrypt hashing with timing-safe comparison

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`db:push` command)

### Core Data Models
1. **Students**: Preloaded with index numbers, password set on first login
2. **Lecturers**: Admin users who create attendance sessions
3. **Courses**: Academic courses linked to lecturers
4. **Attendance Sessions**: GPS-bounded time windows for marking attendance
5. **Attendance Records**: Student attendance entries with location data
6. **User Sessions**: Device tracking for concurrent login control

### Authentication Flow
- Students authenticate using Index Number + Password
- First-time students create password during onboarding
- Device ID tracking prevents concurrent sessions
- Session-based authentication with secure cookies

### Geolocation Logic
- Haversine formula calculates distance between student and session location
- Configurable radius (in meters) per session
- Browser Geolocation API for client-side position

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui)
    hooks/        # Custom React hooks
    pages/        # Route pages
    lib/          # Utilities
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared code
  schema.ts       # Drizzle database schema
  routes.ts       # API type definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **Drizzle ORM**: Database queries and schema management

### Frontend Libraries
- **@tanstack/react-query**: Server state management
- **shadcn/ui + Radix UI**: Component primitives
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **date-fns**: Date formatting

### Backend Libraries
- **express-session**: Session management
- **memorystore**: In-memory session store for development
- **uuid**: Device ID generation

### Build Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development