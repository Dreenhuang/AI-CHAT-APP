/**
 * 审计日志类型定义
 * 
 * Apple Design Style - 管理后台审计日志系统
 */

// ============ 操作类型枚举 ============

export type AuditActionType = 
  | 'login'       // 登录
  | 'logout'      // 登出
  | 'create'      // 创建
  | 'update'      // 更新
  | 'delete'      // 删除
  | 'export'      // 导出
  | 'import'      // 导入
  | 'view'        // 查看
  | 'approve'     // 审批
  | 'reject'      // 拒绝
  | 'other';      // 其他

// ============ 目标类型枚举 ============

export type TargetType = 
  | 'user'        // 用户
  | 'topic'       // 议题
  | 'comment'     // 评论
  | 'config'      // 系统配置
  | 'role'        // 角色
  | 'system'      // 系统
  | 'session'     // 会话
  | 'soul';       // Soul

// ============ 操作结果枚举 ============

export type AuditResult = 'success' | 'failure' | 'pending';

// ============ 操作人信息 ============

export interface AuditOperator {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: string;
  email?: string;
}

// ============ 数据变更记录 ============

export interface DataChange {
  field: string;
  oldValue: any;
  newValue: any;
}

// ============ 审计日志条目 ============

export interface AuditLogEntry {
  /** 日志唯一ID */
  id: string;
  
  /** 操作时间（精确到毫秒） */
  timestamp: string;
  
  /** 操作人信息 */
  operator: AuditOperator;
  
  /** 操作类型 */
  actionType: AuditActionType;
  
  /** 操作描述 */
  actionDescription: string;
  
  /** 目标对象类型 */
  targetType: TargetType;
  
  /** 目标对象ID */
  targetId: string;
  
  /** 目标对象名称 */
  targetName: string;
  
  /** 操作结果 */
  result: AuditResult;
  
  /** 操作耗时（毫秒） */
  duration?: number;
  
  /** 客户端IP地址 */
  ipAddress: string;
  
  /** User-Agent */
  userAgent: string;
  
  /** 请求ID（用于追踪） */
  requestId: string;
  
  /** 数据变更详情 */
  changes?: DataChange[];
  
  /** 错误信息（失败时） */
  errorMessage?: string;
  
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

// ============ 筛选参数 ============

export interface AuditLogFilters {
  /** 操作人ID */
  operatorId?: string;
  
  /** 操作类型 */
  actionType?: AuditActionType | 'all';
  
  /** 目标类型 */
  targetType?: TargetType | 'all';
  
  /** 操作结果 */
  result?: AuditResult | 'all';
  
  /** 开始时间 */
  startDate?: string;
  
  /** 结束时间 */
  endDate?: string;
  
  /** IP地址搜索 */
  ipAddress?: string;
  
  /** Request ID搜索 */
  requestId?: string;
  
  /** 关键词搜索 */
  keyword?: string;
}

// ============ 分页参数 ============

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// ============ 分页响应 ============

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ 导出选项 ============

export interface ExportOptions {
  format: 'csv' | 'excel';
  fields: string[];
  filters?: AuditLogFilters;
}

// ============ 操作类型配置映射 ============

export const ACTION_TYPE_CONFIG: Record<AuditActionType, {
  label: string;
  icon: string;
  color: string;
}> = {
  login: { label: '登录', icon: '🔐', color: '#007AFF' },
  logout: { label: '登出', icon: '🚪', color: '#8E8E93' },
  create: { label: '创建', icon: '➕', color: '#34C759' },
  update: { label: '更新', icon: '✏️', color: '#FF9500' },
  delete: { label: '删除', icon: '🗑️', color: '#FF3B30' },
  export: { label: '导出', icon: '📤', color: '#5856D6' },
  import: { label: '导入', icon: '📥', color: '#AF52DE' },
  view: { label: '查看', icon: '👁️', color: '#007AFF' },
  approve: { label: '审批', icon: '✅', color: '#34C759' },
  reject: { label: '拒绝', icon: '❌', color: '#FF3B30' },
  other: { label: '其他', icon: '📋', color: '#8E8E93' },
};

// ============ 目标类型配置映射 ============

export const TARGET_TYPE_CONFIG: Record<TargetType, {
  label: string;
  icon: string;
}> = {
  user: { label: '用户', icon: '👤' },
  topic: { label: '议题', icon: '💬' },
  comment: { label: '评论', icon: '💭' },
  config: { label: '系统配置', icon: '⚙️' },
  role: { label: '角色', icon: '🛡️' },
  system: { label: '系统', icon: '🖥️' },
  session: { label: '会话', icon: '🗨️' },
  soul: { label: 'Soul', icon: '🎭' },
};
