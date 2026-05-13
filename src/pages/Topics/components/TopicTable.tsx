/**
 * 议题管理 - 数据表格组件
 *
 * Apple Design Style Table
 * 支持多选、排序、操作按钮、分页
 * 包含骨架屏加载状态和空状态
 */

import React from 'react';
import { TopicItem } from '../types';
import {
  STATUS_COLORS,
  TYPE_COLORS,
  PAGE_SIZE_OPTIONS,
  SPACING,
  RADIUS,
  SHADOWS,
} from '../constants';

// ============ 类型定义 ============

interface TopicTableProps {
  /** 数据列表 */
  items: TopicItem[];
  /** 是否加载中 */
  loading: boolean;
  /** 已选择的 ID 集合 */
  selectedIds: Set<string>;
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 总记录数 */
  totalItems: number;
  /** 每页条数 */
  pageSize: number;
  
  // 回调函数
  onSelectionChange: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (item: TopicItem) => void;
  onDelete: (item: TopicItem) => void;
  onViewDetail: (item: TopicItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// ============ 样式常量 ============

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    boxShadow: SHADOWS.sm,
  },
  
  // 表格包装器（支持横向滚动）
  tableWrapper: {
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  
  // 表格
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 14,
    color: '#1d1d1f',
  },
  
  // 表头
  thead: {
    backgroundColor: '#fafafa',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  th: {
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: 12,
    color: '#86868b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap' as const,
    userSelect: 'none' as const,
  },
  
  // 表体
  tbody: {},
  
  // 行
  tr: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.15s ease',
    cursor: 'pointer' as const,
  },
  trHover: {
    '&:hover': {
      backgroundColor: 'rgba(0, 113, 227, 0.03)',
    },
  },
  trSelected: {
    backgroundColor: 'rgba(0, 113, 227, 0.06)',
  },
  
  // 单元格
  td: {
    padding: `${SPACING.md}px ${SPACING.md}px`,
    verticalAlign: 'middle' as const,
  },
  
  // 复选框
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: '2px solid #d2d2d7',
    cursor: 'pointer' as const,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    position: 'relative' as const,
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#0071e3',
    borderColor: '#0071e3',
  },
  
  // ID 单元格
  idCell: {
    fontFamily: '"SF Mono", "Menlo", monospace',
    fontSize: 13,
    color: '#86868b',
    fontWeight: 500,
    userSelect: 'none' as const,
  },
  
  // 标题单元格
  titleCell: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    maxWidth: 300,
  },
  titleText: {
    fontWeight: 500,
    color: '#1d1d1f',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  coverImage: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    objectFit: 'cover' as const,
    flexShrink: 0,
    backgroundColor: '#f5f5f7',
  },
  
  // 状态/类型标签
  badge: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    padding: '4px 10px',
    borderRadius: RADIUS.sm,
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  
  // 时间文本
  timeText: {
    fontSize: 13,
    color: '#86868b',
    whiteSpace: 'nowrap' as const,
  },
  
  // 操作按钮组
  actionsCell: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#86868b',
    cursor: 'pointer' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  
  // 分页容器
  paginationContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    flexWrap: 'wrap' as const,
    gap: SPACING.sm,
  },
  paginationInfo: {
    fontSize: 13,
    color: '#86868b',
  },
  paginationControls: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: SPACING.xs,
  },
  pageButton: {
    minWidth: 34,
    height: 34,
    padding: '0 10px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: RADIUS.sm,
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    fontSize: 14,
    cursor: 'pointer' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'all 0.15s ease',
  },
  pageButtonActive: {
    backgroundColor: '#0071e3',
    borderColor: '#0071e3',
    color: '#ffffff',
    fontWeight: 600,
  },
  pageButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed' as const,
  },
  pageSizeSelect: {
    height: 34,
    paddingLeft: 8,
    paddingRight: 24,
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: RADIUS.sm,
    fontSize: 13,
    color: '#1d1d1f',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
  },
  
  // 空状态
  emptyState: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: `${SPACING.xxl * 2}px ${SPACING.lg}px`,
    color: '#86868b',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#1d1d1f',
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 1.5,
    textAlign: 'center' as const,
  },
  
  // 骨架屏
  skeletonRow: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

// ============ 子组件 ============

/**
 * 状态标签
 */
const StatusBadge: React.FC<{ status: TopicItem['status'] }> = ({ status }) => {
  const config = STATUS_COLORS[status];
  return (
    <span style={{ ...styles.badge, backgroundColor: config.bg, color: config.text }}>
      {config.label}
    </span>
  );
};

/**
 * 类型标签
 */
const TypeBadge: React.FC<{ type: TopicItem['type'] }> = ({ type }) => {
  const config = TYPE_COLORS[type];
  return (
    <span style={{ ...styles.badge, backgroundColor: config.bg, color: config.text }}>
      <span style={{ marginRight: 4 }}>{config.icon}</span>
      {config.label}
    </span>
  );
};

/**
 * 操作按钮
 */
const ActionButton: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, title, children, danger }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
    style={styles.actionButton}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = danger
        ? 'rgba(255, 59, 48, 0.08)'
        : 'rgba(0, 0, 0, 0.04)';
      (e.currentTarget as HTMLButtonElement).style.color = danger ? '#ff3b30' : '#0071e3';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
      (e.currentTarget as HTMLButtonElement).style.color = '#86868b';
    }}
  >
    {children}
  </button>
);

// ============ 骨架屏组件 ============

const SkeletonRow: React.FC = () => (
  <tr>
    {[...Array(8)].map((_, i) => (
      <td key={i} style={{ ...styles.td, ...styles.skeletonRow }}>
        <div style={{
          height: i === 1 ? 20 : 16,
          width: i === 1 ? '60%' : `${40 + Math.random() * 40}%`,
          borderRadius: 4,
          backgroundColor: '#f0f0f5',
        }} />
      </td>
    ))}
  </tr>
);

// ============ 主组件 ============

/**
 * 数据表格组件
 */
const TopicTable: React.FC<TopicTableProps> = ({
  items,
  loading,
  selectedIds,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onSelectionChange,
  onSelectAll,
  onEdit,
  onDelete,
  onViewDetail,
  onPageChange,
  onPageSizeChange,
}) => {
  // ========== 计算属性 ==========
  const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));
  const hasSelection = selectedIds.size > 0;

  // ========== 格式化时间 ==========
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // ========== 渲染分页 ==========
  const renderPagination = () => {
    if (totalPages <= 1 && !hasSelection) return null;

    // 生成分页按钮
    const pages: number[] = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div style={styles.paginationContainer}>
        {/* 左侧信息 */}
        <div style={styles.paginationInfo}>
          共 <strong>{totalItems.toLocaleString()}</strong> 条记录
          {hasSelection && (
            <span style={{ marginLeft: SPACING.md, color: '#0071e3' }}>
              已选 {selectedIds.size} 项
            </span>
          )}
        </div>

        {/* 右侧控制 */}
        <div style={styles.paginationControls}>
          {/* 每页条数 */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={styles.pageSizeSelect}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} 条/页</option>
            ))}
          </select>

          {/* 上一页 */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              ...styles.pageButton,
              ...(currentPage <= 1 ? styles.pageButtonDisabled : {}),
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 页码 */}
          {startPage > 1 && (
            <>
              <button style={styles.pageButton} onClick={() => onPageChange(1)}>1</button>
              {startPage > 2 && <span style={{ padding: '0 4px', color: '#86868b' }}>...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                ...styles.pageButton,
                ...(page === currentPage ? styles.pageButtonActive : {}),
              }}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span style={{ padding: '0 4px', color: '#86868b' }}>...</span>}
              <button style={styles.pageButton} onClick={() => onPageChange(totalPages)}>{totalPages}</button>
            </>
          )}

          {/* 下一页 */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              ...styles.pageButton,
              ...(currentPage >= totalPages ? styles.pageButtonDisabled : {}),
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // ========== 渲染空状态 ==========
  const renderEmpty = () => (
    <tr>
      <td colSpan={8}>
        <div style={styles.emptyState}>
          <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div style={styles.emptyTitle}>暂无议题</div>
          <div style={styles.emptyDesc}>
            点击右上角「新建议题」按钮创建第一个议题
          </div>
        </div>
      </td>
    </tr>
  );

  // ========== 主渲染 ==========
  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          {/* 表头 */}
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: 44 }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  style={{
                    ...styles.checkbox,
                    ...(isAllSelected ? styles.checkboxChecked : {}),
                  }}
                />
              </th>
              <th style={{ ...styles.th, width: 70 }}>ID</th>
              <th style={styles.th}>标题</th>
              <th style={{ ...styles.th, width: 90 }}>状态</th>
              <th style={{ ...styles.th, width: 80 }}>类型</th>
              <th style={{ ...styles.th, width: 120 }}>创建时间</th>
              <th style={{ ...styles.th, width: 120 }}>更新时间</th>
              <th style={{ ...styles.th, width: 140, textAlign: 'right' }}>操作</th>
            </tr>
          </thead>

          {/* 表体 */}
          <tbody style={styles.tbody}>
            {loading ? (
              // 骨架屏
              [...Array(10)].map((_, i) => <SkeletonRow key={`skeleton-${i}`} />)
            ) : items.length === 0 ? (
              // 空状态
              renderEmpty()
            ) : (
              // 数据行
              items.map(item => {
                const isSelected = selectedIds.has(item.id);
                
                return (
                  <tr
                    key={item.id}
                    style={{
                      ...styles.tr,
                      ...(isSelected ? styles.trSelected : {}),
                    }}
                    onClick={() => onSelectionChange(item.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 113, 227, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {/* 复选框 */}
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectionChange(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          ...styles.checkbox,
                          ...(isSelected ? styles.checkboxChecked : {}),
                        }}
                      />
                    </td>

                    {/* ID */}
                    <td style={styles.td}>
                      <span style={styles.idCell}>{item.displayId}</span>
                    </td>

                    {/* 标题 */}
                    <td style={styles.td}>
                      <div style={styles.titleCell}>
                        {item.coverImage && (
                          <img
                            src={item.coverImage}
                            alt=""
                            style={styles.coverImage}
                          />
                        )}
                        <span style={styles.titleText} title={item.title}>
                          {item.title}
                        </span>
                      </div>
                    </td>

                    {/* 状态 */}
                    <td style={styles.td}>
                      <StatusBadge status={item.status} />
                    </td>

                    {/* 类型 */}
                    <td style={styles.td}>
                      <TypeBadge type={item.type} />
                    </td>

                    {/* 创建时间 */}
                    <td style={styles.td}>
                      <span style={styles.timeText}>{formatTime(item.createdAt)}</span>
                    </td>

                    {/* 更新时间 */}
                    <td style={styles.td}>
                      <span style={styles.timeText}>{formatTime(item.updatedAt)}</span>
                    </td>

                    {/* 操作按钮 */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.actionsCell}>
                        <ActionButton
                          title="查看详情"
                          onClick={() => onViewDetail(item)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </ActionButton>
                        
                        <ActionButton
                          title="编辑"
                          onClick={() => onEdit(item)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </ActionButton>
                        
                        <ActionButton
                          title="删除"
                          onClick={() => onDelete(item)}
                          danger
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {!loading && renderPagination()}

      {/* 全局样式注入 - 骨架屏动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default TopicTable;
