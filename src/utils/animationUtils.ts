/**
 * 动画工具类 - animationUtils.ts
 * 
 * 提供统一的动画配置和预设动画效果
 * 支持React Native Reanimated
 */

import { Easing } from 'react-native-reanimated';

/** 动画配置常量 */
export const AnimationConfig = {
  /** 默认时长 */
  duration: {
    fast: 200,
    normal: 300,
    slow: 450,
    entrance: 600,
  },

  /** 缓动函数 */
  easing: {
    /** 标准缓出 - 最常用 */
    easeOut: Easing.out(Easing.cubic),
    /** 标准缓入 */
    easeIn: Easing.in(Easing.cubic),
    /** 标准缓入缓出 */
    easeInOut: Easing.inOut(Easing.cubic),
    /** 弹性效果 */
    spring: Easing.out(Easing.elastic(1)),
    /** 回弹效果 */
    bounce: Easing.out(Easing.bounce),
  },

  /** 距离配置 */
  distance: {
    small: 10,
    medium: 20,
    large: 50,
  },
};

/** 气泡入场动画配置 */
export const bubbleEntranceConfig = {
  duration: AnimationConfig.duration.entrance,
  easing: AnimationConfig.easing.easeOut,
};

/** 页面切换动画配置 */
export const pageTransitionConfig = {
  duration: AnimationConfig.duration.slow,
  easing: AnimationConfig.easing.easeInOut,
};

/** 列表项交错动画配置 */
export const staggeredConfig = {
  itemDelay: 50,        // 每个项目延迟
  maxDelay: 300,         // 最大延迟
};

/** 骨架屏脉冲动画配置 */
export const skeletonPulseConfig = {
  duration: 1200,
  easing: Easing.inOut(Easing.ease),
};

/** 发光脉冲效果配置 */
export const glowPulseConfig = {
  duration: 2000,
  easing: Easing.inOut(Easing.ease),
};
