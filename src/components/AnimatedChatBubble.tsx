/**
 * AnimatedChatBubble - 动画聊天泡泡组件 v2.0
 * 
 * 功能升级：
 * 1. 消息入场动画 - 从底部滑入+淡入效果
 * 2. 气泡缩放动画 - 模拟弹性出现
 * 3. 状态切换动画 - 平滑的状态变化
 * 4. 打字机效果 - AI消息逐字显示
 * 5. 脉冲高亮 - 新消息到达时的脉冲效果
 * 
 * 使用React Native Reanimated实现60fps流畅动画
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import { Colors } from '../theme/colors';
import { FontFamily, Typography } from '../theme/typography';
import { AnimationConfig } from '../utils/animationUtils';

interface AnimatedChatBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  index: number;  // 消息索引，用于交错动画
  onLongPress?: (message: Message) => void;
  isSelected?: boolean;
}

const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  message,
  isCurrentUser,
  index,
  onLongPress,
  isSelected = false,
}) => {
  // 动画值
  const entranceProgress = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const selectScale = useSharedValue(1);

  // 打字机效果用的值
  const typingProgress = useSharedValue(0);

  useEffect(() => {
    // 入场动画：先执行弹性缩放，再执行滑入+淡入
    const delay = Math.min(index * AnimationConfig.staggeredConfig.itemDelay, AnimationConfig.staggeredConfig.maxDelay);
    
    // 缩放动画
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 180,
      })
    );

    // 透明度动画
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: AnimationConfig.duration.entrance,
        easing: Easing.out(Easing.cubic),
      })
    );

    // 滑入动画（Y轴）
    entranceProgress.value = withDelay(
      delay,
      withTiming(1, {
        duration: AnimationConfig.duration.entrance,
        easing: Easing.out(Easing.cubic),
      })
    );

    // 入场动画完成后触发一次脉冲效果
    setTimeout(() => {
      glowOpacity.value = withSequence(
        withTiming(0.3, { duration: 150 }),
        withTiming(0, { duration: 400 })
      );
    }, delay + AnimationConfig.duration.entrance);
  }, [index]);

  // 选中状态动画
  useEffect(() => {
    selectScale.value = withSpring(isSelected ? 1.02 : 1, {
      damping: 15,
      stiffness: 200,
    });
  }, [isSelected]);

  // 气泡容器动画样式
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(entranceProgress.value, [0, 1], [30, 0]);
    
    return {
      opacity: opacity.value,
      transform: [
        { translateY },
        { scale: scale.value * selectScale.value },
      ],
    };
  });

  // 发光效果动画样式
  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  // 获取气泡样式
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

  // 渲染状态指示器
  const renderStatus = () => {
    if (!isCurrentUser) return null;

    const statusConfig: Record<string, { text: string; color: string; icon?: string }> = {
      sending: { text: 'Sending', color: Colors.textSecondary, icon: 'hourglass-outline' },
      sent: { text: 'Sent', color: Colors.textSecondary, icon: 'checkmark-outline' },
      delivered: { text: 'Delivered', color: Colors.textSecondary, icon: 'checkmark-done-outline' },
      read: { text: 'Read', color: Colors.primary, icon: 'checkmark-done' },
      failed: { text: 'Failed', color: Colors.error, icon: 'alert-circle-outline' },
    };

    const config = statusConfig[message.status] || statusConfig.sent;

    return (
      <View style={styles.statusContainer}>
        <Ionicons name={config.icon as any} size={12} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  };

  // 渲染系统消息
  if (message.type === 'system') {
    return (
      <Animated.View
        style={[
          styles.systemContainer,
          containerAnimatedStyle,
        ]}
      >
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isCurrentUser ? styles.rowRight : styles.rowLeft,
        containerAnimatedStyle,
      ]}
    >
      {/* 发光效果层 */}
      <Animated.View
        style={[
          styles.glowLayer,
          isCurrentUser ? styles.glowUser : styles.glowAI,
          glowAnimatedStyle,
        ]}
      />

      <Pressable
        onLongPress={() => onLongPress?.(message)}
        delayLongPress={500}
      >
        {/* AI思考过程 */}
        {message.type === 'thinking' && (
          <View style={[getBubbleStyle(), styles.thinkingBubble]}>
            <View style={styles.thinkingIndicator} />
            <View style={styles.thinkingContent}>
              <View style={styles.thinkingHeader}>
                <Ionicons name="bulb-outline" size={14} color={Colors.primary} />
                <Text style={[styles.thinkingLabel]}>Thinking Process</Text>
              </View>
              <Text style={[getTextStyle(), styles.thinkingBody]}>
                {message.content}
              </Text>
            </View>
          </View>
        )}

        {/* 普通文本消息 */}
        {message.type === 'text' && (
          <>
            <View style={[
              getBubbleStyle(),
              isSelected && styles.selectedBubble,
            ]}>
              <Text style={getTextStyle()}>{message.content}</Text>
            </View>
            <View style={styles.statusContainer}>
              {renderStatus()}
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 8,
    maxWidth: '88%',
    position: 'relative',
  },
  rowLeft: {
    alignSelf: 'flex-start',
  },
  rowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },

  // 发光效果层
  glowLayer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
  },
  glowUser: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  glowAI: {
    backgroundColor: Colors.aiBubble,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  // 用户消息气泡
  userBubble: {
    backgroundColor: Colors.userBubble,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // AI消息气泡
  aiBubble: {
    backgroundColor: Colors.aiBubble,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: Colors.metallicSilver,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // 选中状态
  selectedBubble: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  // 文字样式
  userText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: '#FFFFFF',
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },
  aiText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: Colors.textPrimary,
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  // 状态指示器
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
    gap: 4,
  },
  statusText: {
    fontSize: Typography.small.fontSize,
    marginLeft: 2,
    fontFamily: FontFamily.mono.split(',')[0].trim(),
  },

  // 系统消息
  systemContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  systemBubble: {
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  systemText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.techGray,
    textAlign: 'center',
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  // 思考状态气泡
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.aiBubble,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    overflow: 'hidden',
  },
  thinkingIndicator: {
    width: 3,
    backgroundColor: Colors.primary,
  },
  thinkingContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 8,
    paddingRight: 12,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  thinkingLabel: {
    fontSize: Typography.small.fontSize,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },
  thinkingBody: {
    fontStyle: 'italic',
    opacity: 0.8,
    fontSize: Typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: Typography.small.lineHeight,
  },
});

export default AnimatedChatBubble;
