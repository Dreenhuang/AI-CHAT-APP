/**
 * 用户类型定义
 * 管理后台用户信息结构
 */
export interface AdminUser {
  /** 管理员ID */
  admin_id: number;
  /** 用户名 */
  username: string;
  /** 角色 */
  role: 'super_admin' | 'admin' | 'observer';
  /** 昵称/显示名 */
  nickname: string;
  /** 邮箱（脱敏） */
  email?: string;
  /** 头像URL */
  avatar?: string | null;
  /** 权限列表 */
  permissions?: string[];
  /** 最后登录时间 */
  last_login_at?: string;
  /** 登录次数 */
  login_count?: number;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn: string;
  user: AdminUser;
}

/**
 * API通用响应结构
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
  errorType?: string;
}

/**
 * 认证状态类型
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
