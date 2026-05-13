/**
 * ============================================
 * 登录页 - Login/index.jsx
 * ============================================
 *
 * Apple 风格登录界面：
 * - 居中卡片布局
 * - 毛玻璃背景
 * - 优雅的表单设计
 * - 社交登录选项（可选）
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, User, ArrowRight, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react'
import apiClient from '../../services/api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'Admin@123456',
  })

  // 获取登录前的路径，登录后跳回
  const from = location.state?.from || '/dashboard'

  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  // 处理登录
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 调用真实的登录API
      const response = await apiClient.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      })

      console.log('[Login] 登录成功:', response)

      // 保存Token到localStorage
      if (response.data?.token) {
        localStorage.setItem('admin_token', response.data.token)
        localStorage.setItem('admin_user', JSON.stringify(response.data.user))

        // 登录成功，跳转到目标页面
        navigate(from, { replace: true })
      } else {
        throw new Error('登录响应格式异常')
      }
    } catch (err) {
      console.error('[Login] 登录失败:', err)

      // 根据错误类型显示不同的提示信息
      let errorMessage = '登录失败，请重试'

      if (err.status === 401) {
        errorMessage = '用户名或密码错误'
      } else if (err.status === 0) {
        errorMessage = '网络连接失败，请检查后端服务是否启动（端口9450）'
      } else if (err.status === 500) {
        errorMessage = '服务器内部错误，请联系管理员'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 快速填充演示账号
  const fillDemoAccount = () => {
    setFormData({
      username: 'admin',
      password: 'Admin@123456',
    })
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card p-10 space-y-8">
          {/* Logo 和标题 */}
          <div className="text-center space-y-3">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-apple-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                欢迎回来
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                登录您的管理员账户以继续
              </p>
            </div>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 用户名输入 */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-text-primary">
                用户名 / 邮箱
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名或邮箱"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input pl-12"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-text-primary">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input pl-12 pr-12"
                  required
                  disabled={loading}
                />
                {/* 显示/隐藏密码切换 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                  defaultChecked
                />
                <span className="text-text-secondary">记住我</span>
              </label>
              <a href="#" className="text-primary hover:text-primary-hover transition-colors">
                忘记密码？
              </a>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-base"
            >
              {loading ? (
                <>
                  <span className="opacity-0">登录</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 演示账号快捷填充 */}
            <button
              type="button"
              onClick={fillDemoAccount}
              className="text-sm text-text-tertiary hover:text-primary transition-colors text-center"
            >
              使用演示账号登录 (admin / Admin@123456)
            </button>
          </form>

          {/* 分割线 */}
          <div className="relative">
            <div className="divider" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-white text-xs text-text-tertiary">
              或
            </span>
          </div>

          {/* 其他登录方式（可选） */}
          <div className="text-center text-sm text-text-secondary">
            还没有账户？
            <a href="#" className="text-primary hover:text-primary-hover ml-1 font-medium">
              联系管理员
            </a>
          </div>
        </div>

        {/* 底部版权信息 */}
        <p className="text-center text-xs text-text-quaternary mt-6">
          © 2026 Admin Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  )
}
