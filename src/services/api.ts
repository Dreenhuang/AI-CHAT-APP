/**
 * API封装 - API Service
 * 
 * 封装所有后端API调用
 * 使用fetch进行HTTP请求，支持拦截器、错误处理
 */

import { ApiResponse, PaginatedResponse, Topic, Conversation, Soul, Message, DebatePosition } from '../types';

// ============ 配置 ============

/** API基础地址 */
const BASE_URL = 'http://localhost:9461/api';

/** 请求超时时间（毫秒） */
const TIMEOUT = 15000;

// ============ 类型定义 ============

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

// ============ 工具函数 ============

/**
 * 构建带查询参数的URL
 */
const buildUrl = (endpoint: string, params?: Record<string, string>): string => {
  const url = `${BASE_URL}${endpoint}`;
  if (!params) return url;
  
  const searchParams = new URLSearchParams(params);
  return `${url}?${searchParams.toString()}`;
};

/**
 * 通用请求方法
 */
const request = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
  } = config;

  try {
    const url = buildUrl(endpoint, params);
    
    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // 添加Token（如果有）
    // const token = useUserStore.getState().token;
    // if (token) {
    //   requestHeaders['Authorization'] = `Bearer ${token}`;
    // }

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 解析响应
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP Error: ${response.status}`,
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error: any) {
    console.error('API Request Error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时，请稍后重试',
      };
    }

    return {
      success: false,
      error: error.message || '网络连接失败',
    };
  }
};

// ============ 议题相关API ============

export const topicApi = {
  /** 获取议题列表（分页） */
  getTopics: async (params?: { page?: number; pageSize?: number; category?: string }) =>
    request<PaginatedResponse<Topic>>('/topics', { params: params as any }),

  /** 获取热门议题 */
  getHotTopics: async (limit?: number) =>
    request<Topic[]>('/topics/hot', { params: { limit: String(limit || 10) } }),

  /** 获取单个议题详情 */
  getTopicById: async (id: string) =>
    request<Topic>(`/topics/${id}`),

  /** 搜索议题 */
  searchTopics: async (keyword: string) =>
    request<Topic[]>('/topics/search', { params: { q: keyword } }),
};

// ============ 会话相关API ============

export const conversationApi = {
  /** 获取会话列表 */
  getConversations: async () =>
    request<Conversation[]>('/conversations'),

  /** 创建新会话 */
  createConversation: async (data: { topicId: string; soulIds: string[] }) =>
    request<Conversation>('/conversations', { method: 'POST', body: data }),

  /** 获取会话详情 */
  getConversationById: async (id: string) =>
    request<Conversation>(`/conversations/${id}`),

  /** 删除会话 */
  deleteConversation: async (id: string) =>
    request<void>(`/conversations/${id}`, { method: 'DELETE' }),

  /** 更新会话状态 */
  updateStatus: async (id: string, status: string) =>
    request<Conversation>(`/conversations/${id}/status`, { 
      method: 'PUT', 
      body: { status } 
    }),
};

// ============ 消息相关API ============

export const messageApi = {
  /** 获取消息列表 */
  getMessages: async (conversationId: string, params?: { page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, { params }),

  /** 发送消息 */
  sendMessage: async (conversationId: string, content: string) =>
    request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content },
    }),

  /** 开始辩论 */
  startDebate: async (conversationId: string, position: DebatePosition) =>
    request<{ debateId: string }>(`/conversations/${conversationId}/debate/start`, {
      method: 'POST',
      body: { position },
    }),
};

// ============ Soul好友API ============

export const soulApi = {
  /** 获取Soul好友列表 */
  getSouls: async () =>
    request<Soul[]>('/souls'),

  /** 获取Soul详情 */
  getSoulById: async (id: string) =>
    request<Soul>(`/souls/${id}`),

  /** 添加Soul好友 */
  addSoul: async (soulId: string) =>
    request<void>(`/souls/${soulId}/add`, { method: 'POST' }),

  /** 移除Soul好友 */
  removeSoul: async (soulId: string) =>
    request<void>(`/souls/${soulId}/remove`, { method: 'DELETE' }),
};

// ============ 用户相关API ============

export const userApi = {
  /** 获取当前用户信息 */
  getCurrentUser: async () =>
    import('../types').then(({ User }) => request<User>('/user/profile')),

  /** 更新用户信息 */
  updateProfile: async (data: Partial<import('../types').User>) =>
    request('/user/profile', {
      method: 'PUT',
      body: data,
    }),
};

// ============ 辩论AI生成API ============

export interface DebateGenerateRequest {
  topic: string;
  roleType: string;
  roleName: string;
  soul?: string;
  action?: string;
  actionLabel?: string;
  actionDescription?: string;
  messages?: { role: string; roleName: string; roleType?: string; content: string }[];
  outputDepth?: 'brief' | 'normal' | 'detailed';
  roundNumber?: number;
}

export interface DebateBatchRequest {
  topic: string;
  roles: {
    roleType: string;
    roleName: string;
    soul?: string;
    action?: string;
    actionLabel?: string;
    actionDescription?: string;
  }[];
  messages?: any[];
  outputDepth?: string;
}

export const debateApi = {
  /** 为单个角色生成辩论回复 */
  generateResponse: async (data: DebateGenerateRequest) =>
    request<{ content: string; roleType: string; roleName: string }>('/debate/generate', {
      method: 'POST',
      body: data,
    }),

  /** 批量生成多角色辩论回复 */
  generateBatch: async (data: DebateBatchRequest) =>
    request<{ results: { roleType: string; roleName: string; content: string; success: boolean }[] }>('/debate/generate-batch', {
      method: 'POST',
      body: data,
    }),
};

// ============ 默认导出（更新） ============

export default {
  topic: topicApi,
  conversation: conversationApi,
  message: messageApi,
  soul: soulApi,
  user: userApi,
  debate: debateApi,
};
