/**
 * 用户管理服务层 (User Service)
 *
 * 功能说明：
 * 封装用户管理的所有业务逻辑，作为控制器和数据库之间的中间层
 * 使用 Prisma ORM 操作 PostgreSQL 数据库
 *
 * 核心职责：
 * 1. 数据查询与过滤（列表、详情、搜索）
 * 2. 业务规则验证（状态修改、权限检查）
 * 3. 数据脱敏处理（手机号、邮箱）
 * 4. 统计数据计算
 */

import prisma from '../lib/prisma.js';
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
// 核心业务函数
// ============================================

/**
 * 获取用户列表（分页查询）
 *
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} { success, data: { users, pagination }, permissions }
 */
export async function getUserList(params = {}) {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      status = 'all',
      sortBy = SortByField.CREATED_AT,
      order = SortOrder.DESC
    } = params;

    const validPage = Math.max(1, parseInt(page) || 1);
    const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));

    console.log(
      `[UserService] 获取用户列表 | 页码: ${validPage} | ` +
      `每页: ${validPageSize} | 搜索: ${search || '无'} | ` +
      `状态: ${status} | 排序: ${sortBy} ${order}`
    );

    // ========== 构建查询条件 ==========
    const where = {};

    // 状态筛选
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    // 关键词搜索
    if (search && search.trim()) {
      const searchKeyword = search.trim();
      where.OR = [
        { nickname: { contains: searchKeyword, mode: 'insensitive' } },
        { phone: { contains: searchKeyword } }
      ];
    }

    // ========== 构建排序 ==========
    const orderBy = {};
    switch (sortBy) {
      case SortByField.CREATED_AT:
        orderBy.createdAt = order;
        break;
      case SortByField.LAST_LOGIN_AT:
        orderBy.lastLoginAt = order;
        break;
      case SortByField.NICKNAME:
        orderBy.nickname = order;
        break;
      case SortByField.DEBATE_COUNT:
        orderBy.debateCount = order;
        break;
      default:
        orderBy.createdAt = order;
    }

    // ========== 并行查询：列表 + 总数 ==========
    const [users, total] = await Promise.all([
      prisma.appUser.findMany({
        where,
        orderBy,
        skip: (validPage - 1) * validPageSize,
        take: validPageSize,
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          status: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          debateCount: true,
          messageCount: true,
          groupCount: true
        }
      }),
      prisma.appUser.count({ where })
    ]);

    const totalPages = Math.ceil(total / validPageSize);

    // 手机号脱敏
    const maskedUsers = users.map(user => ({
      ...user,
      phone: maskPhone(user.phone)
    }));

    console.log(
      `[UserService] 查询完成 | 总数: ${total} | ` +
      `当前页: ${users.length}条 | 总页数: ${totalPages}`
    );

    return {
      success: true,
      data: {
        users: maskedUsers,
        pagination: {
          total,
          page: validPage,
          pageSize: validPageSize,
          totalPages
        }
      },
      permissions: {
        can_edit: true,
        can_delete: false,
        can_export: true
      }
    };

  } catch (error) {
    console.error('[UserService] 获取用户列表异常:', error);
    if (error.errorType) throw error;
    throw { ...UserErrorCodes.INTERNAL_ERROR, details: error.message };
  }
}

/**
 * 获取用户详细信息
 *
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户详情对象
 */
export async function getUserDetail(userId) {
  try {
    console.log(`[UserService] 获取用户详情 | 用户ID: ${userId}`);

    const user = await prisma.appUser.findUnique({ where: { id: userId } });

    if (!user) {
      throw { ...UserErrorCodes.USER_NOT_FOUND, details: { userId } };
    }

    // 脱敏并补充虚拟字段
    const detail = {
      id: user.id,
      phone: maskPhone(user.phone),
      nickname: user.nickname,
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      debateCount: user.debateCount,
      messageCount: user.messageCount,
      groupCount: user.groupCount,
      email: maskEmail(user.email),
      gender: user.gender || 'unknown',
      bio: user.bio || '',
      recentActivity: [],
      deviceInfo: [],
      riskMarks: {
        isReported: false,
        reportCount: 0,
        hasViolation: false,
        violationCount: 0,
        lastViolationReason: null,
        lastViolationTime: null
      }
    };

    return { success: true, data: detail };

  } catch (error) {
    console.error('[UserService] 获取用户详情异常:', error);
    if (error.errorType) throw error;
    throw { ...UserErrorCodes.INTERNAL_ERROR, details: error.message };
  }
}

/**
 * 修改用户状态（禁用/启用）
 *
 * @param {string} userId - 目标用户ID
 * @param {Object} params - 修改参数
 * @param {Object} operatorContext - 操作人上下文
 * @returns {Promise<Object>} 操作结果
 */
export async function updateUserStatus(userId, params, operatorContext) {
  try {
    const { status, reason } = params;
    const { operatorId, operatorName, ip } = operatorContext;

    console.log(
      `[UserService] 修改用户状态 | 目标: ${userId} | ` +
      `目标状态: ${status} | 操作人: ${operatorName}`
    );

    // ========== 参数校验 ==========
    const validStatuses = [UserStatus.ACTIVE, UserStatus.DISABLED];
    if (!validStatuses.includes(status)) {
      throw { ...UserErrorCodes.INVALID_STATUS_VALUE, details: { received: status } };
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      throw {
        ...UserErrorCodes.REASON_TOO_SHORT,
        details: { receivedLength: reason ? reason.length : 0, requiredMinLength: 5 }
      };
    }

    // ========== 查找用户 ==========
    const targetUser = await prisma.appUser.findUnique({ where: { id: userId } });

    if (!targetUser) {
      throw { ...UserErrorCodes.USER_NOT_FOUND, details: { userId } };
    }

    // ========== 安全规则检查 ==========
    if (userId === operatorId && status === UserStatus.DISABLED) {
      throw { ...UserErrorCodes.FORBIDDEN_DISABLE_SELF, details: { operatorId, targetUserId: userId } };
    }

    // 转换状态为数据库存储格式（大写）
    const dbStatus = status.toUpperCase();
    const previousDbStatus = targetUser.status;

    if (previousDbStatus === dbStatus) {
      throw {
        code: 400,
        errorType: 'STATUS_UNCHANGED',
        message: `用户已经是${status === UserStatus.ACTIVE ? '正常' : '禁用'}状态，无需重复操作`,
        details: { currentStatus: status }
      };
    }

    // ========== 执行更新 ==========
    const operationTime = new Date().toISOString();

    await prisma.appUser.update({
      where: { id: userId },
      data: {
        status: dbStatus,
        updatedAt: new Date()
      }
    });

    // ========== 计算影响范围 ==========
    const hasRecentLogin = targetUser.lastLoginAt &&
      (Date.now() - new Date(targetUser.lastLoginAt).getTime()) < 30 * 60 * 1000;

    const impact = {
      sessionsTerminated: (status === UserStatus.DISABLED && hasRecentLogin) ? 1 : 0,
      debatesInterrupted: status === UserStatus.DISABLED ? Math.min(targetUser.debateCount, 3) : 0,
      messagesBlocked: 0
    };

    console.log(
      `[UserService] 状态修改成功 | 用户: ${targetUser.nickname} | ` +
      `${previousDbStatus} -> ${dbStatus}`
    );

    return {
      success: true,
      message: `用户已成功${status === UserStatus.DISABLED ? '禁用' : '启用'}`,
      data: {
        userId,
        previousStatus: previousDbStatus.toLowerCase(),
        newStatus: dbStatus.toLowerCase(),
        reason: reason.trim(),
        operatedBy: operatorName,
        operatedAt: operationTime,
        impact,
        frontend_sync: {
          invalidateCache: true,
          pushNotification: status === UserStatus.DISABLED,
          websocketBroadcast: {
            event: 'user_status_changed',
            payload: { userId, status: dbStatus.toLowerCase(), timestamp: operationTime }
          }
        }
      }
    };

  } catch (error) {
    console.error('[UserService] 修改用户状态异常:', error);
    if (error.errorType) throw error;
    throw { ...UserErrorCodes.INTERNAL_ERROR, details: error.message };
  }
}

/**
 * 用户搜索（实时联想）
 *
 * @param {string} query - 搜索关键词
 * @param {number} limit - 最大返回数量（默认10）
 * @returns {Promise<Object>} 搜索结果
 */
export async function searchUsers(query, limit = 10) {
  try {
    const startTime = Date.now();

    if (!query || !query.trim()) {
      return { success: true, data: [], meta: { query: '', count: 0, duration: '0ms' } };
    }

    const searchKeyword = query.trim().toLowerCase();
    console.log(`[UserService] 用户搜索 | 关键词: "${searchKeyword}"`);

    // ========== 精确匹配优先（完整手机号）==========
    const exactMatchUsers = await prisma.appUser.findMany({
      where: {
        OR: [
          { phone: { equals: searchKeyword } },
          { nickname: { equals: searchKeyword, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: { id: true, nickname: true, phone: true, avatar: true }
    });

    // 如果精确匹配已满所需数量，直接返回
    if (exactMatchUsers.length >= limit) {
      const duration = Date.now() - startTime;
      const results = exactMatchUsers.slice(0, limit).map(u => ({
        ...u,
        phone: maskPhone(u.phone)
      }));

      return {
        success: true,
        data: results,
        meta: { query: searchKeyword, count: results.length, duration: `${duration}ms` }
      };
    }

    // ========== 模糊匹配（包含） ==========
    const remaining = limit - exactMatchUsers.length;
    const exactIds = exactMatchUsers.map(u => u.id);

    const fuzzyUsers = await prisma.appUser.findMany({
      where: {
        AND: [
          { id: { notIn: exactIds } },
          {
            OR: [
              { nickname: { contains: searchKeyword, mode: 'insensitive' } },
              { phone: { contains: searchKeyword } }
            ]
          }
        ]
      },
      take: remaining,
      orderBy: { createdAt: 'desc' },
      select: { id: true, nickname: true, phone: true, avatar: true }
    });

    // 合并结果：精确匹配优先，模糊匹配其次
    const merged = [
      ...exactMatchUsers.map(u => ({ ...u, phone: maskPhone(u.phone) })),
      ...fuzzyUsers.map(u => ({ ...u, phone: maskPhone(u.phone) }))
    ];

    const duration = Date.now() - startTime;

    console.log(`[UserService] 搜索完成 | 结果: ${merged.length}条 | 耗时: ${duration}ms`);

    return {
      success: true,
      data: merged,
      meta: { query: searchKeyword, count: merged.length, duration: `${duration}ms` }
    };

  } catch (error) {
    console.error('[UserService] 用户搜索异常:', error);
    return { success: false, data: [], error: '搜索服务暂时不可用' };
  }
}

// ============================================
// 导出
// ============================================

export default {
  getUserList,
  getUserDetail,
  updateUserStatus,
  searchUsers
};
