# CampusTrack - Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies (✅ DONE)
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Initialize database
npm run db:push

# 4. Start development server
npm run dev
```

Visit: http://localhost:5000

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema to PostgreSQL |

---

## 🗄️ Database Setup Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL, then:
createdb campustrack
# Update .env with: postgresql://postgres:password@localhost:5432/campustrack
```

### Option 2: Cloud Database (Recommended)

**Neon (Free)** - https://neon.tech
- Sign up → Create project → Copy connection string
- Paste into `.env` as `DATABASE_URL`

**Supabase (Free)** - https://supabase.com
- Create project → Settings → Database → Connection string
- Use "Connection pooling" string for better performance

**Railway (Free $5/month)** - https://railway.app
- New Project → Add PostgreSQL → Copy `DATABASE_URL`

---

## 🔐 Environment Variables

Required in `.env`:

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
```

Generate secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Deployment Quick Guide

### Railway (Easiest)
```bash
npm i -g @railway/cli
railway login
railway init
railway add  # Select PostgreSQL
railway up
```

### Render
1. Go to https://render.com
2. New → Web Service
3. Connect repo
4. Build: `npm run build`
5. Start: `npm start`
6. Add PostgreSQL from dashboard
7. Set environment variables

### Vercel + Neon
```bash
# Set up Neon database first
npx vercel
# Add DATABASE_URL in Vercel dashboard
```

---

## 🧪 Testing Checklist

After setup:
- [ ] Server starts without errors
- [ ] Frontend loads at http://localhost:5000
- [ ] Database connection successful
- [ ] Can create lecturer account
- [ ] Can create student account
- [ ] Can create attendance session
- [ ] Geolocation permission works

---

## 🐛 Common Issues

**"DATABASE_URL not found"**
- Create `.env` file
- Add `DATABASE_URL=postgresql://...`

**"Port 5000 already in use"**
- Change `PORT=5001` in `.env`
- Or kill process: `npx kill-port 5000`

**Database connection fails**
- Check PostgreSQL is running
- Verify connection string format
- Test with: `psql <DATABASE_URL>`

**Build errors**
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📁 Project Structure

```
Attendance/
├── client/src/          # React frontend
│   ├── components/      # UI components
│   ├── pages/          # Route pages
│   └── hooks/          # Custom hooks
├── server/             # Express backend
│   ├── index.ts        # Entry point
│   ├── routes.ts       # API handlers
│   └── storage.ts      # Database ops
├── shared/             # Shared code
│   ├── schema.ts       # DB schema
│   └── routes.ts       # API types
└── .env               # Environment config
```

---

## 🔗 Useful Links

- **Setup Guide**: See `setup_guide.md` in artifacts
- **Deployment Checklist**: See `deployment_checklist.md` in artifacts
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team/
- **React Query**: https://tanstack.com/query/latest

---

## 📞 Next Steps

1. ✅ Dependencies installed
2. ⏳ Create `.env` file
3. ⏳ Set up PostgreSQL database
4. ⏳ Run `npm run db:push`
5. ⏳ Start with `npm run dev`
6. ⏳ Test the application
7. ⏳ Build for production
8. ⏳ Deploy!
