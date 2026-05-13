/**
 * 批量操作组件 (BatchActions)
 *
 * 功能说明：
 * 当用户在表格中选中多个用户时，显示批量操作工具栏
 *
 * 核心功能：
 * 1. 显示已选中的用户数量
 * 2. 批量启用/禁用用户
 * 3. 批量更改用户角色
 * 4. 批量发送通知
 * 5. 批量导出用户数据
 * 6. 取消选择
 *
 * 设计特点：
 * - 固定在底部的工具栏
 * - 毛玻璃背景效果
 * - 图标+文字的操作按钮
 * - 危险操作使用红色警示
 *
 * @module BatchActions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Styles, Colors, Spacing } from '../styles';

// ============================================
// 类型定义
// ============================================

/** 组件Props */
interface BatchActionsProps {
  /** 已选中的用户ID集合 */
  selectedIds: Set<string>;
  /** 取消全部选择 */
  onClearSelection: () => void;
  /** 批量启用回调 */
  onBatchEnable?: (ids: string[]) => void;
  /** 批量禁用回调 */
  onBatchDisable?: (ids: string[]) => void;
  /** 批量更改角色回调 */
  onBatchChangeRole?: (ids: string[], role: string) => void;
  /** 批量删除回调 */
  onBatchDelete?: (ids: string[]) => void;
  /** 批量导出回调 */
  onBatchExport?: (ids: string[]) => void;
}

/** 角色选项 */
const ROLE_OPTIONS = [
  { label: '管理员', value: 'admin' },
  { label: '编辑', value: 'editor' },
  { label: '观众', value: 'viewer' },
];

// ============================================
// 主组件：BatchActions
// ============================================

/**
 * 批量操作主组件
 *
 * @param props - 组件属性
 * @returns JSX.Element
 */
const BatchActions: React.FC<BatchActionsProps> = ({
  selectedIds,
  onClearSelection,
  onBatchEnable,
  onBatchDisable,
  onBatchChangeRole,
  onBatchDelete,
  onBatchExport,
}) => {

  // ========== 状态管理 ==========

  /** 是否显示角色选择弹窗 */
  const [showRoleModal, setShowRoleModal] = useState(false);

  // ========== 计算属性 ==========

  /** 选中的用户ID数组 */
  const selectedArray = Array.from(selectedIds);

  /** 是否有选中项 */
  const hasSelection = selectedIds.size > 0;

  // ========== 事件处理函数 ==========

  /**
   * 处理批量启用
   */
  const handleBatchEnable = () => {
    Alert.alert(
      '批量启用',
      `确定要启用选中的 ${selectedIds.size} 个用户吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => onBatchEnable?.(selectedArray),
        },
      ]
    );
  };

  /**
   * 处理批量禁用
   */
  const handleBatchDisable = () => {
    Alert.alert(
      '批量禁用',
      `确定要禁用选中的 ${selectedIds.size} 个用户吗？\n\n被禁用的用户将无法登录系统。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定禁用',
          style: 'destructive',
          onPress: () => onBatchDisable?.(selectedArray),
        },
      ]
    );
  };

  /**
   * 处理批量删除
   */
  const handleBatchDelete = () => {
    Alert.alert(
      '批量删除',
      `确定要删除选中的 ${selectedIds.size} 个用户吗？\n\n此操作不可恢复！`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定删除',
          style: 'destructive',
          onPress: () => onBatchDelete?.(selectedArray),
        },
      ]
    );
  };

  /**
   * 处理批量导出
   */
  const handleBatchExport = () => {
    onBatchExport?.(selectedArray);
  };

  /**
   * 处理角色选择确认
   */
  const handleRoleSelect = (roleValue: string) => {
    setShowRoleModal(false);
    const roleLabel = ROLE_OPTIONS.find(r => r.value === roleValue)?.label || roleValue;
    Alert.alert(
      '更改角色',
      `确定要将选中的 ${selectedIds.size} 个用户的角色更改为"${roleLabel}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => onBatchChangeRole?.(selectedArray, roleValue),
        },
      ]
    );
  };

  // ========== 渲染函数 ==========

  /**
   * 渲染单个操作按钮
   */
  const renderActionButton = (
    icon: string,
    label: string,
    onPress: () => void,
    color?: string,
    isDangerous?: boolean,
  ) => (
    <TouchableOpacity
      style={{
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        minWidth: 70,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDangerous
            ? 'rgba(255, 59, 48, 0.12)'
            : color
              ? `${color}18`
              : Colors.background.tertiary,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={color || (isDangerous ? Colors.semantic.error : Colors.text.primary)}
        />
      </View>
      <Text style={{
        fontSize: 11,
        color: isDangerous ? Colors.semantic.error : Colors.text.secondary,
        fontFamily: '-apple-system',
        marginTop: 4,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 如果没有选中项，不渲染
  if (!hasSelection) return null;

  // ========== 主渲染 ==========

  return (
    <>
      {/* 底部固定工具栏 */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(242, 242, 247, 0.95)',
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.lg + 20, // 为iPhone底部安全区域留空间
        paddingHorizontal: Spacing.base,
        ...Colors.shadow.lg,
      }}>
        {/* 顶部信息栏 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: Spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary.DEFAULT} />
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: Colors.text.primary,
              fontFamily: '-apple-system',
            }}>
              已选中 {selectedIds.size} 项
            </Text>
          </View>

          {/* 取消选择按钮 */}
          <TouchableOpacity
            onPress={onClearSelection}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 14,
              color: Colors.primary.DEFAULT,
              fontFamily: '-apple-system',
            }}>
              取消选择
            </Text>
          </TouchableOpacity>
        </View>

        {/* 操作按钮组（横向滚动） */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.xs }}
        >
          {/* 批量启用 */}
          {renderActionButton(
            'checkmark-circle-outline',
            '启用',
            handleBatchEnable,
            Colors.status.active
          )}

          {/* 批量禁用 */}
          {renderActionButton(
            'ban-outline',
            '禁用',
            handleBatchDisable,
            undefined,
            true
          )}

          {/* 更改角色 */}
          {renderActionButton(
            'people-outline',
            '角色',
            () => setShowRoleModal(true),
            Colors.primary.DEFAULT
          )}

          {/* 批量导出 */}
          {renderActionButton(
            'download-outline',
            '导出',
            handleBatchExport,
            '#FF9500'
          )}

          {/* 批量删除 */}
          {renderActionButton(
            'trash-outline',
            '删除',
            handleBatchDelete,
            undefined,
            true
          )}
        </ScrollView>
      </View>

      {/* 角色选择模态框 */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={Styles.modalOverlay}>
          <View style={[Styles.modalContainer, { maxWidth: 320 }]}>
            {/* 头部 */}
            <View style={Styles.modalHeader}>
              <Text style={Styles.modalTitle}>选择新角色</Text>
              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* 角色选项列表 */}
            <View style={{ padding: Spacing.xl }}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => handleRoleSelect(role.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: Spacing.md,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: Colors.border.light,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={Colors.text.secondary}
                    style={{ marginRight: Spacing.md }}
                  />
                  <Text style={{
                    flex: 1,
                    fontSize: 16,
                    color: Colors.text.primary,
                    fontFamily: '-apple-system',
                  }}>
                    {role.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// 需要导入StyleSheet
import { StyleSheet } from 'react-native';

// ============================================
// 默认导出
// ============================================

export default BatchActions;
