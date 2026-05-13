/**
 * 用户管理 API 服务层 (User Service)
 *
 * 功能说明：
 * 封装用户管理的所有API调用，作为前端和后端之间的桥梁
 *
 * 核心职责：
 * 1. HTTP请求封装（GET/POST/PUT/DELETE）
 * 2. 请求/响应数据转换
 * 3. 错误处理和统一格式
 * 4. Loading状态管理
 *
 * 设计模式：
 * - 服务层模式 (Service Layer Pattern)
 * - Promise-based异步操作
 * - Axios拦截器统一处理
 *
 * @module userService
 */

// ============================================
// 基础配置
// ============================================

/**
 * API基础配置
 */
const API_BASE_URL = 'http://localhost:9473/api'; // 后端服务地址（根据实际端口调整）

/**
 * 模拟延迟（开发环境使用，生产环境删除）
 */
const SIMULATED_DELAY = 300; // ms

/**
 * 通用请求函数
 *
 * @param {string} url - API端点
 * @param {Object} options - fetch选项
 * @returns {Promise<Object>} 响应数据
 */
async function request(url, options = {}) {
  try {
    // 开发环境模拟网络延迟
    if (__DEV__) {
      await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // 检查HTTP状态码
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
      };
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[UserService] API请求失败:', error);

    // 网络错误处理
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw {
        success: false,
        error: '网络连接失败，请检查网络设置',
        code: 'NETWORK_ERROR',
      };
    }

    throw error;
  }
}

// ============================================
// 用户管理 API 接口
// ============================================

export const userApi = {
  /**
   * 获取用户列表（分页查询）
   *
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（默认1）
   * @param {number} params.pageSize - 每页数量（默认10）
   * @param {string} params.search - 搜索关键词
   * @param {string} params.role - 角色筛选
   * @param {string} params.status - 状态筛选
   * @param {string} params.sortBy - 排序字段
   * @param {string} params.order - 排序方向
   * @returns {Promise<{users: Array, pagination: Object}>}
   */
  getList: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...(params.search && { search: params.search }),
      ...(params.role && params.role !== 'all' && { role: params.role }),
      ...(params.status && params.status !== 'all' && { status: params.status }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.order && { order: params.order }),
    }).toString();

    return request(`/users?${queryParams}`);
  },

  /**
   * 获取用户详情
   *
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户详情对象
   */
  getById: async (userId) => {
    return request(`/users/${userId}`);
  },

  /**
   * 创建用户
   *
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建结果
   */
  create: async (userData) => {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * 更新用户信息
   *
   * @param {string} userId - 用户ID
   * @param {Object} userData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  update: async (userId, userData) => {
    return request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * 删除用户
   *
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 删除结果
   */
  delete: async (userId) => {
    return request(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * 批量更新用户
   *
   * @param {Array<string>} ids - 用户ID数组
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 批量操作结果
   */
  batchUpdate: async (ids, data) => {
    return request('/users/batch', {
      method: 'PUT',
      body: JSON.stringify({ ids, ...data }),
    });
  },

  /**
   * 重置用户密码
   *
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 操作结果
   */
  resetPassword: async (userId) => {
    return request(`/users/${userId}/reset-password`, {
      method: 'POST',
    });
  },

  /**
   * 更新用户状态（启用/禁用）
   *
   * @param {string} userId - 用户ID
   * @param {string} status - 目标状态 ('active' | 'disabled')
   * @param {string} reason - 操作原因
   * @returns {Promise<Object>} 操作结果
   */
  updateStatus: async (userId, status, reason = '') => {
    return request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  /**
   * 搜索用户（实时联想）
   *
   * @param {string} query - 搜索关键词
   * @param {number} limit - 最大返回数量
   * @returns {Promise<Array>} 搜索结果数组
   */
  search: async (query, limit = 10) => {
    const queryParams = new URLSearchParams({ q: query, limit }).toString();
    return request(`/users/search?${queryParams}`);
  },
};

// ============================================
// 默认导出
// ============================================

export default userApi;
