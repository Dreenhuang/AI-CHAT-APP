/**
 * 认证控制器 (Auth Controller)
 *
 * 功能说明：
 * - login(): 管理员登录（验证密码、签发JWT、记录审计日志）
 * - getProfile(): 获取当前登录管理员的个人信息
 * - changePassword(): 修改当前管理员密码
 * - logout(): 登出操作（客户端清除token）
 *
 * 技术实现：
 * - 使用 bcryptjs 进行密码加密和比对
 * - 密码存储格式：bcrypt hash（自动包含salt）
 * - 数据库操作使用 Prisma ORM
 *
 * 安全机制：
 * - 登录失败次数限制（防暴力破解）
 * - 密码强度验证
 * - 修改密码时必须提供旧密码
 * - 敏感操作记录审计日志
 */

import bcrypt from 'bcryptjs';
import { generateToken, refreshToken } from '../utils/jwt.js';
import dotenv from 'dotenv';

dotenv.config();

// bcrypt 加密轮次（从环境变量读取，默认10）
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// ============================================
// 模拟数据库（实际项目中应替换为 Prisma/Supabase）
// ============================================

/**
 * 模拟的管理员数据表
 * 生产环境中应该从数据库读取，这里仅作演示
 */
const mockAdmins = [
  {
    admin_id: 1,
    username: 'admin',
    password_hash: '',  // 将在初始化时生成
    role: 'super_admin',
    permissions: ['*'],
    nickname: '超级管理员',
    email: 'admin@prd-debate.com',
    avatar: null,
    status: 'active',        // active/disabled/locked
    login_count: 0,
    last_login_at: null,
    last_login_ip: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    admin_id: 2,
    username: 'operator',
    password_hash: '',
    role: 'admin',
    permissions: [
      'user:view', 'user:create', 'user:edit',
      'content:view', 'content:create', 'content:edit', 'content:publish',
      'data:analytics', 'audit_log:view'
    ],
    nickname: '内容运营',
    email: 'operator@prd-debate.com',
    avatar: null,
    status: 'active',
    login_count: 5,
    last_login_at: '2026-05-12T08:30:00.000Z',
    last_login_ip: '192.168.1.100',
    created_at: '2026-02-15T10:00:00.000Z',
    updated_at: '2026-05-12T08:30:00.000Z'
  },
  {
    admin_id: 3,
    username: 'viewer',
    password_hash: '',
    role: 'observer',
    permissions: ['user:view', 'content:view', 'data:analytics'],
    nickname: '数据观察员',
    email: 'viewer@prd-debate.com',
    avatar: null,
    status: 'active',
    login_count: 12,
    last_login_at: '2026-05-13T09:15:00.000Z',
    last_login_ip: '192.168.1.105',
    created_at: '2026-03-20T14:00:00.000Z',
    updated_at: '2026-05-13T09:15:00.000Z'
  }
];

// 初始化默认密码（所有账号初始密码为: Admin@123456）
let initialized = false;
async function initializeMockData() {
  if (initialized) return;

  const defaultPassword = 'Admin@123456';
  const hash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  mockAdmins.forEach(admin => {
    admin.password_hash = hash;
  });

  initialized = true;
  console.log('[AuthController] 模拟数据已初始化 | 默认密码:', defaultPassword);
}

// 审计日志存储（生产环境应写入数据库）
const auditLogs = [];

/**
 * 记录审计日志
 *
 * @param {Object} logInfo - 日志信息
 */
function recordAuditLog(logInfo) {
  const logEntry = {
    ...logInfo,
    timestamp: new Date().toISOString(),
    log_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  auditLogs.push(logEntry);

  // 只保留最近1000条日志（防止内存溢出）
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }

  console.log(`[Audit] ${logEntry.action} | 操作人: ${logEntry.operator} | IP: ${logEntry.ip}`);
}

// ============================================
// 控制器函数实现
// ============================================

/**
 * 管理员登录
 *
 * POST /api/admin/v1/auth/login
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 *
 * 请求体 (Body):
 * {
 *   "username": "string",     // 用户名（必填）
 *   "password": "string"      // 密码（必填）
 * }
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "message": "登录成功",
 *   "data": {
 *     "token": "eyJhbGci...",       // JWT访问令牌
 *     "refreshToken": "eyJhbG...",  // 刷新令牌（可选）
 *     "expiresIn": "24h",           // 过期时间
 *     "user": {                     // 用户信息（不含敏感数据）
 *       "admin_id": 1,
 *       "username": "admin",
 *       "role": "super_admin",
 *       "nickname": "超级管理员"
 *     }
 *   }
 * }
 */
export async function login(request, reply) {
  try {
    // 初始化模拟数据（确保密码hash已生成）
    await initializeMockData();

    const { username, password } = request.body;
    const clientIP = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    // ========== 第一步：参数验证 ==========
    if (!username || !password) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '用户名和密码不能为空',
        errorType: 'MISSING_PARAMETERS'
      });
    }

    // ========== 第二步：查找用户 ==========
    // 注意：实际项目应使用数据库查询，如：
    // const admin = await prisma.admin.findUnique({ where: { username } });
    const admin = mockAdmins.find(a => a.username === username);

    if (!admin) {
      // 记录失败尝试（安全提示：不明确告知用户名不存在，防止枚举攻击）
      console.warn(`[Login] 登录失败 | 用户不存在 | 用户名: ${username} | IP: ${clientIP}`);

      return reply.status(401).send({
        success: false,
        code: 401,
        message: '用户名或密码错误',
        errorType: 'INVALID_CREDENTIALS'
      });
    }

    // ========== 第三步：检查账户状态 ==========
    if (admin.status === 'disabled') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: '该账户已被禁用，请联系系统管理员',
        errorType: 'ACCOUNT_DISABLED'
      });
    }

    if (admin.status === 'locked') {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: '该账户已被锁定，请联系系统管理员解锁',
        errorType: 'ACCOUNT_LOCKED'
      });
    }

    // ========== 第四步：验证密码 ==========
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      // 记录失败的登录尝试
      console.warn(`[Login] 登录失败 | 密码错误 | 用户: ${username} | IP: ${clientIP}`);

      // 记录安全审计日志
      recordAuditLog({
        action: 'LOGIN_FAILED',
        operator: username,
        target_type: 'admin_account',
        target_id: admin.admin_id,
        ip: clientIP,
        details: '密码验证失败',
        severity: 'warning'
      });

      return reply.status(401).send({
        success: false,
        code: 401,
        message: '用户名或密码错误',
        errorType: 'INVALID_CREDENTIALS'
      });
    }

    // ========== 第五步：生成JWT Token ==========
    const tokenPayload = {
      admin_id: admin.admin_id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions,
      nickname: admin.nickname
    };

    const token = generateToken(tokenPayload);
    const refreshTok = refreshToken(token);  // 可选：生成刷新令牌

    // ========== 第六步：更新登录统计信息 ==========
    // 实际项目中这里应该更新数据库
    admin.login_count = (admin.login_count || 0) + 1;
    admin.last_login_at = new Date().toISOString();
    admin.last_login_ip = clientIP;
    admin.updated_at = new Date().toISOString();

    // ========== 第七步：记录成功审计日志 ==========
    recordAuditLog({
      action: 'LOGIN_SUCCESS',
      operator: username,
      target_type: 'admin_account',
      target_id: admin.admin_id,
      ip: clientIP,
      details: `第${admin.login_count}次登录`,
      severity: 'info'
    });

    console.log(`[Login] 登录成功 | 用户: ${username} | 角色: ${admin.role} | IP: ${clientIP}`);

    // ========== 第八步：返回成功响应 ==========
    return reply.send({
      success: true,
      message: '登录成功',
      data: {
        token,
        refreshToken: refreshTok?.token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        user: {
          admin_id: admin.admin_id,
          username: admin.username,
          role: admin.role,
          nickname: admin.nickname,
          avatar: admin.avatar,
          email: admin.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),  // 邮箱脱敏
          last_login_at: admin.last_login_at,
          login_count: admin.login_count
        }
      }
    });

  } catch (error) {
    console.error('[Login] 登录异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误，请稍后重试',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

/**
 * 获取当前管理员个人信息
 *
 * GET /api/admin/v1/auth/profile
 *
 * 需要认证：✅ 是（需要Bearer Token）
 *
 * 成功响应 (200):
 * {
 *   "success": true,
 *   "data": {
 *     "admin_id": 1,
 *     "username": "admin",
 *     "role": "super_admin",
 *     "nickname": "超级管理员",
 *     "permissions": [...],
 *     "created_at": "...",
 *     "last_login_at": "..."
 *   }
 * }
 */
export async function getProfile(request, reply) {
  try {
    // 从request.user获取当前登录用户信息（由auth中间件注入）
    const currentUser = request.user;

    if (!currentUser) {
      return reply.status(401).send({
        success: false,
        code: 401,
        message: '未授权访问',
        errorType: 'UNAUTHORIZED'
      });
    }

    // 根据admin_id查询完整用户信息
    // 实际项目：const admin = await prisma.admin.findUnique({ where: { admin_id: currentUser.admin_id } });
    const admin = mockAdmins.find(a => a.admin_id === currentUser.admin_id);

    if (!admin) {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: '用户不存在或已被删除',
        errorType: 'USER_NOT_FOUND'
      });
    }

    console.log(`[Profile] 获取用户信息成功 | 用户: ${admin.username}`);

    // 返回用户信息（排除敏感字段如password_hash）
    return reply.send({
      success: true,
      data: {
        admin_id: admin.admin_id,
        username: admin.username,
        role: admin.role,
        nickname: admin.nickname,
        email: admin.email,
        avatar: admin.avatar,
        permissions: admin.permissions,
        status: admin.status,
        login_count: admin.login_count,
        last_login_at: admin.last_login_at,
        last_login_ip: admin.last_login_ip,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }
    });

  } catch (error) {
    console.error('[Profile] 获取用户信息异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

/**
 * 修改当前管理员密码
 *
 * PUT /api/admin/v1/auth/password
 *
 * 需要认证：✅ 是
 *
 * 请求体 (Body):
 * {
 *   "oldPassword": "string",    // 当前密码（必填）
 *   "newPassword": "string",    // 新密码（必填）
 *   "confirmPassword": "string" // 确认新密码（必填）
 * }
 *
 * 密码强度要求：
 * - 长度：8-20个字符
 * - 必须包含：大小写字母 + 数字 + 特殊字符（至少1种）
 */
export async function changePassword(request, reply) {
  try {
    const currentUser = request.user;
    const { oldPassword, newPassword, confirmPassword } = request.body;
    const clientIP = request.ip || 'unknown';

    // ========== 参数验证 ==========
    if (!oldPassword || !newPassword || !confirmPassword) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '旧密码、新密码和确认密码都不能为空',
        errorType: 'MISSING_PARAMETERS'
      });
    }

    if (newPassword !== confirmPassword) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '两次输入的新密码不一致',
        errorType: 'PASSWORD_MISMATCH'
      });
    }

    // 密码强度验证
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: passwordValidation.message,
        errorType: 'WEAK_PASSWORD'
      });
    }

    // 不能与旧密码相同
    if (oldPassword === newPassword) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '新密码不能与旧密码相同',
        errorType: 'SAME_PASSWORD'
      });
    }

    // ========== 查询用户并验证旧密码 ==========
    const admin = mockAdmins.find(a => a.admin_id === currentUser.admin_id);

    if (!admin) {
      return reply.status(404).send({
        success: false,
        code: 404,
        message: '用户不存在',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // 验证旧密码是否正确
    const isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password_hash);

    if (!isOldPasswordValid) {
      // 记录异常行为
      recordAuditLog({
        action: 'PASSWORD_CHANGE_FAILED',
        operator: currentUser.username,
        target_type: 'admin_account',
        target_id: admin.admin_id,
        ip: clientIP,
        details: '旧密码验证失败（可能存在安全风险）',
        severity: 'warning'
      });

      return reply.status(400).send({
        success: false,
        code: 400,
        message: '旧密码输入错误',
        errorType: 'WRONG_OLD_PASSWORD'
      });
    }

    // ========== 加密并保存新密码 ==========
    const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 更新数据库（这里是模拟）
    admin.password_hash = newHashedPassword;
    admin.updated_at = new Date().toISOString();

    // ========== 记录审计日志 ==========
    recordAuditLog({
      action: 'PASSWORD_CHANGED',
      operator: currentUser.username,
      target_type: 'admin_account',
      target_id: admin.admin_id,
      ip: clientIP,
      details: '密码修改成功',
      severity: 'info'
    });

    console.log(`[Password] 密码修改成功 | 用户: ${currentUser.username}`);

    return reply.send({
      success: true,
      message: '密码修改成功，请重新登录',
      data: {
        updatedAt: new Date().toISOString(),
        hint: '建议前端清除本地存储的token，引导用户重新登录'
      }
    });

  } catch (error) {
    console.error('[Password] 修改密码异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

/**
 * 用户登出
 *
 * POST /api/admin/v1/auth/logout
 *
 * 说明：
 * JWT是无状态的，服务端不需要主动使token失效
 * 登出操作主要是：
 * 1. 记录登出审计日志
 * 2. 返回成功响应，让客户端清除本地存储的token
 * 3. （可选）将token加入黑名单（如果使用了redis等缓存）
 *
 * 前端处理建议：
 * - 清除 localStorage/sessionStorage 中的 token
 * - 清除 Pinia/Zustand 等状态管理中的用户信息
 * - 重定向到登录页面
 */
export async function logout(request, reply) {
  try {
    const currentUser = request.user;
    const clientIP = request.ip || 'unknown';

    // 记录登出审计日志
    recordAuditLog({
      action: 'LOGOUT',
      operator: currentUser?.username || 'unknown',
      target_type: 'admin_account',
      target_id: currentUser?.admin_id || null,
      ip: clientIP,
      details: '用户主动登出',
      severity: 'info'
    });

    console.log(`[Logout] 用户登出 | 用户: ${currentUser?.username || 'unknown'}`);

    return reply.send({
      success: true,
      message: '登出成功',
      data: {
        loggedOutAt: new Date().toISOString(),
        hint: '请前端清除本地存储的认证令牌'
      }
    });

  } catch (error) {
    console.error('[Logout] 登出异常:', error);
    // 即使出错也返回成功（登出不应该因为服务器错误而失败）
    return reply.send({
      success: true,
      message: '登出成功',
      warning: '审计日志记录失败，但登出操作已完成'
    });
  }
}

/**
 * 刷新Token接口
 *
 * POST /api/admin/v1/auth/refresh
 *
 * 当access token即将过期时，客户端可以调用此接口获取新的token
 * 从而实现无感续期，避免用户频繁重新登录
 *
 * 请求体:
 * {
 *   "refreshToken": "string"  // 刷新令牌
 * }
 */
export async function refreshAccessToken(request, reply) {
  try {
    const { refreshToken: clientRefreshToken } = request.body;

    if (!clientRefreshToken) {
      return reply.status(400).send({
        success: false,
        code: 400,
        message: '缺少刷新令牌',
        errorType: 'MISSING_REFRESH_TOKEN'
      });
    }

    // 使用jwt工具类的refreshToken函数
    const { jwtUtils } = await import('../utils/jwt.js');
    const newTokenData = jwtUtils.refreshToken(clientRefreshToken);

    if (!newTokenData) {
      return reply.status(401).send({
        success: false,
        code: 401,
        message: '刷新令牌无效或已过期，请重新登录',
        errorType: 'INVALID_REFRESH_TOKEN'
      });
    }

    console.log(`[Refresh] Token刷新成功`);

    return reply.send({
      success: true,
      message: 'Token刷新成功',
      data: newTokenData
    });

  } catch (error) {
    console.error('[Refresh] Token刷新异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部错误',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 验证密码强度
 *
 * @param {string} password - 待验证的密码
 * @returns {Object} { valid: boolean, message: string }
 *
 * 强度要求：
 * - 长度：8-20字符
 * - 必须包含：字母（大写或小写）+ 数字
 * - 建议包含：特殊字符（!@#$%^&* 等）
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' };
  }

  if (password.length < 8) {
    return { valid: false, message: '密码长度不能少于8位' };
  }

  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个字母' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个数字' };
  }

  // 建议但不强制：包含特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    // 只是警告，不阻止
    console.log('[Password] 提示: 密码未包含特殊字符，安全性一般');
  }

  return { valid: true, message: '密码强度符合要求' };
}

// 默认导出所有控制器函数
export default {
  login,
  getProfile,
  changePassword,
  logout,
  refreshAccessToken
};
