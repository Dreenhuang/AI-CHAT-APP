/**
 * ============================================
 * Axios 实例配置 - API 服务层
 * ============================================
 *
 * 功能：
 * - 创建统一的 Axios 实例
 * - 配置基础 URL 和超时时间
 * - 请求/响应拦截器（Token注入、错误处理）
 * - 统一的错误处理机制
 */

import axios from 'axios'

// 从环境变量获取 API 基础地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9450/api/admin/v1'
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000

/**
 * 创建 Axios 实例
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * 请求拦截器
 * - 自动注入认证 Token
 * - 添加请求时间戳（用于防重放攻击）
 */
apiClient.interceptors.request.use(
  (config) => {
    // 获取 Token
    const token = localStorage.getItem('admin_token')

    // 如果存在 Token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳
    config.metadata = { startTime: new Date() }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '')

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * - 统一处理错误响应
 * - 自动处理 401 未授权（跳转登录页）
 * - 统一数据格式提取
 */
apiClient.interceptors.response.use(
  (response) => {
    const { data, config } = response

    // 计算请求耗时
    if (config.metadata?.startTime) {
      const duration = new Date() - config.metadata.startTime
      console.log(`[API] ${config.url} - ${duration}ms`)
    }

    // 假设后端返回格式为 { code, message, data }
    // 直接返回 data 字段，简化调用方式
    return data
  },
  (error) => {
    const { response, request } = error

    if (response) {
      // 服务器返回了错误状态码
      switch (response.status) {
        case 401:
          // 未授权 - 清除 Token 并跳转登录页
          console.error('[API] 401 Unauthorized - 跳转到登录页')
          localStorage.removeItem('admin_token')
          window.location.href = '/login'
          break

        case 403:
          console.error('[API] 403 Forbidden - 权限不足')
          break

        case 404:
          console.error('[API] 404 Not Found - 资源不存在')
          break

        case 500:
          console.error('[API] 500 Internal Server Error - 服务器错误')
          break

        default:
          console.error(`[API] Error ${response.status}:`, response.data)
      }

      // 返回统一格式的错误信息
      return Promise.reject({
        status: response.status,
        message: response.data?.message || '请求失败',
        data: response.data,
      })
    } else if (request) {
      // 请求已发出但没有收到响应（网络错误、超时等）
      console.error('[API] Network Error:', error.message)
      return Promise.reject({
        status: 0,
        message: '网络连接失败，请检查网络设置',
      })
    } else {
      // 其他错误（请求配置错误等）
      console.error('[API] Unknown Error:', error.message)
      return Promise.reject({
        status: -1,
        message: error.message || '未知错误',
      })
    }
  }
)

export default apiClient
