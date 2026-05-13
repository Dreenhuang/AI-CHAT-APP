/**
 * Soul角色管理系统 - 类型定义
 * 
 * 采用Apple设计风格的企业级AI辩论角色管理后台
 * 包含完整的角色CRUD、参数调节、对话测试等功能
 */

/** 角色类型枚举 */
export type SoulType = 
  | 'debate'      // 辩论型
  | 'analysis'    // 分析型
  | 'speculation' // 思辨型
  | 'creative'    // 创意型
  | 'business'    // 商业型
  | 'academic'    // 学术型
  | 'other';      // 其他

/** 角色状态 */
export type SoulStatus = 'active' | 'inactive';

/** 语言风格 */
export type LanguageStyle = 
  | 'academic'     // 学术严谨
  | 'accessible'   // 通俗易懂
  | 'humorous'     // 幽默风趣
  | 'formal'       // 正式官方
  | 'friendly';    // 亲切友好

/** 性格特点标签 */
export type PersonalityTag = 
  | 'rational'     // 理性
  | 'critical'     // 批判
  | 'humorous'     // 幽默
  | 'gentle'       // 温和
  | 'aggressive'   // 激进
  | 'creative'     // 创意
  | 'empathetic'   // 共情
  | 'logical'      // 逻辑
  | 'innovative'   // 创新
  | 'custom';      // 自定义

/** AI行为参数 */
export interface AIBehaviorParams {
  creativity: number;    // 创造力等级 (0-10)
  rigor: number;         // 严谨程度 (0-10)
  interaction: number;   // 互动倾向 (0-10)
}

/** 示例对话对 */
export interface ExampleDialogue {
  id: string;
  question: string;
  answer: string;
}

/** 使用统计 */
export interface UsageStats {
  totalCalls: number;        // 总调用次数
  avgRating: number;         // 平均评分 (0-5)
  approvalRate: number;      // 好评率 (%)
  avgDialogueRounds: number; // 平均对话轮数
}

/** Soul角色完整数据结构 */
export interface Soul {
  id: string;
  
  /** 基本信息 */
  name: string;              // 中文名称
  nameEn: string;            // 英文名称
  description: string;       // 角色简介
  avatar: string;            // 头像URL
  
  /** 角色设定 */
  type: SoulType;            // 角色类型
  personalityTags: PersonalityTag[]; // 性格特点标签
  customTags?: string[];     // 自定义标签
  languageStyle: LanguageStyle; // 语言风格
  
  /** AI行为参数 */
  aiParams: AIBehaviorParams;
  
  /** Prompt配置 */
  systemPrompt: string;      // System Prompt模板
  exampleDialogues: ExampleDialogue[]; // 示例对话
  
  /** 状态与统计 */
  status: SoulStatus;        // 启用/停用
  usageStats: UsageStats;    // 使用统计
  
  /** 元数据 */
  createdAt: string;         // 创建时间
  updatedAt: string;         // 更新时间
  version: number;           // 版本号
  isABTest: boolean;         // 是否A/B测试标记
  creator?: string;          // 创建者
}

/** 创建/编辑角色的表单数据 */
export interface SoulFormData {
  name: string;
  nameEn: string;
  description: string;
  avatar: string | File;
  type: SoulType;
  personalityTags: PersonalityTag[];
  customTags: string[];
  languageStyle: LanguageStyle;
  aiParams: AIBehaviorParams;
  systemPrompt: string;
  exampleDialogues: ExampleDialogue[];
  status: SoulStatus;
  isABTest: boolean;
}

/** 搜索筛选参数 */
export interface SoulFilterParams {
  keyword?: string;          // 搜索关键词
  type?: SoulType | 'all';   // 类型筛选
  status?: SoulStatus | 'all'; // 状态筛选
  sortBy?: 'name' | 'createdAt' | 'usage' | 'rating'; // 排序方式
  sortOrder?: 'asc' | 'desc'; // 排序顺序
  page: number;              // 页码
  pageSize: number;          // 每页数量
}

/** 视图模式 */
export type ViewMode = 'card' | 'list';

/** 类型映射（中文显示） */
export const SoulTypeLabels: Record<SoulType, string> = {
  debate: '辩论型',
  analysis: '分析型',
  speculation: '思辨型',
  creative: '创意型',
  business: '商业型',
  academic: '学术型',
  other: '其他',
};

/** 状态映射 */
export const SoulStatusLabels: Record<SoulStatus, string> = {
  active: '启用',
  inactive: '停用',
};

/** 语言风格映射 */
export const LanguageStyleLabels: Record<LanguageStyle, string> = {
  academic: '学术严谨',
  accessible: '通俗易懂',
  humorous: '幽默风趣',
  formal: '正式官方',
  friendly: '亲切友好',
};

/** 性格标签映射 */
export const PersonalityTagLabels: Record<PersonalityTag, string> = {
  rational: '理性',
  critical: '批判',
  humorous: '幽默',
  gentle: '温和',
  aggressive: '激进',
  creative: '创意',
  empathetic: '共情',
  logical: '逻辑',
  innovative: '创新',
  custom: '自定义',
};

/** 类型对应的主题色 */
export const SoulTypeColors: Record<SoulType, string> = {
  debate: '#FF6B6B',      // 红色 - 辩论的激情
  analysis: '#4ECDC4',    // 青色 - 分析的冷静
  speculation: '#95E1D3', // 薄荷绿 - 思辨的清新
  creative: '#DDA0DD',    // 紫色 - 创意的灵感
  business: '#F7DC6F',    // 金黄色 - 商业的稳重
  academic: '#85C1E9',    // 天蓝色 - 学术的深邃
  other: '#D5DBDB',       // 灰色 - 其他的中性
};
