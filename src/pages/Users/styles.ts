/**
 * Apple Design System - 用户管理页面样式
 *
 * 设计理念：
 * 基于 Apple Human Interface Guidelines (HIG)
 * 采用 SF Pro 风格的视觉语言
 *
 * 核心原则：
 * 1. 清晰 (Clarity) - 文字清晰易读，图标精确
 * 2. 依从 (Deference) - 内容为王，UI不抢戏
 * 3. 深度 (Depth) - 层次分明，动效自然
 *
 * 色彩系统（Apple官方色值）：
 * - Blue: #007AFF (iOS系统蓝)
 * - Green: #34C759 (成功/活跃)
 * - Red: #FF3B30 (错误/危险)
 * - Orange: #FF9500 (警告)
 * - Yellow: #FFCC00 (提醒)
 * - Teal: #5AC8FA (信息)
 * - Indigo: #5856D6 (链接)
 * - Gray: #8E8E93 (次要文字)
 *
 * @module UserManagementStyles
 */

import { StyleSheet, Dimensions } from 'react-native';

// ============================================
// Design Tokens（设计令牌）
// ============================================

/** 屏幕尺寸 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** 是否为平板设备 */
const IS_TABLET = SCREEN_WIDTH >= 768;

/** 基础间距单位 */
const SPACING_UNIT = 4;

// ============================================
// 颜色系统 (Color Tokens)
// ============================================

export const Colors = {
  // === 品牌色 ===
  primary: {
    DEFAULT: '#007AFF',        // iOS系统蓝
    light: '#5AC8FA',          // 浅蓝
    dark: '#0056B3',            // 深蓝
    background: '#F2F2F7',      // iOS背景灰
  },

  // === 语义色 (Semantic Colors) ===
  semantic: {
    success: '#34C759',         // 成功/活跃
    warning: '#FF9500',         // 警告
    error: '#FF3B30',           // 错误/危险
    info: '#5AC8FA',            // 信息
  },

  // === 角色颜色 (Role Colors) ===
  role: {
    admin: '#FF3B30',           // 管理员-红色
    editor: '#007AFF',          // 编辑-蓝色
    viewer: '#8E8E93',          // 观众-灰色
  },

  // === 状态颜色 (Status Colors) ===
  status: {
    active: '#34C759',          // 活跃-绿色
    disabled: '#8E8E93',        // 禁用-灰色
    pending: '#FF9500',         // 待审核-橙色
  },

  // === 文字颜色 (Text Colors) ===
  text: {
    primary: '#1C1C1E',         // 主文字-近黑
    secondary: '#8E8E93',       // 次要文字-灰色
    tertiary: '#AEAEB2',        // 三级文字-浅灰
    inverse: '#FFFFFF',         // 反白文字
    link: '#007AFF',            // 链接蓝
  },

  // === 背景色 (Background Colors) ===
  background: {
    primary: '#FFFFFF',         // 主背景-白色
    secondary: '#F2F2F7',       // 次级背景-iOS灰
    tertiary: '#E5E5EA',        // 三级背景-边框灰
    grouped: '#F2F2F7',         // 分组背景
  },

  // === 边框颜色 (Border Colors) ===
  border: {
    light: 'rgba(0, 0, 0, 0.08)',   // 浅边框
    medium: 'rgba(0, 0, 0, 0.12)',  // 中边框
    strong: 'rgba(0, 0, 0, 0.18)',  // 深边框
    focus: '#007AFF',                // 聚焦边框-蓝色
  },

  // === 阴影 (Shadows) ===
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
  },
};

// ============================================
// 间距系统 (Spacing Tokens)
// 基于 4px 网格系统
// ============================================

export const Spacing = {
  xs: SPACING_UNIT * 1,     // 4px
  sm: SPACING_UNIT * 2,     // 8px
  md: SPACING_UNIT * 3,     // 12px
  base: SPACING_UNIT * 4,   // 16px
  lg: SPACING_UNIT * 5,     // 20px
  xl: SPACING_UNIT * 6,     // 24px
  xxl: SPACING_UNIT * 8,    // 32px
  xxxl: SPACING_UNIT * 10,  // 40px
};

// ============================================
// 字体系统 (Typography Tokens)
// ============================================

export const Typography = {
  /** 字体家族 */
  fontFamily: {
    regular: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    medium: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    semibold: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    bold: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  /** 字号阶梯 */
  fontSize: {
    display: IS_TABLET ? 36 : 28,       // 大标题
    heading1: IS_TABLET ? 28 : 22,      // H1
    heading2: IS_TABLET ? 24 : 19,      // H2
    heading3: IS_TABLET ? 20 : 17,      // H3 / 导航栏标题
    body: IS_TABLET ? 17 : 15,          // 正文
    callout: IS_TABLET ? 16 : 14,       // 说明文字
    subhead: IS_TABLET ? 15 : 13,       // 副标题
    footnote: IS_TABLET ? 13 : 11,      // 注脚
    caption1: IS_TABLET ? 12 : 10,      // 小字说明
    caption2: IS_TABLET ? 11 : 9,       // 极小字
  },

  /** 字重 */
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  /** 行高 */
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// ============================================
// 圆角系统 (Border Radius Tokens)
// ============================================

export const BorderRadius = {
  none: 0,
  xs: 4,        // 小圆角-标签
  sm: 6,        // 中小圆角-按钮
  md: 8,        // 中圆角-输入框
  lg: 10,       // 大圆角-卡片
  xl: 12,       // 超大圆角-对话框
  xxl: 16,      // 特大圆角-弹窗
  full: 9999,   // 完全圆角-头像/徽章
};

// ============================================
// 样式表 (StyleSheet)
// ============================================

export const Styles = StyleSheet.create({
  // === 容器样式 ===

  /** 页面容器 */
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  /** 安全区域容器 */
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  /** 内容区域 */
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },

  // === 头部样式 ===

  /** 页面头部 */
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  },

  /** 页面标题 */
  title: {
    fontSize: Typography.fontSize.heading2,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semibold,
  },

  /** 头部操作按钮区域 */
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },

  // === 搜索栏样式 ===

  /** 搜索栏容器 */
  searchBarContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },

  /** 搜索输入框 */
  searchInput: {
    height: 44,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },

  /** 筛选标签容器 */
  filterTagsContainer: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  /** 筛选标签 */
  filterTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },

  /** 筛选标签文字 */
  filterTagText: {
    fontSize: Typography.fontSize.caption1,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },

  // === 表格样式 ===

  /** 表格容器 */
  tableContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    ...Colors.shadow.md,
  },

  /** 表格头部 */
  tableHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.grouped,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  },

  /** 表头文字 */
  headerText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },

  /** 表格行 */
  tableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  },

  /** 表格行（选中态） */
  tableRowSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.04)',
  },

  /** 单元格基础样式 */
  cell: {
    justifyContent: 'center' as const,
  },

  // === 用户头像样式 ===

  /** 头像容器 */
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    overflow: 'hidden' as const,
    backgroundColor: Colors.background.tertiary,
  },

  /** 头像图片 */
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover' as const,
  },

  /** 默认头像（无图片时） */
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary.DEFAULT,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  /** 头像占位符文字 */
  avatarText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.inverse,
    fontFamily: Typography.fontFamily.medium,
  },

  // === 状态指示器 ===

  /** 状态圆点 */
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },

  /** 状态活跃（绿色） */
  statusActive: {
    backgroundColor: Colors.status.active,
  },

  /** 状态禁用（灰色） */
  statusDisabled: {
    backgroundColor: Colors.status.disabled,
  },

  // === 角色标签 ===

  /** 角色标签容器 */
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },

  /** 角色标签文字 */
  roleBadgeText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium as any,
    fontFamily: Typography.fontFamily.medium,
  },

  /** 管理员角色标签 */
  roleAdmin: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  roleAdminText: {
    color: Colors.role.admin,
  },

  /** 编辑角色标签 */
  roleEditor: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  roleEditorText: {
    color: Colors.role.editor,
  },

  /** 观众角色标签 */
  roleViewer: {
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  roleViewerText: {
    color: Colors.role.viewer,
  },

  // === 操作按钮 ===

  /** 操作按钮容器 */
  actionButtonContainer: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
  },

  /** 图标按钮 */
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
  },

  /** 图标按钮（按下态） */
  iconButtonPressed: {
    backgroundColor: Colors.background.tertiary,
  },

  // === 分页样式 ===

  /** 分页容器 */
  paginationContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.light,
  },

  /** 分页信息文字 */
  paginationInfo: {
    fontSize: Typography.fontSize.caption1,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },

  /** 分页按钮组 */
  paginationButtons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },

  /** 分页按钮 */
  paginationButton: {
    minWidth: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },

  /** 分页按钮（当前页） */
  paginationButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },

  /** 分页按钮文字 */
  paginationButtonText: {
    fontSize: Typography.fontSize.caption1,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },

  /** 分页按钮文字（当前页） */
  paginationButtonTextActive: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium as any,
  },

  // === 模态框样式 ===

  /** 模态框遮罩 */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.xxl,
  },

  /** 模态框容器 */
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xxl,
    ...Colors.shadow.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },

  /** 模态框头部 */
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  },

  /** 模态框标题 */
  modalTitle: {
    fontSize: Typography.fontSize.heading3,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semibold,
  },

  /** 模态框内容区 */
  modalContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  /** 模态框底部 */
  modalFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.light,
  },

  // === 输入框样式 ===

  /** 输入框容器 */
  inputContainer: {
    marginBottom: Spacing.lg,
  },

  /** 输入框标签 */
  inputLabel: {
    fontSize: Typography.fontSize.subhead,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },

  /** 输入框（必填标记） */
  requiredMark: {
    color: Colors.semantic.error,
  },

  /** 输入框 */
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    backgroundColor: Colors.background.primary,
  },

  /** 输入框（聚焦态） */
  inputFocused: {
    borderColor: Colors.border.focus,
    borderWidth: 2,
  },

  /** 输入框（错误态） */
  inputError: {
    borderColor: Colors.semantic.error,
  },

  /** 输入框错误提示 */
  inputErrorText: {
    fontSize: Typography.fontSize.caption1,
    color: Colors.semantic.error,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.xs,
  },

  // === 按钮样式 ===

  /** 主要按钮 */
  buttonPrimary: {
    height: 48,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.xl,
  },

  /** 主要按钮文字 */
  buttonPrimaryText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.inverse,
    fontFamily: Typography.fontFamily.semibold,
  },

  /** 次要按钮 */
  buttonSecondary: {
    height: 48,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.xl,
  },

  /** 次要按钮文字 */
  buttonSecondaryText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },

  /** 危险按钮 */
  buttonDanger: {
    height: 48,
    backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.xl,
  },

  /** 危险按钮文字 */
  buttonDangerText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.inverse,
    fontFamily: Typography.fontFamily.semibold,
  },

  // === 侧边抽屉样式 ===

  /** 抽屉遮罩 */
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row-reverse' as const,
  },

  /** 抽屉容器 */
  drawerContainer: {
    width: IS_TABLET ? 480 : SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.background.primary,
    ...Colors.shadow.xl,
  },

  /** 抽屉头部 */
  drawerHeader: {
    padding: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
    alignItems: 'center' as const,
  },

  /** 抽屉头部头像 */
  drawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },

  /** 抽屉用户名 */
  drawerUsername: {
    fontSize: Typography.fontSize.heading2,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center' as const,
  },

  /** 抽屉邮箱 */
  drawerEmail: {
    fontSize: Typography.fontSize.subhead,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center' as const,
    marginTop: Spacing.xs,
  },

  /** 抽屉内容区 */
  drawerContent: {
    flex: 1,
    padding: Spacing.xl,
  },

  /** 统计卡片网格 */
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },

  /** 统计卡片 */
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background.grouped,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center' as const,
  },

  /** 统计数字 */
  statNumber: {
    fontSize: Typography.fontSize.heading1,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.primary.DEFAULT,
    fontFamily: Typography.fontFamily.bold,
  },

  /** 统计标签 */
  statLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.xs,
  },

  // === 空状态样式 ===

  /** 空状态容器 */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.xxxl,
  },

  /** 空状态图标 */
  emptyIcon: {
    fontSize: 64,
    color: Colors.border.medium,
    marginBottom: Spacing.lg,
  },

  /** 空状态标题 */
  emptyTitle: {
    fontSize: Typography.fontSize.heading3,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.sm,
  },

  /** 空状态描述 */
  emptyDescription: {
    fontSize: Typography.fontSize.callout,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.xxl,
  },

  // === 加载状态 ===

  /** 加载容器 */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  /** Toast提示样式 */
  toast: {
    position: 'absolute' as const,
    bottom: 100,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.text.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Colors.shadow.lg,
  },

  toastText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.callout,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center' as const,
  },
});

// ============================================
// 默认导出
// ============================================

export default {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Styles,
};
