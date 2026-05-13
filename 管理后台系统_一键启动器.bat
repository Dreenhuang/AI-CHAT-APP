@echo off
chcp 65001 >nul
title 🚀 PRD辩论APP - 管理后台系统 (SuperPower Mode)
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║     🎯 PRD辩论APP - 管理后台系统 一键启动器 v2.0           ║
echo ║     🎨 Apple风格设计 | SuperPower多Agent开发                 ║
echo ║                                                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 检查Node.js/Bun环境
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Bun 运行时
    echo 请先安装 Bun: https://bun.sh
    pause
    exit /b 1
)

echo ✅ 检测到 Bun 环境
echo.

:: ============================================
:: 启动后端服务 (端口 9450)
:: ============================================
echo [1/2] 📦 正在启动后端API服务...
echo        端口: 9450
echo        地址: http://localhost:9450
echo.

cd /d "%~dp0admin-backend"
start "Admin-Backend-API" cmd /k "bun run src/index.js"

:: 等待后端启动
timeout /t 3 /nobreak >nul

echo.
echo ✅ 后端服务已启动!
echo.

:: ============================================
:: 启动前端服务 (端口 5173)
:: ============================================
echo [2/2] 🎨 正在启动前端管理界面...
echo        端口: 5173
echo        地址: http://localhost:5173
echo.

cd /d "%~dp0admin-frontend"
start "Admin-Frontend-UI" cmd /k "bun run dev"

:: 等待前端启动
timeout /t 4 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║     🎉 所有服务已成功启动!                                   ║
echo ║                                                              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║     📍 前端管理界面: http://localhost:5173                   ║
echo ║     📍 后端API服务: http://localhost:9450                    ║
echo ║     📍 API文档:     http://localhost:9450/docs               ║
echo ║                                                              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║     🔑 测试账号:                                             ║
echo ║        用户名: admin                                         ║
echo ║        密码:   Admin@123456                                  ║
echo ║                                                              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║     📚 功能模块:                                             ║
echo ║        ✓ 登录认证系统                                        ║
echo ║        ✓ 数据可视化仪表盘                                    ║
echo ║        ✓ 议题管理 (CRUD)                                     ║
echo ║        ✓ 用户管理系统                                        ║
echo ║        ✓ 审计日志查看                                        ║
echo ║        ✓ 系统配置中心                                        ║
echo ║        ✓ Soul角色管理                                       ║
echo ║                                                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 自动打开浏览器
echo 🌐 正在打开浏览器...
start http://localhost:5173

echo.
echo 💡 提示:
echo    - 按 Ctrl+C 可停止当前窗口的服务
echo    - 关闭此窗口不会影响已启动的服务
echo    - 如需重启服务，请关闭对应命令行窗口后重新运行本脚本
echo.

pause
