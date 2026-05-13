/**
 * PageTransitionAnimator - 页面过渡动画组件
 * 
 * 提供多种入场动画效果：
 * 1. FadeInSlide - 淡入+滑动
 * 2. ScaleIn - 缩放入场
 * 3. StaggeredList - 列表交错动画
 * 4. SkeletonLoader - 骨架屏加载动画
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  SlideInDown,
  SlideInUp,
  ZoomIn,
  ZoomInDown,
  Layout,
} from 'react-native-reanimated';
import { AnimationConfig } from '../utils/animationUtils';

interface PageTransitionAnimatorProps {
  children: React.ReactNode;
  type?: 'fade' | 'slideRight' | 'slideLeft' | 'slideUp' | 'scale' | 'zoom';
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const PageTransitionAnimator: React.FC<PageTransitionAnimatorProps> = ({
  children,
  type = 'fade',
  delay = 0,
  duration = AnimationConfig.duration.slow,
  style,
}) => {
  const animationConfig = {
    entering: getEnteringAnimation(type, delay, duration),
  };

  return (
    <Animated.View entering={animationConfig.entering} style={[styles.container, style]}>
      {children}
    </Animated.View>
  );
};

// 获取入场动画配置
const getEnteringAnimation = (
  type: string,
  delay: number,
  duration: number
) => {
  const delayValue = delay;

  switch (type) {
    case 'slideRight':
      return SlideInRight.delay(delayValue).duration(duration);
    case 'slideLeft':
      return SlideInLeft.delay(delayValue).duration(duration);
    case 'slideUp':
      return SlideInUp.delay(delayValue).duration(duration);
    case 'slideDown':
      return SlideInDown.delay(delayValue).duration(duration);
    case 'scale':
      return ZoomIn.delay(delayValue).duration(duration);
    case 'zoom':
      return ZoomInDown.delay(delayValue).springify().damping(12);
    default:
      return FadeIn.delay(delayValue).duration(duration);
  }
};

// ============ 预设动画组件 ============

/** 淡入动画包装器 */
export const FadeInWrapper: React.FC<{ 
  children: React.ReactNode; 
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}> = ({ children, delay = 0, duration = AnimationConfig.duration.normal, style }) => (
  <Animated.View 
    entering={FadeIn.delay(delay).duration(duration)} 
    style={style}
  >
    {children}
  </Animated.View>
);

/** 从下方滑入动画 */
export const SlideUpWrapper: React.FC<{ 
  children: React.ReactNode; 
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}> = ({ children, delay = 0, duration = AnimationConfig.duration.slow, style }) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).duration(duration)} 
    style={style}
  >
    {children}
  </Animated.View>
);

/** 缩放入场动画 */
export const ScaleInWrapper: React.FC<{ 
  children: React.ReactNode; 
  delay?: number;
  style?: ViewStyle;
}> = ({ children, delay = 0, style }) => (
  <Animated.View 
    entering={ZoomIn.delay(delay).springify().damping(12)} 
    style={style}
  >
    {children}
  </Animated.View>
);

/** 列表项交错动画 */
export const StaggeredItem: React.FC<{ 
  children: React.ReactNode; 
  index: number;
  maxDelay?: number;
  baseDelay?: number;
  style?: ViewStyle;
}> = ({ 
  children, 
  index, 
  maxDelay = AnimationConfig.staggeredConfig.maxDelay,
  baseDelay = AnimationConfig.staggeredConfig.itemDelay,
  style 
}) => {
  const delay = Math.min(index * baseDelay, maxDelay);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(14)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

// ============ 骨架屏加载动画 ============

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: AnimationConfig.skeletonPulseConfig.duration / 2 }),
        withTiming(0.3, { duration: AnimationConfig.skeletonPulseConfig.duration / 2 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

// ============ 脉冲动画 ============

interface PulseAnimationProps {
  children: React.ReactNode;
  isActive?: boolean;
  color?: string;
  style?: ViewStyle;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  isActive = true,
  color = Colors.primary,
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 1000 }),
          withTiming(0.6, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.pulseContainer, style]}>
      {isActive && (
        <Animated.View
          style={[
            styles.pulseRing,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
      )}
      <View style={styles.pulseContent}>{children}</View>
    </View>
  );
};

// ============ 发光效果 ============

interface GlowEffectProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: ViewStyle;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  color = Colors.primary,
  size = 20,
  style,
}) => {
  return (
    <View style={[styles.glowContainer, style]}>
      <View
        style={[
          styles.glowLayer,
          {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: size,
          },
        ]}
      />
      {children}
    </View>
  );
};

// ============ 样式 ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  pulseContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  pulseContent: {
    zIndex: 1,
  },
  glowContainer: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default PageTransitionAnimator;
