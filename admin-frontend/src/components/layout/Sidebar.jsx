/**
 * ============================================
 * 侧边栏组件 - Sidebar.jsx
 * ============================================
 *
 * 功能：
 * - 导航菜单（支持图标+文字）
 * - 折叠/展开动画
 * - 当前页面高亮
 * - 响应式设计
 */

import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

/**
 * 菜单配置
 */
const menuItems = [
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: '仪表盘',
    description: '数据概览',
  },
  {
    path: '/topics',
    icon: MessageSquare,
    label: '议题管理',
    description: '辩论议题',
  },
  {
    path: '/users',
    icon: Users,
    label: '用户管理',
    description: '用户列表',
  },
  {
    path: '/audit-logs',
    icon: FileText,
    label: '审计日志',
    description: '操作记录',
  },
  {
    path: '/config',
    icon: Settings,
    label: '系统配置',
    description: '参数设置',
  },
  {
    path: '/souls',
    icon: Sparkles,
    label: 'Soul角色',
    description: 'AI角色管理',
  },
]

/**
 * 侧边栏组件
 *
 * @param {boolean} collapsed - 是否折叠
 * @param {function} onToggle - 切换折叠状态的回调
 */
export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`
        relative flex flex-col h-full bg-white border-r border-border-light
        transition-all duration-300 ease-apple
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* Logo 区域 */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border-light">
        {!collapsed && (
          <div className="flex items-center gap-3">
            {/* Logo 图标 */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {/* 应用名称 */}
            <div>
              <h1 className="text-base font-bold text-text-primary leading-tight">
                管理后台
              </h1>
              <p className="text-[10px] text-text-tertiary leading-tight">
                Admin Dashboard
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}

        {/* 折叠/展开按钮 */}
        <button
          onClick={onToggle}
          className={`
            p-1.5 rounded-md text-text-tertiary hover:text-text-primary
            hover:bg-bg-secondary transition-all duration-200
            ${collapsed ? 'mx-auto' : ''}
          `}
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => `
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 ease-apple
                    ${isActive
                      ? 'bg-primary-alpha-10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  {/* 图标 */}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      // 在活跃状态下，图标颜色会更鲜艳
                      ''
                    }`}
                  />

                  {/* 文字和描述（展开时显示） */}
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-text-tertiary leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 底部区域 - 用户信息 / 登出按钮 */}
      <div className="border-t border-border-light p-3">
        <button
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-text-secondary hover:text-danger hover:bg-danger-bg
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
          title="退出登录"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">退出登录</span>}
        </button>
      </div>
    </aside>
  )
}
