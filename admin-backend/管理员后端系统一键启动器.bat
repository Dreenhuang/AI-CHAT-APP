@echo off
chcp 65001 >nul 2>&1
title PRD Admin Backend - One Click Launcher

echo ============================================
echo   PRD Debate APP - Admin Backend System
echo   One Click Launcher v1.0
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Checking port 9450...
netstat -ano | findstr ":9450" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [INFO] Port 9450 is in use, stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9450" ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
        echo [OK] Stopped process %%a
    )
    timeout /t 1 >nul
) else (
    echo [OK] Port 9450 is available
)

echo.
echo [2/4] Starting Admin Backend Server...
echo [INFO] Port: 9450
echo [INFO] API Prefix: /api/admin/v1
echo [INFO] Test Account: admin / Admin@123456
echo.

start "Admin-Backend-Server" cmd /k "bun run src/index.js"

echo.
echo [3/4] Waiting for server to start...
timeout /t 3 >nul

curl -s http://localhost:9450/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Server started successfully!
) else (
    echo [WARN] Server may still be starting, please wait a moment...
)

echo.
echo [4/4] Opening browser...
start http://localhost:9450/docs

echo.
echo ============================================
echo   Startup Complete!
echo ============================================
echo.
echo   Service URLs:
echo   - Swagger Docs: http://localhost:9450/docs
echo   - Health Check: http://localhost:9450/health
echo   - Login API:    POST http://localhost:9450/api/admin/v1/auth/login
echo.
echo   Test Accounts:
echo   - Super Admin: admin     / Admin@123456
echo   - Operator:    operator  / Admin@123456
echo   - Viewer:      viewer    / Admin@123456
echo.
echo   Press any key to stop the server...
pause >nul

echo.
echo [STOP] Shutting down server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9450" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo [OK] Server stopped. Goodbye!

exit /b 0
