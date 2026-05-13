/**
 * Dashboard仪表盘页面
 *
 * 占位页面，展示系统概览信息
 * 后续可扩展为完整的数据可视化仪表盘
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  /**
   * 统计卡片数据（示例）
   */
  const statCards = [
    {
      title: '总议题数',
      value: '1,284',
      change: '+12.5%',
      trend: 'up',
      icon: MessageSquare,
      color: 'blue',
    },
    {
      title: '活跃用户',
      value: '8,642',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'green',
    },
    {
      title: '今日辩论',
      value: '356',
      change: '-3.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: '系统运行时间',
      value: '99.9%',
      change: '+0.1%',
      trend: 'up',
      icon: Activity,
      color: 'orange',
    },
  ];

  const colorMap: Record<string, { bg: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', iconBg: 'bg-blue-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', iconBg: 'bg-green-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', iconBg: 'bg-purple-500' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', iconBg: 'bg-orange-500' },
  };

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[16px] p-6 text-white shadow-lg">
        <h2 className="text-xl font-semibold mb-1">
          欢迎回来，{user?.nickname || '管理员'}
        </h2>
        <p className="text-blue-100 text-sm">
          这是您的管理控制面板概览。今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const colors = colorMap[card.color];
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`${colors.bg} rounded-[16px] p-5 border border-gray-100 dark:border-gray-800`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`
                    inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full
                    ${card.trend === 'up'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }
                  `}
                >
                  {card.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* 快捷操作 & 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 快捷操作 */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">快捷操作</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '新建议题', desc: '创建新的辩论议题' },
              { label: '审核内容', desc: '待审核的内容列表' },
              { label: '用户管理', desc: '查看和管理用户' },
              { label: '系统配置', desc: '调整系统参数' },
            ].map((action) => (
              <button
                key={action.label}
                className="
                  p-4 text-left rounded-xl
                  bg-gray-50 dark:bg-gray-800
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  border border-gray-200 dark:border-gray-700
                  transition-colors duration-200
                "
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-white dark:bg-gray-900 rounded-[16px] p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">最近活动</h3>
          <div className="space-y-4">
            {[
              { action: '创建了新议题', target: 'AI是否会取代程序员？', time: '5分钟前', type: 'create' },
              { action: '审核通过了', target: '用户张三的注册申请', time: '15分钟前', type: 'approve' },
              { action: '修改了系统配置', target: '辩论时长限制 → 30分钟', time: '1小时前', type: 'config' },
              { action: '禁用了用户', target: '用户李四（违规操作）', time: '2小时前', type: 'ban' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="bg-white dark:bg-gray-900 rounded-[16px] p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">系统状态</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <span className="text-sm text-gray-700 dark:text-gray-300">API服务</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              运行中
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <span className="text-sm text-gray-700 dark:text-gray-300">数据库</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              正常
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <span className="text-sm text-gray-700 dark:text-gray-300">WebSocket</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              已连接
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
