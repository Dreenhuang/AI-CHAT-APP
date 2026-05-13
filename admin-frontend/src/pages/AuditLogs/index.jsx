/**
 * ============================================
 * 审计日志页面 - AuditLogs/index.jsx
 * ============================================
 */

import React from 'react'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'

export default function AuditLogs() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">审计日志</h1>
          <p className="text-sm text-text-secondary mt-1">查看系统操作记录和安全审计</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Download className="w-4 h-4" /> 导出</button>
          <button className="btn btn-secondary"><RefreshCw className="w-4 h-4" /> 刷新</button>
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="date" className="input" defaultValue="2026-05-01" />
          <input type="date" className="input" defaultValue="2026-05-13" />
          <select className="input">
            <option>所有操作类型</option>
            <option>登录/登出</option>
            <option>数据修改</option>
            <option>权限变更</option>
          </select>
          <button className="btn btn-primary"><Search className="w-4 h-4" /> 搜索</button>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作者</th>
              <th>操作类型</th>
              <th>目标对象</th>
              <th>IP地址</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i}>
                <td className="whitespace-nowrap text-text-secondary">2026-05-13 {10 + i}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}</td>
                <td className="font-medium text-text-primary">Admin #{i % 3 + 1}</td>
                <td><span className={`badge ${i % 3 === 0 ? 'badge-primary' : i % 3 === 1 ? 'badge-warning' : 'badge-success'}`}>
                  {['登录', '修改数据', '删除'][i % 3]}
                </span></td>
                <td className="text-text-secondary truncate-1 max-w-xs">资源 #{i} - 示例操作描述</td>
                <td className="text-text-tertiary font-mono text-xs">192.168.1.{100 + i}</td>
                <td><span className={`badge ${i % 4 === 0 ? 'badge-danger' : 'badge-success'}`}>{i % 4 === 0 ? '失败' : '成功'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">显示 1-10 条，共 123 条记录</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm">上一页</button>
          <button className="btn btn-primary btn-sm">1</button>
          <button className="btn btn-secondary btn-sm">2</button>
          <button className="btn btn-secondary btn-sm">3</button>
          <button className="btn btn-secondary btn-sm">下一页</button>
        </div>
      </div>
    </div>
  )
}
