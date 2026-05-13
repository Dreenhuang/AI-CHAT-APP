/**
 * 用户管理控制器 (User Controller)
 *
 * 功能说明：
 * 处理所有用户管理相关的HTTP请求
 * 作为路由和服务层之间的桥梁，负责：
 * - 请求参数提取和验证
 * - 调用服务层执行业务逻辑
 * - 格式化API响应
 * - 统一错误处理和日志记录
 *
 * API接口列表：
 * U001: GET  /api/admin/v1/users          - 获取用户列表（分页）
 * U002: GET  /api/admin/v1/users/:id       - 获取用户详情
 * U003: PATCH /api/admin/v1/users/:id/status - 修改用户状态（禁用/启用）
 * U004: GET  /api/admin/v1/users/search    - 用户搜索（实时联想）
 *
 * 权限要求：
 * - super_admin: 全部权限（CRUD + 禁用）
 * - admin: 查看 + 禁用/启用（不能删除）
 * - observer: 只读（只能查看列表和详情）
 *
 * @module userController
 */

import userService from '../services/userService.js';
import { UserErrorCodes } from '../types/user.js';

// ============================================
// U001: 获取用户列表 (User List)
// ============================================

/**
 * 获取用户列表接口
 *
 * GET /api/admin/v1/users
 *
 * 需要认证：✅ 是（需要Bearer Token）
 * 需要权限：user:view（查看用户列表的权限）
 *
 * 查询参数 (Query Parameters):
 * @param {number} page - 页码（默认1，从1开始）
 * @param {number} pageSize - 每页数量（默认20，最大100）
 * @param {string} search - 搜索关键词（手机号/昵称模糊搜索）
 * @param {string} status - 状态筛选：active/disabled/all（默认all）
 * @param {string} sortBy - 排序字段：createdAt/lastLoginAt/nickname/debateCount
 * @param {string} order - 排序方向：asc/desc（默认desc）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "users": [...],           // UserItem 数组
 *     "pagination": {           // 分页信息
 *       "total": 1258,
 *       "page": 1,
 *       "pageSize": 20,
 *       "totalPages": 63
 *     }
 *   },
 *   "permissions": {            // 当前操作者权限标识
 *     "can_edit": true,
 *     "can_delete": false,
 *     "can_export": true
 *   }
 * }
 *
 * 使用场景：
 * - 管理后台的用户列表页面
 * - 支持分页浏览、搜索、筛选、排序
 */
export async function getUserList(request, reply) {
  try {
    // ========== 第一步：提取查询参数 ==========
    const query = request.query || {};

    const params = {
      page: parseInt(query.page) || 1,
      pageSize: parseInt(query.pageSize) || 20,
      search: query.search || '',
      status: query.status || 'all',
      sortBy: query.sortBy || 'createdAt',
      order: query.order || 'desc'
    };

    console.log(
      `[Controller] 获取用户列表 | 操作人: ${request.user?.username} | ` +
      `参数: ${JSON.stringify(params)}`
    );

    // ========== 第二步：调用服务层 ==========
    const result = await userService.getUserList(params);

    // ========== 第三步：返回成功响应 ==========
    return reply.send(result);

  } catch (error) {
    console.error('[Controller] 获取用户列表异常:', error);

    // 返回标准错误格式
    return reply.status(error.code || 500).send({
      success: false,
      code: error.code || 500,
      message: error.message || '获取用户列表失败',
      errorType: error.errorType || 'INTERNAL_ERROR',
      ...(error.details && { details: error.details })
    });
  }
}

// ============================================
// U002: 获取用户详情 (User Detail)
// ============================================

/**
 * 获取用户详情接口
 *
 * GET /api/admin/v1/users/:id
 *
 * 需要认证：✅ 是
 * 需要权限：user:view
 *
 * 路径参数:
 * @param {string} id - 用户ID（UUID格式）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "...",
 *     "phone": "138****1234",
 *     "nickname": "辩手小王",
 *     ...完整用户画像信息,
 *     "recentActivity": [...],
 *     "deviceInfo": [...],
 *     "riskMarks": {...}
 *   }
 * }
 *
 * 使用场景：
 * - 点击用户列表中的某一行，进入详情页面
 * - 展示用户的完整画像、活跃记录、设备信息、风险标记等
 */
export async function getUserDetail(request, reply) {
  try {
    // ========== 第一步：提取路径参数 ==========
    const userId = request.params.id;

    if (!userId) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '缺少用户ID参数',
        errorType: 'MISSING_PARAMETER'
      });
    }

    console.log(
      `[Controller] 获取用户详情 | 操作人: ${request.user?.username} | ` +
      `目标用户ID: ${userId}`
    );

    // ========== 第二步：调用服务层 ==========
    const result = await userService.getUserDetail(userId);

    // ========== 第三步：返回成功响应 ==========
    return reply.send(result);

  } catch (error) {
    console.error('[Controller] 获取用户详情异常:', error);

    return reply.status(error.code || 500).send({
      success: false,
      code: error.code || 500,
      message: error.message || '获取用户详情失败',
      errorType: error.errorType || 'INTERNAL_ERROR',
      ...(error.details && { details: error.details })
    });
  }
}

// ============================================
// U003: 修改用户状态 (Update User Status)
// ============================================

/**
 * 修改用户状态接口（禁用/启用用户）
 *
 * PATCH /api/admin/v1/users/:id/status
 *
 * 需要认证：✅ 是
 * 需要权限：user:edit（编辑用户信息的权限）
 *
 * 路径参数:
 * @param {string} id - 目标用户ID
 *
 * 请求体 (Body):
 * {
 *   "status": "disabled",     // 目标状态：disabled 或 active（必填）
 *   "reason": "发布违规内容"   // 原因说明（必填，最少5个字符）
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "用户已成功禁用",
 *   "data": {
 *     "userId": "...",
 *     "previousStatus": "active",
 *     "newStatus": "disabled",
 *     "reason": "发布违规内容",
 *     "operatedBy": "admin",
 *     "operatedAt": "2026-05-13T10:30:00.000Z",
 *     "impact": {
 *       "sessionsTerminated": 1,    // 被踢出的会话数
 *       "debatesInterrupted": 2,    // 被打断的辩论数
 *       "messagesBlocked": 0        // 被拦截的消息数
 *     },
 *     "frontend_sync": {...}       // 前端同步指令
 *   }
 * }
 *
 * 安全规则：
 * ✅ reason必填且>=5个字符
 * ✅ 不能禁用自己
 * ✅ 必须记录审计日志
 * ✅ 返回操作影响范围
 *
 * 错误示例：
 * - 400: reason太短或status值无效
 * - 403: 尝试禁用自己
 * - 404: 用户不存在
 */
export async function updateUserStatus(request, reply) {
  try {
    // ========== 第一步：提取参数 ==========
    const userId = request.params.id;
    const { status, reason } = request.body;
    const clientIP = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    // ========== 第二步：参数校验 ==========

    // 2.1 检查userId
    if (!userId) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '缺少目标用户ID',
        errorType: 'MISSING_USER_ID'
      });
    }

    // 2.2 检查status字段
    if (!status || !['active', 'disabled'].includes(status)) {
      return reply.status(400).send({
        ...UserErrorCodes.INVALID_STATUS_VALUE,
        details: { received: status }
      });
    }

    // 2.3 检查reason字段
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return reply.status(400).send({
        ...UserErrorCodes.REASON_TOO_SHORT,
        details: {
          receivedLength: reason ? reason.length : 0,
          requiredMinLength: 5
        }
      });
    }

    console.log(
      `[Controller] 修改用户状态 | 操作人: ${request.user?.username} | ` +
      `目标用户: ${userId} | 目标状态: ${status} | 原因: ${reason.trim()}`
    );

    // ========== 第三步：构建操作人上下文 ==========
    const operatorContext = {
      operatorId: String(request.user?.admin_id),  // 注意：当前登录的是管理员
      operatorName: request.user?.username || 'unknown',
      ip: clientIP
    };

    // ========== 第四步：调用服务层执行业务逻辑 ==========
    const result = await userService.updateUserStatus(
      userId,
      { status, reason: reason.trim() },
      operatorContext
    );

    // ========== 第五步：返回成功响应 ==========
    return reply.send(result);

  } catch (error) {
    console.error('[Controller] 修改用户状态异常:', error);

    return reply.status(error.code || 500).send({
      success: false,
      code: error.code || 500,
      message: error.message || '修改用户状态失败',
      errorType: error.errorType || 'INTERNAL_ERROR',
      ...(error.details && { details: error.details })
    });
  }
}

// ============================================
// U004: 用户搜索 (User Search)
// ============================================

/**
 * 用户搜索接口（实时联想）
 *
 * GET /api/admin/v1/users/search?q=xxx
 *
 * 需要认证：✅ 是
 * 需要权限：user:view
 *
 * 查询参数:
 * @param {string} q - 搜索关键词（必填）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "user_001",
 *       "nickname": "辩手小王",
 *       "phone": "138****5678",
 *       "avatar": "https://..."
 *     },
 *     ...
 *   ],
 *   "meta": {
 *     "query": "小王",
 *     "count": 5,
 *     "duration": "12ms"
 *   }
 * }
 *
 * 性能要求：
 * - 响应时间 < 200ms
 * - 最多返回10条结果
 * - 只返回轻量级字段（id + nickname + phone + avatar）
 *
 * 使用场景：
 * - 输入框实时搜索提示
 * - 快速查找特定用户
 * - 批量操作时选择用户
 */
export async function searchUsers(request, reply) {
  try {
    // ========== 第一步：提取查询参数 ==========
    const query = request.query.q || '';

    if (!query || !query.trim()) {
      // 如果没有提供搜索关键词，返回空结果
      return reply.send({
        success: true,
        data: [],
        meta: {
          query: '',
          count: 0,
          duration: '0ms'
        }
      });
    }

    console.log(
      `[Controller] 用户搜索 | 操作人: ${request.user?.username} | ` +
      `关键词: "${query.trim()}"`
    );

    // ========== 第二步：调用服务层 ==========
    const result = await userService.searchUsers(query.trim(), 10);  // 最多返回10条

    // ========== 第三步：返回成功响应 ==========
    return reply.send(result);

  } catch (error) {
    console.error('[Controller] 用户搜索异常:', error);

    // 搜索功能即使出错也不应该阻塞用户，返回空结果
    return reply.send({
      success: true,
      data: [],
      error: '搜索服务暂时不可用，请稍后重试'
    });
  }
}

// ============================================
// 默认导出所有控制器函数
// ============================================

export default {
  getUserList,      // U001: 用户列表
  getUserDetail,    // U002: 用户详情
  updateUserStatus, // U003: 修改状态
  searchUsers       // U004: 用户搜索
};
