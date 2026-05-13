/**
 * 议题管理 - 自定义 Hook
 *
 * useTopics - 核心数据管理 Hook
 * 封装列表查询、筛选、CRUD 操作等所有业务逻辑
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  TopicItem,
  TopicFormData,
  TopicListResponse,
  TopicQueryParams,
  TopicStatus,
  TopicType,
} from '../types';
import { topicService } from '../services/topicService';
import { DEFAULT_QUERY_PARAMS } from '../constants';

// ============ Hook 返回类型 ============

interface UseTopicsReturn {
  // 数据状态
  items: TopicItem[];
  loading: boolean;
  error: string | null;
  
  // 分页状态
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalItems: number;
  };
  
  // 筛选状态
  filters: TopicQueryParams;
  
  // 选择状态
  selectedIds: Set<string>;
  
  // 详情状态
  detailItem: TopicItem | null;
  
  // 表单状态
  formMode: 'create' | 'edit' | null;
  editingItem: TopicItem | null;
  
  // 方法
  fetchList: () => Promise<void>;
  refresh: () => Promise<void>;
  updateFilters: (newFilters: Partial<TopicQueryParams>) => void;
  resetFilters: () => void;
  changePage: (page: number) => void;
  changePageSize: (size: number) => void;
  
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  
  openCreateForm: () => void;
  openEditForm: (item: TopicItem) => void;
  closeForm: () => void;
  saveForm: (data: TopicFormData) => Promise<boolean>;
  
  viewDetail: (item: TopicItem) => void;
  closeDetail: () => void;
  
  deleteItem: (id: string) => Promise<boolean>;
  batchDelete: (ids: string[]) => Promise<boolean>;
  updateStatus: (id: string, status: TopicStatus) => Promise<boolean>;
}

// ============ 主 Hook ============

/**
 * 议题管理核心 Hook
 *
 * 提供完整的 CRUD + 列表管理功能
 */
export function useTopics(): UseTopicsReturn {
  // ========== 数据状态 ==========
  const [items, setItems] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ========== 分页状态 ==========
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    pageSize: DEFAULT_QUERY_PARAMS.pageSize,
    totalItems: 0,
  });
  
  // ========== 筛选状态 ==========
  const [filters, setFilters] = useState<TopicQueryParams>({
    ...DEFAULT_QUERY_PARAMS,
  });
  
  // ========== 选择状态 ==========
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // ========== 详情/表单状态 ==========
  const [detailItem, setDetailItem] = useState<TopicItem | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<TopicItem | null>(null);
  
  // ========== 防抖 Ref ==========
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ========== 数据获取 ==========
  
  /**
   * 获取议题列表
   */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await topicService.getList(filters);
      
      if (response.success && response.data) {
        const data = response.data as unknown as TopicListResponse;
        setItems(data.items || []);
        
        if (data.pagination) {
          setPagination({
            current: data.pagination.current,
            total: data.pagination.total,
            pageSize: data.pagination.pageSize,
            totalItems: data.pagination.totalItems,
          });
        }
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      console.error('[useTopics] Fetch error:', err);
      setError('网络请求失败，请检查连接');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * 刷新列表（重新获取当前页）
   */
  const refresh = useCallback(async () => {
    await fetchList();
  }, [fetchList]);

  // ========== 筛选操作 ==========
  
  /**
   * 更新筛选条件（带防抖）
   */
  const updateFilters = useCallback((newFilters: Partial<TopicQueryParams>) => {
    // 如果是搜索关键词变化，应用防抖
    if (newFilters.search !== undefined) {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      
      searchTimerRef.current = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          ...newFilters,
          page: 1, // 重置到第一页
        }));
      }, 300); // 300ms 防抖
      
      return;
    }
    
    // 其他筛选条件立即生效
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, []);

  /**
   * 重置所有筛选条件
   */
  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_QUERY_PARAMS });
    setSelectedIds(new Set());
  }, []);

  // ========== 分页操作 ==========
  
  /**
   * 切换页码
   */
  const changePage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  /**
   * 切换每页条数
   */
  const changePageSize = useCallback((size: number) => {
    setFilters(prev => ({ ...prev, pageSize: size, page: 1 }));
  }, []);

  // ========== 选择操作 ==========
  
  /**
   * 切换单个选择
   */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === items.length && items.length > 0) {
        return new Set(); // 全部取消
      }
      return new Set(items.map(item => item.id)); // 全选
    });
  }, [items]);

  /**
   * 清空选择
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ========== 表单操作 ==========
  
  /**
   * 打开新建表单
   */
  const openCreateForm = useCallback(() => {
    setFormMode('create');
    setEditingItem(null);
  }, []);

  /**
   * 打开编辑表单
   */
  const openEditForm = useCallback((item: TopicItem) => {
    setFormMode('edit');
    setEditingItem(item);
  }, []);

  /**
   * 关闭表单
   */
  const closeForm = useCallback(() => {
    setFormMode(null);
    setEditingItem(null);
  }, []);

  /**
   * 保存表单数据
   */
  const saveForm = useCallback(async (data: TopicFormData): Promise<boolean> => {
    try {
      let response;
      
      if (formMode === 'create') {
        response = await topicService.create(data);
      } else if (formMode === 'edit' && editingItem) {
        response = await topicService.update(editingItem.id, data);
      } else {
        return false;
      }
      
      if (response.success) {
        await fetchList(); // 刷新列表
        closeForm();
        return true;
      }
      
      setError(response.error || '保存失败');
      return false;
    } catch (err) {
      console.error('[useTopics] Save error:', err);
      setError('保存失败，请重试');
      return false;
    }
  }, [formMode, editingItem, fetchList, closeForm]);

  // ========== 详情操作 ==========
  
  /**
   * 查看详情
   */
  const viewDetail = useCallback((item: TopicItem) => {
    setDetailItem(item);
  }, []);

  /**
   * 关闭详情
   */
  const closeDetail = useCallback(() => {
    setDetailItem(null);
  }, []);

  // ========== 删除操作 ==========
  
  /**
   * 删除单个议题
   */
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await topicService.delete(id);
      
      if (response.success) {
        await fetchList(); // 刷新列表
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return true;
      }
      
      setError(response.error || '删除失败');
      return false;
    } catch (err) {
      console.error('[useTopics] Delete error:', err);
      setError('删除失败，请重试');
      return false;
    }
  }, [fetchList]);

  /**
   * 批量删除
   */
  const batchDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const response = await topicService.batchDelete(ids);
      
      if (response.success) {
        await fetchList(); // 刷新列表
        setSelectedIds(new Set());
        return true;
      }
      
      setError(response.error || '批量删除失败');
      return false;
    } catch (err) {
      console.error('[useTopics] Batch delete error:', err);
      setError('批量删除失败，请重试');
      return false;
    }
  }, [fetchList]);

  /**
   * 更新状态
   */
  const updateStatus = useCallback(async (
    id: string,
    status: TopicStatus
  ): Promise<boolean> => {
    try {
      const response = await topicService.updateStatus(id, status);
      
      if (response.success) {
        await fetchList(); // 刷新列表
        return true;
      }
      
      setError(response.error || '状态更新失败');
      return false;
    } catch (err) {
      console.error('[useTopics] Update status error:', err);
      setError('状态更新失败，请重试');
      return false;
    }
  }, [fetchList]);

  // ========== 初始化 & 监听 ==========
  
  // 当筛选条件变化时自动刷新
  useEffect(() => {
    fetchList();
  }, [filters.page, filters.pageSize, filters.status, filters.type, 
      filters.sortBy, filters.sortOrder, filters.dateFrom, filters.dateTo]);
  
  // 搜索防抖后的刷新由 updateFilters 内的 setTimeout 触发

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // ========== 返回 ==========
  return {
    // 数据状态
    items,
    loading,
    error,
    
    // 分页状态
    pagination,
    
    // 筛选状态
    filters,
    
    // 选择状态
    selectedIds,
    
    // 详情/表单状态
    detailItem,
    formMode,
    editingItem,
    
    // 方法
    fetchList,
    refresh,
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
    updateStatus,
  };
}

export default useTopics;
