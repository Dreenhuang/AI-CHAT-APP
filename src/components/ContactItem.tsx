/**
 * 联系人项组件 - ContactItem
 * 
 * 用于通讯录页展示Soul好友或群组
 * 包含头像、名称、描述、状态、操作按钮
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Soul, Group } from '../types';
import { Colors } from '../theme/colors';

interface ContactItemProps {
  /** 联系人数据（Soul或Group） */
  contact: Soul | Group;
  /** 类型 */
  type: 'soul' | 'group';
  /** 点击回调 */
  onPress: (contact: Soul | Group) => void;
  /** 是否显示操作按钮（如"开始辩论"） */
  showAction?: boolean;
  /** 操作按钮文字 */
  actionText?: string;
  /** 操作按钮回调 */
  onActionPress?: (contact: Soul | Group) => void;
}

/** 性格对应的颜色和图标 */
const personalityConfig = {
  rational: { color: '#2196F3', icon: '🧠', label: '理性' },
  emotional: { color: '#E91E63', icon: '❤️', label: '情感' },
  aggressive: { color: '#FF9800', icon: '⚡', label: '激进' },
  moderate: { color: '#4CAF50', icon: '🕊️', label: '温和' },
  creative: { color: '#9C27B0', icon: '💡', label: '创意' },
  critical: { color: '#607D8B', icon: '🔍', label: '批判' },
};

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  type,
  onPress,
  showAction = false,
  actionText = '开始辩论',
  onActionPress,
}) => {
  // 判断是否为Soul
  const isSoul = type === 'soul';
  const soul = isSoul ? contact as Soul : null;
  const group = !isSoul ? contact as Group : null;

  const config = isSoul && soul ? personalityConfig[soul.personality] : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(contact)}
      activeOpacity={0.7}
    >
      {/* 头像区域 */}
      <View style={styles.avatarSection}>
        <Image
          source={{ uri: isSoul ? soul!.avatar : group!.avatar }}
          style={styles.avatar}
        />
        
        {/* 在线状态指示器（仅Soul显示） */}
        {isSoul && (
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: soul!.isOnline ? Colors.primary : '#CCCCCC' }
          ]} />
        )}
        
        {/* 性格标签（仅Soul显示） */}
        {config && (
          <View style={[styles.personalityTag, { backgroundColor: config.color + '20' }]}>
            <Text style={styles.personalityIcon}>{config.icon}</Text>
          </View>
        )}
      </View>

      {/* 信息区域 */}
      <View style={styles.infoSection}>
        {/* 名称行 */}
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {isSoul ? soul!.name : group!.name}
          </Text>
          
          {/* 胜率（仅Soul显示） */}
          {isSoul && (
            <View style={styles.winRateBadge}>
              <Text style={styles.winRateText}>胜率 {soul!.winRate}%</Text>
            </View>
          )}
        </View>

        {/* 描述/简介 */}
        <Text style={styles.description} numberOfLines={2}>
          {isSoul ? soul!.description : group!.description}
        </Text>

        {/* 底部元信息 */}
        <View style={styles.metaRow}>
          {isSoul ? (
            <>
              <Text style={styles.metaText}>
                擅长: {soul!.specialty}
              </Text>
              <Text style={styles.metaDivider}>|</Text>
              <Text style={styles.metaText}>
                辩论 {soul!.debateCount} 场
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.metaText}>
                成员 {group!.memberCount} 人
              </Text>
              <Text style={styles.metaDivider}>|</Text>
              <Text style={styles.metaText}>
                群组
              </Text>
            </>
          )}
        </View>
      </View>

      {/* 操作按钮区域 */}
      {showAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onActionPress?.(contact)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  personalityTag: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personalityIcon: {
    fontSize: 10,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  winRateBadge: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  winRateText: {
    fontSize: 11,
    color: '#FFA000',
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaDivider: {
    marginHorizontal: 6,
    color: Colors.border,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ContactItem;
