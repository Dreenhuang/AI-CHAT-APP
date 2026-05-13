@echo off
chcp 65001 >nul 2>&1
title Admin Frontend - One-Click Launcher

echo ========================================
echo   Admin Frontend - Quick Start Launcher
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking port 9450...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9450" ^| findstr "LISTENING"') do (
    echo     Port 9450 is in use by PID %%a. Terminating...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)
echo     Port 9450 is ready!
echo.

echo [2/4] Starting development server...
start "" bun run dev
timeout /t 3 /nobreak >nul
echo.
echo [3/4] Waiting for server to be ready...
timeout /t 4 /nobreak >nul
echo.
echo [4/4] Opening browser...
start http://localhost:9450
echo.
echo ========================================
echo   Server is running at:
echo   Local: http://localhost:9450
echo ========================================
echo.
echo Press any key to stop the server and exit...
pause >nul

echo.
echo Stopping server on port 9450...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9450" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Server stopped. Goodbye!
timeout /t 2 /nobreak >nul
