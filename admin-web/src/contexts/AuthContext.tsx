/**
 * AuthContext - 认证状态管理
 *
 * 功能说明：
 * - 管理用户登录状态、Token存储
 * - 提供login/logout方法
 * - 自动从localStorage恢复登录状态
 * - 401错误时自动登出
 *
 * 使用方式：
 * const { login, logout, user, isAuthenticated } = useAuth();
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import type { AdminUser, AuthStatus } from '@/types/auth';

// ============================================
// 类型定义
// ============================================

interface AuthContextType {
  /** 当前用户信息 */
  user: AdminUser | null;
  /** JWT Token */
  token: string | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 认证状态（用于UI loading等） */
  authStatus: AuthStatus;
  /** 登录方法 */
  login: (username: string, password: string) => Promise<void>;
  /** 登出方法 */
  logout: () => Promise<void>;
  /** 获取当前用户信息 */
  fetchProfile: () => Promise<void>;
}

// ============================================
// Context创建
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage Key常量
const TOKEN_KEY = 'prd_admin_token';
const USER_KEY = 'prd_admin_user';

// ============================================
// AuthProvider组件
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  
  // 注意：useNavigate需要在Router内部使用，这里用函数式调用避免问题
  const navigate = useNavigate();

  /**
   * 初始化：从localStorage恢复登录状态
   */
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as AdminUser;
        setToken(savedToken);
        setUser(parsedUser);
        setAuthStatus('authenticated');
      } catch {
        // 解析失败，清除无效数据
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAuthStatus('unauthenticated');
      }
    } else {
      setAuthStatus('unauthenticated');
    }
  }, []);

  /**
   * 登录方法
   *
   * @param username - 用户名
   * @param password - 密码
   */
  const login = useCallback(async (username: string, password: string) => {
    setAuthStatus('loading');

    try {
      const response = await authApi.login({ username, password });

      // 存储Token和用户信息
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);
      setAuthStatus('authenticated');

      // 跳转到仪表盘
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setAuthStatus('error');
      throw error; // 让调用方处理错误显示
    }
  }, [navigate]);

  /**
   * 登出方法
   */
  const logout = useCallback(async () => {
    try {
      // 调用后端登出接口（记录审计日志）
      if (token) {
        await authApi.logout();
      }
    } catch {
      // 即使后端登出失败也要清除本地状态
      console.warn('[Auth] 后端登出接口调用失败，仍执行本地登出');
    } finally {
      // 清除本地存储
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // 清除状态
      setToken(null);
      setUser(null);
      setAuthStatus('unauthenticated');

      // 跳转到登录页
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  /**
   * 获取/刷新当前用户信息
   */
  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('[Auth] 获取用户信息失败:', error);
      // 如果是401错误，自动登出
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401) {
        await logout();
      }
    }
  }, [token, logout]);

  /**
   * Context值
   */
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: authStatus === 'authenticated',
    authStatus,
    login,
    logout,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// Hook：使用认证上下文
// ============================================

/**
 * useAuth Hook
 *
 * 必须在AuthProvider内部使用
 *
 * @example
 * function MyComponent() {
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *   // ...
 * }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
