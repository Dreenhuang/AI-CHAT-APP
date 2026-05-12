/**
 * 工具函数集合 - Utils
 * 
 * 包含日期格式化、ID生成、数据验证等通用工具
 */

// ============ 日期时间工具 ============

/**
 * 格式化时间为相对时间（如：3分钟前、2小时前）
 */
export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  
  // 超过30天显示具体日期
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  if (year === now.getFullYear()) {
    return `${month}月${day}日`;
  }
  
  return `${year}年${month}月${day}日`;
};

/**
 * 格式化为完整日期时间
 */
export const formatDateTime = (dateStr: string, showTime: boolean = true): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let result = `${year}-${month}-${day}`;
  
  if (showTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }
  
  return result;
};

// ============ ID生成工具 ============

/**
 * 生成唯一ID
 */
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// ============ 字符串工具 ============

/**
 * 截断文本，超出部分用省略号代替
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * 高亮搜索关键词
 */
export const highlightKeyword = (
  text: string, 
  keyword: string,
  highlightColor: string = '#AFDD22'
): Array<{ text: string; highlight?: boolean }> => {
  if (!keyword.trim()) return [{ text }];
  
  const parts: Array<{ text: string; highlight?: boolean }> = [];
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    parts.push({ text: match[0], highlight: true });
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }
  
  return parts;
};

/** 转义正则特殊字符 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ============ 数据验证工具 ============

/**
 * 验证是否为有效的邮箱地址
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证是否为有效的手机号（中国大陆）
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// ============ 数组工具 ============

/**
 * 数组去重
 */
export const uniqueArray = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) return [...new Set(array)];
  
  const seen = new Set();
  return array.filter(item => {
    const keyValue = item[key];
    if (seen.has(keyValue)) return false;
    seen.add(keyValue);
    return true;
  });
};

/**
 * 数组分块（用于分页等场景）
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ============ 数字工具 ============

/**
 * 格式化数字（添加千位分隔符）
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============ 颜色工具 ============

/**
 * 将十六进制颜色转换为RGBA
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * 判断颜色是深色还是浅色（用于决定文字颜色）
 */
export const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};
