/**
 * 推送管理 API 服务
 *
 * 功能说明：
 * 封装推送管理模块的所有API调用
 *
 * API端点：
 * - GET    /push                    推送活动列表
 * - GET    /push/:id                推送活动详情
 * - POST   /push                    创建推送活动
 * - PUT    /push/:id                编辑推送活动
 * - DELETE /push/:id                删除推送活动
 * - GET    /push/limits/config       获取推送限额
 * - PUT    /push/limits/config       更新推送限额
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PushCampaign {
  id: string;
  title: string;
  content: string;
  sendAt: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushLimits {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const BASE_URL = 'http://localhost:9461/api/admin/v1';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[Push API] 请求失败:', error);
    return { success: false, error: error.message || '网络连接失败' };
  }
}

export const pushApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<{ items: PushCampaign[]; pagination: PaginationInfo }>(`/push${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => request<PushCampaign>(`/push/${id}`),

  create: (data: { title: string; content?: string; sendAt: string; status?: string; category?: string }) =>
    request<PushCampaign>('/push', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<PushCampaign>) =>
    request<PushCampaign>(`/push/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/push/${id}`, { method: 'DELETE' }),

  getLimits: () => request<PushLimits>('/push/limits/config'),

  updateLimits: (limits: PushLimits) =>
    request<PushLimits>('/push/limits/config', { method: 'PUT', body: JSON.stringify(limits) }),
};

export default pushApi;
