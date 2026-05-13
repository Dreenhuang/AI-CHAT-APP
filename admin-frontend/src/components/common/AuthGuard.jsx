/**
 * ============================================
 * 路由守卫组件 - AuthGuard.jsx
 * ============================================
 *
 * 功能：
 * - 检查用户是否已登录
 * - 未登录时重定向到登录页
 * - 保护需要认证的路由
 *
 * 使用方式：
 * <Route path="/dashboard" element={
 *   <AuthGuard>
 *     <Dashboard />
 *   </AuthGuard>
 * } />
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * 认证状态检查函数
 * TODO: 替换为真实的认证逻辑（如从 localStorage、Cookie 或 Context 获取）
 */
function isAuthenticated() {
  // 开发阶段：暂时返回 true，允许访问所有页面
  // 生产环境：应该检查有效的 token 或 session
  const token = localStorage.getItem('admin_token')
  return !!token || import.meta.env.DEV
}

/**
 * 路由守卫组件
 *
 * @param {React.ReactNode} children - 子组件（受保护的路由内容）
 */
export default function AuthGuard({ children }) {
  const location = useLocation()

  // 检查用户是否已登录
  if (!isAuthenticated()) {
    // 未登录，重定向到登录页，并保存当前路径以便登录后跳回
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // 已登录，渲染子组件
  return children
}
