@echo off
chcp 65001 >nul 2>&1
title AI Chat Frontend Server
echo ========================================
echo   AI Chat - Frontend Dev Server
echo ========================================
echo.
cd /d "g:\ai-gongju\prd-debate\aichat-app"
echo Starting Expo Web Server...
echo.
npx expo start --web --port 19006
pause