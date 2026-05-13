/**
 * 审计日志 API 服务
 * 
 * 提供审计日志的增删改查、导出等接口
 */

import request from '../../services/api';
import {
  AuditLogEntry,
  AuditLogFilters,
  PaginatedAuditLogs,
  ExportOptions,
} from './types';

// ============ 模拟数据生成 ============

const OPERATORS = [
  { id: 'op1', username: 'admin', displayName: '系统管理员', role: '超级管理员', email: 'admin@prd-debate.com' },
  { id: 'op2', username: 'zhangsan', displayName: '张三', role: '内容管理员', email: 'zhangsan@prd-debate.com' },
  { id: 'op3', username: 'lisi', displayName: '李四', role: '用户管理员', email: 'lisi@prd-debate.com' },
  { id: 'op4', username: 'wangwu', displayName: '王五', role: '审核员', email: 'wangwu@prd-debate.com' },
  { id: 'op6', username: 'zhaoliu', displayName: '赵六', role: '普通管理员', email: 'zhaoliu@prd-debate.com' },
];

const ACTION_TYPES: Array<'login' | 'logout' | 'create' | 'update' | 'delete' | 'export' | 'view'> = [
  'login', 'logout', 'create', 'update', 'delete', 'export', 'view'
];

const TARGET_TYPES: Array<'user' | 'topic' | 'comment' | 'config' | 'role' | 'system' | 'session' | 'soul'> = [
  'user', 'topic', 'comment', 'config', 'role', 'system', 'session', 'soul'
];

const TARGET_NAMES: Record<string, string[]> = {
  user: ['张三', '李四', '王五', '赵六', '钱七', '孙八'],
  topic: ['如何提高产品经理的需求分析能力?', 'AI时代的产品设计趋势', '用户体验优化方法论', '敏捷开发实战指南', '数据驱动决策实践'],
  comment: ['这个观点很有见地', '我同意你的看法', '需要进一步讨论', '补充一点想法'],
  config: ['系统邮件配置', '安全策略设置', '通知模板更新'],
  role: ['管理员角色', '编辑角色', '查看者角色'],
  system: ['系统备份', '缓存清理', '日志归档'],
  session: ['辩论会话 #1234', '讨论组 #5678'],
  soul: ['理性分析师', '创意发散者', '批判性思考者'],
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Mobile/15E148',
];

const IP_ADDRESSES = [
  '192.168.1.100', '192.168.1.101', '10.0.0.55', '172.16.0.23',
  '120.235.156.78', '183.14.132.65', '211.97.88.42',
];

/**
 * 生成随机时间戳（最近30天内）
 */
function generateRecentTimestamp(): string {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
  return new Date(randomTime).toISOString();
}

/**
 * 生成模拟日志条目
 */
function generateMockLogEntry(index: number): AuditLogEntry {
  const actionType = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
  const targetType = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];
  const operator = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
  const targetNames = TARGET_NAMES[targetType];
  const targetName = targetNames[Math.floor(Math.random() * targetNames.length)];
  const result = Math.random() > 0.1 ? 'success' : 'failure';
  
  return {
    id: `audit_${String(index).padStart(6, '0')}`,
    timestamp: generateRecentTimestamp(),
    operator,
    actionType,
    actionDescription: `${getActionDescription(actionType)}${targetName}`,
    targetType,
    targetId: `${targetType}_${Math.floor(Math.random()  1000)}`,
    targetName,
    result,
    duration: result === 'success' ? Math.floor(Math.random() * 500) + 20 : undefined,
    ipAddress: IP_ADDRESSES[Math.floor(Math.random() * IP_ADDRESSES.length)],
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    changes: (actionType === 'update' || actionType === 'create') ? generateMockChanges() : undefined,
    errorMessage: result === 'failure' ? getRandomError() : undefined,
  };
}

function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    login: '用户登录系统',
    logout: '用户退出登录',
    create: '创建',
    update: '更新',
    delete: '删除',
    export: '导出',
    import: '导入',
    view: '查看',
    approve: '审批通过',
    reject: '审批拒绝',
    other: '执行操作',
  };
  return descriptions[action] || '执行操作';
}

function generateMockChanges(): Array<{ field: string; oldValue: any; newValue: any }> {
  const changeCount = Math.floor(Math.random() * 3) + 1;
  const fields = ['status', 'role', 'name', 'email', 'permissions'];
  const changes = [];
  
  for (let i = 0; i < changeCount; i++) {
    const field = fields[Math.floor(Math.random() * fields.length)];
    changes.push({
      field,
      oldValue: `old_value_${Math.floor(Math.random() * 100)}`,
      newValue: `new_value_${Math.floor(Math.random() * 100)}`,
    });
  }
  
  return changes;
}

function getRandomError(): string {
  const errors = [
    '权限不足，无法执行该操作',
    '目标资源不存在或已被删除',
    '参数验证失败',
    '网络连接超时',
    '服务器内部错误',
    '并发冲突，请重试',
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}

// 生成所有模拟数据
const MOCK_LOG_ENTRIES: AuditLogEntry[] = Array.from({ length: 2345 }, (_, i) => generateMockLogEntry(i))
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// ============ API 接口定义 ============

export const auditLogApi = {
  /**
   * 获取审计日志列表（分页）
   */
  getList: async (params: { page?: number; pageSize?: number } & Partial<AuditLogFilters> = {}): Promise<PaginatedAuditLogs> => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    const { page = 1, pageSize = 20, ...filters } = params;
    
    let filteredEntries = [...MOCK_LOG_ENTRIES];
    
    // 应用筛选条件
    if (filters.operatorId && filters.operatorId !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.operator.id === filters.operatorId);
    }
    if (filters.actionType && filters.actionType !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.actionType === filters.actionType);
    }
    if (filters.targetType && filters.targetType !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.targetType === filters.targetType);
    }
    if (filters.result && filters.result !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.result === filters.result);
    }
    if (filters.startDate) {
      filteredEntries = filteredEntries.filter(e => new Date(e.timestamp) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      filteredEntries = filteredEntries.filter(e => new Date(e.timestamp) <= new Date(filters.endDate!));
    }
    if (filters.ipAddress) {
      filteredEntries = filteredEntries.filter(e => e.ipAddress.includes(filters.ipAddress!));
    }
    if (filters.requestId) {
      filteredEntries = filteredEntries.filter(e => e.requestId.includes(filters.requestId!));
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filteredEntries = filteredEntries.filter(e =>
        e.targetName.toLowerCase().includes(keyword) ||
        e.actionDescription.toLowerCase().includes(keyword) ||
        e.operator.displayName.toLowerCase().includes(keyword)
      );
    }
    
    const total = filteredEntries.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = filteredEntries.slice(startIndex, startIndex + pageSize);
    
    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * 获取单条日志详情
   */
  getById: async (id: string): Promise<AuditLogEntry | null> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const entry = MOCK_LOG_ENTRIES.find(e => e.id === id);
    return entry || null;
  },

  /**
   * 导出审计日志
   */
  export: async (options: ExportOptions): Promise<Blob> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { filters } = options;
    const result = await auditLogApi.getList({ page: 1, pageSize: 10000, ...filters });
    
    // 简单模拟：返回文本Blob
    const csvContent = convertToCSV(result.items, options.fields);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },

  /**
   * 获取操作人列表
   */
  getOperators: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return OPERATORS;
  },
};

// ============ 工具函数 ============

function convertToCSV(entries: AuditLogEntry[], fields: string[]): string {
  const header = fields.join(',');
  const rows = entries.map(entry => 
    fields.map(field => {
      const value = getNestedValue(entry, field);
      return `"${String(value || '').replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// ============ 时间格式化工具 ============

/**
 * 格式化为相对时间
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
  
  return date.toLocaleDateString('zh-CN');
}

/**
 * 格式化为完整时间
 */
export function formatFullTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
}

export default auditLogApi;
