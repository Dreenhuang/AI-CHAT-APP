/**
 * ============================================
 * 顶部导航栏组件 - Header.jsx
 * ============================================
 *
 * 功能：
 * - 毛玻璃效果（Glassmorphism）
 * - 面包屑导航
 * - 用户头像 + 下拉菜单
 * - 通知铃铛
 * - 全局搜索
 */

import React from 'react'
import { useLocation } from 'react-router-dom'
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

/**
 * 页面标题映射
 */
const pageTitles = {
  '/dashboard': '仪表盘',
  '/topics': '议题管理',
  '/users': '用户管理',
  '/audit-logs': '审计日志',
  '/config': '系统配置',
  '/souls': 'Soul角色管理',
}

/**
 * 顶部导航栏组件
 *
 * @param {boolean} sidebarCollapsed - 侧边栏是否折叠
 * @param {function} onToggleSidebar - 切换侧边栏的回调
 */
export default function Header({ sidebarCollapsed, onToggleSidebar }) {
  const location = useLocation()
  const currentPage = pageTitles[location.pathname] || '页面'

  return (
    <header
      className="
        sticky top-0 z-sticky
        h-16 px-6 flex items-center justify-between
        bg-white/72 backdrop-blur-xl backdrop-saturate-180
        border-b border-border-light
      "
    >
      {/* 左侧：菜单按钮 + 面包屑 */}
      <div className="flex items-center gap-4">
        {/* 移动端菜单按钮 */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 当前页面标题 */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {currentPage}
          </h2>
          {/* 面包屑（可选） */}
          <p className="text-xs text-text-tertiary hidden sm:block">
            Home / Management / {currentPage}
          </p>
        </div>
      </div>

      {/* 右侧：操作按钮组 */}
      <div className="flex items-center gap-3">
        {/* 全局搜索 */}
        <button
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-bg-secondary text-text-tertiary text-sm
            hover:bg-bg-tertiary transition-colors
            max-w-xs
          "
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-white rounded border border-border-light">
            ⌘K
          </kbd>
        </button>

        {/* 通知铃铛 */}
        <button
          className="
            relative p-2.5 rounded-xl text-text-secondary
            hover:text-text-primary hover:bg-bg-secondary transition-colors
          "
          title="通知"
        >
          <Bell className="w-5 h-5" />
          {/* 红点提示（有未读通知时显示） */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* 分割线 */}
        <div className="w-px h-8 bg-divider" />

        {/* 用户信息下拉 */}
        <button
          className="
            flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl
            hover:bg-bg-secondary transition-colors group
          "
        >
          {/* 头像 */}
          <div className="avatar avatar-sm bg-gradient-to-br from-primary to-secondary text-white font-semibold">
            A
          </div>

          {/* 用户名和角色（桌面端显示） */}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-text-primary leading-tight">
              Admin User
            </p>
            <p className="text-[11px] text-text-tertiary leading-tight">
              超级管理员
            </p>
          </div>

          {/* 下拉箭头 */}
          <ChevronDown className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary transition-colors hidden md:block" />
        </button>
      </div>
    </header>
  )
}
