@echo off
chcp 65001 >nul 2>&1
title Admin Dashboard - PRD Debate System

echo ========================================
echo   Admin Dashboard Launcher
echo   PRD Debate System - Apple Design Style
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking port 9450 availability...
netstat -ano | findstr ":9450" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [WARN] Port 9450 is already in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9450" ^| findstr "LISTENING"') do (
        echo [INFO] Killing process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [2/3] Starting development server...
echo [INFO] Server will run on: http://localhost:9450
echo.

start "" http://localhost:9450

bun run dev

pause
