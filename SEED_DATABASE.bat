@echo off
title EcoGuard AI - Database Seeder
color 0C
cd /d "%~dp0backend"
echo Seeding EcoGuard AI database with realistic demo data...
echo This will clear existing data and re-seed.
echo.
node scripts/seed.js
echo.
echo Database seeded! You can now start the application.
pause
