# 🎓 CampusTrack - Location-Based Attendance System

A modern, GPS-enabled attendance tracking system designed for tertiary institutions. Lecturers can create location-bounded attendance sessions, and students can only mark attendance when physically present within a defined radius.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## ✨ Features

### For Lecturers
- 📍 Create GPS-bounded attendance sessions with configurable radius
- ⏰ Set time windows for attendance marking
- 📊 Real-time attendance tracking and analytics
- 📈 View attendance reports and statistics
- 👥 Manage courses and enrolled students

### For Students
- 📱 Mark attendance using device geolocation
- 🎯 Only mark when physically present within session radius
- 📅 View attendance history and statistics
- 🔔 Real-time session notifications
- 📊 Track personal attendance rate and streaks

### Technical Features
- 🔐 Secure authentication with session management
- 🌍 Haversine formula for accurate distance calculation
- 📱 Responsive design for mobile and desktop
- ⚡ Real-time updates with optimistic UI
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🔄 Type-safe API with shared TypeScript definitions

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (v22.19.0 installed ✅)
- npm 10+ (v10.9.3 installed ✅)
- PostgreSQL database (local or cloud)

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd c:\Users\THINKPAD\Downloads\Attendance_system\Attendance
   ```

2. **Install dependencies** ✅ DONE
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   copy .env.example .env
   
   # Edit .env and add your database URL
   # DATABASE_URL=postgresql://username:password@localhost:5432/campustrack
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5000
   ```

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema to PostgreSQL |

---

## 🗄️ Database Setup

### Option 1: Cloud Database (Recommended)

Choose a free PostgreSQL provider:

**🟢 Neon** (Recommended)
- Visit: https://neon.tech
- Create account → New project → Copy connection string
- Paste into `.env` as `DATABASE_URL`

**🟢 Supabase**
- Visit: https://supabase.com
- Create project → Settings → Database
- Use "Connection pooling" string for better performance

**🟢 Railway**
- Visit: https://railway.app
- New Project → Add PostgreSQL
- Copy `DATABASE_URL` from variables

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL from https://www.postgresql.org/download/windows/

# Create database
createdb campustrack

# Update .env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/campustrack
```

---

## 🏗️ Project Structure

```
Attendance/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # shadcn/ui components
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Route pages
│       └── lib/           # Utilities
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Database operations
│   └── db.ts             # Database connection
├── shared/               # Shared TypeScript code
│   ├── schema.ts         # Drizzle ORM schema
│   └── routes.ts         # API type definitions
├── .env.example          # Environment template
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
└── drizzle.config.ts     # Database configuration
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Wouter** - Lightweight routing
- **TanStack Query** - Server state management
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database toolkit
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **express-session** - Session management

### Build Tools
- **Vite** - Frontend bundler
- **esbuild** - Production bundling
- **tsx** - TypeScript execution

---

## 🌐 Deployment

### Quick Deploy Options

#### Railway (Easiest)
```bash
npm i -g @railway/cli
railway login
railway init
railway add  # Select PostgreSQL
railway up
```

#### Render
1. Create account at https://render.com
2. New Web Service → Connect repo
3. Build: `npm run build`
4. Start: `npm start`
5. Add PostgreSQL from dashboard
6. Set environment variables

#### Vercel + Neon
```bash
# Set up Neon database first
npx vercel
# Configure DATABASE_URL in Vercel dashboard
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql://[production-url]
NODE_ENV=production
SESSION_SECRET=[generate-strong-secret]
PORT=5000
```

Generate secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 Security Features

- ✅ Scrypt password hashing
- ✅ Timing-safe password comparison
- ✅ Session-based authentication
- ✅ Secure cookie configuration
- ✅ Device ID tracking
- ✅ Concurrent session prevention
- ✅ Environment variable protection

---

## 📊 Database Schema

### Core Tables

1. **students** - Student records with index numbers
2. **lecturers** - Lecturer/admin accounts
3. **courses** - Academic courses
4. **attendance_sessions** - GPS-bounded time windows
5. **attendance_records** - Student attendance entries
6. **user_sessions** - Device tracking

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Frontend loads correctly
- [ ] Database connection works
- [ ] Lecturer can create account
- [ ] Student can create account
- [ ] Attendance session creation works
- [ ] Geolocation permission granted
- [ ] Distance calculation accurate
- [ ] Attendance marking successful

---

## 🐛 Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check DATABASE_URL format
# postgresql://username:password@host:port/database

# Test connection
psql "postgresql://..."
```

**Port 5000 already in use**
```bash
# Change PORT in .env
PORT=5001

# Or kill the process
npx kill-port 5000
```

**Build errors**
```bash
# Clear and reinstall
rm -rf node_modules dist
npm install
npm run build
```

**TypeScript errors**
```bash
# Run type checking
npm run check
```

---

## 📚 Documentation

- **[Setup Guide](QUICKSTART.md)** - Detailed setup instructions
- **[Deployment Checklist](deployment_checklist.md)** - Production deployment guide
- **[Architecture Overview](replit.md)** - System architecture details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎯 Next Steps

1. ✅ Dependencies installed
2. ⏳ Create `.env` file with database credentials
3. ⏳ Run `npm run db:push` to initialize database
4. ⏳ Start development server with `npm run dev`
5. ⏳ Test the application
6. ⏳ Build for production with `npm run build`
7. ⏳ Deploy to your chosen platform

---

## 📞 Support

For issues or questions:
- Check the [QUICKSTART.md](QUICKSTART.md) guide
- Review the [deployment_checklist.md](deployment_checklist.md)
- Check the database schema in `shared/schema.ts`
- Review API routes in `shared/routes.ts`

---

**Built with ❤️ for modern educational institutions**
