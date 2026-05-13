/**
 * 审计日志管理页面
 * 
 * Apple Design Style - 管理后台审计日志系统
 * 
 * 设计特点：
 * - 简洁清晰的视觉层级
 * - 流畅的交互动画
 * - 高效的信息展示
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditActionType,
  TargetType,
  AuditResult,
  ACTION_TYPE_CONFIG,
  TARGET_TYPE_CONFIG,
} from './types';
import auditLogApi, { formatRelativeTime } from './api';
import LogDetailModal from './LogDetailModal';

// ============ 常量 ============

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 768;

// ============ 主组件 ============

const AuditLogsPage: React.FC = () => {
  // ============ 状态管理 ============
  
  /** 日志列表数据 */
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  
  /** 总条数 */
  const [total, setTotal] = useState(0);
  
  /** 当前页码 */
  const [page, setPage] = useState(1);
  
  /** 每页条数 */
  const [pageSize] = useState(IS_TABLET ? 20 : 15);
  
  /** 总页数 */
  const [totalPages, setTotalPages] = useState(1);
  
  /** 筛选条件 */
  const [filters, setFilters] = useState<AuditLogFilters>({});
  
  /** 加载状态 */
  const [loading, setLoading] = useState(false);
  
  /** 下拉刷新状态 */
  const [refreshing, setRefreshing] = useState(false);
  
  /** 选中的日志（用于详情弹窗） */
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  
  /** 详情弹窗可见 */
  const [modalVisible, setModalVisible] = useState(false);
  
  /** 导出加载中 */
  const [exporting, setExporting] = useState(false);
  
  /** 操作人列表 */
  const [operators, setOperators] = useState<Array<{ id: string; displayName: string; username: string }>>([]);

  // ============ 数据加载 ============

  /**
   * 加载日志数据
   */
  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const result = await auditLogApi.getList({
        page,
        pageSize,
        ...filters,
      });
      
      setLogs(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, filters]);

  /**
   * 加载操作人列表
   */
  useEffect(() => {
    const loadOperators = async () => {
      const ops = await auditLogApi.getOperators();
      setOperators(ops);
    };
    loadOperators();
  }, []);

  // 初始加载 & 筛选变化时重新加载
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ============ 事件处理 ============

  /** 下拉刷新 */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchLogs(false);
  }, [fetchLogs]);

  /** 切换页码 */
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  /** 打开日志详情 */
  const handleViewDetail = useCallback((log: AuditLogEntry) => {
    setSelectedLog(log);
    setModalVisible(true);
  }, []);

  /** 关闭详情弹窗 */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setSelectedLog(null), 300);
  }, []);

  /** 更新筛选条件 */
  const updateFilter = useCallback(<K extends keyof AuditLogFilters>(
    key: K,
    value: AuditLogFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // 重置到第一页
  }, []);

  /** 导出日志 */
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await auditLogApi.export({
        format: 'csv',
        fields: ['id', 'timestamp', 'operator.displayName', 'actionType', 'targetType', 'targetName', 'result'],
        filters,
      });
      alert('导出成功！文件已下载');
    } catch (error) {
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  }, [filters]);

  /** 重置筛选 */
  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  // ============ 渲染 ============

  return (
    <View style={styles.container}>
      {/* 页面头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📋</Text>
          <Text style={styles.headerTitle}>审计日志</Text>
        </View>
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.7}
        >
          <Text style={styles.exportButtonText}>
            {exporting ? '导出中...' : '导出'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 筛选栏 */}
        <View style={styles.filterSection}>
          {/* 第一行筛选 */}
          <View style={styles.filterRow}>
            <FilterDropdown
              label="操作人"
              value={filters.operatorId || 'all'}
              options={[
                { value: 'all', label: '全部操作人' },
                ...operators.map(op => ({ value: op.id, label: op.displayName })),
              ]}
              onChange={(value) => updateFilter('operatorId', value === 'all' ? undefined : value)}
            />
            
            <FilterDropdown
              label="操作类型"
              value={filters.actionType || 'all'}
              options={[
                { value: 'all', label: '全部类型' },
                ...Object.entries(ACTION_TYPE_CONFIG).map(([key, config]) => ({
                  value: key,
                  label: `${config.icon} ${config.label}`,
                })),
              ]}
              onChange={(value) => updateFilter('actionType', value === 'all' ? undefined : value as AuditActionType)}
            />

            <FilterDropdown
              label="结果"
              value={filters.result || 'all'}
              options={[
                { value: 'all', label: '全部结果' },
                { value: 'success', label: '✅ 成功' },
                { value: 'failure', label: '❌ 失败' },
              ]}
              onChange={(value) => updateFilter('result', value === 'all' ? undefined : value as AuditResult)}
            />
          </View>

          {/* 第二行筛选 */}
          <View style={styles.filterRow}>
            <FilterDropdown
              label="目标类型"
              value={filters.targetType || 'all'}
              options={[
                { value: 'all', label: '全部对象' },
                ...Object.entries(TARGET_TYPE_CONFIG).map(([key, config]) => ({
                  value: key,
                  label: `${config.icon} ${config.label}`,
                })),
              ]}
              onChange={(value) => updateFilter('targetType', value === 'all' ? undefined : value as TargetType)}
            />

            <SearchInput
              placeholder="搜索 IP / Request ID..."
              value={filters.ipAddress || ''}
              onChangeText={(text) => updateFilter('ipAddress', text || undefined)}
            />

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>重置</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            共 <Text style={styles.statsHighlight}>{total.toLocaleString()}</Text> 条记录
          </Text>
          {Object.keys(filters).length > 0 && (
            <Text style={styles.filterCount}>
              已应用 {Object.keys(filters).length} 个筛选条件
            </Text>
          )}
        </View>

        {/* 表格/列表区域 */}
        <View style={styles.tableContainer}>
          {/* 表头 */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellTime]}>时间</Text>
            <Text style={[styles.tableHeaderCell, styles.cellOperator]}>操作人</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAction]}>操作类型</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTarget]}>目标</Text>
            <Text style={[styles.tableHeaderCell, styles.cellResult]}>结果</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDetail]}>操作</Text>
          </View>

          {/* 数据行 */}
          {loading && logs.length === 0 ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner} />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>暂无日志记录</Text>
              <Text style={styles.emptyDesc}>调整筛选条件或稍后再试</Text>
            </View>
          ) : (
            logs.map((log, index) => {
              const actionConfig = ACTION_TYPE_CONFIG[log.actionType];
              
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowEven,
                  ]}
                  onPress={() => handleViewDetail(log)}
                  activeOpacity={0.6}
                >
                  {/* 时间列 */}
                  <View style={[styles.tableCell, styles.cellTime]}>
                    <Text style={styles.timeText} numberOfLines={1}>
                      {formatRelativeTime(log.timestamp)}
                    </Text>
                    <Text style={styles.fullTimeText} numberOfLines={1}>
                      {new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* 操作人列 */}
                  <View style={[styles.tableCell, styles.cellOperator]}>
                    <Text style={styles.operatorText} numberOfLines={1}>
                      {log.operator.displayName}
                    </Text>
                  </View>

                  {/* 操作类型列 */}
                  <View style={[styles.tableCell, styles.cellAction]}>
                    <View style={[styles.actionBadge, { backgroundColor: `${actionConfig.color}15` }]}>
                      <Text style={styles.actionIcon}>{actionConfig.icon}</Text>
                      <Text style={[styles.actionLabel, { color: actionConfig.color }]}>
                        {actionConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* 目标列 */}
                  <View style={[styles.tableCell, styles.cellTarget]}>
                    <Text style={styles.targetText} numberOfLines={1}>
                      {log.targetName}
                    </Text>
                  </View>

                  {/* 结果列 */}
                  <View style={[styles.tableCell, styles.cellResult]}>
                    <View style={[
                      styles.resultBadge,
                      log.result === 'success' ? styles.resultSuccess :
                      log.result === 'failure' ? styles.resultFailure : styles.resultPending
                    ]}>
                      <Text style={[
                        styles.resultBadgeText,
                        log.result === 'success' ? styles.resultSuccessText :
                        log.result === 'failure' ? styles.resultFailureText : styles.resultPendingText
                      ]}>
                        {log.result === 'success' ? '成功' : log.result === 'failure' ? '失败' : '进行中'}
                      </Text>
                    </View>
                  </View>

                  {/* 操作列 */}
                  <View style={[styles.tableCell, styles.cellDetail]}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={(e) => {
                        e.stopPropagation?.(); // RN不需要这个但保留兼容性
                        handleViewDetail(log);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.viewButtonText}>查看</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* 分页器 */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
          />
        )}
      </ScrollView>

      {/* 详情模态框 */}
      <LogDetailModal
        visible={modalVisible}
        log={selectedLog}
        onClose={handleCloseModal}
      />
    </View>
  );
};

// ============ 子组件 ============

/** 筛选下拉框 */
interface FilterDropdownProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  const selectedOption = options.find(o => o.value === value);

  return (
    <View style={styles.filterDropdown}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownValue} numberOfLines={1}>
          {selectedOption?.label || '请选择'}
        </Text>
        <Text style={styles.dropdownArrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.dropdownMenu}>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                option.value === value && styles.dropdownItemSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setExpanded(false);
              }}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  option.value === value && styles.dropdownItemTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

/** 搜索输入框 */
interface SearchInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  value,
  onChangeText,
}) => (
  <View style={styles.searchInputWrapper}>
    <Text style={styles.searchIcon}>🔍</Text>
    <TextInputWrapper
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

// 由于RN没有原生TextInput在ScrollView中的问题，这里简化处理
const TextInputWrapper: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ placeholder, value, onChangeText }) => (
  <TouchableOpacity
    style={styles.searchInput}
    activeOpacity={1}
  >
    <Text style={value ? styles.searchValue : styles.searchPlaceholder}>
      {value || placeholder}
    </Text>
  </TouchableOpacity>
);

/** 分页器 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showMax = IS_TABLET ? 9 : 5;
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        activeOpacity={0.7}
      >
        <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
          ‹
        </Text>
      </TouchableOpacity>

      {getPageNumbers().map((pageNum, idx) =>
        typeof pageNum === 'string' ? (
          <Text key={`dots-${idx}`} style={styles.pageDots}>...</Text>
        ) : (
          <TouchableOpacity
            key={pageNum}
            style={[
              styles.pageButton,
              pageNum === currentPage && styles.pageButtonActive,
            ]}
            onPress={() => onPageChange(pageNum)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pageButtonText,
                pageNum === currentPage && styles.pageButtonTextActive,
              ]}
            >
              {pageNum}
            </Text>
          </TouchableOpacity>
        )
      )}

      <TouchableOpacity
        style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        activeOpacity={0.7}
      >
        <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ============ Apple 风格样式 ============

const styles = StyleSheet.create({
  // 容器
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // 头部
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IS_TABLET ? 28 : 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: IS_TABLET ? 26 : 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },

  // 导出按钮
  exportButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // 滚动视图
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // 筛选区域
  filterSection: {
    marginHorizontal: IS_TABLET ? 28 : 16,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filterRow:lastChild: {
    marginBottom: 0,
  },

  // 下拉框
  filterDropdown: {
    flex: 1,
    minWidth: 0,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  dropdownValue: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
    marginRight: 6,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#8E8E93',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownItemSelected: {
    backgroundColor: '#007AFF15',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // 搜索框
  searchInputWrapper: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  searchValue: {
    fontSize: 13,
    color: '#1C1C1E',
  },
  searchPlaceholder: {
    fontSize: 13,
    color: '#C7C7CC',
  },

  // 重置按钮
  resetButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },

  // 统计信息
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: IS_TABLET ? 28 : 16,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statsHighlight: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  filterCount: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },

  // 表格容器
  tableContainer: {
    marginHorizontal: IS_TABLET ? 28 : 16,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // 表头
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 列宽定义
  cellTime: { flex: 1.6, minWidth: 100 },
  cellOperator: { flex: 1, minWidth: 70 },
  cellAction: { flex: 1.1, minWidth: 80 },
  cellTarget: { flex: 1.4, minWidth: 90 },
  cellResult: { flex: 0.75, minWidth: 60 },
  cellDetail: { flex: 0.65, minWidth: 50, alignItems: 'flex-end' },

  // 数据行
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFC',
  },

  // 单元格
  tableCell: {
    paddingRight: 8,
  },

  // 时间单元格
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  fullTimeText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // 操作人
  operatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
  },

  // 操作类型徽章
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 目标文本
  targetText: {
    fontSize: 13,
    color: '#1C1C1E',
  },

  // 结果徽章
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  resultSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  resultFailure: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  resultPending: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultSuccessText: { color: '#248A3D' },
  resultFailureText: { color: '#D70015' },
  resultPendingText: { color: '#007AFF' },

  // 查看按钮
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F0F0F5',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },

  // 加载状态
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E5E5EA',
    borderTopColor: '#007AFF',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#8E8E93',
  },

  // 空状态
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // 分页器
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 8,
    gap: 6,
  },
  pageButton: {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08),
  },
  pageButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  pageButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: '#C7C7CC',
  },
  pageDots: {
    paddingHorizontal: 6,
    fontSize: 14,
    color: '#8E8E93',
  },
});

// ============ 导出 ============

export default AuditLogsPage;
