/**
 * Sidebar侧边栏组件
 *
 * 功能说明：
 * - 固定宽度260px，可折叠到80px
 * - 折叠时只显示图标，悬停显示tooltip
 * - 当前页面高亮（左侧蓝色竖线+背景色）
 * - 支持暗色模式切换（可选）
 * - 底部管理员信息和退出按钮
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// 类型定义
// ============================================

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number | string;
}

// ============================================
// 菜单配置
// ============================================

const MENU_ITEMS: MenuItem[] = [
  { label: '仪表盘', path: '/dashboard', icon: LayoutDashboard },
  { label: '议题管理', path: '/topics', icon: MessageSquare },
  { label: '用户管理', path: '/users', icon: Users },
  { label: '操作日志', path: '/logs', icon: FileText },
  { label: '系统配置', path: '/settings', icon: Settings },
  { label: '角色权限', path: '/roles', icon: Shield },
];

// ============================================
// 组件实现
// ============================================

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Sidebar({ collapsed, onToggle, isDarkMode, onToggleDarkMode }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
    }
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[80px]' : 'w-[260px]'}
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        shadow-sm
      `}
    >
      {/* Logo区域 */}
      <div className="flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">PRD</span>
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              辩论管理系统
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">PRD</span>
          </div>
        )}
      </div>

      {/* 折叠按钮 */}
      <button
        onClick={onToggle}
        className="
          absolute -right-3 top-20 z-50
          w-6 h-6 bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-full flex items-center justify-center
          shadow-md hover:shadow-lg
          text-gray-500 hover:text-blue-600
          transition-all duration-200
        "
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 导航菜单区域 */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-3">
          {MENU_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `
                  group relative flex items-center
                  ${collapsed ? 'justify-center' : 'gap-3'}
                  px-3 py-2.5 rounded-apple
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {({ isActive: active }) => (
                  <>
                {/* 激活状态左侧指示条 */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}

                {/* 图标 */}
                <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : ''}`} />

                {/* 文字标签 */}
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}

                {/* 徽标 */}
                {item.badge && !collapsed && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip（折叠时显示） */}
                {collapsed && (
                  <div className="
                    absolute left-full ml-3 px-2.5 py-1.5
                    bg-gray-900 dark:bg-gray-700 text-white text-xs
                    rounded-md opacity-0 invisible
                    group-hover:opacity-100 group-hover:visible
                    transition-all duration-200
                    whitespace-nowrap z-50
                    pointer-events-none
                  ">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
                  </div>
                )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 底部区域 */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-3">
        {/* 暗色模式切换 */}
        <button
          onClick={onToggleDarkMode}
          className={`
            w-full flex items-center
            ${collapsed ? 'justify-center' : 'gap-3'}
            px-3 py-2 rounded-apple
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-200
          `}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">{isDarkMode ? '浅色模式' : '深色模式'}</span>}
        </button>

        {/* 管理员信息 & 退出 */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-2`}>
          {/* 头像 */}
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {user?.nickname?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>

          {/* 用户信息 */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.nickname || '管理员'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role === 'super_admin' ? '超级管理员' : user?.role === 'admin' ? '运营管理员' : '观察员'}
              </p>
            </div>
          )}

          {/* 退出按钮 */}
          <button
            onClick={handleLogout}
            className={`
              p-2 rounded-apple
              text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors duration-200
              ${collapsed ? '' : ''}
            `}
            title="退出登录"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
