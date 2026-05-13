/**
 * 用户管理页面 (User Management Page)
 *
 * 功能说明：
 * 完整的用户管理系统主页，集成所有子组件
 *
 * 核心功能：
 * 1. 用户列表展示和分页
 * 2. 搜索和筛选功能
 * 3. 添加/编辑/删除用户
 * 4. 批量操作
 * 5. 用户详情查看
 *
 * 页面结构：
 * ┌─────────────────────────────────────┐
 * │ Header: 标题 + 添加按钮             │
 * ├─────────────────────────────────────┤
 * │ SearchBar: 搜索 + 筛选              │
 * ├─────────────────────────────────────┤
 * │ UserTable: 用户列表表格            │
 * ├─────────────────────────────────────┤
 * │ Pagination: 分页控制               │
 * ├─────────────────────────────────────┤
 * │ BatchActions: 批量操作工具栏       │
 * └─────────────────────────────────────┘
 *
 * @module UserManagementPage
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 导入子组件
import SearchBar from './components/SearchBar';
import UserTable from './components/UserTable';
import UserModal from './components/UserModal';
import UserDrawer from './components/UserDrawer';
import BatchActions from './components/BatchActions';

// 导入服务和样式
import { userApi } from './services/userService';
import { Styles, Colors, Spacing } from './styles';
import type { User } from './components/UserTable';
import type { FilterParams } from './components/SearchBar';
import type { UserFormData } from './components/UserModal';
import type { UserDetail } from './components/UserDrawer';

// ============================================
// 类型定义
// ============================================

/** 分页信息 */
interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// 主组件：UserManagementPage
// ============================================

/**
 * 用户管理页面主组件
 */
const UserManagementPage: React.FC = () => {

  // ========== 状态管理 ==========

  /** 用户数据列表 */
  const [users, setUsers] = useState<User[]>([]);

  /** 是否正在加载 */
  const [loading, setLoading] = useState(false);

  /** 筛选条件 */
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    role: 'all',
    status: 'all',
  });

  /** 分页信息 */
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  /** 排序字段和方向 */
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /** 已选中的用户ID集合 */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /** 模态框状态 */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  /** 抽屉状态 */
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerUser, setDrawerUser] = useState<UserDetail | null>(null);

  // ========== 数据加载函数 ==========

  /**
   * 加载用户列表数据
   */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      // 调用API获取用户列表
      const response = await userApi.getList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        sortBy: sortBy,
        order: sortOrder,
      });

      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || pagination);
      }

    } catch (error) {
      console.error('[UserManagementPage] 加载用户列表失败:', error);
      Alert.alert('错误', '加载用户列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters, sortBy, sortOrder]);

  // 初始加载和筛选变化时重新加载数据
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ========== 事件处理函数 ==========

  /**
   * 处理筛选条件变化
   */
  const handleFilterChange = useCallback((newFilters: FilterParams) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
  }, []);

  /**
   * 处理排序变化
   */
  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  /**
   * 处理分页变化
   */
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  /**
   * 打开添加用户模态框
   */
  const handleAddUser = useCallback(() => {
    setModalMode('create');
    setEditingUser(null);
    setModalVisible(true);
  }, []);

  /**
   * 打开编辑用户模态框
   */
  const handleEditUser = useCallback((user: User) => {
    setModalMode('edit');
    setEditingUser(user);
    setModalVisible(true);
  }, []);

  /**
   * 关闭模态框
   */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingUser(null);
  }, []);

  /**
   * 提交表单（添加或编辑）
   */
  const handleSubmitForm = useCallback(async (formData: UserFormData) => {
    if (modalMode === 'create') {
      // 创建新用户
      await userApi.create(formData);
      Alert.alert('成功', '用户创建成功');
    } else if (editingUser) {
      // 更新现有用户
      await userApi.update(editingUser.id, formData);
      Alert.alert('成功', '用户信息更新成功');
    }
    // 重新加载数据
    loadUsers();
  }, [modalMode, editingUser, loadUsers]);

  /**
   * 处理删除用户
   */
  const handleDeleteUser = useCallback((user: User) => {
    Alert.alert(
      '确认删除',
      `确定要删除用户 "${user.username}" 吗？\n\n此操作不可恢复！`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.delete(user.id);
              Alert.alert('成功', '用户已删除');
              loadUsers();
            } catch (error) {
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ]
    );
  }, [loadUsers]);

  /**
   * 处理状态切换
   */
  const handleStatusToggle = useCallback(async (user: User) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '禁用';

    Alert.alert(
      `${actionText}用户`,
      `确定要${actionText}用户 "${user.username}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: `确定${actionText}`,
          onPress: async () => {
            try {
              await userApi.updateStatus(user.id, newStatus, `管理员手动${actionText}`);
              Alert.alert('成功', `用户已${actionText}`);
              loadUsers();
            } catch (error) {
              Alert.alert('错误', '操作失败，请重试');
            }
          },
        },
      ]
    );
  }, [loadUsers]);

  /**
   * 打开用户详情抽屉
   */
  const handleRowPress = useCallback(async (user: User) => {
    try {
      // 获取用户详细信息
      const response = await userApi.getById(user.id);
      if (response.success) {
        setDrawerUser(response.data);
        setDrawerVisible(true);
      }
    } catch (error) {
      console.error('[UserManagementPage] 获取用户详情失败:', error);
      Alert.alert('错误', '获取用户详情失败');
    }
  }, []);

  /**
   * 关闭用户详情抽屉
   */
  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
    setDrawerUser(null);
  }, []);

  /**
   * 处理选择变化
   */
  const handleSelectChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  /**
   * 取消全部选择
   */
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ========== 批量操作处理函数 ==========

  /**
   * 批量启用
   */
  const handleBatchEnable = useCallback(async (ids: string[]) => {
    try {
      await userApi.batchUpdate(ids, { status: 'active' });
      Alert.alert('成功', `已启用 ${ids.length} 个用户`);
      handleClearSelection();
      loadUsers();
    } catch (error) {
      Alert.alert('错误', '批量操作失败');
    }
  }, [loadUsers, handleClearSelection]);

  /**
   * 批量禁用
   */
  const handleBatchDisable = useCallback(async (ids: string[]) => {
    try {
      await userApi.batchUpdate(ids, { status: 'disabled' });
      Alert.alert('成功', `已禁用 ${ids.length} 个用户`);
      handleClearSelection();
      loadUsers();
    } catch (error) {
      Alert.alert('错误', '批量操作失败');
    }
  }, [loadUsers, handleClearSelection]);

  /**
   * 批量更改角色
   */
  const handleBatchChangeRole = useCallback(async (ids: string[], role: string) => {
    try {
      await userApi.batchUpdate(ids, { role });
      Alert.alert('成功', `已更改 ${ids.length} 个用户的角色`);
      handleClearSelection();
      loadUsers();
    } catch (error) {
      Alert.alert('错误', '批量操作失败');
    }
  }, [loadUsers, handleClearSelection]);

  /**
   * 批量删除
   */
  const handleBatchDelete = useCallback(async (ids: string[]) => {
    try {
      await userApi.batchUpdate(ids, { deleted: true });
      Alert.alert('成功', `已删除 ${ids.length} 个用户`);
      handleClearSelection();
      loadUsers();
    } catch (error) {
      Alert.alert('错误', '批量操作失败');
    }
  }, [loadUsers, handleClearSelection]);

  /**
   * 批量导出
   */
  const handleBatchExport = useCallback((ids: string[]) => {
    Alert.alert('提示', `导出 ${ids.length} 个用户的数据...（功能开发中）`);
  }, []);

  // ========== 渲染分页控件 ==========

  /**
   * 渲染分页按钮
   */
  const renderPagination = () => (
    <View style={Styles.paginationContainer}>
      {/* 总数信息 */}
      <Text style={Styles.paginationInfo}>
        共 {pagination.total} 条记录
      </Text>

      {/* 分页按钮组 */}
      <View style={Styles.paginationButtons}>
        {/* 上一页 */}
        <TouchableOpacity
          onPress={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          style={[
            Styles.paginationButton,
            pagination.page <= 1 && { opacity: 0.5 },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* 页码显示（简化版，只显示当前页） */}
        <TouchableOpacity
          style={[Styles.paginationButton, Styles.paginationButtonActive]}
          disabled
        >
          <Text style={[Styles.paginationButtonText, Styles.paginationButtonTextActive]}>
            {pagination.page}
          </Text>
        </TouchableOpacity>

        {/* 下一页 */}
        <TouchableOpacity
          onPress={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          style={[
            Styles.paginationButton,
            pagination.page >= pagination.totalPages && { opacity: 0.5 },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={16} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* 每页条数选择器（可选） */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
      }}>
        <Text style={{ fontSize: 12, color: Colors.text.secondary }}>每页</Text>
        <Text style={{ fontSize: 12, color: Colors.text.primary, fontWeight: '600' }}>
          {pagination.pageSize}
        </Text>
      </View>
    </View>
  );

  // ========== 主渲染 ==========

  return (
    <SafeAreaView style={Styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      <View style={Styles.container}>
        {/* ====== 页面头部 ====== */}
        <View style={Styles.header}>
          <Text style={Styles.title}>用户管理</Text>

          {/* 添加用户按钮 */}
          <TouchableOpacity
            onPress={handleAddUser}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: Colors.primary.DEFAULT,
              borderRadius: 20,
              ...Colors.shadow.sm,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#FFFFFF',
              fontFamily: '-apple-system',
            }}>
              添加用户
            </Text>
          </TouchableOpacity>
        </View>

        {/* ====== 搜索栏和筛选 ====== */}
        <SearchBar
          value={filters}
          onChange={handleFilterChange}
        />

        {/* ====== 用户表格 ====== */}
        <UserTable
          users={users}
          loading={loading}
          selectedIds={selectedIds}
          onSelect={handleSelectChange}
          onRowPress={handleRowPress}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onStatusToggle={handleStatusToggle}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        {/* ====== 分页控件 ====== */}
        {renderPagination()}

        {/* ====== 批量操作工具栏 ====== */}
        <BatchActions
          selectedIds={selectedIds}
          onClearSelection={handleClearSelection}
          onBatchEnable={handleBatchEnable}
          onBatchDisable={handleBatchDisable}
          onBatchChangeRole={handleBatchChangeRole}
          onBatchDelete={handleBatchDelete}
          onBatchExport={handleBatchExport}
        />

        {/* ====== 添加/编辑用户模态框 ====== */}
        <UserModal
          visible={modalVisible}
          mode={modalMode}
          user={editingUser}
          onClose={handleCloseModal}
          onSubmit={handleSubmitForm}
        />

        {/* ====== 用户详情侧边抽屉 ====== */}
        {drawerVisible && (
          <UserDrawer
            visible={drawerVisible}
            user={drawerUser}
            onClose={handleCloseDrawer}
            onEdit={(user) => {
              handleCloseDrawer();
              handleEditUser(user as User);
            }}
            onResetPassword={(user) => {
              Alert.alert('重置密码', `确定要重置用户 "${user.username}" 的密码吗？`, [
                { text: '取消', style: 'cancel' },
                {
                  text: '确定',
                  onPress: async () => {
                    try {
                      await userApi.resetPassword(user.id);
                      Alert.alert('成功', '密码已重置，新密码将发送到用户邮箱');
                    } catch (error) {
                      Alert.alert('错误', '重置密码失败');
                    }
                  },
                },
              ]);
            }}
            onToggleStatus={(user) => {
              handleCloseDrawer();
              handleStatusToggle(user as User);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ============================================
// 默认导出
// ============================================

export default UserManagementPage;

// 需要导入StyleSheet
import { StyleSheet } from 'react-native';
