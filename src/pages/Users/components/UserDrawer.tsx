/**
 * 用户详情侧边抽屉 (UserDrawer)
 *
 * 功能说明：
 * 从右侧滑出的抽屉面板，展示用户的完整详细信息
 *
 * 核心功能：
 * 1. 基本信息：头像、用户名、邮箱、角色、状态
 * 2. 统计数据：发表议题数、参与评论数、登录次数
 * 3. 账户安全：最后登录IP、登录时间、设备信息
 * 4. 操作日志：该用户的操作历史记录
 * 5. 快捷操作：重置密码、启用/禁用、编辑用户
 *
 * 设计特点：
 * - 从右侧滑入的抽屉动画
 * - 分区块展示信息，层次清晰
 * - 统计卡片使用网格布局
 * - 快捷操作按钮组
 *
 * @module UserDrawer
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Styles, Colors, Spacing } from '../styles';
import type { User } from './UserTable';

// ============================================
// 类型定义
// ============================================

/** 用户详情扩展数据 */
export interface UserDetail extends User {
  phone?: string;
  debateCount?: number;
  commentCount?: number;
  loginCount?: number;
  lastLoginIp?: string;
  lastLoginTime?: string;
  deviceInfo?: string;
  createdAt?: string;
}

/** 组件Props */
interface UserDrawerProps {
  /** 是否可见 */
  visible: boolean;
  /** 用户详情数据 */
  user: UserDetail | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 编辑回调 */
  onEdit?: (user: UserDetail) => void;
  /** 重置密码回调 */
  onResetPassword?: (user: UserDetail) => void;
  /** 切换状态回调 */
  onToggleStatus?: (user: UserDetail) => void;
}

// ============================================
// 子组件：统计卡片
// ============================================

/**
 * 统计数字卡片
 */
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  color?: string;
}> = ({ icon, label, value, color = Colors.primary.DEFAULT }) => (
  <View style={Styles.statCard}>
    <Ionicons name={icon as any} size={24} color={color} />
    <Text style={[Styles.statNumber, { color }]}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Text>
    <Text style={Styles.statLabel}>{label}</Text>
  </View>
);

// ============================================
// 子组件：信息行
// ============================================

/**
 * 信息展示行（图标 + 标签 + 内容）
 */
const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string | null | undefined;
  color?: string;
}> = ({ icon, label, value, color = Colors.text.secondary }) => (
  <View style={{
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  }}>
    <Ionicons name={icon as any} size={18} color={color} style={{ width: 24 }} />
    <View style={{ flex: 1, marginLeft: Spacing.md }}>
      <Text style={{
        fontSize: 12,
        color: Colors.text.tertiary,
        fontFamily: '-apple-system',
        marginBottom: 2,
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: 15,
        color: value ? Colors.text.primary : Colors.text.tertiary,
        fontFamily: '-apple-system',
        fontWeight: '500',
      }}>
        {value || '未设置'}
      </Text>
    </View>
  </View>
);

// 需要导入StyleSheet
import { StyleSheet } from 'react-native';

// ============================================
// 主组件：UserDrawer
// ============================================

/**
 * 用户详情抽屉主组件
 *
 * @param props - 组件属性
 * @returns JSX.Element
 */
const UserDrawer: React.FC<UserDrawerProps> = ({
  visible,
  user,
  onClose,
  onEdit,
  onResetPassword,
  onToggleStatus,
}) => {

  // 如果没有用户数据或不可见，不渲染内容
  if (!visible || !user) return null;

  // ========== 渲染函数 ==========

  /**
   * 渲染头部区域（头像+基本信息）
   */
  const renderHeader = () => (
    <View style={Styles.drawerHeader}>
      {/* 头像 */}
      <View style={[Styles.drawerAvatar, {
        backgroundColor: Colors.background.grouped,
        justifyContent: 'center',
        alignItems: 'center',
      }]}>
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={Styles.drawerAvatar}
          />
        ) : (
          <Text style={{
            fontSize: 36,
            fontWeight: '700',
            color: Colors.primary.DEFAULT,
            fontFamily: '-apple-system',
          }}>
            {(user.username || '?').charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      {/* 用户名 */}
      <Text style={Styles.drawerUsername}>{user.username}</Text>

      {/* 邮箱 */}
      <Text style={Styles.drawerEmail}>{user.email}</Text>

      {/* 角色和状态标签 */}
      <View style={{
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
      }}>
        {/* 角色标签 */}
        <View style={[
          Styles.roleBadge,
          user.role === 'admin' ? Styles.roleAdmin :
          user.role === 'editor' ? Styles.roleEditor :
          Styles.roleViewer,
        ]}>
          <Text style={[
            Styles.roleBadgeText,
            user.role === 'admin' ? Styles.roleAdminText :
            user.role === 'editor' ? Styles.roleEditorText :
            Styles.roleViewerText,
          ]}>
            {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑' : '观众'}
          </Text>
        </View>

        {/* 状态标签 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 20,
          backgroundColor: user.status === 'active'
            ? 'rgba(52, 199, 89, 0.12)'
            : 'rgba(142, 142, 147, 0.12)',
        }}>
          <View style={[
            Styles.statusDot,
            user.status === 'active' ? Styles.statusActive : Styles.statusDisabled,
          ]} />
          <Text style={{
            fontSize: 13,
            fontWeight: '500',
            color: user.status === 'active' ? Colors.status.active : Colors.status.disabled,
            fontFamily: '-apple-system',
          }}>
            {user.status === 'active' ? '活跃' : '禁用'}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * 渲染统计数据区域
   */
  const renderStats = () => (
    <View style={{ marginBottom: Spacing.xl }}>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        fontFamily: '-apple-system',
        marginBottom: Spacing.md,
      }}>
        数据统计
      </Text>
      <View style={Styles.statsGrid}>
        <StatCard
          icon="chatbubbles"
          label="发表议题"
          value={user.debateCount || 0}
          color="#FF9500"
        />
        <StatCard
          icon="chatbox-ellipses"
          label="参与评论"
          value={user.commentCount || 0}
          color="#5AC8FA"
        />
        <StatCard
          icon="log-in"
          label="登录次数"
          value={user.loginCount || 0}
          color="#34C759"
        />
        <StatCard
          icon="time"
          label="注册天数"
          value={user.createdAt
            ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0
          }
          color="#5856D6"
        />
      </View>
    </View>
  );

  /**
   * 渲染账户安全信息
   */
  const renderSecurityInfo = () => (
    <View style={{ marginBottom: Spacing.xl }}>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        fontFamily: '-apple-system',
        marginBottom: Spacing.md,
      }}>
        账户安全
      </Text>
      <View style={{
        backgroundColor: Colors.background.grouped,
        borderRadius: 10,
        padding: Spacing.md,
      }}>
        <InfoRow
          icon="globe-outline"
          label="最后登录IP"
          value={user.lastLoginIp}
        />
        <InfoRow
          icon="time-outline"
          label="最后登录时间"
          value={user.lastLoginTime
            ? new Date(user.lastLoginTime).toLocaleString('zh-CN')
            : null
          }
        />
        <InfoRow
          icon="phone-portrait-outline"
          label="设备信息"
          value={user.deviceInfo}
        />
      </View>
    </View>
  );

  /**
   * 渲染快捷操作按钮
   */
  const renderQuickActions = () => (
    <View style={{
      padding: Spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border.light,
      gap: Spacing.sm,
    }}>
      {/* 编辑按钮 */}
      <TouchableOpacity
        onPress={() => onEdit?.(user)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
          backgroundColor: Colors.primary.DEFAULT,
          borderRadius: 10,
          gap: Spacing.sm,
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#FFFFFF',
          fontFamily: '-apple-system',
        }}>
          编辑用户
        </Text>
      </TouchableOpacity>

      {/* 操作按钮行 */}
      <View style={{
        flexDirection: 'row',
        gap: Spacing.sm,
      }}>
        {/* 重置密码按钮 */}
        <TouchableOpacity
          onPress={() => onResetPassword?.(user)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 44,
            backgroundColor: Colors.background.tertiary,
            borderRadius: 10,
            gap: Spacing.xs,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="key-outline" size={18} color={Colors.semantic.warning} />
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: Colors.text.primary,
            fontFamily: '-apple-system',
          }}>
            重置密码
          </Text>
        </TouchableOpacity>

        {/* 启用/禁用按钮 */}
        <TouchableOpacity
          onPress={() => onToggleStatus?.(user)}
          style={[
            {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: 44,
              borderRadius: 10,
              gap: Spacing.xs,
              borderWidth: 1.5,
            },
            user.status === 'active'
              ? { borderColor: Colors.semantic.error, backgroundColor: 'rgba(255, 59, 48, 0.06)' }
              : { borderColor: Colors.status.active, backgroundColor: 'rgba(52, 199, 89, 0.06)' },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={user.status === 'active' ? 'ban-outline' : 'checkmark-circle-outline'}
            size={18}
            color={user.status === 'active' ? Colors.semantic.error : Colors.status.active}
          />
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: user.status === 'active' ? Colors.semantic.error : Colors.status.active,
            fontFamily: '-apple-system',
          }}>
            {user.status === 'active' ? '禁用账户' : '启用账户'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ========== 主渲染 ==========

  return (
    <View style={Styles.drawerOverlay}>
      {/* 抽屉容器 */}
      <ScrollView
        style={Styles.drawerContainer}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {/* 关闭按钮 */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            right: Spacing.md,
            top: Spacing.md,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>

        {/* 头部 */}
        {renderHeader()}

        {/* 内容区 */}
        <View style={Styles.drawerContent}>
          {/* 统计数据 */}
          {renderStats()}

          {/* 账户安全信息 */}
          {renderSecurityInfo()}
        </View>

        {/* 快捷操作 */}
        {renderQuickActions()}
      </ScrollView>
    </View>
  );
};

// ============================================
// 默认导出
// ============================================

export default UserDrawer;
