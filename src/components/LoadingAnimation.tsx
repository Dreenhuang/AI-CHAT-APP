/**
 * 加载动画组件 - LoadingAnimation
 * 
 * 用于数据加载、发送消息等等待状态
 * 支持多种加载样式：点阵、骨架屏、文字提示
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';

interface LoadingAnimationProps {
  /** 加载文字 */
  text?: string;
  /** 加载类型：dots / pulse / skeleton / typing */
  type?: 'dots' | 'pulse' | 'skeleton' | 'typing';
  /** 尺寸：small / medium / large */
  size?: 'small' | 'medium' | 'large';
  /** 是否全屏显示 */
  fullscreen?: boolean;
  /** 自定义颜色 */
  color?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  text,
  type = 'dots',
  size = 'medium',
  fullscreen = false,
  color = Colors.primary,
}) => {
  // 点阵动画
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === 'dots' || type === 'typing') {
      const animation = Animated.stagger(150, [
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot1Anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot1Anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot2Anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot3Anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);

      animation.start();

      return () => {
        dot1Anim.stopAnimation();
        dot2Anim.stopAnimation();
        dot3Anim.stopAnimation();
      };
    }
  }, [type]);

  const sizeConfig = {
    small: { dotSize: 6, gap: 4 },
    medium: { dotSize: 8, gap: 6 },
    large: { dotSize: 12, gap: 8 },
  };

  const config = sizeConfig[size];

  // 渲染点阵动画
  if (type === 'dots' || type === 'typing') {
    const content = (
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              backgroundColor: color,
              opacity: dot1Anim,
              transform: [
                { scale: dot1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              backgroundColor: color,
              marginLeft: config.gap,
              opacity: dot2Anim,
              transform: [
                { scale: dot2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              backgroundColor: color,
              marginLeft: config.gap,
              opacity: dot3Anim,
              transform: [
                { scale: dot3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }) },
              ],
            },
          ]}
        />
      </View>
    );

    if (fullscreen) {
      return (
        <View style={styles.fullscreenContainer}>
          {content}
          {text && <Text style={[styles.text, { color }]}>{text}</Text>}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {content}
        {text && <Text style={[styles.text, { color, marginTop: 8 }]}>{text}</Text>}
      </View>
    );
  }

  // 脉冲动画
  if (type === 'pulse') {
    return (
      <View style={[styles.container, fullscreen && styles.fullscreenContainer]}>
        <View style={styles.pulseContainer}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.pulseRing,
                {
                  width: size === 'small' ? 30 : size === 'medium' ? 40 : 50,
                  height: size === 'small' ? 30 : size === 'medium' ? 40 : 50,
                  backgroundColor: `${color}20`,
                  borderColor: color,
                },
              ]}
            />
          ))}
          <View
            style={[
              styles.pulseCore,
              {
                width: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
                height: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        {text && <Text style={[styles.text, { color }, fullscreen && { marginTop: 16 }]}>{text}</Text>}
      </View>
    );
  }

  // 骨架屏
  if (type === 'skeleton') {
    return (
      <View style={[styles.skeletonContainer, fullscreen && styles.fullscreenContainer]}>
        {/* 模拟会话列表项 */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonItem}>
            <View style={[styles.skeletonAvatar, { backgroundColor: '#F0F0F0' }]} />
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonLine, { width: '60%', backgroundColor: '#F0F0F0' }]} />
              <View style={[styles.skeletonLine, { width: '80%', marginTop: 8, backgroundColor: '#F5F5F5' }]} />
            </View>
          </View>
        ))}
        {text && <Text style={[styles.text, { color: Colors.textSecondary }]}>加载中...</Text>}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {},
  text: {
    fontSize: 14,
    marginTop: 12,
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 25,
    borderWidth: 2,
  },
  pulseCore: {
    borderRadius: 12,
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
  },
});

export default LoadingAnimation;
