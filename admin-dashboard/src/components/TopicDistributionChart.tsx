/**
 * TopicDistributionChart 议题类型分布图组件
 *
 * 功能说明：
 * 使用Recharts绘制环形图（Donut Chart），展示各类型议题的占比分布。
 * 中心显示议题总数，图例在右侧。
 *
 * 设计特点：
 * - Apple风格简洁的环形图
 * - 中心文字显示总数
 * - 右侧/底部图例列表
 * - 点击图例可筛选高亮对应扇区
 * - 悬停时扇区放大效果
 *
 * 数据来源：
 * GET /api/admin/v1/dashboard/topic-distribution
 */

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

// ============ 类型定义 ============

interface TopicDataItem {
  name: string;
  value: number;
  color: string;
}

interface TopicDistributionChartProps {
  /** 图表数据 */
  data: TopicDataItem[];
}

// ============ 自定义Tooltip ============

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: TopicDataItem }>;
}> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-apple-md border border-gray-200 bg-white p-3 shadow-apple-lg">
      <div className="mb-1 flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-medium text-gray-900">{item.name}</span>
      </div>
      <p className="text-sm text-gray-600">
        数量：<span className="font-semibold text-gray-900">{item.value.toLocaleString()}</span>
      </p>
      <p className="text-sm text-gray-600">
        占比：
        <span className="font-semibold text-gray-900">
          {((item.value / payload.reduce((sum, entry) => sum + entry.value, 0)) * 100).toFixed(1)}%
        </span>
      </p>
    </div>
  );
};

// ============ 自定义图例组件 ============

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: TopicDataItem;
  }>;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  if (!payload) return null;

  // 计算总数用于百分比计算
  const total = payload.reduce(
    (sum, entry) => sum + entry.payload.value,
    0
  );

  return (
    <div className="mt-4 space-y-2">
      {payload.map((entry, index) => {
        const percentage = ((entry.payload.value / total) * 100).toFixed(1);

        return (
          <div
            key={index}
            className="flex cursor-pointer items-center justify-between rounded-apple-sm px-2 py-1.5 transition-all duration-200 hover:bg-gray-50"
          >
            {/* 左侧：颜色块 + 名称 */}
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.value}</span>
            </div>

            {/* 右侧：数量 + 百分比 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {entry.payload.value.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">({percentage}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============ 主组件 ============

const TopicDistributionChart: React.FC<TopicDistributionChartProps> = ({
  data,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // 计算总数
  const totalCount = data.reduce((sum, item) => sum + item.value, 0);

  // 处理鼠标进入扇区
  const onPieEnter = (_: any, index: number) => setActiveIndex(index);

  // 处理鼠标离开
  const onPieLeave = () => setActiveIndex(-1);

  return (
    <div className="apple-card h-full rounded-apple-md bg-white p-6">
      {/* 标题区域 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">议题类型分布</h3>
        <p className="mt-1 text-sm text-gray-500">各类别议题占比统计</p>
      </div>

      {/* 图表内容区：左侧图表 + 右侧图例 */}
      <div className="flex items-start gap-6">
        {/* 左侧：环形图 */}
        <div className="relative h-[240px] w-[240px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={2.5}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                    opacity={
                      activeIndex === -1 || activeIndex === index ? 1 : 0.4
                    }
                    style={{
                      filter:
                        activeIndex === index
                          ? 'drop-shadow(0 0 8px rgba(0,0,0,0.15))'
                          : 'none',
                      transition: 'all 0.3s ease',
                      transform:
                        activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                    }}
                  />
                ))}
              </Pie>

              {/* Tooltip */}
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* 中心文字：显示总数 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-gray-900">
              {totalCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">总计</p>
          </div>
        </div>

        {/* 右侧：自定义图例 */}
        <div className="flex-1 min-w-[140px]">
          <Legend content={<CustomLegend />} />
        </div>
      </div>
    </div>
  );
};

export default TopicDistributionChart;
