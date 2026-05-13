/**
 * UserTrendChart 用户增长趋势图组件
 *
 * 功能说明：
 * 使用Recharts绘制面积图/折线图，展示用户增长趋势。
 * 支持双线对比：新增用户 vs 活跃用户。
 *
 * 设计特点：
 * - Apple风格渐变填充面积图
 * - Tooltip悬浮提示显示详细数据
 * - 响应式图表宽度
 * - 平滑的曲线动画
 *
 * 数据来源：
 * GET /api/admin/v1/dashboard/user-trend?period=7d
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

// ============ 类型定义 ============

interface UserTrendChartProps {
  /** 图表数据数组 */
  data: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>;
  /** 时间周期描述（用于标题） */
  period?: string;
}

// ============ 自定义Tooltip组件 ============

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-apple-md border border-gray-200 bg-white p-4 shadow-apple-lg">
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============ 主组件 ============

const UserTrendChart: React.FC<UserTrendChartProps> = ({ data, period = '近7天' }) => {
  return (
    <div className="apple-card h-full rounded-apple-md bg-white p-6">
      {/* 标题区域 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900">用户增长趋势</h3>
          <p className="text-sm text-gray-500">{period}数据对比</p>
        </div>
        <div className="flex items-center gap-4">
          {/* 图例：新增用户 */}
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">新增用户</span>
          </div>
          {/* 图例：活跃用户 */}
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-600">活跃用户</span>
          </div>
        </div>
      </div>

      {/* 图表容器 - 响应式宽度 */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            {/* 网格线 */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />

            {/* X轴 - 日期 */}
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#9CA3AF',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
              dy={8}
            />

            {/* Y轴 - 用户数量 */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#9CA3AF',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
              dx={-8}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
              }
            />

            {/* 自定义Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* 面积图1：新增用户（蓝色渐变） */}
            <Area
              type="monotone"
              dataKey="newUsers"
              name="新增用户"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fillOpacity={0.15}
              fill="url(#colorNewUsers)"
              animationDuration={1500}
              animationEasing="ease-in-out"
            />

            {/* 面积图2：活跃用户（绿色渐变） */}
            <Area
              type="monotone"
              dataKey="activeUsers"
              name="活跃用户"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={0.1}
              fill="url(#colorActiveUsers)"
              animationDuration={1500}
              animationEasing="ease-in-out"
              animationBegin={300}
            />

            {/* 渐变定义 */}
            <defs>
              <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserTrendChart;
