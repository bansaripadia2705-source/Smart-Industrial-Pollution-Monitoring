@echo off
title EcoGuard AI - Push to GitHub
color 0A

echo.
echo ================================================================
echo   EcoGuard AI - Push to GitHub
echo   Repo: Smart-Industrial-Pollution-Monitoring-for-Golden-Corridor
echo ================================================================
echo.
echo STEP 1: Get your GitHub Personal Access Token
echo   1. Go to: https://github.com/settings/tokens
echo   2. Click "Generate new token (classic)"
echo   3. Give it a name: EcoGuard-Push
echo   4. Check the "repo" checkbox
echo   5. Click "Generate token"
echo   6. COPY the token (starts with ghp_...)
echo.
set /p TOKEN="STEP 2: Paste your GitHub token here and press Enter: "

echo.
echo Pushing to GitHub...
git push https://Harshdi:%TOKEN%@github.com/Harshdi/Smart-Industrial-Pollution-Monitoring-for-Golden-Corridor-Vapi-Ankleswar-.git main

if %errorlevel% == 0 (
    echo.
    echo ================================================================
    echo   SUCCESS! Files pushed to GitHub!
    echo   View at: https://github.com/Harshdi/Smart-Industrial-Pollution-Monitoring-for-Golden-Corridor-Vapi-Ankleswar-
    echo ================================================================
    start https://github.com/Harshdi/Smart-Industrial-Pollution-Monitoring-for-Golden-Corridor-Vapi-Ankleswar-
) else (
    echo.
    echo ERROR: Push failed. Check your token and try again.
)
echo.
pause
