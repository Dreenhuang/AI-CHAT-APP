/**
 * 字体规范 - AI Chat v2.0
 *
 * 设计说明：
 * - 采用专业无衬线字体栈，确保跨平台一致性
 * - 主字体：Inter（Google Fonts）- 现代几何感，优秀可读性
 * - 等宽字体：Roboto Mono - 代码/数据展示
 * - 字号参考Apple Human Interface Guidelines + Material Design
 * - 权重使用 400(Regular) / 500(Medium) / 600(SemiBold) / 700(Bold)
 * - 行高采用1.4-1.6范围，确保舒适阅读体验
 *
 * 技术实现：
 * - React Native使用 fontFamily 属性
 * - Web端通过@import引入Google Fonts
 * - 提供完整的字体回退链（Fallback Chain）
 */

// ============ 字体家族定义 ============

export const FontFamily = {
  /**
   * 主字体 - Inter
   * - 来源：Google Fonts（免费商用）
   * - 特点：几何无衬线、高可读性、多语言支持
   * - 用途：标题、正文、UI元素
   * - 回退链：Inter -> -apple-system(iOS) -> system-ui(Android) -> sans-serif
   */
  primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  /**
   * 等宽字体 - Roboto Mono
   * - 特点：清晰等宽、适合代码/数据显示
   * - 用途：时间戳、代码块、数字展示
   * - 回退链：Roboto Mono -> "Courier New" -> monospace
   */
  mono: '"Roboto Mono", "SF Mono", "Consolas", "Liberation Mono", Menlo, Courier, monospace',

  /**
   * 中文优化字体栈
   * - 优先使用系统中文字体
   * - iOS: PingFang SC
   * - Android: Noto Sans SC / 思源黑体
   * - Windows: Microsoft YaHei
   */
  chinese: '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
} as const;

// ============ 字号阶梯系统 ============

/**
 * 字号设计原则：
 * - 基于4px网格系统（8的倍数最佳）
 * - 参考Material Design Type Scale
 * - 覆盖从超小到超大的完整范围
 */
export const Typography = {
  /** 超大显示文字 - 用于品牌/Splash页 */
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  /** 大标题 - 页面主标题 */
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },

  /** 导航栏标题 - iOS标准17sp */
  nav: {
    fontSize: 17,
    fontWeight: '700' as const,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  /** 页面标题/子标题 */
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },

  /** 正文内容 - 主要阅读文本 */
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },

  /** 次要正文 - 列表项、描述 */
  bodySecondary: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  /** Tab栏文字 - 小号可点击文字 */
  tab: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    letterSpacing: 0.1,
  },

  /** 辅助文字 - 时间戳、提示、标签 */
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  /** 小号文字 - 徽章、标签内文字 */
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
    letterSpacing: 0.3,
  },

  /** 超小文字 - 版权、脚注 */
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;

// ============ 字重枚举 ============

export const FontWeight = {
  regular: '400',      // 常规 - 正文
  medium: '500',       // 中等 - 强调
  semiBold: '600',     // 半粗 - 小标题
  bold: '700',         // 粗体 - 标题/重要信息
} as const;

// ============ 行高工具函数 ============

/**
 * 计算标准行高（基于字号的1.5倍）
 * @param fontSize 字号
 * @returns 推荐行高
 */
export const calculateLineHeight = (fontSize: number): number => {
  return Math.round(fontSize * 1.5);
};

// ============ Google Fonts导入（Web端使用） ============

/**
 * 在Web/index.html的<head>中添加以下link标签：
 *
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
 *
 * React Native/Expo配置：
 * 使用 expo-font 包在App启动时加载字体：
 *
 * import { useFonts } from 'expo-font';
 * import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
 * import { RobotoMono_400Regular, RobotoMono_500Medium } from '@expo-google-fonts/roboto-mono';
 */

export default Typography;
