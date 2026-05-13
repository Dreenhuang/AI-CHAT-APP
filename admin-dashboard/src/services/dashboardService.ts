/**
 * Dashboard API 服务层
 *
 * 功能说明：
 * 封装管理员仪表盘相关的所有API调用。
 * 提供统计数据、趋势图表、议题分布、审计日志等数据接口。
 *
 * API端点：
 * - GET /api/admin/v1/dashboard/stats - 核心统计指标
 * - GET /api/admin/v1/dashboard/user-trend - 用户增长趋势
 * - GET /api/admin/v1/dashboard/topic-distribution - 议题类型分布
 * - GET /api/admin/v1/audit-logs - 审计日志列表
 *
 * 基础URL：http://localhost:9461/api/admin/v1 (admin-backend)
 */

// ============ 类型定义 ============

/** API通用响应格式 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  _meta?: Record<string, any>;
}

/** 统计指标数据 */
export interface DashboardStats {
  totalUsers: number;          // 总用户数
  todayNewUsers: number;       // 今日新增用户
  totalTopics: number;         // 总议题数
  activeRate: number;          // 活跃率 (%)
  totalDebates: number;        // 总辩论数
  activeDebates: number;       // 进行中辩论
  totalMessages: number;       // 总消息数
  apiCallCountToday: number;   // 今日API调用量
}

/** 单个指标卡片数据 */
export interface StatCardData {
  title: string;               // 指标名称
  value: string | number;      // 当前值
  change: number;              // 变化百分比（正=增长，负=下降）
  trend: 'up' | 'down';       // 趋势方向
  icon: string;                // 图标名称（Lucide）
  color: string;               // 主题色
}

/** 用户趋势数据点 */
export interface TrendDataPoint {
  date: string;                // 日期
  newUsers: number;            // 新增用户
  activeUsers: number;         // 活跃用户
  retentionRate?: number;      // 留存率（可选）
}

/** 用户趋势响应 */
export interface UserTrendResponse {
  dates: string[];             // 日期数组
  newUsers: number[];          // 每日新增用户
  activeUsers: number[];       // 每日活跃用户
  retentionRate?: number[];    // 留存率数组
}

/** 议题分布数据项 */
export interface TopicDistributionItem {
  name: string;                // 议题类型名称
  value: number;               // 数量
  color: string;               // 颜色
  percentage?: number;         // 百分比（可选）
}

/** 审计日志条目 */
export interface AuditLogEntry {
  id: string;                  // 日志ID
  timestamp: string;           // 操作时间
  adminName: string;           // 操作人
  actionType: string;          // 操作类型
  target: string;              // 目标对象
  result: 'success' | 'failed'; // 操作结果
  details: string;             // 详情描述
}

// ============ 配置常量 ============

/** API基础URL - 指向admin-backend后端 */
const BASE_URL = 'http://localhost:9461/api/admin/v1';

/** 请求超时时间（毫秒） */
const TIMEOUT_MS = 15000;

// ============ 工具函数 ============

/**
 * 通用请求方法
 *
 * @param endpoint - API端点路径（不含BASE_URL）
 * @param options - fetch配置选项
 * @returns Promise<ApiResponse<T>> 标准化的API响应
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    console.error('[Dashboard API] Request failed:', error);

    let errorMessage = '网络连接失败';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '请求超时，请稍后重试';
      } else {
        errorMessage = error.message;
      }
    }

    return { success: false, error: errorMessage };
  }
}

// ============ API接口定义 ============

export const dashboardApi = {
  /**
   * 获取核心统计指标
   *
   * 用途：仪表盘顶部4个关键指标卡片展示
   * 数据：总用户数、今日新增、总议题数、活跃率等
   *
   * @returns Promise<ApiResponse<DashboardStats>>
   *
   * @example
   * const { data } = await dashboardApi.getStats();
   * console.log(data.totalUsers); // 12345
   */
  getStats: (): Promise<ApiResponse<DashboardStats>> =>
    request<DashboardStats>('/dashboard/metrics'),

  /**
   * 获取用户增长趋势数据
   *
   * 用途：绘制面积图/折线图展示用户增长曲线
   * 数据：每日新增用户 vs 活跃用户对比
   *
   * @param params - 查询参数
   * @param params.period - 时间周期 ('7d' | '30d' | '90d')
   * @returns Promise<ApiResponse<UserTrendResponse>>
   *
   * @example
   * // 获取近7天趋势
   * const { data } = await dashboardApi.getUserTrend({ period: '7d' });
   * console.log(data.dates); // ['2026-05-07', ..., '2026-05-13']
   */
  getUserTrend: (params?: { period?: '7d' | '30d' | '90d' }): Promise<ApiResponse<UserTrendResponse>> => {
    const queryString = params?.period ? `?period=${params.period}` : '';
    return request<UserTrendResponse>(`/dashboard/user-trend${queryString}`);
  },

  /**
   * 获取议题类型分布数据
   *
   * 用途：绘制环形图/饼图展示各类型议题占比
   * 数据：各类型议题的数量和百分比
   *
   * @returns Promise<ApiResponse<TopicDistributionItem[]>>
   *
   * @example
   * const { data } = await dashboardApi.getTopicDistribution();
   * // [{ name: '技术讨论', value: 350, color: '#007AFF', percentage: 35 }, ...]
   */
  getTopicDistribution: (): Promise<ApiResponse<TopicDistributionItem[]>> =>
    request<TopicDistributionItem[]>('/dashboard/topic-distribution'),

  /**
   * 获取最近审计日志
   *
   * 用途：显示最近10条管理员操作记录
   * 数据：时间、操作人、操作类型、目标、结果、详情
   *
   * @param limit - 返回条数限制（默认10条）
   * @returns Promise<ApiResponse<AuditLogEntry[]>>
   *
   * @example
   * const { data } = await dashboardApi.getRecentLogs(10);
   * data.forEach(log => {
   *   console.log(`${log.adminName} ${log.actionType} -> ${log.result}`);
   * });
   */
  getRecentLogs: (limit: number = 10): Promise<ApiResponse<AuditLogEntry[]>> =>
    request<AuditLogEntry[]>(`/audit-logs?limit=${limit}`),
};

// ============ Mock数据（用于开发和演示） ============

/**
 * 生成模拟的统计数据
 * 当后端不可用时，使用此数据进行演示
 */
export const mockStats: DashboardStats = {
  totalUsers: 12345,
  todayNewUsers: 156,
  totalTopics: 1234,
  activeRate: 78.5,
  totalDebates: 5678,
  activeDebates: 123,
  totalMessages: 89012,
  apiCallCountToday: 3456,
};

/**
 * 生成模拟的用户趋势数据（近7天）
 */
export const mockUserTrend: UserTrendResponse = {
  dates: ['05-07', '05-08', '05-09', '05-10', '05-11', '05-12', '05-13'],
  newUsers: [120, 145, 132, 168, 156, 189, 178],
  activeUsers: [890, 920, 895, 1020, 980, 1050, 1100],
  retentionRate: [65.2, 67.8, 66.5, 69.2, 68.0, 70.5, 72.1],
};

/**
 * 生成模拟的议题分布数据
 */
export const mockTopicDistribution: TopicDistributionItem[] = [
  { name: '技术讨论', value: 350, color: '#007AFF', percentage: 35 },
  { name: '产品设计', value: 250, color: '#34C759', percentage: 25 },
  { name: '市场策略', value: 180, color: '#FF9500', percentage: 18 },
  { name: '用户体验', value: 120, color: '#AF52DE', percentage: 12 },
  { name: '其他', value: 100, color: '#8E8E93', percentage: 10 },
];

/**
 * 生成模拟的审计日志数据（最近10条）
 */
export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2026-05-13 14:32:15',
    adminName: '张三',
    actionType: '创建议题',
    target: 'AI技术发展趋势',
    result: 'success',
    details: '成功创建新议题并设置标签',
  },
  {
    id: '2',
    timestamp: '2026-05-13 14:28:42',
    adminName: '李四',
    actionType: '编辑用户',
    target: 'user_001234',
    result: 'success',
    details: '更新用户权限设置',
  },
  {
    id: '3',
    timestamp: '2026-05-13 14:15:08',
    adminName: '王五',
    actionType: '删除辩论',
    target: 'debate_56789',
    result: 'failed',
    details: '辩论进行中，无法删除',
  },
  {
    id: '4',
    timestamp: '2026-05-13 13:58:33',
    adminName: '张三',
    actionType: '导出报告',
    target: '月度运营报告',
    result: 'success',
    details: '成功导出PDF格式报告（2.3MB）',
  },
  {
    id: '5',
    timestamp: '2026-05-13 13:45:21',
    adminName: '赵六',
    actionType: '修改配置',
    target: '系统参数',
    result: 'success',
    details: '更新API速率限制为1000次/分钟',
  },
  {
    id: '6',
    timestamp: '2026-05-13 13:30:55',
    adminName: '李四',
    actionType: '添加管理员',
    target: 'admin_new_001',
    result: 'success',
    details: '新管理员账号已创建并发送通知邮件',
  },
  {
    id: '7',
    timestamp: '2026-05-13 13:22:18',
    adminName: '王五',
    actionType: '禁用用户',
    target: 'user_009876',
    result: 'success',
    details: '因违规行为临时禁用账户7天',
  },
  {
    id: '8',
    timestamp: '2026-05-13 13:15:44',
    adminName: '张三',
    actionType: '备份数据',
    target: '数据库完整备份',
    result: 'success',
    details: '自动备份完成，大小1.2GB，已上传至云存储',
  },
  {
    id: '9',
    timestamp: '2026-05-13 12:58:09',
    adminName: '赵六',
    actionType: '审核内容',
    target: 'comment_34567',
    result: 'failed',
    details: '内容包含敏感信息，已标记待人工复审',
  },
  {
    id: '10',
    timestamp: '2026-05-13 12:45:37',
    adminName: '李四',
    actionType: '查看日志',
    target: '系统访问日志',
    result: 'success',
    details: '查询最近24小时的登录记录',
  },
];

export default dashboardApi;
