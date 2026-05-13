/**
 * 议题管理页面 - 常量配置
 *
 * Apple Design System Tokens
 * 包含状态颜色、类型配置、选项列表等静态配置
 */

import { TopicStatus, TopicType } from './types';

// ============ Apple 设计系统色彩 ============

/** 状态标签颜色映射 - Apple 风格 */
export const STATUS_COLORS: Record<TopicStatus, {
  bg: string;      // 背景色
  text: string;    // 文字色
  label: string;   // 显示名称
}> = {
  active: {
    bg: 'rgba(0, 113, 227, 0.12)',
    text: '#0071e3',
    label: '进行中',
  },
  completed: {
    bg: 'rgba(52, 199, 89, 0.12)',
    text: '#34c759',
    label: '已完成',
  },
  paused: {
    bg: 'rgba(255, 159, 10, 0.12)',
    text: '#ff9f0a',
    label: '已暂停',
  },
  pending: {
    bg: 'rgba(142, 142, 139, 0.12)',
    text: '#86868b',
    label: '待审核',
  },
  archived: {
    bg: 'rgba(175, 82, 222, 0.12)',
    text: '#af52de',
    label: '已归档',
  },
};

/** 类型标签颜色映射 */
export const TYPE_COLORS: Record<TopicType, {
  bg: string;
  text: string;
  label: string;
  icon: string;
}> = {
  debate: {
    bg: 'rgba(255, 59, 48, 0.10)',
    text: '#ff3b30',
    label: '辩论',
    icon: '💬',
  },
  vote: {
    bg: 'rgba(48, 209, 88, 0.10)',
    text: '#30d158',
    label: '投票',
    icon: '🗳️',
  },
  discussion: {
    bg: 'rgba(94, 92, 230, 0.10)',
    text: '#5e5ce6',
    label: '讨论',
    icon: '📝',
  },
  qa: {
    bg: 'rgba(255, 159, 10, 0.10)',
    text: '#ff9f0a',
    label: '问答',
    icon: '❓',
  },
};

// ============ 选项配置 ============

/** 状态选项列表（用于筛选下拉） */
export const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  ...Object.entries(STATUS_COLORS).map(([value, config]) => ({
    value,
    label: config.label,
  })),
] as const;

/** 类型选项列表 */
export const TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  ...Object.entries(TYPE_COLORS).map(([value, config]) => ({
    value,
    label: config.label,
  })),
] as const;

/** 排序选项 */
export const SORT_OPTIONS = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '更新时间' },
  { value: 'title', label: '标题' },
  { value: 'hotness', label: '热度' },
] as const;

/** 每页条数选项 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/** 预设标签选项 */
export const TAG_OPTIONS = [
  'AI', '教育', '科技', '社会', '环境', '经济',
  '文化', '体育', '娱乐', '健康', '政治', '法律',
];

// ============ 表单验证规则 ============

/** 字段验证规则 */
export const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: {
      required: '标题为必填项',
      minLength: '标题至少需要2个字符',
      maxLength: '标题不能超过100个字符',
    },
  },
  description: {
    maxLength: 500,
    message: {
      maxLength: '描述不能超过500个字符',
    },
  },
} as const;

// ============ Apple Design Token ============

/** 间距系统 (8px 基准网格) */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** 圆角系统 */
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

/** 阴影系统 - Apple 风格 */
export const SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 30px rgba(0, 0, 0, 0.12)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

/** 动画时长 */
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/** 默认分页参数 */
export const DEFAULT_QUERY_PARAMS = {
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
};
