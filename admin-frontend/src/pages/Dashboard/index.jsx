/**
 * ============================================
 * 仪表盘页面 - Dashboard/index.jsx
 * ============================================
 *
 * 功能：
 * - 数据概览卡片（用户数、议题数、活跃度等）
 * - 趋势图表（使用 Recharts）
 * - 最近活动列表
 * - 快捷操作入口
 */

import React from 'react'
import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// 模拟数据
const statsData = [
  { title: '总用户数', value: '12,345', change: '+12.5%', icon: Users, color: 'text-primary', bg: 'bg-primary-alpha-10' },
  { title: '总议题数', value: '1,234', change: '+8.2%', icon: MessageSquare, color: 'text-secondary', bg: 'bg-secondary/10' },
  { title: '活跃度', value: '89.2%', change: '+5.1%', icon: TrendingUp, color: 'text-success', bg: 'bg-success-bg' },
  { title: '在线人数', value: '567', change: '-2.3%', icon: Activity, color: 'text-warning', bg: 'bg-warning-bg' },
]

const chartData = [
  { name: 'Mon', users: 4000, topics: 2400 },
  { name: 'Tue', users: 3000, topics: 1398 },
  { name: 'Wed', users: 2000, topics: 9800 },
  { name: 'Thu', users: 2780, topics: 3908 },
  { name: 'Fri', users: 1890, topics: 4800 },
  { name: 'Sat', users: 2390, topics: 3800 },
  { name: 'Sun', users: 3490, topics: 4300 },
]

const recentActivities = [
  { id: 1, user: '张三', action: '创建了新议题', target: 'AI未来发展辩论', time: '2分钟前' },
  { id: 2, user: '李四', action: '回复了评论', target: '关于气候变化的讨论', time: '5分钟前' },
  { id: 3, user: '王五', action: '更新了角色配置', target: 'Soul - 哲学家', time: '10分钟前' },
  { id: 4, user: '赵六', action: '删除了违规内容', target: '广告帖 #1234', time: '15分钟前' },
  { id: 5, user: '钱七', action: '修改了系统参数', target: 'API限流设置', time: '20分钟前' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">仪表盘</h1>
        <p className="text-sm text-text-secondary mt-1">欢迎回来！以下是您的数据概览。</p>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card p-6 group cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                    <ArrowUpRight className={`w-4 h-4 ${!stat.change.startsWith('+') ? 'rotate-90' : ''}`} />
                    {stat.change}
                    <span className="text-text-quaternary ml-1">vs 上周</span>
                  </div>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 用户活跃度趋势图 */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">用户活跃趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071e3" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTopics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5e5ce6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#5e5ce6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#86868b" fontSize={12} />
                <YAxis stroke="#86868b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5ea',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="#0071e3" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                <Area type="monotone" dataKey="topics" stroke="#5e5ce6" fillOpacity={1} fill="url(#colorTopics)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 快捷操作面板 */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">快捷操作</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '创建议题', icon: MessageSquare, color: 'from-primary to-primary-light' },
              { label: '管理用户', icon: Users, color: 'from-secondary to-secondary-light' },
              { label: '查看日志', icon: Activity, color: 'from-success to-success-light' },
              { label: '系统设置', icon: TrendingUp, color: 'from-warning to-warning-dark' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  className="flex items-center gap-3 p-4 rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 系统状态 */}
          <div className="pt-4 border-t border-border-light space-y-3">
            <h4 className="text-sm font-medium text-text-secondary">系统状态</h4>
            <div className="space-y-2">
              {[
                { label: 'API 服务', status: '正常', color: 'text-success' },
                { label: '数据库连接', status: '正常', color: 'text-success' },
                { label: '缓存服务', status: '警告', color: 'text-warning' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className={`font-medium ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动列表 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">最近活动</h3>
          <a href="#" className="text-sm text-primary hover:text-primary-hover transition-colors">
            查看全部
          </a>
        </div>
        <div className="table-container rounded-xl overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>操作者</th>
                <th>操作类型</th>
                <th>目标对象</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="font-medium text-text-primary">{activity.user}</td>
                  <td><span className="badge badge-primary">{activity.action}</span></td>
                  <td className="text-text-secondary truncate-1 max-w-xs">{activity.target}</td>
                  <td className="text-text-tertiary whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {activity.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
