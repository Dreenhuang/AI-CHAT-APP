/**
 * ============================================
 * 用户管理页面 - Users/index.jsx
 * ============================================
 */

import React from 'react'
import { Plus, Search, UserCheck, UserX, Shield } from 'lucide-react'

export default function Users() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">用户管理</h1>
          <p className="text-sm text-text-secondary mt-1">管理系统用户和权限</p>
        </div>
        <button className="btn btn-primary"><Plus className="w-4 h-4" /> 添加用户</button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: '总用户数', value: '12,345', icon: UserCheck, color: 'from-primary to-primary-light' },
          { label: '活跃用户', value: '8,901', icon: UserCheck, color: 'from-success to-success-light' },
          { label: '封禁用户', value: '23', icon: UserX, color: 'from-danger to-danger-light' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 用户列表 */}
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>用户</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <span className="font-medium text-text-primary">用户 #{i}</span>
                  </div>
                </td>
                <td className="text-text-secondary">user{i}@example.com</td>
                <td><span className="badge badge-primary">{i === 1 ? '管理员' : '普通用户'}</span></td>
                <td><span className={`badge ${i % 2 === 0 ? 'badge-success' : 'badge-warning'}`}>{i % 2 === 0 ? '正常' : '待验证'}</span></td>
                <td className="text-text-tertiary whitespace-nowrap">2026-05-{10 + i}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-bg-secondary transition-colors" title="编辑角色"><Shield className="w-4 h-4 text-text-secondary" /></button>
                    <button className="p-2 rounded-lg hover:bg-danger-bg transition-colors" title="禁用"><UserX className="w-4 h-4 text-danger" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
