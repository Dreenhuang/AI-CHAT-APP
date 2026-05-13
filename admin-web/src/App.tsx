/**
 * App主应用组件
 *
 * 路由结构：
 * /login           -> 登录页（公开）
 * /dashboard       -> 仪表盘（需要认证）
 * /topics          -> 议题管理（需要认证）
 * /users           -> 用户管理（需要认证）
 * /logs            -> 操作日志（需要认证）
 * /settings        -> 系统配置（需要认证）
 * /roles           -> 角色权限（需要认证）
 * *                -> 重定向到/dashboard
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardPage from './pages/Dashboard/DashboardPage';

// ============================================
// 占位页面组件（后续实现）
// ============================================

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-2xl text-gray-400">🚧</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        该功能模块正在开发中，敬请期待...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 公开路由：登录页 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 受保护的路由：需要认证才能访问 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* 默认重定向到仪表盘 */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* 仪表盘 */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* 其他占位页面 */}
        <Route path="topics" element={<PlaceholderPage title="议题管理" />} />
        <Route path="users" element={<PlaceholderPage title="用户管理" />} />
        <Route path="logs" element={<PlaceholderPage title="操作日志" />} />
        <Route path="settings" element={<PlaceholderPage title="系统配置" />} />
        <Route path="roles" element={<PlaceholderPage title="角色权限" />} />
      </Route>

      {/* 404兜底重定向 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
