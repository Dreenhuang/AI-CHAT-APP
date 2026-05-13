/**
 * ============================================
 * 主布局组件 - MainLayout.jsx
 * ============================================
 *
 * Apple 风格管理后台布局：
 * - 左侧固定侧边栏（可折叠）
 * - 顶部导航栏（毛玻璃效果）
 * - 右侧内容区域
 *
 * 布局结构：
 * ┌──────────────────────────────────────┐
 * │ Sidebar │       Header (Fixed)        │
 * ├─────────┼─────────────────────────────┤
 * │         │                             │
 * │         │      Main Content           │
 * │         │     (Scrollable)            │
 * │         │                             │
 * └─────────┴─────────────────────────────┘
 */

import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

/**
 * 主布局组件
 */
export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 切换侧边栏折叠状态
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary">
      {/* 左侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      {/* 右侧区域：顶部导航 + 内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
