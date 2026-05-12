/**
 * 消息气泡组件 - ChatBubble v2.0
 *
 * 视觉升级要点：
 * 1. 用户消息：科技蓝背景 + 右侧圆角缩小（对话尾巴效果）
 * 2. AI消息：白色卡片 + 微妙阴影 + 左侧边框高光
 * 3. 思考状态：左侧蓝色竖线 + 斜体文字
 * 4. 系统消息：居中显示，半透明胶囊样式
 * 5. 移除所有emoji，使用纯文字状态指示
 *
 * 设计原则：
 * - 阴影层次感：AI气泡有轻微浮起效果
 * - 圆角一致性：12px基础圆角，底部4px模拟对话尾巴
 * - 色彩对比度符合WCAG AA标准
 */

import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { Message } from '../types';
import { Colors } from '../theme/colors';
import { FontFamily, Typography } from '../theme/typography';

interface ChatBubbleProps {
  message: Message;
  /** 是否为当前用户发送（用于布局方向） */
  isCurrentUser: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser }) => {
  // 根据发送者确定气泡样式
  const getBubbleStyle = () => {
    if (message.sender === 'user') {
      return styles.userBubble;
    }
    return styles.aiBubble;
  };

  const getTextStyle = (): TextStyle => {
    if (message.sender === 'user') {
      return styles.userText;
    }
    return styles.aiText;
  };

  // 渲染状态指示器（纯文字，无emoji）
  const renderStatus = () => {
    if (!isCurrentUser) return null;

    const statusConfig = {
      sending: { text: '...', color: Colors.textSecondary },
      sent: { text: 'Sent', color: Colors.textSecondary },
      delivered: { text: 'Delivered', color: Colors.textSecondary },
      read: { text: 'Read', color: Colors.primary },
      failed: { text: 'Failed', color: Colors.error },
    };

    const config = statusConfig[message.status];
    return (
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
    );
  };

  // 渲染系统消息
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isCurrentUser ? styles.rowRight : styles.rowLeft,
      ]}
    >
      {/* AI思考过程用斜体显示 */}
      {message.type === 'thinking' && (
        <View style={[getBubbleStyle(), styles.thinkingBubble]}>
          <View style={styles.thinkingIndicator} />
          <View style={styles.thinkingContent}>
            <Text style={[getTextStyle(), styles.thinkingLabel]}>
              Thinking...
            </Text>
            <Text style={[getTextStyle(), styles.thinkingBody]}>
              {message.content}
            </Text>
          </View>
        </View>
      )}

      {/* 普通文本消息 */}
      {message.type === 'text' && (
        <>
          <View style={getBubbleStyle()}>
            <Text style={getTextStyle()}>{message.content}</Text>
          </View>
          <View style={styles.statusContainer}>
            {renderStatus()}
          </View>
        </>
      )}
    </View>
  );
};

// ============ 样式定义 ============

const styles = StyleSheet.create({
  // ========== 容器布局 ==========
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
    maxWidth: '75%',
  },
  rowLeft: {
    alignSelf: 'flex-start',
  },
  rowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },

  // ========== 用户消息气泡 ==========
  /**
   * 设计要点：
   * - 背景：科技蓝 #0EA5E9（主色）
   * - 文字：白色，确保对比度
   * - 圆角：12px + 右下角4px（对话尾巴）
   */
  userBubble: {
    backgroundColor: Colors.userBubble,       // 科技蓝
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderBottomRightRadius: 4,                // 对话尾巴效果
    // 无阴影，保持扁平化设计
  },

  // ========== AI消息气泡 ==========
  /**
   * 设计要点：
   * - 背景：白色 #FFFFFF
   * - 边框：左侧金属银高光线（1px）
   * - 阴影：微妙浮起效果
   * - 圆角：12px + 左下角4px（对话尾巴）
   */
  aiBubble: {
    backgroundColor: Colors.aiBubble,           // 白色
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderBottomLeftRadius: 4,                 // 对话尾巴效果

    // 左侧边框高光（金属银）
    borderLeftWidth: 2,
    borderLeftColor: Colors.metallicSilver,     // #94A3B8

    // 微妙阴影 - 浮起效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  // ========== 文字样式 ==========
  userText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: '#FFFFFF',                          // 白色文字（蓝底）
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },
  aiText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: Colors.textPrimary,                  // 深色文字（白底）
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  // ========== 状态指示器 ==========
  statusContainer: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 2,
  },
  statusText: {
    fontSize: Typography.small.fontSize,
    marginLeft: 4,
    fontFamily: FontFamily.mono.split(',')[0].trim(), // 等宽字体
  },

  // ========== 系统消息 ==========
  systemContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  systemBubble: {
    backgroundColor: 'rgba(100, 116, 139, 0.08)', // 科技灰8%透明度
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,                             // 胶囊形状
  },
  systemText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.techGray,                      // 科技灰
    textAlign: 'center',
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  // ========== 思考状态气泡 ==========
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  thinkingIndicator: {
    width: 3,
    backgroundColor: Colors.primary,             // 蓝色竖线
    borderRadius: 1.5,
  },
  thinkingContent: {
    flex: 1,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  thinkingLabel: {
    fontStyle: 'italic',
    fontSize: Typography.small.fontSize,
    color: Colors.primary,                       // 蓝色标签
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  thinkingBody: {
    fontStyle: 'italic',
    opacity: 0.75,
  },
});

export default ChatBubble;
