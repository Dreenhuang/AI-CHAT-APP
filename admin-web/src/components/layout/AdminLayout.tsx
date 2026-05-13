/**
 * AdminLayout主布局组件
 *
 * 布局结构：
 * ┌─────────────────────────────────────────────┐
 * │ Header（顶部导航栏）                         │
 * ├──────────┬──────────────────────────────────┤
 * │ Sidebar  │ Main Content Area                │
 * │ （侧边栏）│                                  │
 * │          │  [页面内容]                       │
 * │          │                                  │
 * └──────────┴──────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从localStorage读取或检测系统偏好
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const location = useLocation();

  /**
   * 根据当前路由获取页面标题
   */
  const getPageTitle = (): string => {
    const titleMap: Record<string, string> = {
      '/dashboard': '仪表盘',
      '/topics': '议题管理',
      '/users': '用户管理',
      '/logs': '操作日志',
      '/settings': '系统配置',
      '/roles': '角色权限',
    };
    
    // 精确匹配优先
    if (titleMap[location.pathname]) {
      return titleMap[location.pathname];
    }

    // 前缀匹配
    for (const [path, title] of Object.entries(titleMap)) {
      if (location.pathname.startsWith(path) && path !== '/') {
        return title;
      }
    }

    return '';
  };

  /**
   * 切换暗色模式
   */
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  /**
   * 应用暗色模式class到html元素
   */
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* 侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* 顶部导航栏 + 主内容区 */}
      <div
        className={`
          transition-all duration-300
          ${sidebarCollapsed ? 'ml-[80px]' : 'ml-[260px]'}
        `}
      >
        {/* 顶部导航栏 */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={getPageTitle()}
        />

        {/* 主内容区域 */}
        <main className="pt-16 min-h-screen">
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
