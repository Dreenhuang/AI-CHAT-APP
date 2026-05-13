@echo off
chcp 65001 >nul
title PRD Debate APP Launcher

set "BACKEND_PORT=9461"

echo ==========================================
echo   PRD Debate APP - Smart Launcher
echo ==========================================
echo.

:: Step 1: Kill any existing backend process
echo [1/5] Checking port %BACKEND_PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
    echo    [+] Port %BACKEND_PORT% in use, terminating process %%a...
    taskkill /F /PID %%a 2>nul
    timeout /t 1 /nobreak >nul
)
echo    [OK] Port %BACKEND_PORT% is available.
echo.

:: Step 2: Check and install backend dependencies
echo [2/5] Checking backend dependencies...
cd /d "%~dp0server"
if not exist "node_modules\express" (
    echo    [+] Installing backend dependencies...
    call bun install
) else (
    echo    [OK] Backend dependencies already installed.
)
echo.

:: Step 3: Start backend server
echo [3/5] Starting backend server on port %BACKEND_PORT%...
start "PRD-Debate-Backend" bun run start
timeout /t 3 /nobreak >nul
echo    [OK] Backend server started.
echo.

:: Step 4: Verify backend health
echo [4/5] Verifying backend service...
cd /d "%~dp0"
curl -s http://localhost:%BACKEND_PORT%/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Backend service is running normally.
    echo.
    echo ==========================================
    echo   All services started successfully!
    echo ==========================================
    echo   API Service:  http://localhost:%BACKEND_PORT%
    echo   AI API:      http://localhost:%BACKEND_PORT%/api/ai/health
    echo ==========================================
    echo.
    start http://localhost:%BACKEND_PORT%/api/health
) else (
    echo    [!] Backend service may still be starting...
    echo    Retrying...
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:%BACKEND_PORT%/api/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo    [OK] Backend service is now running.
    ) else (
        echo    [WARNING] Backend service did not start properly.
    )
)

echo.
echo ==========================================
echo   Tips:
echo   1. Backend API is at: localhost:%BACKEND_PORT%
echo   2. Health check at:   localhost:%BACKEND_PORT%/api/health
echo   3. To stop: close this window or press Ctrl+C in the backend terminal
echo   4. To start frontend (Expo), run separately: cd frontend ^&^& bun run start
echo ==========================================
echo.
echo Press any key to exit...
pause >nul
