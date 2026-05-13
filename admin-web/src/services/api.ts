/**
 * API服务层
 *
 * 功能说明：
 * - Axios实例配置（基础URL、超时时间）
 * - 请求拦截器：自动添加Authorization头
 * - 响应拦截器：统一错误处理、401自动跳转
 * - 认证相关API封装
 */

import axios from 'axios';
import type { ApiResponse, LoginRequest, LoginResponse, AdminUser } from '@/types/auth';

// ============================================
// Axios实例配置
// ============================================

const apiClient = axios.create({
  baseURL: '/api/admin/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// 请求拦截器
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取Token并添加到请求头
    const token = localStorage.getItem('prd_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] 请求错误:', error);
    return Promise.reject(error);
  },
);

// ============================================
// 响应拦截器
// ============================================

apiClient.interceptors.response.use(
  (response) => {
    // 成功响应：直接返回data
    const data = response.data as ApiResponse;

    if (data.success === false) {
      // 业务逻辑错误
      console.error('[API] 业务错误:', data.message, data.errorType);
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    return response;
  },
  (error) => {
    // HTTP错误处理
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权：Token过期或无效
          console.error('[API] 401 未授权，需要重新登录');
          localStorage.removeItem('prd_admin_token');
          localStorage.removeItem('prd_admin_user');
          // 不在这里跳转，让组件自行处理
          break;

        case 403:
          console.error('[API] 403 无权限访问');
          break;

        case 404:
          console.error('[API] 404 资源不存在');
          break;

        case 500:
          console.error('[API] 500 服务器内部错误');
          break;

        default:
          console.error(`[API] HTTP错误 ${status}:`, data?.message || error.message);
      }

      // 返回业务错误信息
      const errorMessage = data?.message || `请求失败 (${status})`;
      const enhancedError = new Error(errorMessage);
      (enhancedError as unknown as Record<string, unknown>).status = status;
      return Promise.reject(enhancedError);
    }

    if (error.request) {
      // 请求已发出但没有响应（网络错误）
      console.error('[API] 网络错误，无法连接服务器');
      return Promise.reject(new Error('网络连接失败，请检查网络设置'));
    }

    // 其他错误
    console.error('[API] 未知错误:', error.message);
    return Promise.reject(error);
  },
);

// ============================================
// 认证相关API
// ============================================

export const authApi = {
  /**
   * 管理员登录
   *
   * POST /api/admin/v1/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  /**
   * 管理员登出
   *
   * POST /api/admin/v1/auth/logout
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * 获取当前用户信息
   *
   * GET /api/admin/v1/auth/profile
   */
  async getProfile(): Promise<AdminUser> {
    const response = await apiClient.get<ApiResponse<AdminUser>>('/auth/profile');
    return response.data.data!;
  },

  /**
   * 修改密码
   *
   * PUT /api/admin/v1/auth/password
   */
  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.put('/auth/password', data);
  },
};

// ============================================
// 导出默认实例（供其他模块使用）
// ============================================

export default apiClient;
