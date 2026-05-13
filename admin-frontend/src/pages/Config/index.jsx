/**
 * ============================================
 * 系统配置页面 - Config/index.jsx
 * ============================================
 */

import React, { useState } from 'react'
import { Save, RotateCcw, Bell, Shield, Globe, Database } from 'lucide-react'

export default function Config() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: '基本设置', icon: Globe },
    { id: 'notification', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'database', label: '数据库', icon: Database },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">系统配置</h1>
          <p className="text-sm text-text-secondary mt-1">管理系统参数和全局设置</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><RotateCcw className="w-4 h-4" /> 重置</button>
          <button className="btn btn-primary"><Save className="w-4 h-4" /> 保存更改</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：选项卡导航 */}
        <div className="lg:col-span-1">
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-alpha-10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* 右侧：配置内容 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 基本设置 */}
          {activeTab === 'general' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">基本设置</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">站点名称</label>
                  <input type="text" defaultValue="管理后台" className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">站点描述</label>
                  <input type="text" defaultValue="AI辩论平台管理系统" className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">管理员邮箱</label>
                  <input type="email" defaultValue="admin@example.com" className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">时区设置</label>
                  <select className="input">
                    <option>Asia/Shanghai (UTC+8)</option>
                    <option>America/New_York (UTC-5)</option>
                    <option>Europe/London (UTC+0)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary" />
                  <span className="text-sm text-text-primary">启用维护模式</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary" />
                  <span className="text-sm text-text-primary">允许用户注册</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" />
                  <span className="text-sm text-text-primary">开启调试模式</span>
                </label>
              </div>
            </div>
          )}

          {/* 其他选项卡占位 */}
          {activeTab !== 'general' && (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                {(() => {
                  const Icon = tabs.find(t => t.id === activeTab)?.icon || Globe
                  return <Icon className="w-8 h-8 text-text-quaternary" />
                })()}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                该功能正在开发中，敬请期待...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
