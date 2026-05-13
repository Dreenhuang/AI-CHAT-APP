/**
 * Admin Dashboard - 主应用入口
 *
 * 功能说明：
 * 这是管理员数据可视化仪表盘的主应用组件。
 * 负责路由配置、全局状态管理和布局渲染。
 *
 * 技术栈：
 * - React 18 + TypeScript
 * - Recharts (数据可视化)
 * - Tailwind CSS (Apple Design Style)
 * - Lucide React (图标库)
 */

import React from 'react'
import Dashboard from './pages/Dashboard'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主内容区域 */}
      <main className="container mx-auto px-4 py-8 max-w-[1440px]">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
