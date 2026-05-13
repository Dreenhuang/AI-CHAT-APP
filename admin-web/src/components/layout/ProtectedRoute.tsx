/**
 * Protected Route - 路由保护组件
 *
 * 功能说明：
 * - 检查用户是否已认证
 * - 未认证时重定向到登录页
 * - 认证时渲染目标组件
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, authStatus } = useAuth();
  const location = useLocation();

  // 正在加载认证状态（首次加载从localStorage恢复）
  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 未认证：重定向到登录页，保存原始路径
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // 已认证：渲染子组件
  return <>{children}</>;
}
