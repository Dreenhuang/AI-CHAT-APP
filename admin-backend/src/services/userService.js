/**
 * 用户管理服务层 (User Service)
 *
 * 功能说明：
 * 封装用户管理的所有业务逻辑，作为控制器和数据库之间的中间层
 *
 * 核心职责：
 * 1. 数据查询与过滤（列表、详情、搜索）
 * 2. 业务规则验证（状态修改、权限检查）
 * 3. 数据脱敏处理（手机号、邮箱）
 * 4. 审计日志记录
 * 5. 统计数据计算
 *
 * 设计模式：
 * - 服务层模式 (Service Layer Pattern)
 * - 将业务逻辑从控制器中分离出来
 * - 便于单元测试和维护
 *
 * 当前状态：
 * 使用模拟数据（内存数组）
 * 生产环境应替换为 Prisma ORM 查询 Supabase/PostgreSQL
 *
 * @module userService
 */

import {
  UserStatus,
  UserRole,
  SortByField,
  SortOrder,
  maskPhone,
  maskEmail,
  UserErrorCodes
} from '../types/user.js';

// ============================================
// 模拟数据库（生产环境应替换为 Prisma 查询）
// ============================================

/**
 * 模拟的用户数据表
 *
 * 生产环境中应该从数据库读取：
 * const users = await prisma.user.findMany({ ... });
 */
const mockUsers = [
  // ===== 示例用户1：活跃普通用户 =====
  {
    id: 'user_001',
    phone: '13812345678',
    nickname: '辩手小王',
    avatar: 'https://cdn.example.com/avatars/cat_01.png',
    status: UserStatus.ACTIVE,
    role: UserRole.USER,
    email: 'xiaowang@example.com',
    gender: 'male',
    bio: '热爱辩论的程序员',
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-05-13T09:20:00.000Z',
    lastLoginAt: '2026-05-13T09:20:00.000Z',
    lastLoginIp: '113.88.12.45',
    lastLoginUA: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    debateCount: 25,
    messageCount: 342,
    groupCount: 5,

    // 设备信息（最近登录记录）
    devices: [
      {
        ip: '113.88.12.45',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        deviceType: 'mobile',
        location: '广东省广州市',
        loginTime: '2026-05-13T09:20:00.000Z',
        isActive: true
      },
      {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        deviceType: 'desktop',
        location: '',
        loginTime: '2026-05-12T14:30:00.000Z',
        isActive: false
      }
    ],

    // 最近活跃记录
    recentActivity: [
      { type: 'message', content: '我认为AI技术的发展应该以人类福祉为首要目标', targetId: 'debate_001', timestamp: '2026-05-13T09:18:00.000Z' },
      { type: 'debate', content: '参与了"AI是否会取代人类"辩论', targetId: 'debate_001', timestamp: '2026-05-12T20:00:00.000Z' },
      { type: 'message', content: '从伦理角度来看，这个问题需要多方权衡', targetId: 'debate_002', timestamp: '2026-05-11T16:45:00.000Z' }
    ],

    // 风险标记
    riskMarks: {
      isReported: false,
      reportCount: 0,
      hasViolation: false,
      violationCount: 0,
      lastViolationReason: null,
      lastViolationTime: null
    }
  },

  // ===== 示例用户2：VIP会员用户 =====
  {
    id: 'user_002',
    phone: '13987654321',
    nickname: '辩手小李',
    avatar: 'https://cdn.example.com/avatars/cat_05.png',
    status: UserStatus.ACTIVE,
    role: UserRole.VIP,
    email: 'xiaoli@example.com',
    gender: 'female',
    bio: '法律专业背景，擅长逻辑推理',
    createdAt: '2026-02-20T10:15:00.000Z',
    updatedAt: '2026-05-12T16:40:00.000Z',
    lastLoginAt: '2026-05-12T16:40:00.000Z',
    lastLoginIp: '120.234.56.78',
    lastLoginUA: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    debateCount: 48,
    messageCount: 891,
    groupCount: 12,
    devices: [
      { ip: '120.234.56.78', userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', deviceType: 'tablet', location: '北京市海淀区', loginTime: '2026-05-12T16:40:00.000Z', isActive: true }
    ],
    recentActivity: [
      { type: 'debate', content: '发起了"远程办公是否值得推广"辩论', targetId: 'debate_003', timestamp: '2026-05-12T15:30:00.000Z' }
    ],
    riskMarks: {
      isReported: true,
      reportCount: 1,
      hasViolation: false,
      violationCount: 0,
      lastViolationReason: null,
      lastViolationTime: null
    }
  },

  // ===== 示例用户3：被禁用用户 =====
  {
    id: 'user_003',
    phone: '13666666666',
    nickname: '违规用户',
    avatar: null,
    status: UserStatus.DISABLED,
    role: UserRole.USER,
    email: 'weigui@example.com',
    gender: 'unknown',
    bio: '',
    createdAt: '2026-03-10T14:20:00.000Z',
    updatedAt: '2026-05-10T11:00:00.000Z',
    lastLoginAt: '2026-05-09T22:15:00.000Z',
    lastLoginIp: '45.67.89.123',
    lastLoginUA: 'Mozilla/5.0 (Linux; Android 12)',
    debateCount: 8,
    messageCount: 156,
    groupCount: 2,
    devices: [],
    recentActivity: [],
    riskMarks: {
      isReported: true,
      reportCount: 5,
      hasViolation: true,
      violationCount: 3,
      lastViolationReason: '发布不当言论，多次警告无效',
      lastViolationTime: '2026-05-10T11:00:00.000Z'
    }
  },

  // ===== 批量生成更多测试数据（总计50个用户）=====
  ...Array.from({ length: 47 }, (_, index) => ({
    id: `user_${String(index + 4).padStart(3, '0')}`,
    phone: `1${3 + Math.floor(Math.random() * 9)}${String(Math.floor(Math.random() * 100000000)).padStart(9, '0')}`,
    nickname: `用户${index + 4}`,
    avatar: index % 3 === 0 ? null : `https://cdn.example.com/avatars/cat_${(index % 30) + 1}.png`,
    status: Math.random() > 0.9 ? UserStatus.DISABLED : UserStatus.ACTIVE,
    role: Math.random() > 0.85 ? UserRole.VIP : UserRole.USER,
    email: `user${index + 4}@example.com`,
    gender: ['male', 'female', 'unknown'][Math.floor(Math.random() * 3)],
    bio: index % 2 === 0 ? `这是用户${index + 4}的个人简介` : '',
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    lastLoginIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    lastLoginUA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
    debateCount: Math.floor(Math.random() * 100),
    messageCount: Math.floor(Math.random() * 2000),
    groupCount: Math.floor(Math.random() * 15),
    devices: [],
    recentActivity: [],
    riskMarks: {
      isReported: Math.random() > 0.9,
      reportCount: Math.floor(Math.random() * 3),
      hasViolation: Math.random() > 0.95,
      violationCount: Math.random() > 0.95 ? Math.floor(Math.random() * 5) : 0,
      lastViolationReason: null,
      lastViolationTime: null
    }
  }))
];

// ============================================
// 审计日志服务（空壳函数，后续由Agent-8填充）
// ============================================

/**
 * 记录审计日志
 *
 * @param {Object} logInfo - 日志信息
 * @param {string} logInfo.action - 操作类型
 * @param {string} logInfo.operator - 操作人
 * @param {string} logInfo.targetType - 目标类型
 * @param {string} logInfo.targetId - 目标ID
 * @param {Object} logInfo.oldData - 操作前数据
 * @param {Object} logInfo.newData - 操作后数据
 * @param {string} logInfo.reason - 操作原因
 * @param {string} logInfo.ip - 操作IP
 *
 * TODO: 后续需要连接真实的审计日志数据库或服务
 * 当前仅输出到控制台日志
 */
export async function recordAuditLog(logInfo) {
  const logEntry = {
    ...logInfo,
    timestamp: new Date().toISOString(),
    log_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  console.log(`[AuditService] ${logEntry.action} | 操作人: ${logEntry.operator} | 目标: ${logEntry.targetType}/${logEntry.targetId}`);

  // TODO: 实际项目中这里应该写入数据库
  // await prisma.auditLog.create({ data: logEntry });

  return logEntry;
}

// ============================================
// 核心业务函数：获取用户列表
// ============================================

/**
 * 获取用户列表（分页查询）
 *
 * 功能说明：
 * 支持多条件筛选、排序、分页
 * 返回轻量级的用户列表项（不含详细信息）
 *
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（默认1）
 * @param {number} params.pageSize - 每页数量（默认20，最大100）
 * @param {string} params.search - 搜索关键词（手机号/昵称模糊匹配）
 * @param {string} params.status - 状态筛选（active/disabled/all）
 * @param {string} params.sortBy - 排序字段
 * @param {string} params.order - 排序方向（asc/desc）
 *
 * @returns {Object} { users: Array, pagination: Object, permissions: Object }
 *
 * 使用示例：
 * const result = await getUserList({
 *   page: 1,
 *   pageSize: 20,
 *   search: '小王',
 *   status: 'active',
 *   sortBy: 'lastLoginAt',
 *   order: 'desc'
 * });
 */
export async function getUserList(params = {}) {
  try {
    // ========== 第一步：参数解析和默认值 ==========
    const {
      page = 1,
      pageSize = 20,
      search = '',
      status = 'all',
      sortBy = SortByField.CREATED_AT,
      order = SortOrder.DESC
    } = params;

    // ========== 第二步：参数校验 ==========
    // 校验page和pageSize范围
    const validPage = Math.max(1, parseInt(page) || 1);
    const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

    if (validPage < 1 || validPageSize < 1 || validPageSize > 100) {
      throw {
        ...UserErrorCodes.INVALID_PAGE_PARAMS,
        details: { received: { page, pageSize } }
      };
    }

    console.log(
      `[UserService] 获取用户列表 | 页码: ${validPage} | ` +
      `每页: ${validPageSize} | 搜索: ${search || '无'} | ` +
      `状态: ${status} | 排序: ${sortBy} ${order}`
    );

    // ========== 第三步：数据筛选 ==========
    let filteredUsers = [...mockUsers];  // 创建副本，避免修改原数组

    // 3.1 按状态筛选
    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // 3.2 按关键词搜索（手机号或昵称模糊匹配）
    if (search && search.trim()) {
      const searchKeyword = search.trim().toLowerCase();

      filteredUsers = filteredUsers.filter(user => {
        // 昵称模糊匹配
        const nicknameMatch = user.nickname.toLowerCase().includes(searchKeyword);

        // 手机号模糊匹配（支持完整或部分号码）
        const phoneMatch = user.phone && (
          user.phone.includes(searchKeyword) ||
          user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2').includes(searchKeyword)
        );

        return nicknameMatch || phoneMatch;
      });
    }

    // ========== 第四步：排序 ==========
    filteredUsers.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case SortByField.CREATED_AT:
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;

        case SortByField.LAST_LOGIN_AT:
          // 处理null值（从未登录的用户排到最后）
          if (!a.lastLoginAt && !b.lastLoginAt) comparison = 0;
          else if (!a.lastLoginAt) comparison = 1;
          else if (!b.lastLoginAt) comparison = -1;
          else comparison = new Date(a.lastLoginAt) - new Date(b.lastLoginAt);
          break;

        case SortByField.NICKNAME:
          comparison = a.nickname.localeCompare(b.nickname, 'zh-CN');
          break;

        case SortByField.DEBATE_COUNT:
          comparison = a.debateCount - b.debateCount;
          break;

        default:
          // 默认按创建时间排序
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
      }

      // 应用排序方向
      return order === SortOrder.DESC ? -comparison : comparison;
    });

    // ========== 第五步：计算分页信息 ==========
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / validPageSize);
    const offset = (validPage - 1) * validPageSize;
    const paginatedUsers = filteredUsers.slice(offset, offset + validPageSize);

    // ========== 第六步：数据转换（脱敏处理）==========
    const users = paginatedUsers.map(user => transformToUserItem(user));

    // ========== 第七步：构建权限标识（基于当前操作者角色）==========
    // 注意：实际权限应由控制器传入，这里返回默认值
    const permissions = {
      can_edit: true,     // 默认有编辑权限
      can_delete: false,  // 默认无删除权限
      can_export: true    // 默认有导出权限
    };

    // ========== 第八步：返回结果 ==========
    console.log(
      `[UserService] 查询完成 | 总数: ${total} | ` +
      `当前页: ${users.length}条 | 总页数: ${totalPages}`
    );

    return {
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: validPage,
          pageSize: validPageSize,
          totalPages
        }
      },
      permissions
    };

  } catch (error) {
    console.error('[UserService] 获取用户列表异常:', error);

    // 如果是已知的业务错误，直接抛出
    if (error.errorType) {
      throw error;
    }

    // 未知错误包装为标准格式
    throw {
      ...UserErrorCodes.INTERNAL_ERROR,
      details: error.message
    };
  }
}

// ============================================
// 核心业务函数：获取用户详情
// ============================================

/**
 * 获取用户详细信息
 *
 * 功能说明：
 * 返回用户的完整画像，包括基本信息、活跃记录、设备信息、风险标记等
 *
 * @param {string} userId - 用户ID
 * @returns {Object} 用户详情对象（UserDetail接口）
 *
 * @throws {Object} 用户不存在时抛出404错误
 */
export async function getUserDetail(userId) {
  try {
    console.log(`[UserService] 获取用户详情 | 用户ID: ${userId}`);

    // ========== 第一步：查找用户 ==========
    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
      console.warn(`[UserService] 用户不存在 | ID: ${userId}`);
      throw {
        ...UserErrorCodes.USER_NOT_FOUND,
        details: { userId }
      };
    }

    // ========== 第二步：转换为详情格式并脱敏 ==========
    const detail = transformToUserDetail(user);

    console.log(`[UserService] 用户详情获取成功 | 用户: ${detail.nickname}`);

    return {
      success: true,
      data: detail
    };

  } catch (error) {
    console.error('[UserService] 获取用户详情异常:', error);

    if (error.errorType) {
      throw error;
    }

    throw {
      ...UserErrorCodes.INTERNAL_ERROR,
      details: error.message
    };
  }
}

// ============================================
// 核心业务函数：修改用户状态
// ============================================

/**
 * 修改用户状态（禁用/启用）
 *
 * 功能说明：
 * - 将用户状态在 active 和 disabled 之间切换
 * - 必须提供原因（用于审计追溯）
 * - 不能禁用自己
 * - 记录详细的审计日志
 * - 计算操作影响范围
 * - 返回前端同步指令
 *
 * @param {string} userId - 目标用户ID
 * @param {Object} params - 修改参数
 * @param {string} params.status - 目标状态（disabled 或 active）
 * @param {string} params.reason - 原因说明（必填，最少5个字符）
 * @param {Object} operatorContext - 操作人上下文
 * @param {string} operatorContext.operatorId - 操作人ID
 * @param {string} operatorContext.operatorName - 操作人名称
 * @param {string} operatorContext.ip - 操作IP地址
 *
 * @returns {Object} 操作结果（包含影响范围和同步指令）
 *
 * 安全规则：
 * 1. reason必填且>=5个字符
 * 2. 不能禁用自己
 * 3. 状态必须是 active 或 disabled
 */
export async function updateUserStatus(userId, params, operatorContext) {
  try {
    const { status, reason } = params;
    const { operatorId, operatorName, ip } = operatorContext;

    console.log(
      `[UserService] 修改用户状态 | 目标: ${userId} | ` +
      `目标状态: ${status} | 操作人: ${operatorName}`
    );

    // ========== 第一步：参数校验 ==========

    // 1.1 校验status值
    if (![UserStatus.ACTIVE, UserStatus.DISABLED].includes(status)) {
      throw {
        ...UserErrorCodes.INVALID_STATUS_VALUE,
        details: { received: status }
      };
    }

    // 1.2 校验reason（必填且长度>=5）
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      throw {
        ...UserErrorCodes.REASON_TOO_SHORT,
        details: {
          receivedLength: reason ? reason.length : 0,
          requiredMinLength: 5
        }
      };
    }

    // ========== 第二步：查找目标用户 ==========
    const userIndex = mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw {
        ...UserErrorCodes.USER_NOT_FOUND,
        details: { userId }
      };
    }

    const targetUser = mockUsers[userIndex];

    // ========== 第三步：安全规则检查 ==========

    // 3.1 不能禁用自己
    if (userId === operatorId && status === UserStatus.DISABLED) {
      console.warn(`[UserService] 尝试禁用自己 | 操作人: ${operatorName}`);
      throw {
        ...UserErrorCodes.FORBIDDEN_DISABLE_SELF,
        details: { operatorId, targetUserId: userId }
      };
    }

    // 3.2 如果状态相同，无需操作
    if (targetUser.status === status) {
      throw {
        code: 400,
        errorType: 'STATUS_UNCHANGED',
        message: `用户已经是${status === UserStatus.ACTIVE ? '正常' : '禁用'}状态，无需重复操作`,
        details: { currentStatus: status }
      };
    }

    // ========== 第四步：执行状态更新 ==========
    const previousStatus = targetUser.status;
    const operationTime = new Date().toISOString();

    // 更新用户状态（这里是内存操作，实际应该是数据库UPDATE）
    mockUsers[userIndex] = {
      ...targetUser,
      status: status,
      updatedAt: operationTime
    };

    // ========== 第五步：计算影响范围 ==========
    const impact = calculateStatusChangeImpact(targetUser, previousStatus, status);

    // ========== 第六步：记录审计日志 ==========
    await recordAuditLog({
      action: 'STATUS_CHANGE',
      operator: operatorName,
      targetType: 'USER',
      targetId: userId,
      oldData: { status: previousStatus },
      newData: { status: status, reason: reason.trim() },
      reason: reason.trim(),
      ip: ip || 'unknown',
      details: impact
    });

    // ========== 第七步：构建前端同步指令 ==========
    const frontendSync = buildFrontendSyncInstruction(userId, status, impact);

    // ========== 第八步：返回结果 ==========
    console.log(
      `[UserService] 状态修改成功 | 用户: ${targetUser.nickname} | ` +
      `${previousStatus} -> ${status} | 影响会话: ${impact.sessionsTerminated}`
    );

    return {
      success: true,
      message: `用户已成功${status === UserStatus.DISABLED ? '禁用' : '启用'}`,
      data: {
        userId,
        previousStatus,
        newStatus: status,
        reason: reason.trim(),
        operatedBy: operatorName,
        operatedAt: operationTime,
        impact,
        frontend_sync: frontendSync
      }
    };

  } catch (error) {
    console.error('[UserService] 修改用户状态异常:', error);

    if (error.errorType) {
      throw error;
    }

    throw {
      ...UserErrorCodes.INTERNAL_ERROR,
      details: error.message
    };
  }
}

// ============================================
// 核心业务函数：用户搜索（实时联想）
// ============================================

/**
 * 用户搜索（实时联想）
 *
 * 功能说明：
 * 提供轻量级的实时搜索功能
 * 用于输入框的自动补全提示
 * 响应时间要求 < 200ms
 *
 * @param {string} query - 搜索关键词
 * @param {number} limit - 最大返回数量（默认10）
 *
 * @returns {Array<UserSearchResultItem>} 搜索结果数组
 *
 * 性能优化：
 * - 只返回必要字段（id, nickname, phone, avatar）
 * - 结果限制最多10条
 * - 内存索引加速查找
 */
export async function searchUsers(query, limit = 10) {
  try {
    const startTime = Date.now();

    if (!query || !query.trim()) {
      return [];
    }

    const searchKeyword = query.trim().toLowerCase();
    console.log(`[UserService] 用户搜索 | 关键词: "${searchKeyword}"`);

    // ========== 快速搜索算法 ==========

    // 1. 精确匹配优先（完整手机号或完全一致的昵称）
    const exactMatches = mockUsers.filter(user =>
      user.phone === searchKeyword ||
      user.nickname.toLowerCase() === searchKeyword
    );

    // 2. 前缀匹配（手机号前缀或昵称开头）
    const prefixMatches = mockUsers.filter(user =>
      user.phone.startsWith(searchKeyword) ||
      user.nickname.toLowerCase().startsWith(searchKeyword)
    );

    // 3. 包含匹配（任意位置包含）
    const containsMatches = mockUsers.filter(user =>
      user.phone.includes(searchKeyword) ||
      user.nickname.toLowerCase().includes(searchKeyword)
    );

    // 合并去重（保持顺序：精确 > 前缀 > 包含）
    const seenIds = new Set();
    const results = [];

    [...exactMatches, ...prefixMatches, ...containsMatches].forEach(user => {
      if (!seenIds.has(user.id) && results.length < limit) {
        seenIds.add(user.id);
        results.push({
          id: user.id,
          nickname: user.nickname,
          phone: maskPhone(user.phone),  // 脱敏显示
          avatar: user.avatar
        });
      }
    });

    // ========== 性能监控 ==========
    const duration = Date.now() - startTime;

    if (duration > 200) {
      console.warn(`[UserService] 搜索响应时间过长 | 耗时: ${duration}ms | 关键词: ${searchKeyword}`);
    } else {
      console.log(`[UserService] 搜索完成 | 结果: ${results.length}条 | 耗时: ${duration}ms`);
    }

    return {
      success: true,
      data: results,
      meta: {
        query: searchKeyword,
        count: results.length,
        duration: `${duration}ms`
      }
    };

  } catch (error) {
    console.error('[UserService] 用户搜索异常:', error);

    return {
      success: false,
      data: [],
      error: '搜索服务暂时不可用'
    };
  }
}

// ============================================
// 数据转换工具函数
// ============================================

/**
 * 将原始用户数据转换为列表项格式（UserItem）
 *
 * 处理内容：
 * - 手机号脱敏
 * - 移除敏感字段
 * - 只保留列表展示需要的字段
 *
 * @param {Object} rawUser - 原始用户数据
 * @returns {Object} UserItem 格式的对象
 */
function transformToUserItem(rawUser) {
  return {
    id: rawUser.id,
    phone: maskPhone(rawUser.phone),
    nickname: rawUser.nickname,
    avatar: rawUser.avatar,
    status: rawUser.status,
    role: rawUser.role,
    createdAt: rawUser.createdAt,
    lastLoginAt: rawUser.lastLoginAt,
    debateCount: rawUser.debateCount,
    messageCount: rawUser.messageCount,
    groupCount: rawUser.groupCount
  };
}

/**
 * 将原始用户数据转换为详情格式（UserDetail）
 *
 * 处理内容：
 * - 所有字段脱敏
 * - 补充扩展信息（设备、活跃记录、风险标记）
 *
 * @param {Object} rawUser - 原始用户数据
 * @returns {Object} UserDetail 格式的对象
 */
function transformToUserDetail(rawUser) {
  return {
    // 基础信息
    id: rawUser.id,
    phone: maskPhone(rawUser.phone),
    nickname: rawUser.nickname,
    avatar: rawUser.avatar,
    status: rawUser.status,
    role: rawUser.role,
    createdAt: rawUser.createdAt,
    lastLoginAt: rawUser.lastLoginAt,
    debateCount: rawUser.debateCount,
    messageCount: rawUser.messageCount,
    groupCount: rawUser.groupCount,

    // 扩展信息
    email: maskEmail(rawUser.email),
    gender: rawUser.gender,
    bio: rawUser.bio,

    // 最近活跃记录（最多5条）
    recentActivity: (rawUser.recentActivity || []).slice(0, 5),

    // 设备信息
    deviceInfo: rawUser.devices || [],

    // 风险标记
    riskMarks: rawUser.riskMarks || {}
  };
}

// ============================================
// 辅助计算函数
// ============================================

/**
 * 计算状态变更的影响范围
 *
 * 当用户被禁用时，可能影响：
 * - 在线会话（需要踢出）
 * - 进行中的辩论（需要打断）
 * - 待发送的消息（需要拦截）
 *
 * @param {Object} user - 被操作的用户
 * @param {string} previousStatus - 原状态
 * @param {string} newStatus - 新状态
 * @returns {Object} 影响范围统计
 */
function calculateStatusChangeImpact(user, previousStatus, newStatus) {
  // 只有禁用操作才会有影响
  if (newStatus !== UserStatus.DISABLED) {
    return {
      sessionsTerminated: 0,
      debatesInterrupted: 0,
      messagesBlocked: 0
    };
  }

  // 模拟影响范围计算（实际应根据用户的在线状态查询）
  // 这里假设：如果用户最近登录过，可能有活跃会话
  const hasRecentLogin = user.lastLoginAt &&
    (Date.now() - new Date(user.lastLoginAt).getTime()) < 30 * 60 * 1000;  // 30分钟内

  return {
    sessionsTerminated: hasRecentLogin ? 1 : 0,       // 可能有1个活跃会话
    debatesInterrupted: Math.min(user.debateCount, 3), // 假设最多影响3个进行中的辩论
    messagesBlocked: 0                                  // 通常不会拦截消息
  };
}

/**
 * 构建前端同步指令
 *
 * 告诉前端需要执行的同步操作
 * 用于保证数据一致性
 *
 * @param {string} userId - 被操作的用户ID
 * @param {string} newStatus - 新状态
 * @param {Object} impact - 影响范围
 * @returns {Object} 同步指令对象
 */
function buildFrontendSyncInstruction(userId, newStatus, impact) {
  return {
    invalidateCache: true,  // 清除该用户的缓存
    pushNotification: newStatus === UserStatus.DISABLED,  // 禁用时推送通知
    websocketBroadcast: {
      event: 'user_status_changed',
      payload: {
        userId,
        status: newStatus,
        timestamp: new Date().toISOString()
      }
    }
  };
}

// ============================================
// 默认导出所有服务函数
// ============================================

export default {
  getUserList,
  getUserDetail,
  updateUserStatus,
  searchUsers,
  recordAuditLog
};
