@echo off
chcp 65001 >nul
title PRD Debate APP Launcher
color 0A

echo ══════════════════════════════════════════════════════════
echo   PRD Debate APP - One Click Launcher
echo   Version: 1.0.0
echo   Port: 9461 (Backend API)
echo ══════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/5] Checking port 9461...
netstat -ano | findstr ":9461" >nul 2>&1
if %errorlevel%==0 (
    echo [INFO] Port 9461 is in use, killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9461"') do (
        taskkill /pid %%a /f >nul 2>&1
    )
    echo [OK] Port 9461 released
) else (
    echo [OK] Port 9461 is available
)
echo.

echo [2/5] Installing dependencies (if needed)...
if not exist node_modules (
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)
echo.

echo [3/5] Starting Backend Server (Port 9461)...
if exist server (
    cd server
    if not exist node_modules (
        call npm install
    )
    start "PRD-Backend-9461" cmd /c "node index.js"
    cd ..
    timeout /t 3 /nobreak >nul
    echo [OK] Backend server starting on http://localhost:9461
) else (
    echo [WARN] Server directory not found, skipping backend...
)
echo.

echo [4/5] Starting Frontend Dev Server...
start "PRD-Frontend-Expo" cmd /c "npx expo start --web"
timeout /t 10 /nobreak >nul
echo [OK] Frontend server starting...
echo.

echo ══════════════════════════════════════════════════════════
echo   All services are starting up!
echo ══════════════════════════════════════════════════════════
echo.
echo   Services:
echo   - Backend API: http://localhost:9461/api/health
echo   - Frontend Web: http://localhost:19006 (or check terminal)
echo.
echo   Waiting for servers to be ready...
echo.

echo [5/5] Opening browser in 10 seconds...
timeout /t 10 /nobreak >nul

start http://localhost:19006

echo.
echo ══════════════════════════════════════════════════════════
echo   PRD Debate APP is now running!
echo   Press any key to stop all services and exit...
echo ══════════════════════════════════════════════════════════
pause >nul

echo.
echo Stopping services...
taskkill /fi "WINDOWTITLE eq PRD-Backend-9461*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq PRD-Frontend-Expo*" /f >nul 2>&1
echo [OK] Services stopped
echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
