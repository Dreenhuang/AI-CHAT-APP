/**
 * StatCard 统计卡片组件
 *
 * 功能说明：
 * 展示仪表盘的核心关键指标（KPI）。
 * 采用Apple风格的卡片设计，包含图标、标题、数值和趋势指示。
 *
 * 设计特点：
 * - 毛玻璃背景效果（可选）
 * - 悬停时轻微上浮 + 阴影加深动画
 * - 趋势箭头使用语义色（绿色=增长，红色=下降）
 * - 响应式布局，支持移动端自适应
 *
 * 使用示例：
 * ```tsx
 * <StatCard
 *   title="总用户数"
 *   value="12,345"
 *   change={12.5}
 *   trend="up"
 *   icon="Users"
 *   color="#007AFF"
 * />
 * ```
 */

import React from 'react';
import { Users, TrendingUp, TrendingDown, FileText, Activity } from 'lucide-react';

// ============ 类型定义 ============

interface StatCardProps {
  /** 卡片标题 */
  title: string;
  /** 显示数值（支持数字或格式化字符串） */
  value: string | number;
  /** 变化百分比（正数表示增长） */
  change: number;
  /** 趋势方向 */
  trend: 'up' | 'down';
  /** 图标名称（Lucide图标） */
  icon: 'Users' | 'TrendingUp' | 'FileText' | 'Activity';
  /** 主题色（用于图标和强调元素） */
  color: string;
}

// ============ 图标映射 ============

const iconMap = {
  Users,
  TrendingUp,
  FileText,
  Activity,
};

// ============ 主组件 ============

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  color,
}) => {
  // 选择对应的图标组件
  const IconComponent = iconMap[icon];

  // 格式化变化百分比显示
  const formattedChange = Math.abs(change).toFixed(1);
  const isPositive = trend === 'up';

  return (
    <div className="apple-card group relative overflow-hidden rounded-apple-md bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-apple-card-hover">
      {/* 背景装饰 - 左侧色条 */}
      <div
        className="absolute left-0 top-0 h-full w-1 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: color }}
      />

      {/* 内容区域 */}
      <div className="flex items-start justify-between">
        {/* 左侧：标题和数值 */}
        <div className="flex-1 space-y-3">
          {/* 标题 */}
          <p className="text-sm font-medium text-gray-500 transition-colors duration-300 group-hover:text-gray-700">
            {title}
          </p>

          {/* 数值 - 大字号粗体 */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>

          {/* 趋势指示器 */}
          <div className="flex items-center gap-1.5">
            {/* 趋势箭头 */}
            {isPositive ? (
              <TrendingUp
                className="h-4 w-4 text-green-500"
                strokeWidth={2.5}
              />
            ) : (
              <TrendingDown
                className="h-4 w-4 text-red-500"
                strokeWidth={2.5}
              />
            )}

            {/* 百分比数字 */}
            <span
              className={`text-sm font-semibold ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? '+' : '-'}{formattedChange}%
            </span>
          </div>
        </div>

        {/* 右侧：图标容器 */}
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-apple-md transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${color}15`, // 10%透明度背景
          }}
        >
          <IconComponent
            className="h-6 w-6 transition-colors duration-300"
            style={{ color }}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* 底部渐变装饰（悬停时增强） */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${color}40, transparent)`,
        }}
      />
    </div>
  );
};

export default StatCard;
