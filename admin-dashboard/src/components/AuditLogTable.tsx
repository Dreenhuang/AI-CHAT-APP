/**
 * AuditLogTable 审计日志表格组件
 *
 * 功能说明：
 * 表格形式展示最近的管理员操作记录。
 * 包含时间、操作人、操作类型、目标对象、操作结果、详情等列。
 *
 * 设计特点：
 * - Apple风格简洁表格设计
 * - 操作结果使用颜色标签区分（成功=绿色，失败=红色）
 * - 斑马纹行背景提升可读性
 * - 悬停行高亮效果
 * - 支持"查看更多"链接跳转
 *
 * 数据来源：
 * GET /api/admin/v1/audit-logs?limit=10
 */

import React from 'react';
import { Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

// ============ 类型定义 ============

interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  actionType: string;
  target: string;
  result: 'success' | 'failed';
  details: string;
}

interface AuditLogTableProps {
  /** 日志数据数组 */
  logs: AuditLogEntry[];
  /** 最大显示条数（默认10条） */
  maxRows?: number;
}

// ============ 辅助函数 ============

/**
 * 截断过长文本
 */
const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
};

// ============ 主组件 ============

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  maxRows = 10,
}) => {
  // 截取指定数量的日志
  const displayLogs = logs.slice(0, maxRows);

  return (
    <div className="apple-card overflow-hidden rounded-apple-md bg-white">
      {/* 标题区域 */}
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">
              最近操作日志
            </h3>
            <p className="text-sm text-gray-500">
              管理员操作记录追踪
            </p>
          </div>

          {/* "查看更多"链接按钮 */}
          <button className="group inline-flex items-center gap-1.5 rounded-apple-sm px-3 py-1.5 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">
            <span>查看全部</span>
            <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* 表格容器 - 可滚动 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* 表头 */}
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                操作人
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                操作类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                目标对象
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                结果
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                详情
              </th>
            </tr>
          </thead>

          {/* 表体 */}
          <tbody className="divide-y divide-gray-100">
            {displayLogs.map((log, index) => (
              <tr
                key={log.id}
                className={`transition-colors duration-150 ${
                  index % 2 === 0
                    ? 'bg-white hover:bg-gray-50/50'
                    : 'bg-gray-50/30 hover:bg-gray-50/70'
                }`}
              >
                {/* 时间列 */}
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {log.timestamp.split(' ')[1]} {/* 只显示时间部分 */}
                  </div>
                </td>

                {/* 操作人列 */}
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {log.adminName}
                  </span>
                </td>

                {/* 操作类型列 */}
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {log.actionType}
                  </span>
                </td>

                {/* 目标对象列 */}
                <td className="max-w-[180px] truncate px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {truncate(log.target, 20)}
                  </span>
                </td>

                {/* 结果列 - 带颜色标签 */}
                <td className="whitespace-nowrap px-6 py-4">
                  {log.result === 'success' ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">
                        成功
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-semibold text-red-700">
                        失败
                      </span>
                    </div>
                  )}
                </td>

                {/* 详情列 */}
                <td className="max-w-[260px] truncate px-6 py-4">
                  <span
                    className="text-sm text-gray-500"
                    title={log.details}
                  >
                    {truncate(log.details, 35)}
                  </span>
                </td>
              </tr>
            ))}

            {/* 空状态 */}
            {displayLogs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-sm text-gray-500"
                >
                  暂无操作记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 底部统计信息 */}
      {logs.length > maxRows && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
          <p className="text-xs text-gray-500">
            显示最近 {Math.min(maxRows, logs.length)} 条记录，共{' '}
            {logs.length} 条
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;
