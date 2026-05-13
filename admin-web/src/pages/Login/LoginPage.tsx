/**
 * Apple风格登录页面
 *
 * 设计规范：
 * - 居中卡片式布局，背景使用渐变色
 * - 白色圆角卡片（20px），微妙阴影效果
 * - SF Pro字体系统，清晰的视觉层级
 * - 流畅的过渡动画
 * - 完整的表单验证和错误提示
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, User, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, authStatus } = useAuth();
  const navigate = useNavigate();

  // 表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    if (!username.trim()) {
      setError('请输入用户名');
      return false;
    }

    if (!password) {
      setError('请输入密码');
      return false;
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return false;
    }

    return true;
  };

  /**
   * 处理登录提交
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      // 登录成功后由AuthContext处理跳转
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [username, password, login]);

  /**
   * 演示账号快速填充
   */
  const fillDemoAccount = () => {
    setUsername('admin');
    setPassword('Admin@123456');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-white/90 backdrop-blur-xl rounded-[20px] shadow-apple-lg p-8 sm:p-10 border border-white/20">
          {/* Logo区域 */}
          <div className="text-center mb-8">
            {/* Logo图标 */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <span className="text-white text-2xl font-bold">PRD</span>
            </div>
            
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              PRD辩论管理系统
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              管理员控制面板
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-apple animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名输入框 */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4.5 h-4.5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入管理员用户名"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-apple text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4.5 h-4.5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入登录密码"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-apple text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                {/* 显示/隐藏密码按钮 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  记住我
                </span>
              </label>
              
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                忘记密码？
              </Link>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isSubmitting || authStatus === 'loading'}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-apple shadow-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting || authStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>正在登录...</span>
                </>
              ) : (
                <span>登 录</span>
              )}
            </button>
          </form>

          {/* 分割线 */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">或</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 快速演示入口 */}
          <button
            type="button"
            onClick={fillDemoAccount}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-apple transition-colors duration-200"
          >
            使用演示账号填充
          </button>

          {/* 底部提示 */}
          <p className="mt-6 text-center text-xs text-gray-400">
            默认账号：admin / Admin@123456
          </p>
        </div>

        {/* 版权信息 */}
        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; 2026 PRD辩论管理系统. All rights reserved.
        </p>
      </div>
    </div>
  );
}
