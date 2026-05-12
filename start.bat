@echo off
chcp 65001 >nul
title PRD Debate APP Launcher

echo ==========================================
echo   PRD Debate APP Launcher
echo ==========================================
echo.

:: Step 1: Kill any existing process on port 9461
echo [1/4] Checking port 9461...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9461 ^| findstr LISTENING') do (
    echo    Port 9461 in use, killing PID %%a...
    taskkill /F /PID %%a 2>nul
    timeout /t 1 /nobreak >nul
)
echo    Port 9461 is available.
echo.

:: Step 2: Install backend dependencies if needed
echo [2/4] Checking backend dependencies...
cd /d "%~dp0server"
if not exist "node_modules\express" (
    echo    Installing backend dependencies...
    call bun install
) else (
    echo    Backend dependencies already installed.
)
echo.

:: Step 3: Start backend server
echo [3/4] Starting backend server on port 9461...
start "PRD-Debate-Backend" bun run start
timeout /t 3 /nobreak >nul
echo    Backend server started.
echo.

:: Step 4: Verify backend service
echo [4/4] Verifying backend service...
curl -s http://localhost:9461/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    Backend service is running normally.
    echo.
    echo ==========================================
    echo   All services started successfully!
    echo ==========================================
    echo   API Service:  http://localhost:9461
    echo   Health Check: http://localhost:9461/api/health
    echo   AI API:      http://localhost:9461/api/ai/health
    echo ==========================================
    echo.
    echo   Opening browser for verification...
    start http://localhost:9461/api/health
) else (
    echo    [WARNING] Backend service may not be ready yet.
    echo    Please wait a moment and check manually.
    echo    Try: http://localhost:9461/api/health
    timeout /t 3 /nobreak >nul
    start http://localhost:9461/api/health
)
echo.

echo Press any key to exit...
pause >nul
