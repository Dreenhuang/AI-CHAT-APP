/**
 * 会话列表项组件 - ConversationItem
 * 
 * 用于会话列表页展示单个对话条目
 * 包含头像、标题、最后消息、时间、未读数
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Conversation } from '../types';
import { Colors } from '../theme/colors';

interface ConversationItemProps {
  conversation: Conversation;
  /** 点击回调 */
  onPress: (id: string) => void;
  /** 长按回调（可选） */
  onLongPress?: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onLongPress,
}) => {
  // 格式化时间显示
  const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    // 超过7天显示日期
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 获取状态标签
  const getStatusLabel = (): string | null => {
    switch (conversation.status) {
      case 'active':
        return '进行中';
      case 'paused':
        return '已暂停';
      case 'completed':
        return '已完成';
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(conversation.id)}
      onLongPress={() => onLongPress?.(conversation.id)}
      activeOpacity={0.7}
    >
      {/* 头像区域 */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: conversation.participants[0]?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' }}
          style={styles.avatar}
        />
        {conversation.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      {/* 内容区域 */}
      <View style={styles.content}>
        {/* 第一行：标题 + 时间 */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text 
              style={[styles.title, conversation.unreadCount > 0 && styles.titleBold]}
              numberOfLines={1}
            >
              {conversation.topicTitle}
            </Text>
            {getStatusLabel() && (
              <View style={styles.statusTag}>
                <Text style={styles.statusText}>{getStatusLabel()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.time}>
            {formatTime(conversation.lastMessageTime)}
          </Text>
        </View>
        
        {/* 第二行：最后消息预览 */}
        <View style={styles.messageRow}>
          <Text 
            style={[styles.message, conversation.unreadCount > 0 && styles.messageBold]}
            numberOfLines={1}
          >
            {conversation.lastMessage || '暂无消息'}
          </Text>
        </View>
        
        {/* 参与者头像组（可选显示） */}
        {conversation.participants.length > 1 && (
          <View style={styles.participantsRow}>
            {conversation.participants.slice(0, 4).map((p, index) => (
              <Image
                key={p.id}
                source={{ uri: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}` }}
                style={[
                  styles.participantAvatar,
                  { marginLeft: index > 0 ? -8 : 0 }
                ]}
              />
            ))}
            {conversation.participants.length > 4 && (
              <View style={styles.moreParticipants}>
                <Text style={styles.moreText}>+{conversation.participants.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  titleBold: {
    fontWeight: '600',
    color: '#000000',
  },
  statusTag: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#07C160',
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  messageRow: {
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messageBold: {
    color: Colors.textPrimary,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  moreParticipants: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  moreText: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
});

export default ConversationItem;
