/**
 * 聊天状态管理 - Zustand Store
 *
 * 管理会话列表、消息记录、当前活跃会话等状态
 *
 * 功能说明：
 * 1. 使用 Zustand 进行轻量级状态管理（类似Redux但更简单）
 * 2. 包含会话列表、消息记录、用户立场等核心数据
 * 3. 预置Mock数据用于开发调试和演示
 * 4. 支持完整的CRUD操作（增删改查）
 *
 * 数据结构：
 * - conversations: 会话列表数组
 * - messages: 以会话ID为key的消息记录对象
 * - userPosition: 用户在当前辩论中的立场（正方/反方）
 */

import { create } from 'zustand';
import { Conversation, Message, DebatePosition } from '../types';

// 导入Mock数据
import { mockSouls } from '../data/souls';

// ============ 工具函数 ============

/**
 * 生成过去N分钟/小时/天的时间戳
 * @param minutes 多少分钟前（负数表示未来）
 */
const getTimeAgo = (minutes: number): string => {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  return date.toISOString();
};

// ============ Mock数据生成 ============

/**
 * 生成初始的Mock会话数据
 *
 * 设计原则：
 * - 包含5个示例会话，覆盖不同场景
 * - 混合群组辩论和Soul私聊两种类型
 * - 包含不同状态：进行中(active)、已完成(completed)
 * - 包含不同的未读数：0、3、12、99+
 * - 时间分布合理：从几分钟前到几天前
 *
 * @returns 初始会话列表
 */
const generateMockConversations = (): Conversation[] => [
  {
    // ===== 示例1：群组辩论 - AI是否应该拥有人权？ =====
    id: 'conv_001',
    topicId: 'topic_ai_rights',
    topicTitle: 'AI是否应该拥有人权？',
    lastMessage: '我认为AI不应该拥有人权，因为它们没有意识和情感...',
    lastMessageTime: getTimeAgo(-5), // 5分钟前
    unreadCount: 3,
    status: 'active',
    participants: [
      {
        id: 'user_001',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        role: 'user',
        position: 'con', // 反方
      },
      {
        id: 'soul_001',
        name: '逻辑君',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=logic',
        role: 'soul',
        position: 'pro', // 正方
      },
      {
        id: 'soul_002',
        name: '情感姐',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=emotion',
        role: 'soul',
        position: 'neutral',
      },
    ],
    createdAt: getTimeAgo(-120), // 2小时前创建
    updatedAt: getTimeAgo(-5),
  },
  {
    // ===== 示例2：Soul私聊 - 与挑战者的深度对话 =====
    id: 'conv_002',
    topicId: '',
    topicTitle: '与挑战者的私聊',
    lastMessage: '你的论点存在逻辑谬误，让我来指出问题所在...',
    lastMessageTime: getTimeAgo(-30), // 30分钟前
    unreadCount: 0, // 已读
    status: 'active',
    participants: [
      {
        id: 'user_001',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        role: 'user',
      },
      {
        id: 'soul_003',
        name: '挑战者',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aggressive',
        role: 'soul',
      },
    ],
    createdAt: getTimeAgo(-1440), // 1天前创建
    updatedAt: getTimeAgo(-30),
  },
  {
    // ===== 示例3：群组辩论 - 远程办公的未来 =====
    id: 'conv_003',
    topicId: 'topic_remote_work',
    topicTitle: '远程办公是否会成为主流工作模式？',
    lastMessage: '远程办公提高了效率，但也减少了团队凝聚力...',
    lastMessageTime: getTimeAgo(-120), // 2小时前
    unreadCount: 12,
    status: 'active',
    participants: [
      {
        id: 'user_001',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        role: 'user',
        position: 'pro',
      },
      {
        id: 'soul_004',
        name: '和事佬',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=moderate',
        role: 'soul',
        position: 'neutral',
      },
      {
        id: 'soul_005',
        name: '脑洞王',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=creative',
        role: 'soul',
        position: 'con',
      },
    ],
    createdAt: getTimeAgo(-480), // 8小时前创建
    updatedAt: getTimeAgo(-120),
  },
  {
    // ===== 示例4：已完成的辩论 - 大学教育是否有必要？ =====
    id: 'conv_004',
    topicId: 'topic_education',
    topicTitle: '在互联网时代，大学教育还有必要吗？',
    lastMessage: '辩论结束！最终结论：大学教育仍然重要，但需要改革...',
    lastMessageTime: getTimeAgo(-2880), // 2天前
    unreadCount: 0,
    status: 'completed', // 已完成
    participants: [
      {
        id: 'user_001',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        role: 'user',
        position: 'pro',
      },
      {
        id: 'soul_006',
        name: '质疑者',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=critical',
        role: 'soul',
        position: 'con',
      },
    ],
    createdAt: getTimeAgo(-4320), // 3天前创建
    updatedAt: getTimeAgo(-2880),
  },
  {
    // ===== 示例5：热门话题讨论 - 环境保护vs经济发展 =====
    id: 'conv_005',
    topicId: 'topic_environment',
    topicTitle: '环境保护与经济发展能否兼得？',
    lastMessage: '[系统] 新成员"数据侠"加入了讨论',
    lastMessageTime: getTimeAgo(-1440), // 1天前
    unreadCount: 99, // 99+未读（显示为99+）
    status: 'active',
    participants: [
      {
        id: 'user_001',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        role: 'user',
      },
      {
        id: 'soul_007',
        name: '数据侠',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=data',
        role: 'soul',
        position: 'pro',
      },
      {
        id: 'soul_008',
        name: '哲学家',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=philo',
        role: 'soul',
        position: 'con',
      },
      {
        id: 'soul_001',
        name: '逻辑君',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=logic',
        role: 'soul',
        position: 'neutral',
      },
    ],
    createdAt: getTimeAgo(-2880), // 2天前创建
    updatedAt: getTimeAgo(-1440),
  },
];

/**
 * 生成某个会话的初始Mock消息
 * @param conversationId 会话ID
 * @param count 消息数量
 */
const generateMockMessages = (
  conversationId: string,
  count: number = 5
): Message[] => {
  const messages: Message[] = [];

  // 根据不同会话预设不同的对话内容
  const conversationScripts: Record<string, string[]> = {
    conv_001: [
      '大家好！今天我们讨论的话题是"AI是否应该拥有人权？"我持反方立场。',
      '作为正方，我认为AI如果展现出真正的意识和情感，就应该享有基本权利。',
      '但是目前的AI只是复杂的算法，没有主观体验，怎么能算"人"呢？',
      '意识这个概念本身就很模糊，人类对大脑的理解也还很有限...',
      '我同意正方的观点！让我们从伦理角度深入探讨这个问题。',
    ],
    conv_002: [
      '你好！我是挑战者，准备好接受犀利的质疑了吗？',
      '当然！我觉得辩论就是要有碰撞才能产生火花。',
      '很好！那我们来讨论一下：你认为真理是客观存在的吗？',
      '这是一个经典的哲学问题。我认为真理具有客观性，但人类的认知有限...',
      '哼，你的论点存在逻辑谬误。让我来指出问题所在...',
    ],
    conv_003: [
      '远程办公显然是未来的趋势！它节省通勤时间，提高工作效率。',
      '但我认为面对面的交流是不可替代的，团队文化会受影响。',
      '我们可以采用混合模式啊！既有效率又有温度。',
      '脑洞王有创意！或许未来VR技术能解决远程协作的问题？',
      '远程办公提高了效率，但也减少了团队凝聚力，需要平衡...',
    ],
  };

  const scripts = conversationScripts[conversationId] || [
    '你好！欢迎来到讨论区 🎉',
    '这是一个很有趣的话题！让我们开始吧。',
    '我同意你的观点，但也有一些补充看法...',
    '从另一个角度来看，也许情况并非如此简单。',
    '感谢大家的分享！这次讨论很有收获 👍',
  ];

  for (let i = 0; i < Math.min(count, scripts.length); i++) {
    const isUserMessage = i % 2 === 0; // 交替显示用户和AI消息

    messages.push({
      id: `msg_${conversationId}_${i}`,
      conversationId,
      sender: isUserMessage ? 'user' : 'ai',
      content: scripts[i],
      type: 'text',
      status: isUserMessage ? 'read' : 'delivered',
      timestamp: getTimeAgo(-(count - i) * 10), // 每条消息间隔10分钟
      soulId: !isUserMessage ? mockSouls[i % mockSouls.length]?.id : undefined,
    });
  }

  return messages;
};

// ============ 生成所有会话的消息记录 ============

/**
 * 初始化所有Mock消息数据
 * 为每个会话生成对应的消息历史
 */
const generateAllMockMessages = (): Record<string, Message[]> => {
  const mockConversations = generateMockConversations();
  const allMessages: Record<string, Message[]> = {};

  mockConversations.forEach((conv) => {
    // 只为进行中的会话生成消息（已完成的可以不生成或生成少量）
    allMessages[conv.id] =
      conv.status === 'active'
        ? generateMockMessages(conv.id, conv.unreadCount > 0 ? 6 : 4)
        : conv.status === 'completed'
        ? generateMockMessages(conv.id, 8) // 已完成的会话消息更多
        : [];
  });

  return allMessages;
};

// ============ State接口定义 ============

interface ChatState {
  // 会话列表
  conversations: Conversation[];

  // 当前活跃会话ID
  activeConversationId: string | null;

  // 当前会话的消息列表（以会话ID为key）
  messages: Record<string, Message[]>;

  // 用户选择的立场
  userPosition: DebatePosition | null;

  // 加载状态
  isLoading: boolean;

  // ============ Actions ============

  /** 设置会话列表（完全替换） */
  setConversations: (conversations: Conversation[]) => void;

  /** 添加新会话到列表头部 */
  addConversation: (conversation: Conversation) => void;

  /** 更新指定会话的部分字段 */
  updateConversation: (id: string, updates: Partial<Conversation>) => void;

  /** 删除指定会话 */
  removeConversation: (id: string) => void;

  /** 设置当前活跃会话 */
  setActiveConversation: (id: string | null) => void;

  /** 添加新消息到指定会话 */
  addMessage: (message: Message) => void;

  /** 更新消息的状态（sending/sent/delivered/read/failed） */
  updateMessageStatus: (
    conversationId: string,
    messageId: string,
    status: Message['status']
  ) => void;

  /** 获取某会话的所有消息 */
  getMessages: (conversationId: string) => Message[];

  /** 设置用户立场 */
  setUserPosition: (position: DebatePosition | null) => void;

  /** 清空某会话的未读数 */
  clearUnreadCount: (conversationId: string) => void;

  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
}

// ============ Store实现 ============

export const useChatStore = create<ChatState>((set, get) => ({
  // ==================== 初始状态 ====================
  // 初始为空，数据从后端或用户创建动态加载
  conversations: [],
  activeConversationId: null,
  messages: {},
  userPosition: null,
  isLoading: false,

  // ==================== Actions实现 ====================

  /**
   * 完全替换会话列表
   * 通常用于从服务器获取数据后批量设置
   */
  setConversations: (conversations) => set({ conversations }),

  /**
   * 添加新会话
   * 新会话插入到列表头部（最新的在最前面）
   */
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  /**
   * 更新会话信息
   * 使用展开运算符合并新旧数据，只覆盖传入的字段
   */
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),

  /**
   * 删除会话
   * 同时清理关联的活跃状态
   */
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      // 如果删除的是当前活跃会话，清空活跃状态
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),

  /**
   * 设置当前活跃会话
   */
  setActiveConversation: (id) => set({ activeConversationId: id }),

  /**
   * 添加消息
   *
   * 同时执行两个操作：
   * 1. 将消息添加到对应会话的消息数组
   * 2. 更新会话的最后消息预览和时间戳
   */
  addMessage: (message) =>
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...conversationMessages, message],
        },
        // 更新会话的最后消息信息（用于列表展示）
        conversations: state.conversations.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage:
                  message.content.length > 50
                    ? message.content.slice(0, 50) + '...'
                    : message.content,
                lastMessageTime: message.timestamp,
              }
            : conv
        ),
      };
    }),

  /**
   * 更新消息状态
   * 用于标记消息已发送、已送达、已读等
   */
  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]:
          state.messages[conversationId]?.map((msg) =>
            msg.id === messageId ? { ...msg, status } : msg
          ) || [],
      },
    })),

  /**
   * 获取某会话的所有消息
   * 如果没有返回空数组（避免undefined）
   */
  getMessages: (conversationId) => get().messages[conversationId] || [],

  /**
   * 设置用户立场
   */
  setUserPosition: (position) => set({ userPosition: position }),

  /**
   * 清空某会话的未读数
   * 通常在用户点击进入聊天详情时调用
   */
  clearUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),

  /**
   * 设置加载状态
   * 用于显示加载动画
   */
  setLoading: (isLoading) => set({ isLoading }),
}));
