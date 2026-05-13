/**
 * PRD辩论APP - UI/UX增强组件库 v2.0
 *
 * 核心功能：
 * 1. 微动画系统（弹簧弹性+位移动画）
 * 2. 新拟态设计（Neumorphism凸起/凹陷效果）
 * 3. 毛玻璃效果（Glassmorphism背景模糊）
 * 4. 触觉反馈集成
 * 5. 响应式适配
 *
 * 设计原则：
 * - 专业级视觉品质，避免通用模板感
 * - 独特性、创新性、实用性三合一
 * - 符合现代UI/UX最佳实践
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ══════════════════════════════════════
// 颜色系统
// ══════════════════════════════════════
export const Colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  accent: '#FF6B6B',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: {
    primary: '#2D3436',
    secondary: '#636E72',
    muted: '#B2BEC3',
  },
  neumorphism: {
    light: '#FFFFFF',
    dark: '#E8EAF0',
    shadowLight: 'rgba(255, 255, 255, 0.8)',
    shadowDark: 'rgba(163, 177, 198, 0.6)',
  },
  glassmorphism: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: 20,
  },
};

// ══════════════════════════════════════
// 1. 动画触摸按钮组件
// ══════════════════════════════════════
interface AnimatedButtonProps {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: any;
  variant?: 'primary' | 'secondary' | 'ghost' | 'neumorphic' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  animationType?: 'spring' | 'fade' | 'scale' | 'ripple';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  onLongPress,
  children,
  style,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  animationType = 'spring',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;

    switch (animationType) {
      case 'spring':
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 4,
          useNativeDriver: true,
        }).start();
        break;
      case 'scale':
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 100,
          useNativeDriver: true,
        }).start();
        break;
      case 'fade':
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }).start();
        break;
      default:
        break;
    }
  };

  const handlePressOut = () => {
    switch (animationType) {
      case 'spring':
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }).start();
        break;
      case 'scale':
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        break;
      case 'fade':
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        break;
      default:
        break;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 20 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 };
    }
  };

  const getVariantStyles = () => {
    const baseStyle = getSizeStyles();

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#B2BEC3' : Colors.primary,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#E8EAF0' : Colors.secondary,
          shadowColor: Colors.secondary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 5,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? '#B2BEC3' : Colors.primary,
        };
      case 'neumorphic':
        return {
          ...baseStyle,
          backgroundColor: Colors.neumorphism.light,
          shadowColor: Colors.neumorphism.shadowDark,
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
          // 新拟态内阴影效果通过多层阴影模拟
          shadowOffsetInner: { width: -4, height: -4 },
          shadowColorInner: '#FFFFFF',
        };
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: Colors.glassmorphism.background,
          borderWidth: 1,
          borderColor: Colors.glassmorphism.border,
          // 模糊效果在RN中需要额外处理
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View
      style={[
        styles.animatedButton,
        getVariantStyles(),
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || loading}
        style={styles.touchableArea}
      >
        {loading ? (
          <LoadingIndicator size="small" color="#FFFFFF" />
        ) : (
          children
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ══════════════════════════════════════
// 2. 新拟态卡片组件
// ══════════════════════════════════════
interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'raised' | 'pressed' | 'convex' | 'concave';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  onPress?: () => void;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  variant = 'raised',
  size = 'medium',
  rounded = true,
  onPress,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: 16, borderRadius: rounded ? 16 : 8 };
      case 'large':
        return { padding: 32, borderRadius: rounded ? 28 : 12 };
      default:
        return { padding: 24, borderRadius: rounded ? 22 : 10 };
    }
  };

  const getVariantStyles = () => {
    const baseStyle = getSizeStyles();
    const backgroundColor = Colors.neumorphism.light;

    switch (variant) {
      case 'raised': // 凸起效果（默认）
        return {
          ...baseStyle,
          backgroundColor,
          shadowColor: Colors.neumorphism.shadowDark,
          shadowOffset: { width: 8, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 15,
          elevation: 10,
          // 内部亮边框
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.7)',
        };
      case 'pressed': // 凹陷效果
        return {
          ...baseStyle,
          backgroundColor,
          shadowColor: Colors.neumorphism.shadowDark,
          shadowOffset: { width: isPressed ? 4 : 8, height: isPressed ? 4 : 8 },
          shadowOpacity: isPressed ? 0.25 : 0.45,
          shadowRadius: isPressed ? 8 : 15,
          elevation: isPressed ? 5 : 10,
          // 内嵌阴影
          boxShadow: isPressed
            ? 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.8)'
            : undefined,
        };
      case 'convex': // 凸面效果
        return {
          ...baseStyle,
          backgroundColor: `linear-gradient(145deg, #FFFFFF, ${Colors.neumorphism.dark})`,
          shadowColor: Colors.neumorphism.shadowDark,
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        };
      case 'concave': // 凹面效果
        return {
          ...baseStyle,
          backgroundColor: `${Colors.neumorphism.dark}`,
          shadowColor: Colors.neumorphism.shadowLight,
          shadowOffset: { width: -4, height: -4 },
          shadowOpacity: 0.6,
          shadowRadius: 10,
          elevation: 6,
          boxShadow: 'inset 6px 6px 12px rgba(163, 177, 198, 0.4)',
        };
      default:
        return baseStyle;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.9}
        style={[styles.cardContainer, getVariantStyles(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.cardContainer, getVariantStyles(), style]}>
      {children}
    </View>
  );
};

// ══════════════════════════════════════
// 3. 毛玻璃卡片组件
// ══════════════════════════════════════
interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: any;
  intensity?: 'light' | 'medium' | 'strong';
  blurAmount?: number;
  bordered?: boolean;
  gradient?: boolean;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  style,
  intensity = 'medium',
  blurAmount = 20,
  bordered = true,
  gradient = false,
}) => {
  const getIntensityStyles = () => {
    switch (intensity) {
      case 'light':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: `blur(${blurAmount}px)`,
        };
      case 'strong':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: `blur(${blurAmount + 10}px)`,
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: `blur(${blurAmount}px)`,
        };
    }
  };

  return (
    <View
      style={[
        styles.glassContainer,
        getIntensityStyles(),
        bordered && {
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.25)',
        },
        gradient && {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ══════════════════════════════════════
// 4. 加载指示器组件
// ══════════════════════════════════════
interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'medium',
  color = Colors.primary,
  fullScreen = false,
  message,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();

    return () => spinAnimation.stop();
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 56;
      default: return 40;
    }
  };

  const spinnerSize = getSize();

  const content = (
    <View style={fullScreen ? styles.fullScreenLoader : styles.inlineLoader}>
      <Animated.View
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: spinnerSize / 2,
          borderWidth: 3,
          borderTopColor: color,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [
            {
              rotate: spinAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      />
      {message && (
        <Text style={[styles.loadingMessage, { color }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenOverlay}>
        {content}
      </View>
    );
  }

  return content;
};

// ══════════════════════════════════════
// 5. 列表项动画组件
// ══════════════════════════════════════
interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: any;
  onPress?: () => void;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index = 0,
  delay = 100,
  style,
  onPress,
}) => {
  const translateXAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const staggerDelay = index * delay;

    Animated.parallel([
      Animated.spring(translateXAnim, {
        toValue: 0,
        delay: staggerDelay,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay: staggerDelay,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={style}
      >
        <Animated.View
          style={[
            {
              transform: [{ translateX: translateXAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: translateXAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ══════════════════════════════════════
// 6. 浮动操作按钮(FAB)
// ══════════════════════════════════════
interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon,
  label,
  position = 'bottom-right',
  size = 'medium',
  color = Colors.primary,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };

  const getPositionStyles = () => {
    const baseMargin = 20;
    switch (position) {
      case 'bottom-right':
        return { right: baseMargin, bottom: baseMargin };
      case 'bottom-left':
        return { left: baseMargin, bottom: baseMargin };
      case 'top-right':
        return { right: baseMargin, top: baseMargin };
      case 'top-left':
        return { left: baseMargin, top: baseMargin };
      default:
        return { right: baseMargin, bottom: baseMargin };
    }
  };

  const getSizeDimension = () => {
    switch (size) {
      case 'small': return 48;
      case 'large': return 64;
      default: return 56;
    }
  };

  const fabSize = getSizeDimension();

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        getPositionStyles(),
        {
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          backgroundColor: color,
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '90deg'],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.fabTouchable}
      >
        {icon || (
          <Text style={styles.fabIcon}>+</Text>
        )}
        {label && <Text style={styles.fabLabel}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ══════════════════════════════════════
// 样式定义
// ══════════════════════════════════════
const styles = StyleSheet.create({
  animatedButton: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cardContainer: {
    overflow: 'hidden',
  },
  glassContainer: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  inlineLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreenLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingMessage: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  fabContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  fabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fabLabel: {
    position: 'absolute',
    right: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// 导出Easing工具
const { Easing } = Animated;

export default {
  AnimatedButton,
  NeumorphicCard,
  GlassmorphicCard,
  LoadingIndicator,
  AnimatedListItem,
  FAB,
  Colors,
};
