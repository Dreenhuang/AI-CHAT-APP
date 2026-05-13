/**
 * 议题管理 - API 服务层
 *
 * 封装所有议题相关的 API 调用
 * 对接 admin-backend 的 RESTful 接口
 */

import {
  TopicItem,
  TopicFormData,
  TopicListResponse,
  TopicQueryParams,
} from '../types';

// ============ 配置 ============

/** API 基础地址 - 指向 admin-backend */
const BASE_URL = '/api/admin/v1';

/** 请求超时时间（毫秒） */
const TIMEOUT = 15000;

// ============ 类型定义 ============

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  params?: Record<string, string | number | undefined>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

// ============ 工具函数 ============

/**
 * 构建带查询参数的 URL
 */
const buildUrl = (endpoint: string, params?: Record<string, unknown>): string => {
  const url = `${BASE_URL}${endpoint}`;
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * 通用请求方法
 */
const request = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', body, params } = config;

  try {
    const url = buildUrl(endpoint, params);

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        code: response.status,
      };
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message,
    };
  } catch (error: unknown) {
    const err = error as Error;

    if (err.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时，请稍后重试',
        code: 408,
      };
    }

    console.error('[TopicService] Request error:', err);
    return {
      success: false,
      error: err.message || '网络连接失败',
    };
  }
};

// ============ API 方法导出 ============

/**
 * 议题 API 服务
 *
 * 提供完整的 CRUD 操作接口
 */
export const topicService = {
  /**
   * 获取议题列表（分页、筛选、排序）
   *
   * GET /topics
   *
   * @param params - 查询参数
   * @returns 分页列表数据
   */
  async getList(params: TopicQueryParams): Promise<ApiResponse<TopicListResponse>> {
    return request<TopicListResponse>('/topics', {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        status: params.status === 'all' ? undefined : params.status,
        type: params.type === 'all' ? undefined : params.type,
        sortBy: params.sortBy,
        order: params.sortOrder,
        hotnessMin: undefined,
      },
    });
  },

  /**
   * 获取议题详情
   *
   * GET /topics/:id
   *
   * @param id - 议题 ID
   * @returns 议题详情
   */
  async getById(id: string): Promise<ApiResponse<TopicItem>> {
    return request<TopicItem>(`/topics/${id}`);
  },

  /**
   * 创建新议题
   *
   * POST /topics
   *
   * @param data - 表单数据
   * @returns 创建后的议题
   */
  async create(data: TopicFormData): Promise<ApiResponse<TopicItem>> {
    return request<TopicItem>('/topics', {
      method: 'POST',
      body: {
        title: data.title,
        description: data.description,
        category: data.type,
        coverImage: data.coverImage instanceof File
          ? undefined // 文件需单独上传
          : data.coverImage,
      },
    });
  },

  /**
   * 更新议题
   *
   * PUT /topics/:id
   *
   * @param id - 议题 ID
   * @param data - 更新数据
   * @returns 更新后的议题
   */
  async update(id: string, data: Partial<TopicFormData>): Promise<ApiResponse<TopicItem>> {
    return request<TopicItem>(`/topics/${id}`, {
      method: 'PUT',
      body: {
        title: data.title,
        description: data.description,
        category: data.type,
        coverImage: data.coverImage instanceof File
          ? undefined
          : data.coverImage,
      },
    });
  },

  /**
   * 删除议题
   *
   * DELETE /topics/:id
   *
   * @param id - 议题 ID
   * @returns 操作结果
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return request<void>(`/topics/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 批量删除议题
   *
   * POST /topics/batch-delete
   *
   * @param ids - 议题 ID 数组
   * @returns 操作结果
   */
  async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return request<void>('/topics/batch-delete', {
      method: 'POST',
      body: { ids },
    });
  },

  /**
   * 修改议题状态
   *
   * PATCH /topics/:id/status
   *
   * @param id - 议题 ID
   * @param status - 目标状态
   * @param reason - 变更原因
   * @returns 操作结果
   */
  async updateStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<ApiResponse<TopicItem>> {
    return request<TopicItem>(`/topics/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    });
  },

  /**
   * 导出议题数据
   *
   * GET /topics/export
   *
   * @param params - 导出筛选条件
   * @returns 文件下载或数据
   */
  async export(params?: Partial<TopicQueryParams>): Promise<ApiResponse<Blob>> {
    const url = buildUrl('/topics/export', params as Record<string, unknown>);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: '导出失败' };
      }
      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: '网络错误' };
    }
  },
};

export default topicService;
