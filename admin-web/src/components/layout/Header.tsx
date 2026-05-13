/**
 * Header顶部导航栏组件
 *
 * 功能说明：
 * - 高度64px，白色背景，底部细边框
 * - 左侧：Logo/面包屑导航
 * - 中间：全局搜索框（可选）
 * - 右侧：通知铃铛图标（带红点）、管理员头像下拉菜单
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Bell,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  title?: string;
}

export default function Header({ sidebarCollapsed, onToggleSidebar, title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header
      className={`
        fixed top-0 right-0 z-30
        h-16 bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-700
        flex items-center justify-between
        px-6 transition-all duration-300
        ${sidebarCollapsed ? 'left-[80px]' : 'left-[260px]'}
      `}
    >
      {/* 左侧：移动端菜单按钮 + 页面标题 */}
      <div className="flex items-center gap-4">
        {/* 移动端菜单按钮 */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 页面标题 */}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* 中间：搜索框 */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索功能、用户、议题..."
            className="
              w-full pl-10 pr-4 py-2
              bg-gray-100 dark:bg-gray-800
              border border-transparent
              rounded-full text-sm
              placeholder:text-gray-400
              focus:bg-white dark:focus:bg-gray-700
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* 右侧：通知 + 用户菜单 */}
      <div className="flex items-center gap-3">
        {/* 通知铃铛 */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {/* 红点提示 */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* 分割线 */}
        <div className="w-px h-7 bg-gray-200 dark:bg-gray-700" />

        {/* 用户头像下拉菜单 */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {/* 头像 */}
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.nickname?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>

            {/* 用户名（桌面端显示） */}
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
              {user?.nickname || '管理员'}
            </span>

            {/* 下拉箭头 */}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* 下拉菜单内容 */}
          {showUserMenu && (
            <div className="
              absolute right-0 mt-2 w-56
              bg-white dark:bg-gray-800
              rounded-xl shadow-apple-lg
              border border-gray-200 dark:border-gray-700
              py-2 animate-fade-in origin-top-right
            ">
              {/* 当前用户信息头部 */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nickname || '管理员'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email || user?.username || ''}</p>
              </div>

              {/* 菜单项 */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: 导航到个人资料页
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  个人资料
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: 导航到修改密码页
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  修改密码
                </button>
              </div>

              {/* 分割线 */}
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

              {/* 退出登录 */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
