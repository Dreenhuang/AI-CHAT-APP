/**
 * 用户管理模块 - 数据类型定义 (Type Definitions)
 *
 * 功能说明：
 * 定义用户管理模块中使用的所有数据接口和枚举类型
 * 这些类型会被控制器、服务层、路由层共同引用
 *
 * 设计原则：
 * 1. 类型集中管理，避免重复定义
 * 2. 使用JSDoc注释提供完整的字段说明
 * 3. 区分前端展示数据和后端存储数据
 *
 * 使用方式：
 * ```javascript
 * import { UserItem, UserDetail, UserStatus } from '../types/user.js';
 *
 * const user = {
 *   id: 'uuid-xxx',
 *   nickname: '张三',
 *   status: UserStatus.ACTIVE
 * };
 * ```
 */

// ============================================
// 枚举类型定义
// ============================================

/**
 * 用户状态枚举
 *
 * ACTIVE: 正常状态（可以正常使用平台所有功能）
 * DISABLED: 已禁用（管理员手动禁用，无法登录和使用）
 */
export const UserStatus = {
  ACTIVE: 'active',      // 正常活跃
  DISABLED: 'disabled'    // 已被禁用
};

/**
 * 用户角色枚举（针对平台用户，非管理员）
 *
 * USER: 普通注册用户
 * VIP: VIP会员用户（付费用户，拥有额外特权）
 */
export const UserRole = {
  USER: 'user',
  VIP: 'vip'
};

/**
 * 排序字段枚举
 * 定义用户列表支持的排序维度
 */
export const SortByField = {
  CREATED_AT: 'createdAt',        // 按注册时间排序
  LAST_LOGIN_AT: 'lastLoginAt',   // 按最后登录时间排序
  NICKNAME: 'nickname',           // 按昵称排序
  DEBATE_COUNT: 'debateCount'     // 按辩论数量排序
};

/**
 * 排序方向枚举
 */
export const SortOrder = {
  ASC: 'asc',    // 升序（从小到大、从早到晚）
  DESC: 'desc'   // 降序（从大到小、从晚到早）
};

// ============================================
// 核心数据接口
// ============================================

/**
 * 用户列表项接口 (UserItem)
 *
 * 用于用户列表页面的轻量级展示
 * 只包含必要的核心信息，减少网络传输量
 *
 * @interface UserItem
 *
 * 示例：
 * ```json
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "phone": "138****1234",
 *   "nickname": "辩手小王",
 *   "avatar": "https://cdn.example.com/avatars/001.png",
 *   "status": "active",
 *   "role": "user",
 *   "createdAt": "2026-01-15T08:30:00.000Z",
 *   "lastLoginAt": "2026-05-13T09:20:00.000Z",
 *   "debateCount": 25,
 *   "messageCount": 342,
 *   "groupCount": 5
 * }
 * ```
 */
export const UserItemInterface = {
  id: '',                    // 用户唯一标识（UUID格式）
  phone: '',                 // 手机号（脱敏显示，如 138****1234）
  nickname: '',              // 用户昵称（必填）
  avatar: '',                // 头像URL（可选）
  status: '',                // 用户状态：active | disabled
  role: '',                  // 用户角色：user | vip
  createdAt: '',             // 注册时间（ISO 8601格式）
  lastLoginAt: '',           // 最后登录时间（可为null，表示从未登录）
  debateCount: 0,            // 参与的辩论总数
  messageCount: 0,           // 发送的消息总数
  groupCount: 0              // 加入的群组数
};

/**
 * 用户详情接口 (UserDetail)
 *
 * 继承UserItem的所有字段，并扩展更多详细信息
 * 用于用户详情页面，展示完整用户画像
 *
 * @interface UserDetail
 *
 * 扩展字段说明：
 * - recentActivity: 最近5条活跃记录（消息/辩论）
 * - deviceInfo: 设备信息（登录IP、User-Agent等）
 * - riskMarks: 风险标记（举报记录、违规历史等）
 */
export const UserDetailInterface = {
  // ===== 基础信息（继承自UserItem）=====
  id: '',
  phone: '',
  nickname: '',
  avatar: '',
  status: '',
  role: '',
  createdAt: '',
  lastLoginAt: '',
  debateCount: 0,
  messageCount: 0,
  groupCount: 0,

  // ===== 扩展信息（仅详情接口返回）=====

  /**
   * 邮箱地址（脱敏显示）
   * 格式：xx***@xx.com
   */
  email: '',

  /**
   * 性别
   * 可选值：male / female / unknown
   */
  gender: '',

  /**
   * 个人简介/签名
   */
  bio: '',

  /**
   * 最近活跃记录（最多5条）
   * 包含最近发送的消息和参与的辩论
   *
   * 结构示例：
   * [
   *   {
   *     type: 'message',          // 消息类型
   *     content: '我觉得这个观点...', // 内容摘要（最多50字）
   *     targetId: 'debate_xxx',   // 关联的辩论ID
   *     timestamp: '2026-05-13T...'
   *   },
   *   {
   *     type: 'debate',
   *     content: '参与了"AI是否会取代人类"辩论',
   *     targetId: 'debate_yyy',
   *     timestamp: '2026-05-12T...'
   *   }
   * ]
   */
  recentActivity: [],

  /**
   * 设备信息列表（最近的登录设备）
   *
   * 结构示例：
   * [
   *   {
   *     ip: '113.88.12.45',                    // 登录IP地址
   *     userAgent: 'Mozilla/5.0 ...',          // 浏览器UA字符串
   *     deviceType: 'mobile',                  // 设备类型：mobile/tablet/desktop
   *     location: '广东省广州市',               // IP地理位置（可选）
   *     loginTime: '2026-05-13T09:20:00.000Z', // 登录时间
   *     isActive: true                         // 是否为当前活跃会话
   *   }
   * ]
   */
  deviceInfo: [],

  /**
   * 风险标记信息
   *
   * 结构示例：
   * {
   *   isReported: false,            // 是否被举报
   *   reportCount: 0,               // 被举报次数
   *   hasViolation: false,          // 是否有违规记录
   *   violationCount: 0,            // 违规次数
   *   lastViolationReason: null,    // 最近一次违规原因
   *   lastViolationTime: null       // 最近一次违规时间
   * }
   */
  riskMarks: {}
};

// ============================================
// API请求/响应接口
// ============================================

/**
 * 用户列表查询参数接口
 *
 * GET /api/admin/v1/users 的查询参数
 */
export const UserListQueryParams = {
  page: 1,                    // 页码（默认1，从1开始）
  pageSize: 20,               // 每页数量（默认20，最大100）
  search: '',                 // 搜索关键词（手机号/昵称模糊搜索）
  status: '',                 // 状态筛选：active/disabled/all（默认all）
  sortBy: 'createdAt',        // 排序字段
  order: 'desc'               // 排序方向
};

/**
 * 用户列表响应接口
 *
 * 成功响应结构：
 * {
 *   success: true,
 *   data: {
 *     users: [...],           // 用户数组
 *     pagination: {...}       // 分页信息
 *   },
 *   permissions: {...}        // 当前用户的权限标识
 * }
 */
export const UserListResponse = {
  success: true,
  data: {
    users: [],                // UserItem 数组
    pagination: {
      total: 0,               // 总记录数
      page: 1,                // 当前页码
      pageSize: 20,           // 每页数量
      totalPages: 0           // 总页数
    }
  },
  permissions: {
    can_edit: false,          // 是否有编辑权限
    can_delete: false,        // 是否有删除权限
    can_export: false         // 是否有导出权限
  }
};

/**
 * 修改用户状态请求体接口
 *
 * PATCH /api/admin/v1/users/:id/status
 */
export const UpdateStatusRequestBody = {
  status: 'disabled',         // 目标状态：disabled 或 active
  reason: ''                  // 原因说明（必填，最少5个字符）
};

/**
 * 修改用户状态响应接口
 *
 * 成功响应包含操作影响范围和前端同步指令
 */
export const UpdateStatusResponse = {
  success: true,
  message: '用户已成功禁用',
  data: {
    userId: '',               // 被操作的用户ID
    previousStatus: '',       // 操作前的状态
    newStatus: '',            // 操作后的新状态
    reason: '',               // 操作原因
    operatedBy: '',           // 操作人
    operatedAt: '',           // 操作时间

    /**
     * 影响范围统计
     */
    impact: {
      sessionsTerminated: 0,  // 被踢出的在线会话数
      debatesInterrupted: 0, // 被打断的进行中辩论数
      messagesBlocked: 0     // 被拦截的待发送消息数
    },

    /**
     * 前端同步指令
     * 告诉前端需要执行的同步操作
     */
    frontend_sync: {
      invalidateCache: true,  // 是否清除该用户的缓存
      pushNotification: true, // 是否推送通知给用户
      websocketBroadcast: {   // WebSocket广播配置
        event: 'user_status_changed',  // 事件名称
        payload: {}                   // 广播数据
      }
    }
  }
};

/**
 * 用户搜索结果项接口（轻量级）
 *
 * 用于搜索联想功能，只返回最基本信息
 * 响应时间要求 < 200ms
 */
export const UserSearchResultItem = {
  id: '',          // 用户ID
  nickname: '',    // 昵称
  phone: '',       // 手机号（脱敏）
  avatar: ''       // 头像URL
};

// ============================================
// 错误码定义
// ============================================

/**
 * 用户模块专用错误码
 *
 * 遵循HTTP标准状态码 + 业务错误类型
 */
export const UserErrorCodes = {
  // 参数错误 (400)
  INVALID_STATUS_VALUE: {
    code: 400,
    errorType: 'INVALID_STATUS_VALUE',
    message: '无效的状态值，只支持 active 或 disabled'
  },
  REASON_REQUIRED: {
    code: 400,
    errorType: 'REASON_REQUIRED',
    message: '操作原因不能为空，且至少需要5个字符'
  },
  REASON_TOO_SHORT: {
    code: 400,
    errorType: 'REASON_TOO_SHORT',
    message: '操作原因太短，请详细描述禁用/启用原因（至少5个字符）'
  },
  INVALID_PAGE_PARAMS: {
    code: 400,
    errorType: 'INVALID_PAGE_PARAMS',
    message: '分页参数无效，page必须>=1，pageSize范围1-100'
  },

  // 认证错误 (401)
  UNAUTHORIZED: {
    code: 401,
    errorType: 'UNAUTHORIZED',
    message: '未授权访问，请先登录'
  },

  // 权限错误 (403)
  FORBIDDEN_DISABLE_SELF: {
    code: 403,
    errorType: 'FORBIDDEN_DISABLE_SELF',
    message: '不能禁用您自己的账户'
  },
  INSUFFICIENT_PERMISSION: {
    code: 403,
    errorType: 'INSUFFICIENT_PERMISSION',
    message: '权限不足，您无权执行此操作'
  },
  BATCH_LIMIT_EXCEEDED: {
    code: 403,
    errorType: 'BATCH_LIMIT_EXCEEDED',
    message: '批量操作限制：一次最多禁用50个用户'
  },

  // 资源不存在 (404)
  USER_NOT_FOUND: {
    code: 404,
    errorType: 'USER_NOT_FOUND',
    message: '用户不存在或已被删除'
  },

  // 服务器错误 (500)
  INTERNAL_ERROR: {
    code: 500,
    errorType: 'INTERNAL_ERROR',
    message: '服务器内部错误，请稍后重试'
  }
};

// ============================================
// 辅助工具函数
// ============================================

/**
 * 手机号脱敏处理
 *
 * 将完整手机号转换为部分隐藏的格式
 * 例如：13812345678 -> 138****5678
 *
 * @param {string} fullPhone - 完整手机号
 * @returns {string} 脱敏后的手机号
 *
 * @example
 * maskPhone('13812345678')  // 返回 '138****5678'
 * maskPhone(null)           // 返回 null
 * maskPhone('')             // 返回 ''
 */
export function maskPhone(fullPhone) {
  if (!fullPhone || typeof fullPhone !== 'string') {
    return fullPhone;
  }

  // 确保是11位手机号
  if (fullPhone.length !== 11) {
    return fullPhone;  // 不是标准手机号，原样返回
  }

  return fullPhone.substring(0, 3) + '****' + fullPhone.substring(7);
}

/**
 * 邮箱脱敏处理
 *
 * 将邮箱地址转换为部分隐藏的格式
 * 例如：user@example.com -> us***@example.com
 *
 * @param {string} email - 完整邮箱地址
 * @returns {string} 脱敏后的邮箱
 *
 * @example
 * maskEmail('admin@example.com')  // 返回 'ad***@example.com'
 * maskEmail(null)                // 返回 null
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') {
    return email;
  }

  const [localPart, domain] = email.split('@');

  if (!domain) {
    return email;  // 无效邮箱格式
  }

  // 保留前2个字符，其余用***替换
  const maskedLocal = localPart.length > 2
    ? localPart.substring(0, 2) + '***'
    : localPart;

  return maskedLocal + '@' + domain;
}

// 默认导出所有类型和工具函数
export default {
  // 枚举
  UserStatus,
  UserRole,
  SortByField,
  SortOrder,

  // 接口定义
  UserItemInterface,
  UserDetailInterface,
  UserListQueryParams,
  UserListResponse,
  UpdateStatusRequestBody,
  UpdateStatusResponse,
  UserSearchResultItem,

  // 错误码
  UserErrorCodes,

  // 工具函数
  maskPhone,
  maskEmail
};
