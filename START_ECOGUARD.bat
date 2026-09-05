@echo off
title EcoGuard AI - Full Stack Launcher
color 0A

echo.
echo ================================================================
echo    EcoGuard AI - Smart Industrial Pollution Monitoring System
echo    IBM Agentic AI Hackathon 2024 - Challenge 9
echo ================================================================
echo.
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install from https://nodejs.org
    pause
    exit /b 1
)
echo      Node.js OK

echo [2/4] Seeding database with demo data...
cd backend
node scripts/seed.js
if errorlevel 1 (
    echo WARNING: Seed may have partially failed - continuing...
)
cd ..

echo [3/4] Starting Backend (port 5000)...
start "EcoGuard Backend" cmd /k "cd backend && node server.js"

echo      Waiting for backend to start...
timeout /t 4 /nobreak >nul

echo [4/4] Starting Frontend (port 3000)...
start "EcoGuard Frontend" cmd /k "cd frontend && set BROWSER=none && npm start"

echo.
echo ================================================================
echo    Both servers are starting up...
echo.
echo    Frontend : http://localhost:3000
echo    Backend  : http://localhost:5000
echo    API Docs : http://localhost:5000/api/health
echo.
echo    Login: admin@ecoguard.ai / Admin@123
echo ================================================================
echo.
echo    Tip: Wait 30-60 seconds for React to compile.
echo    Then open http://localhost:3000 in your browser.
echo.
pause
