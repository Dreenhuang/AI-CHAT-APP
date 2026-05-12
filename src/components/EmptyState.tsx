/**
 * 空状态组件 - EmptyState
 * 
 * 用于列表无数据时的占位展示
 * 包含图标、标题、描述、操作按钮（可选）
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../theme/colors';

interface EmptyStateProps {
  /** 图标/emoji */
  icon?: string;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮文字（可选） */
  actionLabel?: string;
  /** 操作按钮回调 */
  onActionPress?: () => void;
  /** 自定义容器样式 */
  style?: object;
}

/** 预设的空状态类型 */
export const EmptyStateType = {
  noConversations: {
    icon: '💬',
    title: '暂无讨论记录',
    description: '选择一个感兴趣的议题，开始你的第一次辩论吧！',
    actionLabel: '浏览议题',
  },
  noContacts: {
    icon: '👥',
    title: '暂无Soul好友',
    description: '去发现页面认识一些有趣的辩论伙伴吧！',
    actionLabel: '发现好友',
  },
  noSearchResults: {
    icon: '🔍',
    title: '未找到相关内容',
    description: '试试其他关键词？',
  },
  noMessages: {
    icon: '✉️',
    title: '还没有消息',
    description: '发送第一条消息开始讨论吧！',
  },
  networkError: {
    icon: '🌐',
    title: '网络连接失败',
    description: '请检查网络设置后重试',
    actionLabel: '重新加载',
  },
} as const;

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 图标区域 */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* 文字区域 */}
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {/* 操作按钮 */}
      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onActionPress}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
    lineHeight: 80,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 260,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EmptyState;
