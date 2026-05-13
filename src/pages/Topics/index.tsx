/**
 * 议题管理 - 主页面
 *
 * Apple Design Style CRUD Page
 * 集成筛选、表格、模态框、抽屉等所有子组件
 * 提供完整的议题管理功能
 */

import React, { useState, useCallback } from 'react';
import { useTopics } from './hooks/useTopics';
import TopicFilters from './components/TopicFilters';
import TopicTable from './components/TopicTable';
import TopicFormModal from './components/TopicFormModal';
import TopicDetailDrawer from './components/TopicDetailDrawer';
import { TopicItem } from './types';
import {
  SPACING,
  RADIUS,
  SHADOWS,
} from './constants';

// ============ 样式常量 ============

const styles = {
  // 页面容器
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f7',
  },
  
  // 头部区域
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: `${SPACING.lg}px ${SPACING.xl}px`,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  headerLeft: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#86868b',
    marginTop: 2,
  },
  
  // 新建按钮
  createButton: {
    height: 40,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    border: 'none',
    backgroundColor: '#0071e3',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
  },
  
  // 主内容区
  mainContent: {
    padding: `${SPACING.lg}px ${SPACING.xl}px`,
  },
  
  // 工具栏（批量操作）
  toolbar: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.md,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    boxShadow: SHADOWS.sm,
  },
  toolbarInfo: {
    fontSize: 14,
    color: '#1d1d1f',
  },
  toolbarActions: {
    display: 'flex' as const,
    gap: SPACING.sm,
  },
  toolbarButton: {
    height: 34,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    border: '1px solid rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    transition: 'all 0.15s ease',
  },
  dangerButton: {
    borderColor: '#ff3b30',
    color: '#ff3b30',
  },
  
  // Toast 提示
  toast: {
    position: 'fixed' as const,
    bottom: SPACING.xl,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: `${SPACING.md}px ${SPACING.xl}px`,
    borderRadius: RADIUS.md,
    boxShadow: SHADOWS.lg,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 2000,
    animation: 'toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  toastSuccess: {
    backgroundColor: '#1d1d1f',
    color: '#ffffff',
  },
  toastError: {
    backgroundColor: '#ff3b30',
    color: '#ffffff',
  },
};

// ============ 主组件 ============

/**
 * 议题管理主页面
 */
const TopicsPage: React.FC = () => {
  // ========== Hook ==========
  const {
    items,
    loading,
    error,
    pagination,
    filters,
    selectedIds,
    detailItem,
    formMode,
    editingItem,
    
    fetchList,
    updateFilters,
    resetFilters,
    changePage,
    changePageSize,
    
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    
    openCreateForm,
    openEditForm,
    closeForm,
    saveForm,
    
    viewDetail,
    closeDetail,
    
    deleteItem,
    batchDelete,
  } = useTopics();

  // ========== 本地状态 ==========
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ========== Toast 提示 ==========
  
  /**
   * 显示提示消息
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ========== 操作处理函数 ==========
  
  /** 打开新建表单 */
  const handleCreate = useCallback(() => {
    openCreateForm();
    setShowModal(true);
  }, [openCreateForm]);

  /** 打开编辑表单 */
  const handleEdit = useCallback((item: TopicItem) => {
    openEditForm(item);
    setShowModal(true);
  }, [openEditForm]);

  /** 关闭表单 */
  const handleCloseForm = useCallback(() => {
    closeForm();
    setShowModal(false);
  }, [closeForm]);

  /** 保存表单 */
  const handleSave = useCallback(async (data: Parameters<typeof saveForm>[0]) => {
    try {
      await saveForm(data);
      showToast(formMode === 'create' ? '议题创建成功' : '议题更新成功');
      return Promise.resolve();
    } catch (err) {
      showToast('操作失败，请重试', 'error');
      return Promise.reject(err);
    }
  }, [saveForm, formMode, showToast]);

  /** 查看详情 */
  const handleViewDetail = useCallback((item: TopicItem) => {
    viewDetail(item);
  }, [viewDetail]);

  /** 关闭详情 */
  const handleCloseDetail = useCallback(() => {
    closeDetail();
  }, [closeDetail]);

  /** 删除确认与执行 */
  const handleDelete = useCallback(async (item: TopicItem) => {
    if (!window.confirm(`确定要删除议题「${item.title}」吗？此操作不可恢复。`)) {
      return;
    }

    const success = await deleteItem(item.id);
    if (success) {
      showToast(`已删除「${item.title}」`);
    } else {
      showToast('删除失败', 'error');
    }
  }, [deleteItem, showToast]);

  /** 批量删除 */
  const handleBatchDelete = useCallback(async () => {
    const count = selectedIds.size;
    if (!window.confirm(`确定要删除选中的 ${count} 条记录吗？此操作不可恢复。`)) {
      return;
    }

    const ids = Array.from(selectedIds);
    const success = await batchDelete(ids);
    if (success) {
      showToast(`已删除 ${count} 条记录`);
    } else {
      showToast('批量删除失败', 'error');
    }
  }, [selectedIds, batchDelete, showToast]);

  // ========== 渲染 ==========
  
  return (
    <div style={styles.container}>
      {/* 页面头部 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>议题管理</h1>
          <span style={styles.subtitle}>
            管理所有辩论、投票、讨论和问答议题
          </span>
        </div>
        
        <button
          onClick={handleCreate}
          style={styles.createButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0077ed';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0071e3';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建议题
        </button>
      </header>

      {/* 主内容区 */}
      <main style={styles.mainContent}>
        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: SPACING.md,
            marginBottom: SPACING.md,
            backgroundColor: '#fff5f5',
            border: '1px solid #ffcccc',
            borderRadius: RADIUS.md,
            color: '#cc0000',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button
              onClick={() => fetchList()}
              style={{
                ...styles.toolbarButton,
                borderColor: '#cc0000',
                color: '#cc0000',
                padding: '4px 12px',
                height: 'auto',
              }}
            >
              重试
            </button>
          </div>
        )}

        {/* 批量操作工具栏 */}
        {selectedIds.size > 0 && (
          <div style={styles.toolbar}>
            <span style={styles.toolbarInfo}>
              已选择 <strong>{selectedIds.size}</strong> 项
            </span>
            <div style={styles.toolbarActions}>
              <button
                onClick={() => clearSelection()}
                style={styles.toolbarButton}
              >
                取消选择
              </button>
              <button
                onClick={handleBatchDelete}
                style={{ ...styles.toolbarButton, ...styles.dangerButton }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                批量删除 ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {/* 筛选栏 */}
        <TopicFilters
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
        />

        {/* 数据表格 */}
        <TopicTable
          items={items}
          loading={loading}
          selectedIds={selectedIds}
          currentPage={pagination.current}
          totalPages={pagination.total}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          
          onSelectionChange={toggleSelect}
          onSelectAll={toggleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetail={handleViewDetail}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
        />
      </main>

      {/* 新建/编辑模态框 */}
      <TopicFormModal
        mode={formMode || 'create'}
        editingItem={editingItem}
        visible={showModal}
        onSave={handleSave}
        onCancel={handleCloseForm}
      />

      {/* 详情抽屉 */}
      <TopicDetailDrawer
        item={detailItem}
        visible={!!detailItem}
        onClose={handleCloseDetail}
        onEdit={handleEdit}
      />

      {/* Toast 提示 */}
      {toast && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError),
        }}>
          {toast.type === 'success' ? (
            <span style={{ marginRight: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          ) : (
            <span style={{ marginRight: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </span>
          )}
          {toast.message}
        </div>
      )}

      {/* 全局动画样式 */}
      <style>{`
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        /* 滚动条美化 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c1c6;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a6;
        }
      `}</style>
    </div>
  );
};

export default TopicsPage;

// ============ 默认导出 ============
export { TopicsPage };
