@echo off
chcp 65001 >nul
title PRD Debate App - AI Chat Platform
setlocal enabledelayedexpansion

echo ========================================
echo    PRD Debate App - AI Chat Platform
echo   一键启动器
echo ========================================
echo.

:: 获取脚本所在目录
cd /d "%~dp0"

echo [信息] 正在检测端口 8082...
netstat -ano | findstr :8082 >nul 2>&1
if %errorlevel% equ 0 (
    echo [警告] 端口 8082 已被占用，正在尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082') do (
        if not "%%a"=="" (
            set "pid=%%a"
            set "pid=!pid:* =!"
            if not "!pid!"=="" (
                taskkill /F /PID !pid! >nul 2>&1
            )
        )
    )
    timeout /t 2 /nobreak >nul
)

echo [信息] 正在启动 Expo Web 开发服务器...
echo [信息] 访问地址: http://localhost:8082
echo [信息] 按 Ctrl+C 停止服务器
echo.

start http://localhost:8082

npx expo start --web --port 8082

if %errorlevel% neq 0 (
    echo [错误] 启动失败，请检查依赖是否安装
    echo [提示] 请运行: bun install
    pause
)

endlocal
