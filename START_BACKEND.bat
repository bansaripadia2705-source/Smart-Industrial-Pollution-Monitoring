@echo off
title EcoGuard AI - Backend Server
color 0B
cd /d "%~dp0backend"
echo Starting EcoGuard AI Backend on port 5000...
node server.js
pause
