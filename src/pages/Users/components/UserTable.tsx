/**
 * 用户表格组件 (UserTable)
 *
 * 功能说明：
 * 展示用户列表数据，支持多选、排序、行操作
 *
 * 核心功能：
 * 1. 表格展示：头像、用户名、邮箱、角色、状态、注册时间等
 * 2. 多选批量操作：checkbox选择多个用户
 * 3. 行点击事件：打开用户详情侧边栏
 * 4. 排序功能：点击表头排序
 * 5. 状态指示：绿色圆点=活跃，灰色=禁用
 * 6. 角色标签：不同颜色区分角色类型
 *
 * 设计特点：
 * - Apple风格设计语言
 * - 圆角卡片式表格
 * - 柔和阴影和边框
 * - 流畅的交互动画
 *
 * @module UserTable
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Styles, Colors, Spacing } from '../styles';

// ============================================
// 类型定义
// ============================================

/** 用户数据结构 */
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string | null;
  phone?: string;
}

/** 表格列配置 */
interface ColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  sortable?: boolean;
  render?: (user: User) => React.ReactNode;
}

/** 组件Props */
interface UserTableProps {
  /** 用户数据数组 */
  users: User[];
  /** 是否正在加载 */
  loading?: boolean;
  /** 已选中的用户ID集合 */
  selectedIds?: Set<string>;
  /** 选择变化回调 */
  onSelect?: (ids: Set<string>) => void;
  /** 点击行回调 */
  onRowPress?: (user: User) => void;
  /** 编辑按钮回调 */
  onEdit?: (user: User) => void;
  /** 删除按钮回调 */
  onDelete?: (user: User) => void;
  /** 状态切换回调 */
  onStatusToggle?: (user: User) => void;
  /** 当前排序列 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 排序变化回调 */
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
}

// ============================================
// 子组件：用户头像
// ============================================

/**
 * 用户头像组件
 *
 * 功能：
 * - 显示用户头像图片
 * - 无头像时显示首字母占位符
 * - 支持圆形裁剪
 */
const UserAvatar: React.FC<{ user: User; size?: number }> = ({ user, size = 40 }) => {
  // 提取用户名首字母作为占位符
  const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <View style={[Styles.avatarContainer, { width: size, height: size }]}>
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={Styles.avatarImage}
        />
      ) : (
        <View style={[Styles.avatarPlaceholder, { width: size, height: size }]}>
          <Text style={[Styles.avatarText, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// 子组件：状态指示器
// ============================================

/**
 * 状态指示器组件
 *
 * 功能：
 * - 绿色圆点表示活跃状态
 * - 灰色圆点表示禁用状态
 */
const StatusIndicator: React.FC<{ status: User['status'] }> = ({ status }) => (
  <View style={[
    Styles.statusDot,
    status === 'active' ? Styles.statusActive : Styles.statusDisabled,
  ] />
);

// ============================================
// 子组件：角色标签
// ============================================

/**
 * 角色标签组件
 *
 * 功能：
 * - 不同角色使用不同颜色标签
 * - 管理员=红色，编辑=蓝色，观众=灰色
 */
const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const roleConfig = {
    admin: { label: '管理员', containerStyle: Styles.roleAdmin, textStyle: Styles.roleAdminText },
    editor: { label: '编辑', containerStyle: Styles.roleEditor, textStyle: Styles.roleEditorText },
    viewer: { label: '观众', containerStyle: Styles.roleViewer, textStyle: Styles.roleViewerText },
  };

  const config = roleConfig[role];

  return (
    <View style={[Styles.roleBadge, config.containerStyle]}>
      <Text style={[Styles.roleBadgeText, config.textStyle]}>
        {config.label}
      </Text>
    </View>
  );
};

// ============================================
// 主组件：UserTable
// ============================================

/**
 * 用户表格主组件
 *
 * @param props - 组件属性
 * @returns JSX.Element
 */
const UserTable: React.FC<UserTableProps> = ({
  users,
  loading = false,
  selectedIds = new Set(),
  onSelect,
  onRowPress,
  onEdit,
  onDelete,
  onStatusToggle,
  sortBy,
  sortOrder,
  onSortChange,
}) => {

  // ========== 状态管理 ==========

  /** 内部选中状态（如果外部未控制） */
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());

  /** 当前实际使用的选中状态 */
  const currentSelectedIds = selectedIds || internalSelectedIds;

  // ========== 表格列配置 ==========

  /** 定义表格要显示的列 */
  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: 'username',
      title: '用户名',
      width: '20%',
      sortable: true,
      render: (user) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <UserAvatar user={user} />
          <Text style={{
            fontSize: 15,
            color: Colors.text.primary,
            fontWeight: '500',
            fontFamily: '-apple-system',
          }} numberOfLines={1}>
            {user.username}
          </Text>
        </View>
      ),
    },
    {
      key: 'email',
      title: '邮箱',
      width: '25%',
      render: (user) => (
        <Text style={{
          fontSize: 14,
          color: Colors.text.secondary,
          fontFamily: '-apple-system',
        }} numberOfLines={1}>
          {user.email}
        </Text>
      ),
    },
    {
      key: 'role',
      title: '角色',
      width: '12%',
      sortable: true,
      render: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: 'status',
      title: '状态',
      width: '10%',
      sortable: true,
      render: (user) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          <StatusIndicator status={user.status} />
          <Text style={{
            fontSize: 13,
            color: user.status === 'active' ? Colors.status.active : Colors.status.disabled,
            fontFamily: '-apple-system',
          }}>
            {user.status === 'active' ? '活跃' : '禁用'}
          </Text>
        </View>
      ),
    },
    {
      key: 'createdAt',
      title: '注册时间',
      width: '18%',
      sortable: true,
      render: (user) => (
        <Text style={{
          fontSize: 13,
          color: Colors.text.secondary,
          fontFamily: '-apple-system',
        }}>
          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '15%',
      render: (user) => (
        <View style={Styles.actionButtonContainer}>
          {/* 编辑按钮 */}
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation();
              onEdit?.(user);
            }}
            style={Styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary.DEFAULT} />
          </TouchableOpacity>

          {/* 删除按钮 */}
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation();
              onDelete?.(user);
            }}
            style={Styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} />
          </TouchableOpacity>

          {/* 状态切换按钮 */}
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation();
              onStatusToggle?.(user);
            }}
            style={Styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={user.status === 'active' ? 'ban-outline' : 'checkmark-circle-outline'}
              size={18}
              color={user.status === 'active' ? Colors.semantic.warning : Colors.status.active}
            />
          </TouchableOpacity>
        </View>
      ),
    },
  ], [onEdit, onDelete, onStatusToggle]);

  // ========== 事件处理函数 ==========

  /**
   * 处理全选/取消全选
   */
  const handleSelectAll = useCallback(() => {
    let newSelectedIds: Set<string>;

    if (currentSelectedIds.size === users.length && users.length > 0) {
      // 已全选 → 取消全选
      newSelectedIds = new Set();
    } else {
      // 未全选 → 全选
      newSelectedIds = new Set(users.map(u => u.id));
    }

    if (onSelect) {
      onSelect(newSelectedIds);
    } else {
      setInternalSelectedIds(newSelectedIds);
    }
  }, [currentSelectedIds, users, onSelect]);

  /**
   * 处理单行选择
   */
  const handleSelectRow = useCallback((userId: string) => {
    const newSelectedIds = new Set(currentSelectedIds);

    if (newSelectedIds.has(userId)) {
      newSelectedIds.delete(userId);
    } else {
      newSelectedIds.add(userId);
    }

    if (onSelect) {
      onSelect(newSelectedIds);
    } else {
      setInternalSelectedIds(newSelectedIds);
    }
  }, [currentSelectedIds, onSelect]);

  /**
   * 处理表头排序点击
   */
  const handleSortPress = useCallback((columnKey: string) => {
    if (!onSortChange || !columnKey.sortable) return;

    let newOrder: 'asc' | 'desc' = 'asc';

    if (sortBy === columnKey.key) {
      // 如果当前列已排序，切换排序方向
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    onSortChange(columnKey.key, newOrder);
  }, [sortBy, sortOrder, onSortChange]);

  /**
   * 处理行点击
   */
  const handleRowPress = useCallback((user: User) => {
    onRowPress?.(user);
  }, [onRowPress]);

  // ========== 渲染函数 ==========

  /**
   * 渲染表头
   */
  const renderHeader = () => (
    <View style={Styles.tableHeader}>
      {/* 全选复选框 */}
      <TouchableOpacity
        onPress={handleSelectAll}
        style={{ width: 40, alignItems: 'flex-start' }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentSelectedIds.size === users.length && users.length > 0 ? 'checkbox' : 'square-outline'}
          size={20}
          color={currentSelectedIds.size === users.length && users.length > 0 ? Colors.primary.DEFAULT : Colors.border.medium}
        />
      </TouchableOpacity>

      {/* 列标题 */}
      {columns.map((column) => (
        <TouchableOpacity
          key={column.key}
          onPress={() => handleSortPress(column)}
          style={[
            Styles.cell,
            { flex: typeof column.width === 'number' ? undefined : 1, width: column.width as any },
          ]}
          disabled={!column.sortable}
          activeOpacity={column.sortable ? 0.7 : 1}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={Styles.headerText}>
              {column.title}
            </Text>
            {column.sortable && sortBy === column.key && (
              <Ionicons
                name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={Colors.primary.DEFAULT}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  /**
   * 渲染单行数据
   */
  const renderRow = (user: User, index: number) => {
    const isSelected = currentSelectedIds.has(user.id);

    return (
      <TouchableOpacity
        key={user.id}
        style={[
          Styles.tableRow,
          isSelected && Styles.tableRowSelected,
          index === users.length - 1 && { borderBottomWidth: 0 },
        }
        ]}
        onPress={() => handleRowPress(user)}
        activeOpacity={0.7}
      >

        {/* 选择框 */}
        <TouchableOpacity
          onPress={() => handleSelectRow(user.id)}
          style={{ width: 40, alignItems: 'flex-start' }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={20}
            color={isSelected ? Colors.primary.DEFAULT : Colors.border.medium}
          />
        </TouchableOpacity>

        {/* 数据单元格 */}
        {columns.map((column) => (
          <View
            key={column.key}
            style={[
              Styles.cell,
              { flex: typeof column.width === 'number' ? undefined : 1, width: column.width as any },
            ]}
          >
            {column.render ? column.render(user) : (
              <Text style={{ fontSize: 14, color: Colors.text.primary }}>
                (user[column.key] as any)?.toString() || '-'
              </Text>
            )}
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  // ========== 主渲染 ==========

  return (
    <View style={Styles.tableContainer}>
      {/* 表头 */}
      {renderHeader()}

      {/* 表体内容 */}
      <ScrollView
        style={{ flex: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={true}
      >
        {loading ? (
          // 加载状态
          <View style={Styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
            <Text style={{
              marginTop: Spacing.md,
              fontSize: 14,
              color: Colors.text.secondary,
              fontFamily: '-apple-system',
            }}>
              加载中...
            </Text>
          </View>
        ) : users.length === 0 ? (
          // 空状态
          <View style={Styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={Colors.border.medium} />
            <Text style={Styles.emptyTitle}>暂无用户</Text>
            <Text style={Styles.emptyDescription}>
              点击右上角"添加用户"按钮创建第一个用户
            </Text>
          </View>
        ) : (
          // 用户列表
          users.map((user, index) => renderRow(user, index))
        )}
      </ScrollView>
    </View>
  );
};

// ============================================
// 默认导出
// ============================================

export default UserTable;
