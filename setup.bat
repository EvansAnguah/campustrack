@echo off
REM CampusTrack - Quick Setup Script for Windows

echo ========================================
echo CampusTrack - Local Setup Script
echo ========================================
echo.

REM Check if .env exists
if exist .env (
    echo [OK] .env file found
) else (
    echo [!] Creating .env file from template...
    copy .env.example .env
    echo.
    echo [ACTION REQUIRED] Please edit .env file and add your DATABASE_URL
    echo.
    pause
)

REM Check if node_modules exists
if exist node_modules (
    echo [OK] Dependencies already installed
) else (
    echo [!] Installing dependencies...
    call npm install
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your PostgreSQL connection string
echo 2. Run: npm run db:push (to initialize database)
echo 3. Run: npm run dev (to start development server)
echo.
echo For deployment, run: npm run build
echo.
pause
