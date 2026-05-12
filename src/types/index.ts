/**
 * AI Chat - TypeScript 类型定义
 *
 * 本文件定义了整个应用使用的所有核心数据结构
 */

// ============ 议题相关类型 ============

/** 议题分类枚举 */
export type TopicCategory = 
  | 'tech'      // 科技
  | 'education' // 教育
  | 'social'    // 社会
  | 'lifestyle' // 生活
  | 'entertainment' // 娱乐
  | 'sports'    // 体育
  | 'politics'  // 政治
  | 'economy'   // 经济
  | 'culture'   // 文化
  | 'environment'; // 环境

/** 议题数据结构 */
export interface Topic {
  id: string;
  title: string;
  description: string;
  category: TopicCategory;
  hot: number;           // 热度值 0-100
  createdAt: string;     // ISO时间戳
  tags?: string[];       // 可选标签
}

// ============ 消息相关类型 ============

/** 消息发送者类型 */
export type MessageSender = 'user' | 'ai' | 'soul';

/** 消息状态 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/** 消息类型 */
export type MessageType = 
  | 'text'      // 文本消息
  | 'image'     // 图片消息
  | 'system'    // 系统消息（如：辩论开始、结束）
  | 'thinking'; // AI思考过程

/** 单条消息 */
export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;      // ISO时间戳
  soulId?: string;        // 如果是Soul消息，记录来源
}

// ============ 会话相关类型 ============

/** 会话/对话 */
export interface Conversation {
  id: string;
  topicId: string;        // 关联的议题ID
  topicTitle: string;     // 议题标题（冗余存储，避免联表查询）
  lastMessage?: string;   // 最后一条消息预览
  lastMessageTime: string;// 最后消息时间
  unreadCount: number;    // 未读数
  participants: Participant[];
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

/** 会话参与者 */
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: 'user' | 'ai' | 'soul';
  position?: 'pro' | 'con' | 'neutral'; // 立场：正方/反方/中立
}

/** 会话状态 */
export type ConversationStatus = 
  | 'active'     // 进行中
  | 'paused'     // 已暂停
  | 'completed'; // 已完成

// ============ Soul好友相关类型 ============

/** Soul性格类型 */
export type SoulPersonality = 
  | 'rational'      // 理性分析型
  | 'emotional'     // 情感共鸣型
  | 'aggressive'    // 激进挑战型
  | 'moderate'      // 温和折中型
  | 'creative'      // 创意发散型
  | 'critical';     // 批判思维型

/** Soul好友 */
export interface Soul {
  id: string;
  name: string;
  avatar: string;
  personality: SoulPersonality;
  description: string;
  specialty: string;         // 擅长领域
  winRate: number;          // 胜率 0-100
  debateCount: number;      // 参与辩论次数
  isOnline: boolean;
  addedAt: string;
}

// ============ 群组相关类型 ============

/** 群组 */
export interface Group {
  id: string;
  name: string;
  avatar: string;
  description: string;
  memberCount: number;
  topics: string[];         // 热门议题ID列表
  createdAt: string;
}

// ============ 用户相关类型 ============

/** 用户信息 */
export interface User {
  id: string;
  nickname: string;
  avatar: string;
  bio?: string;
  level: number;            // 等级 1-100
  experience: number;       // 经验值
  totalDebates: number;     // 总辩论次数
  winRate: number;          // 胜率
  createdAt: string;
}

// ============ 辩论相关类型 ============

/** 辩论立场 */
export type DebatePosition = 'pro' | 'con';

/** 辩论回合 */
export interface DebateRound {
  roundNumber: number;
  proArgument: string;      // 正方论述
  conArgument: string;      // 反方论述
  proScore: number;         // 正方得分
  conScore: number;         // 反方得分
  winner: DebatePosition;   // 回合胜者
}

/** 完整辩论记录 */
export interface Debate {
  id: string;
  conversationId: string;
  topicId: string;
  userPosition: DebatePosition;  // 用户选择的立场
  soulId: string;                // 对手Soul ID
  rounds: DebateRound[];
  finalWinner: DebatePosition;
  totalRounds: number;
  startedAt: string;
  endedAt: string;
}

// ============ API响应类型 ============

/** 通用API响应 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** 分页参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalPages: number;
  };
}
