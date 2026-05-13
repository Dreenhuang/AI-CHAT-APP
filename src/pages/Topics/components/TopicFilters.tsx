/**
 * 议题管理 - 搜索筛选栏组件
 *
 * Apple Design Style
 * 提供关键词搜索、状态/类型筛选、排序、重置功能
 * 支持筛选条件 Tag 展示和单独移除
 */

import React, { useState } from 'react';
import { TopicQueryParams, TopicStatus, TopicType } from '../types';
import {
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  SORT_OPTIONS,
  SPACING,
  RADIUS,
} from '../constants';

// ============ 类型定义 ============

interface TopicFiltersProps {
  /** 当前筛选条件 */
  filters: TopicQueryParams;
  /** 筛选变化回调 */
  onFilterChange: (params: Partial<TopicQueryParams>) => void;
  /** 重置回调 */
  onReset: () => void;
}

// ============ 样式常量 ============

const styles = {
  container: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    flexWrap: 'wrap' as const,
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  
  // 搜索框
  searchWrapper: {
    position: 'relative' as const,
    flex: '0 1 280px',
  },
  searchInput: {
    width: '100%',
    height: 36,
    paddingLeft: 36,
    paddingRight: SPACING.md,
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: RADIUS.md,
    fontSize: 14,
    color: '#1d1d1f',
    backgroundColor: '#fafafa',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#86868b',
    fontSize: 15,
    pointerEvents: 'none' as const,
  },
  
  // 下拉选择器
  select: {
    height: 36,
    padding: `0 ${SPACING.md}px`,
    paddingRight: 28,
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: RADIUS.md,
    fontSize: 14,
    color: '#1d1d1f',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 10px center',
  },
  
  // 按钮
  button: {
    height: 36,
    padding: `0 ${SPACING.md}px`,
    border: 'none',
    borderRadius: RADIUS.md,
    fontSize: 13,
    fontWeight: 500 as const,
    cursor: 'pointer',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  },
  resetButton: {
    backgroundColor: 'transparent',
    color: '#86868b',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  
  // 活跃筛选标签容器
  activeFiltersContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: SPACING.xs,
    flexWrap: 'wrap' as const,
    width: '100%',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
  },
  
  // 筛选 Tag
  filterTag: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 4,
    padding: '4px 10px',
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
    color: '#0071e3',
    borderRadius: RADIUS.sm,
    fontSize: 12,
    fontWeight: 500 as const,
  },
  tagRemove: {
    cursor: 'pointer',
    marginLeft: 2,
    opacity: 0.7,
    transition: 'opacity 0.15s',
    background: 'none',
    border: 'none',
    color: 'inherit',
    padding: 0,
    fontSize: 14,
    lineHeight: 1,
  },
};

// ============ 组件 ============

/**
 * 搜索筛选栏组件
 */
const TopicFilters: React.FC<TopicFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  // ========== 本地状态 ==========
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // ========== 处理函数 ==========
  
  /**
   * 搜索输入处理（实时更新）
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onFilterChange({ search: value || undefined });
  };

  /**
   * 清空搜索
   */
  const handleClearSearch = () => {
    setSearchValue('');
    onFilterChange({ search: undefined });
  };

  /**
   * 移除单个筛选 Tag
   */
  const handleRemoveTag = (key: keyof TopicQueryParams) => {
    if (key === 'search') {
      setSearchValue('');
      onFilterChange({ search: undefined });
    } else if (key === 'status') {
      onFilterChange({ status: 'all' });
    } else if (key === 'type') {
      onFilterChange({ type: 'all' });
    }
  };

  /**
   * 获取活跃的筛选条件列表
   */
  const getActiveFilters = (): { key: keyof TopicQueryParams; label: string }[] => {
    const active: { key: keyof TopicQueryParams; label: string }[] = [];
    
    if (filters.search) {
      active.push({ key: 'search', label: `搜索: ${filters.search}` });
    }
    if (filters.status && filters.status !== 'all') {
      const statusOpt = STATUS_OPTIONS.find(o => o.value === filters.status);
      if (statusOpt) active.push({ key: 'status', label: statusOpt.label });
    }
    if (filters.type && filters.type !== 'all') {
      const typeOpt = TYPE_OPTIONS.find(o => o.value === filters.type);
      if (typeOpt) active.push({ key: 'type', label: typeOpt.label });
    }
    
    return active;
  };

  // ========== 渲染 ==========
  
  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div style={styles.container}>
      {/* 搜索框 */}
      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="搜索标题或描述..."
          value={searchValue}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />
        {searchValue && (
          <button
            onClick={handleClearSearch}
            style={{
              ...styles.tagRemove,
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#86868b',
            }}
          >
            x
          </button>
        )}
      </div>

      {/* 状态筛选 */}
      <select
        value={filters.status || 'all'}
        onChange={(e) => onFilterChange({
          status: e.target.value as TopicStatus | 'all'
        })}
        style={styles.select}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* 类型筛选 */}
      <select
        value={filters.type || 'all'}
        onChange={(e) => onFilterChange({
          type: e.target.value as TopicType | 'all'
        })}
        style={styles.select}
      >
        {TYPE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* 排序 */}
      <select
        value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split('-');
          onFilterChange({
            sortBy: sortBy as TopicQueryParams['sortBy'],
            sortOrder: sortOrder as 'asc' | 'desc',
          });
        }}
        style={styles.select}
      >
        {SORT_OPTIONS.map(opt => (
          <optgroup key={opt.value} label={`${opt.label} ▼`}>
            <option value={`${opt.value}-desc`}>{opt.label} (新→旧)</option>
            <option value={`${opt.value}-asc`}>{opt.label} (旧→新)</option>
          </optgroup>
        ))}
      </select>

      {/* 重置按钮 */}
      <button
        onClick={onReset}
        style={{ ...styles.button, ...styles.resetButton }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        重置
      </button>

      {/* 活跃筛选 Tags */}
      {hasActiveFilters && (
        <div style={styles.activeFiltersContainer}>
          <span style={{ fontSize: 12, color: '#86868b', marginRight: 4 }}>
            已选:
          </span>
          {activeFilters.map(({ key, label }) => (
            <span key={key} style={styles.filterTag}>
              {label}
              <button
                onClick={() => handleRemoveTag(key)}
                style={styles.tagRemove}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicFilters;
