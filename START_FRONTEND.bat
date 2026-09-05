@echo off
title EcoGuard AI - Frontend
color 0E
cd /d "%~dp0frontend"
echo Starting EcoGuard AI Frontend on port 3000...
set BROWSER=none
npm start
pause
