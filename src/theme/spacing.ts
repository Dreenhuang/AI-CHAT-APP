/**
 * 间距规范 - AI Chat
 *
 * 设计说明：
 * - 基于 4px 网格系统
 * - 保持与微信一致的视觉节奏
 * - 使用语义化命名，便于理解用途
 */

export const Spacing = {
  /** 极小间距 */
  xs: 4,
  
  /** 小间距 */
  sm: 8,
  
  /** 中等间距 */
  md: 12,
  
  /** 标准间距 */
  lg: 16,
  
  /** 大间距 */
  xl: 20,
  
  /** 超大间距 */
  xxl: 24,
  
  /** 特大间距（用于页面边距） */
  xxxl: 32,
} as const;

/** 固定高度/宽度值 */
export const LayoutSizes = {
  /** 导航栏高度 */
  navBar: 44,
  
  /** Tab栏高度 */
  tabBar: 49,
  
  /** 头像尺寸（小） */
  avatarSm: 36,
  
  /** 头像尺寸（中）- 会话列表 */
  avatarMd: 48,
  
  /** 头像尺寸（大）- 个人中心 */
  avatarLg: 80,
  
  /** 图标按钮尺寸 */
  iconBtn: 44,
  
  /** FAB按钮尺寸 */
  fab: 56,
  
  /** 底部输入框高度 */
  inputBar: 48,
  
  /** 气泡最大宽度比例 */
  bubbleMaxWidthRatio: 0.75,
} as const;

/** 圆角规范 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999, // 完全圆角
} as const;
