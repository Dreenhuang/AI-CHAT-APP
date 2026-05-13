/**
 * ============================================
 * 议题管理页面 - Topics/index.jsx
 * ============================================
 */

import React from 'react'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'

export default function Topics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">议题管理</h1>
          <p className="text-sm text-text-secondary mt-1">管理所有辩论议题和讨论主题</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          新建议题
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input type="text" placeholder="搜索议题..." className="input pl-12" />
        </div>
        <button className="btn btn-secondary">
          <Filter className="w-4 h-4" />
          筛选
        </button>
      </div>

      {/* 议题列表 */}
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>议题标题</th>
              <th>状态</th>
              <th>参与人数</th>
              <th>回复数</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td>
                  <div className="font-medium text-text-primary truncate-1 max-w-xs">
                    示例议题 #{i}：关于AI技术发展的辩论
                  </div>
                </td>
                <td><span className={`badge ${i % 3 === 0 ? 'badge-success' : i % 3 === 1 ? 'badge-primary' : 'badge-warning'}`}>
                  {i % 3 === 0 ? '活跃' : i % 3 === 1 ? '进行中' : '已结束'}
                </span></td>
                <td className="text-text-secondary">{Math.floor(Math.random() * 100)}</td>
                <td className="text-text-secondary">{Math.floor(Math.random() * 500)}</td>
                <td className="text-text-tertiary whitespace-nowrap">2026-05-{10 + i}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-bg-secondary transition-colors" title="查看"><Eye className="w-4 h-4 text-text-secondary" /></button>
                    <button className="p-2 rounded-lg hover:bg-bg-secondary transition-colors" title="编辑"><Edit className="w-4 h-4 text-text-secondary" /></button>
                    <button className="p-2 rounded-lg hover:bg-danger-bg transition-colors" title="删除"><Trash2 className="w-4 h-4 text-danger" /></button>
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
