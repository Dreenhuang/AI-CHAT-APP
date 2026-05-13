/**
 * SearchBar - 搜索筛选工具栏
 * 
 * Apple设计风格的搜索和筛选组件
 * 包含关键词搜索、类型/状态筛选、视图切换、排序功能
 */

import React, { useState, useEffect } from 'react';
import { SoulType, SoulStatus, SoulTypeLabels, SoulStatusLabels, ViewMode, SoulFilterParams } from '../types';

interface SearchBarProps {
  filter: SoulFilterParams;
  onFilterChange: (filter: SoulFilterParams) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResults: number;
  selectedCount?: number;
  onBatchAction?: (action: 'enable' | 'disable' | 'export' | 'delete') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalResults,
  selectedCount = 0,
  onBatchAction,
}) => {
  const [searchValue, setSearchValue] = useState(filter.keyword || '');
  const [showFilters, setShowFilters] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  /** 防抖搜索 */
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onFilterChange({ ...filter, keyword: searchValue });
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchValue]);

  /** 处理类型筛选变化 */
  const handleTypeChange = (type: SoulType | 'all') => {
    onFilterChange({ ...filter, type, page: 1 });
  };

  /** 处理状态筛选变化 */
  const handleStatusChange = (status: SoulStatus | 'all') => {
    onFilterChange({ ...filter, status, page: 1 });
  };

  /** 处理排序变化 */
  const handleSortChange = (sortBy: 'name' | 'createdAt' | 'usage' | 'rating') => {
    const sortOrder = filter.sortBy === sortBy && filter.sortOrder === 'asc' ? 'desc' : 'asc';
    onFilterChange({ ...filter, sortBy, sortOrder, page: 1 });
  };

  /** 清除所有筛选 */
  const clearAllFilters = () => {
    setSearchValue('');
    onFilterChange({
      keyword: '',
      type: 'all',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: filter.pageSize,
    });
  };

  /** 是否有激活的筛选条件 */
  const hasActiveFilters = filter.keyword || filter.type !== 'all' || filter.status !== 'all';

  return (
    <div className="search-bar-container">
      {/* 主工具栏 */}
      <div className="toolbar-main">
        {/* 搜索框 */}
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索角色名称、简介..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
          {searchValue && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchValue('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* 筛选按钮组 */}
        <div className="filter-group">
          {/* 类型筛选 */}
          <select
            value={filter.type || 'all'}
            onChange={(e) => handleTypeChange(e.target.value as SoulType | 'all')}
            className="filter-select"
          >
            <option value="all">所有类型</option>
            {Object.entries(SoulTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* 状态筛选 */}
          <select
            value={filter.status || 'all'}
            onChange={(e) => handleStatusChange(e.target.value as SoulStatus | 'all')}
            className="filter-select"
          >
            <option value="all">所有状态</option>
            {Object.entries(SoulStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* 排序按钮 */}
          <div className="sort-dropdown">
            <button className="sort-button" onClick={() => setShowFilters(!showFilters)}>
              <span>排序</span>
              <span className="sort-icon">↕️</span>
            </button>
            
            {showFilters && (
              <div className="sort-menu">
                <div 
                  className={`sort-option ${filter.sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('name');
                    setShowFilters(false);
                  }}
                >
                  <span>名称</span>
                  {filter.sortBy === 'name' && (
                    <span>{filter.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
                <div 
                  className={`sort-option ${filter.sortBy === 'createdAt' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('createdAt');
                    setShowFilters(false);
                  }}
                >
                  <span>创建时间</span>
                  {filter.sortBy === 'createdAt' && (
                    <span>{filter.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
                <div 
                  className={`sort-option ${filter.sortBy === 'usage' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('usage');
                    setShowFilters(false);
                  }}
                >
                  <span>使用次数</span>
                  {filter.sortBy === 'usage' && (
                    <span>{filter.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
                <div 
                  className={`sort-option ${filter.sortBy === 'rating' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('rating');
                    setShowFilters(false);
                  }}
                >
                  <span>评分</span>
                  {filter.sortBy === 'rating' && (
                    <span>{filter.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 视图切换 */}
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => onViewModeChange('card')}
            title="卡片视图"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="列表视图"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* 批量操作栏（选中时显示） */}
      {selectedCount > 0 && onBatchAction && (
        <div className="batch-actions-bar">
          <span className="selected-info">
            已选择 <strong>{selectedCount}</strong> 个角色
          </span>
          <div className="batch-buttons">
            <button 
              className="batch-btn success"
              onClick={() => onBatchAction('enable')}
            >
              ✓ 批量启用
            </button>
            <button 
              className="batch-btn warning"
              onClick={() => onBatchAction('disable')}
            >
              ⏸ 批量停用
            </button>
            <button 
              className="batch-btn primary"
              onClick={() => onBatchAction('export')}
            >
              📤 导出配置
            </button>
            <button 
              className="batch-btn danger"
              onClick={() => onBatchAction('delete')}
            >
              🗑 批量删除
            </button>
          </div>
        </div>
      )}

      {/* 筛选状态提示 */}
      <div className="filter-status">
        <span className="result-count">
          共 <strong>{totalResults}</strong> 个角色
        </span>
        
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            ✕ 清除筛选
          </button>
        )}

        {/* 活跃筛选标签 */}
        {filter.keyword && (
          <span className="filter-tag">
            关键词: "{filter.keyword}"
            <button onClick={() => setSearchValue('')}>✕</button>
          </span>
        )}
        {filter.type && filter.type !== 'all' && (
          <span className="filter-tag">
            类型: {SoulTypeLabels[filter.type]}
            <button onClick={() => handleTypeChange('all')}>✕</button>
          </span>
        )}
        {filter.status && filter.status !== 'all' && (
          <span className="filter-tag">
            状态: {SoulStatusLabels[filter.status]}
            <button onClick={() => handleStatusChange('all')}>✕</button>
          </span>
        )}
      </div>

      <style>{`
        .search-bar-container {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        /* 主工具栏 */
        .toolbar-main {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        /* 搜索输入框 */
        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          font-size: 16px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 36px 10px 42px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          font-size: 15px;
          background: rgba(0, 0, 0, 0.02);
          color: #1D1D1F;
          transition: all 0.2s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: #007AFF;
          background: white;
          box-shadow: 0 0 0 3px #007AFF15;
        }

        .search-input::placeholder {
          color: #86868B;
        }

        .clear-search-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #86868B;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .clear-search-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #1D1D1F;
        }

        /* 筛选按钮组 */
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-select {
          padding: 10px 32px 10px 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.02);
          color: #1D1D1F;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2386886B' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: all 0.2s;
        }

        .filter-select:focus {
          border-color: #007AFF;
          box-shadow: 0 0 0 3px #007AFF15;
        }

        /* 排序下拉菜单 */
        .sort-dropdown {
          position: relative;
        }

        .sort-button {
          padding: 10px 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.02);
          color: #1D1D1F;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .sort-button:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .sort-icon {
          font-size: 12px;
        }

        .sort-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 160px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 100;
          overflow: hidden;
        }

        .sort-option {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #1D1D1F;
          cursor: pointer;
          transition: background 0.15s;
        }

        .sort-option:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .sort-option.active {
          color: #007AFF;
          background: rgba(0, 122, 255, 0.06);
          font-weight: 500;
        }

        /* 视图切换 */
        .view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 10px;
        }

        .view-btn {
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: #86868B;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .view-btn:hover {
          color: #1D1D1F;
          background: rgba(0, 0, 0, 0.06);
        }

        .view-btn.active {
          background: white;
          color: #007AFF;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* 批量操作栏 */
        .batch-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: linear-gradient(135deg, #007AFF08, #007AFF04);
          border: 1px solid #007AFF20;
          border-radius: 10px;
          margin-bottom: 16px;
          animation: slideDown 0.25s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .selected-info {
          font-size: 14px;
          color: #1D1D1F;
        }

        .selected-info strong {
          color: #007AFF;
          font-weight: 600;
        }

        .batch-buttons {
          display: flex;
          gap: 8px;
        }

        .batch-btn {
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .batch-btn.success {
          background: #34C759;
          color: white;
        }

        .batch-btn.success:hover {
          background: #2DB853;
        }

        .batch-btn.warning {
          background: #FF9500;
          color: white;
        }

        .batch-btn.warning:hover {
          background: #E58900;
        }

        .batch-btn.primary {
          background: #007AFF;
          color: white;
        }

        .batch-btn.primary:hover {
          background: #0066DD;
        }

        .batch-btn.danger {
          background: #FF3B30;
          color: white;
        }

        .batch-btn.danger:hover {
          background: #E53329;
        }

        /* 筛选状态栏 */
        .filter-status {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .result-count {
          font-size: 13px;
          color: #86868B;
        }

        .result-count strong {
          color: #1D1D1F;
          font-weight: 600;
        }

        .clear-filters-btn {
          padding: 6px 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          background: transparent;
          color: #FF3B30;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters-btn:hover {
          background: rgba(255, 59, 48, 0.08);
        }

        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(0, 122, 255, 0.08);
          border: 1px solid rgba(0, 122, 255, 0.2);
          border-radius: 6px;
          font-size: 12px;
          color: #007AFF;
        }

        .filter-tag button {
          background: none;
          border: none;
          color: #007AFF;
          cursor: pointer;
          font-size: 12px;
          padding: 0 2px;
          line-height: 1;
        }

        .filter-tag button:hover {
          color: #FF3B30;
        }

        /* 响应式适配 */
        @media (max-width: 1024px) {
          .toolbar-main {
            flex-wrap: wrap;
          }
          
          .search-input-wrapper {
            flex-basis: 100%;
            order: -1;
          }
          
          .filter-group {
            flex-wrap: wrap;
          }
          
          .filter-select {
            flex: 1;
            min-width: 120px;
          }
        }

        @media (max-width: 768px) {
          .search-bar-container {
            padding: 16px;
          }
          
          .batch-actions-bar {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
          
          .batch-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .filter-status {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;
