/**
 * ============================================
 * React 应用入口文件
 * ============================================
 *
 * 功能：
 * - 挂载 React 应用到 DOM
 * - 引入全局样式和 Design Token
 * - 配置严格模式（开发环境辅助调试）
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// 创建根节点并挂载应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
