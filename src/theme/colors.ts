/**
 * AI Chat App - 深空科技主题系统 v4.0
 *
 * 设计理念：
 * - 采用现代简约的科技感设计语言
 * - 强调清晰的信息层级与流畅的视觉引导
 * - 使用60-30-10色彩法则：60%深蓝背景、30%金属灰辅助、10%科技蓝强调
 *
 * 配色方案：
 * 1. 深空科技（默认）- 用户指定：深蓝#0A1929 + 科技灰#64748B + 金属银#94A3B8
 * 2. 深空蓝 - iOS风格专业科技蓝
 * 3. 极光蓝 - 流动渐变风格
 * 4. 星云紫 - 神秘高级风格
 *
 * 技术说明：
 * - 所有颜色值均为标准HEX或RGBA格式
 * - 渐变效果通过组件层实现，不在ThemeColors中存储渐变字符串
 * - 保持React Native StyleSheet兼容性
 */

// ============ 主题类型定义 ============

export type ThemeId = 'deep-tech' | 'deep-space' | 'aurora-blue' | 'nebula-purple';

export interface ThemeColors {
  /** 主品牌色 - 导航栏、按钮、选中状态 */
  primary: string;

  /** 主品牌色浅色版本 - 用于背景高亮 */
  primaryLight: string;

  /** 主品牌色深色版本 - 用于文字强调 */
  primaryDark: string;

  /** 渐变起始色 - 用于特殊视觉效果 */
  gradientStart: string;

  /** 渐变结束色 - 用于特殊视觉效果 */
  gradientEnd: string;

  /** 用户消息气泡背景 */
  userBubble: string;

  /** AI/Soul消息气泡背景 */
  aiBubble: string;

  /** 页面背景色 */
  background: string;

  /** 卡片/容器背景色 */
  card: string;

  /** 玻璃态卡片背景（RGBA格式） */
  glassCard: string;

  /** 主要文字颜色 */
  textPrimary: string;

  /** 次要文字颜色（提示性文字） */
  textSecondary: string;

  /** 边框/分割线颜色 */
  border: string;

  /** 错误/警告颜色 */
  error: string;

  /** 成功颜色 */
  success: string;

  /** 警告颜色 */
  warning: string;

  /** 金属银 - 装饰性元素、边框高光 */
  metallicSilver: string;

  /** 科技灰 - 中性背景、次要元素 */
  techGray: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
}

// ============ 主题配置定义 ============

export const THEMES: Record<ThemeId, ThemeConfig> = {
  // ========== 深空科技（默认主题）- 用户指定配色 ==========
  'deep-tech': {
    id: 'deep-tech',
    name: 'Deep Tech',
    description: 'Modern minimalist tech aesthetic with deep blue tones',
    colors: {
      // 核心品牌色系 - 基于用户指定
      primary: '#0EA5E9',              // 科技亮蓝 - 主交互色
      primaryLight: '#E0F2FE',         // 极浅蓝 - 背景高光
      primaryDark: '#0369A1',          // 深蓝强调 - 文字/重要元素

      // 渐变色对 - 用于按钮、导航栏等
      gradientStart: '#0A1929',        // 深空蓝起点
      gradientEnd: '#1E3A5F',          // 午夜蓝终点

      // 消息气泡
      userBubble: '#0EA5E9',           // 用户消息 - 科技蓝
      aiBubble: '#FFFFFF',             // AI消息 - 纯白

      // 背景系统
      background: '#F8FAFC',           // 极浅灰蓝背景
      card: '#FFFFFF',                 // 纯白卡片
      glassCard: 'rgba(255, 255, 255, 0.78)', // 玻璃态半透明

      // 文字层级
      textPrimary: '#0F172A',          // 深空黑 - 主文字（基于#0A1929提亮）
      textSecondary: '#64748B',        // 科技灰 - 次要文字（用户指定）

      // 边框与分割线
      border: 'rgba(148, 163, 184, 0.25)', // 金属银半透明（基于#94A3B8）

      // 语义色
      error: '#DC2626',                // 错误红
      success: '#059669',              // 成功绿
      warning: '#D97706',              // 警告橙

      // 装饰色系 - 用户指定核心色
      metallicSilver: '#94A3B8',       // 金属银 - 装饰、边框高光
      techGray: '#64748B',             // 科技灰 - 中性元素
    },
  },

  // ========== 深空蓝 - iOS专业风格 ==========
  'deep-space': {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Professional iOS-style tech aesthetics',
    colors: {
      primary: '#0A84FF',
      primaryLight: '#E8F4FD',
      primaryDark: '#0055D4',
      gradientStart: '#0A84FF',
      gradientEnd: '#5E5CE6',
      userBubble: '#0A84FF',
      aiBubble: '#FFFFFF',
      background: '#F2F2F7',
      card: '#FFFFFF',
      glassCard: 'rgba(255, 255, 255, 0.72)',
      textPrimary: '#1C1C1E',
      textSecondary: '#8E8E93',
      border: 'rgba(60, 60, 67, 0.1)',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      metallicSilver: '#C7C7CC',
      techGray: '#636366',
    },
  },

  // ========== 极光蓝 - 流动渐变 ==========
  'aurora-blue': {
    id: 'aurora-blue',
    name: 'Aurora Blue',
    description: 'Dynamic gradient with flowing aurora effects',
    colors: {
      primary: '#007AFF',
      primaryLight: '#E3F2FD',
      primaryDark: '#1565C0',
      gradientStart: '#00C6FB',
      gradientEnd: '#005BEA',
      userBubble: '#007AFF',
      aiBubble: '#FAFAFA',
      background: '#F5F7FA',
      card: '#FFFFFF',
      glassCard: 'rgba(255, 255, 255, 0.65)',
      textPrimary: '#212121',
      textSecondary: '#757575',
      border: 'rgba(0, 0, 0, 0.08)',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      metallicSilver: '#BDBDBD',
      techGray: '#9E9E9E',
    },
  },

  // ========== 星云紫 - 高级神秘 ==========
  'nebula-purple': {
    id: 'nebula-purple',
    name: 'Nebula Purple',
    description: 'Mysterious premium purple aesthetic',
    colors: {
      primary: '#5856D6',
      primaryLight: '#F3F0FF',
      primaryDark: '#4040B2',
      gradientStart: '#5856D6',
      gradientEnd: '#AF52DE',
      userBubble: '#5856D6',
      aiBubble: '#FFFFFF',
      background: '#F9F8FF',
      card: '#FFFFFF',
      glassCard: 'rgba(255, 255, 255, 0.7)',
      textPrimary: '#1C1C21',
      textSecondary: '#8E8793',
      border: 'rgba(88, 86, 214, 0.12)',
      error: '#FF453A',
      success: '#32D74B',
      warning: '#FF9F0A',
      metallicSilver: '#D1D1D6',
      techGray: '#AEAEB2',
    },
  },
};

// ============ 默认主题导出（向后兼容） ============

/**
 * 默认主题颜色（向后兼容旧代码）
 * 使用深空科技作为默认主题
 */
export const Colors = THEMES['deep-tech'].colors;

/** 颜色键类型 */
export type ColorKeys = keyof ThemeColors;

/** 语义化颜色映射（用于不同场景） */
export const SemanticColors = {
  success: '#059669',    // 成功状态
  warning: '#D97706',    // 警告状态
  info: '#0EA5E9',       // 信息提示（使用主色）
  danger: '#DC2626',     // 危险/错误
} as const;

// ============ 工具函数 ============

/**
 * 获取主题配置
 */
export const getThemeById = (id: ThemeId): ThemeConfig => THEMES[id];

/**
 * 获取所有主题列表
 */
export const getAllThemes = (): ThemeConfig[] => Object.values(THEMES);

/**
 * 获取默认主题ID
 */
export const getDefaultThemeId = (): ThemeId => 'deep-tech';

export default THEMES;
