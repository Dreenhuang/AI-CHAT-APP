/**
 * ============================================
 * 工具函数库 - Utils
 * ============================================
 *
 * 提供通用的辅助函数，包括：
 * - 日期格式化
 * - 数据格式化（数字、货币等）
 * - 字符串处理
 * - 本地存储操作
 * - 验证函数
 */

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期对象或时间戳
 * @param {string} format - 格式类型：'full' | 'date' | 'time' | 'relative'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'full') {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    return 'Invalid Date'
  }

  switch (format) {
    case 'full':
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

    case 'date':
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

    case 'time':
      return d.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })

    case 'relative':
      return getRelativeTime(d)

    default:
      return d.toISOString()
  }
}

/**
 * 获取相对时间描述
 * @param {Date} date - 日期对象
 * @returns {string} 相对时间描述，如"3分钟前"
 */
function getRelativeTime(date) {
  const now = new Date()
  const diff = now - date // 毫秒差

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`

  return formatDate(date, 'date')
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0'
  }

  return new Intl.NumberFormat('zh-CN').format(num)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小，如 "1.5 MB"
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀（默认为 '...'）
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength).trim() + suffix
}

/**
 * 生成随机 ID
 * @param {number} length - ID 长度（默认8）
 * @returns {string} 随机ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2)
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
  let timer

  return function (...args) {
    clearTimeout(timer)

    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的新对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }

  const clonedObj = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }

  return clonedObj
}

/**
 * 本地存储操作
 */
export const storage = {
  /**
   * 设置本地存储
   * @param {string} key - 键名
   * @param {*} value - 值
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('[Storage] Set error:', error)
    }
  },

  /**
   * 获取本地存储
   * @param {string} key - 键名
   * @param {*} defaultValue - 默认值（当键不存在时返回）
   * @returns {*} 存储的值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('[Storage] Get error:', error)
      return defaultValue
    }
  },

  /**
   * 删除本地存储
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('[Storage] Remove error:', error)
    }
  },

  /**
   * 清空所有本地存储
   */
  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('[Storage] Clear error:', error)
    }
  },
}
