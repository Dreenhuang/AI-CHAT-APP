@echo off
chcp 65001 >nul 2>&1
title PRD Admin Dashboard - Dev Server

echo ========================================
echo   PRD Debate Management System
echo   Admin Dashboard - Development Server
echo ========================================
echo.

cd /d "%~dp0admin-web"

echo [1/3] Checking port 9516...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":9516" ^| findstr "LISTENING"') do (
    echo     Port 9516 is in use by PID %%a
    echo     Terminating process...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo     Port 9516 is ready.
echo.

echo [2/3] Starting development server...
echo.
start http://localhost:9516/
bun run dev

pause
