/**
 * Toast提示组件 - Toast
 * 
 * 用于轻量级消息提示（成功、错误、警告、信息）
 * 自动消失，支持自定义时长
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';

interface ToastProps {
  /** 提示内容 */
  message: string;
  /** 类型：success / error / warning / info */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** 显示时长（毫秒），默认3000 */
  duration?: number;
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

/** 类型对应的配置 */
const typeConfig = {
  success: {
    icon: '✓',
    backgroundColor: '#E8F5E9',
    textColor: '#2E7D32',
    borderColor: '#C8E6C9',
  },
  error: {
    icon: '✕',
    backgroundColor: '#FFEBEE',
    textColor: '#C62828',
    borderColor: '#FFCDD2',
  },
  warning: {
    icon: '⚠',
    backgroundColor: '#FFF3E0',
    textColor: '#EF6C00',
    borderColor: '#FFE0B2',
  },
  info: {
    icon: 'ℹ',
    backgroundColor: '#E3F2FD',
    textColor: '#1565C0',
    borderColor: '#BBDEFB',
  },
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // 自动隐藏
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  if (!visible) return null;

  const config = typeConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: config.textColor }]}>
          {config.icon}
        </Text>
      </View>
      <Text 
        style={[styles.message, { color: config.textColor }]} 
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  iconContainer: {
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default Toast;
