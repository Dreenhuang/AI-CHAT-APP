/**
 * ============================================
 * 主应用组件 - App.jsx
 * ============================================
 *
 * 功能：
 * - 配置 React Router v6 路由系统
 * - 集成布局组件（侧边栏 + 顶部导航）
 * - 路由守卫（登录验证）
 * - 懒加载页面组件（性能优化）
 *
 * 路由结构：
 * /login              - 登录页（公开）
 * /                   - 仪表盘（需登录）
 * /topics             - 议题管理
 * /users              - 用户管理
 * /audit-logs         - 审计日志
 * /config             - 系统配置
 * /souls              - Soul角色管理
 */

import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// 布局组件
import MainLayout from './components/layout/MainLayout'
import AuthGuard from './components/common/AuthGuard'

// 懒加载页面组件 - 代码分割优化
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Topics = lazy(() => import('./pages/Topics'))
const Users = lazy(() => import('./pages/Users'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Config = lazy(() => import('./pages/Config'))
const Souls = lazy(() => import('./pages/Souls'))

// 页面加载占位符
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-secondary">
      <div className="flex flex-col items-center gap-4">
        {/* Apple 风格加载动画 */}
        <div className="w-12 h-12 border-4 border-bg-tertiary border-t-primary rounded-full animate-spin" />
        <p className="text-text-secondary text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

/**
 * 主应用组件
 */
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 公开路由 - 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 受保护的路由 - 需要登录才能访问 */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          {/* 默认重定向到仪表盘 */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* 主要功能页面 */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="topics" element={<Topics />} />
          <Route path="users" element={<Users />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="config" element={<Config />} />
          <Route path="souls" element={<Souls />} />

          {/* 404 未找到路由 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* 兜底路由 - 重定向到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

/**
 * 404 页面未找到组件
 */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <h1 className="text-8xl font-bold text-gradient">404</h1>
      <h2 className="text-2xl font-semibold text-text-primary">Page Not Found</h2>
      <p className="text-text-secondary text-center max-w-md">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <a
        href="/dashboard"
        className="btn btn-primary"
      >
        返回首页
      </a>
    </div>
  )
}
