/**
 * RBAC (基于角色的访问控制) 权限中间件
 *
 * 功能说明：
 * - checkRole(): 检查用户角色是否在允许列表中
 * - checkPermission(): 检查用户是否拥有特定权限
 * - 支持三级角色体系：super_admin > admin > observer
 *
 * 角色权限矩阵：
 * ┌─────────────┬──────────┬────────┬───────────┐
 * │   权限/角色  │super_admin│ admin  │ observer  │
 * ├─────────────┼──────────┼────────┼───────────┤
 * │ 用户管理     │    ✅    │   ✅   │     ❌    │
 * │ 内容管理     │    ✅    │   ✅   │     ❌    │
 * │ 系统配置     │    ✅    │   ❌   │     ❌    │
 * │ 数据查看     │    ✅    │   ✅   │     ✅    │
 * │ 审计日志     │    ✅    │   ✅   │     ✅    │
 * └─────────────┴──────────┴────────┴───────────┘
 *
 * 使用方式：
 * ```javascript
 * // 方式1: 检查角色（只允许超级管理员和普通管理员）
 * fastify.delete('/users/:id', {
 *   preHandler: [fastify.auth, checkRole(['super_admin', 'admin'])]
 * }, handler);
 *
 * // 方式2: 检查具体权限（需要用户管理权限）
 * fastify.post('/users', {
 *   preHandler: [fastify.auth, checkPermission('user:create')]
 * }, handler);
 * ```
 */

// ============================================
// 角色定义常量
// ============================================

/**
 * 系统支持的角色类型
 * 权限层级：super_admin(最高) > admin(中等) > observer(最低)
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',  // 超级管理员：拥有所有权限
  ADMIN: 'admin',              // 普通管理员：拥有大部分业务权限
  OBSERVER: 'observer'         // 只读观察者：只能查看，不能修改
};

/**
 * 角色层级（数值越大权限越高）
 * 用于快速比较权限高低
 */
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 3,  // 最高权限
  [ROLES.ADMIN]: 2,        // 中等权限
  [ROLES.OBSERVER]: 1      // 只读权限
};

// ============================================
// 权限定义（细粒度权限点）
// ============================================

/**
 * 完整的权限列表
 * 格式：模块:操作 (如 user:create 表示创建用户)
 */
export const PERMISSIONS = {
  // 用户管理模块
  USER_VIEW: 'user:view',           // 查看用户列表
  USER_CREATE: 'user:create',       // 创建用户
  USER_EDIT: 'user:edit',           // 编辑用户信息
  USER_DELETE: 'user:delete',       // 删除用户
  USER_RESET_PASSWORD: 'user:reset_password',  // 重置密码

  // 角色管理模块
  ROLE_VIEW: 'role:view',
  ROLE_ASSIGN: 'role:assign',

  // 内容管理模块
  CONTENT_VIEW: 'content:view',
  CONTENT_CREATE: 'content:create',
  CONTENT_EDIT: 'content:edit',
  CONTENT_DELETE: 'content-delete',
  CONTENT_PUBLISH: 'content:publish',

  // 系统配置模块
  SYSTEM_CONFIG_VIEW: 'system:config_view',
  SYSTEM_CONFIG_EDIT: 'system:config_edit',
  SYSTEM_CONFIG_MANAGE: 'system:config_manage',

  // 数据统计模块
  DATA_ANALYTICS: 'data:analytics',
  DATA_EXPORT: 'data:export',

  // 审计日志模块
  AUDIT_LOG_VIEW: 'audit_log:view',
  AUDIT_LOG_EXPORT: 'audit_log:export'
};

/**
 * 角色默认权限映射表
 * 定义每个角色默认拥有的权限集合
 */
const ROLE_DEFAULT_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // 超级管理员拥有所有权限（这里不列举，代码中特殊处理）
    '*'
  ],

  [ROLES.ADMIN]: [
    // 用户管理
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    // 内容管理
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_PUBLISH,
    // 数据统计
    PERMISSIONS.DATA_ANALYTICS,
    PERMISSIONS.DATA_EXPORT,
    // 审计日志
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.AUDIT_LOG_EXPORT
  ],

  [ROLES.OBSERVER]: [
    // 只读权限
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.DATA_ANALYTICS,
    PERMISSIONS.AUDIT_LOG_VIEW
  ]
};

// ============================================
// 权限检查函数
// ============================================

/**
 * 检查用户角色是否在允许的角色列表中
 *
 * @param {Array<string>} allowedRoles - 允许访问的角色列表
 * @returns {Function} Fastify中间件函数
 *
 * 使用示例：
 * ```javascript
 * // 只有超级管理员才能访问的接口
 * checkRole(['super_admin'])
 *
 * // 超级管理员和普通管理员都能访问
 * checkRole(['super_admin', 'admin'])
 * ```
 */
export function checkRole(allowedRoles) {
  return async function roleCheckMiddleware(request, reply) {
    try {
      // 前置条件：必须先通过认证中间件（request.user必须存在）
      if (!request.user) {
        console.error('[RBAC] 错误: 未检测到用户信息，请确保auth中间件在此中间件之前执行');
        return reply.status(500).send({
          success: false,
          code: 500,
          message: '服务器配置错误：缺少认证中间件',
          errorType: 'CONFIG_ERROR'
        });
      }

      const userRole = request.user.role;
      const userId = request.user.admin_id;
      const username = request.user.username;

      console.log(
        `[RBAC] 角色检查 | 用户: ${username} | ` +
        `当前角色: ${userRole} | 要求角色: ${JSON.stringify(allowedRoles)}`
      );

      // 检查用户角色是否在允许列表中
      if (!allowedRoles.includes(userRole)) {
        console.warn(
          `[RBAC] 权限不足 | 用户: ${username} | ` +
          `角色 ${userRole} 不在允许列表 [${allowedRoles.join(', ')}] 中`
        );

        return reply.status(403).send({
          success: false,
          code: 403,
          message: '权限不足：您的角色无权执行此操作',
          errorType: 'INSUFFICIENT_ROLE',
          details: {
            currentRole: userRole,
            requiredRoles: allowedRoles,
            hint: '请联系超级管理员提升权限或使用有权限的账号登录'
          }
        });
      }

      // 角色检查通过，继续执行
      console.log(`[RBAC] 角色检查通过 | 用户: ${username}`);

    } catch (error) {
      console.error('[RBAC] 角色检查异常:', error);
      return reply.status(500).send({
        success: false,
        code: 500,
        message: '权限验证过程中发生错误',
        errorType: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * 检查用户是否拥有特定权限
 *
 * @param {string} requiredPermission - 需要的权限标识（如 'user:create'）
 * @returns {Function} Fastify中间件函数
 *
 * 工作原理：
 * 1. 先检查用户的角色默认权限
 * 2. 如果用户有自定义权限（从token.permissions字段），也会一并检查
 * 3. super_admin角色自动拥有所有权限（跳过详细检查）
 *
 * 使用示例：
 * ```javascript
 * // 需要用户创建权限
 * checkPermission('user:create')
 *
 * // 需要系统配置编辑权限
 * checkPermission('system:config_edit')
 * ```
 */
export function checkPermission(requiredPermission) {
  return async function permissionCheckMiddleware(request, reply) {
    try {
      // 前置条件检查
      if (!request.user) {
        return reply.status(500).send({
          success: false,
          code: 500,
          message: '服务器配置错误：缺少认证中间件',
          errorType: 'CONFIG_ERROR'
        });
      }

      const userRole = request.user.role;
      const userPermissions = request.user.permissions || [];
      const username = request.user.username;

      console.log(
        `[RBAC] 权限检查 | 用户: ${username} | ` +
        `所需权限: ${requiredPermission}`
      );

      // ========== 特殊处理：超级管理员拥有所有权限 ==========
      if (userRole === ROLES.SUPER_ADMIN) {
        console.log(`[RBAC] 超级管理员自动授权 | 用户: ${username}`);
        return;  // 直接放行
      }

      // ========== 检查角色默认权限 ==========
      const rolePermissions = ROLE_DEFAULT_PERMISSIONS[userRole] || [];

      // 检查是否有通配符权限（表示该角色拥有所有权限）
      if (rolePermissions.includes('*')) {
        console.log(`[RBAC] 角色 ${userRole} 拥有通配符权限 | 用户: ${username}`);
        return;  // 放行
      }

      // ========== 检查具体权限 ==========
      // 合并：角色默认权限 + 用户个人权限（如果有的话）
      const allPermissions = new Set([
        ...rolePermissions,
        ...userPermissions
      ]);

      if (!allPermissions.has(requiredPermission)) {
        console.warn(
          `[RBAC] 权限不足 | 用户: ${username} | ` +
          `缺少权限: ${requiredPermission}`
        );

        return reply.status(403).send({
          success: false,
          code: 403,
          message: `权限不足：需要 "${requiredPermission}" 权限`,
          errorType: 'INSUFFICIENT_PERMISSION',
          details: {
            requiredPermission,
            currentRole: userRole,
            availablePermissions: Array.from(allPermissions),
            hint: '请联系管理员为您分配所需权限'
          }
        });
      }

      // 权限检查通过
      console.log(`[RBAC] 权限检查通过 | 用户: ${username} | 权限: ${requiredPermission}`);

    } catch (error) {
      console.error('[RBAC] 权限检查异常:', error);
      return reply.status(500).send({
        success: false,
        code: 500,
        message: '权限验证过程中发生错误',
        errorType: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * 组合多个权限检查（满足任一即可）
 *
 * @param {Array<string>} permissions - 权限列表（OR关系）
 * @returns {Function} Fastify中间件函数
 *
 * 使用场景：
 * - 某个操作可以通过多种权限完成
 * - 如：删除内容可能需要 content:delete 或 system:manage 任一即可
 */
export function checkAnyPermission(permissions) {
  return async function anyPermissionCheck(request, reply) {
    if (!request.user) {
      return reply.status(500).send({
        success: false,
        code: 500,
        message: '服务器配置错误：缺少认证中间件'
      });
    }

    // 超级管理员直接放行
    if (request.user.role === ROLES.SUPER_ADMIN) {
      return;
    }

    const allPermissions = new Set([
      ...(ROLE_DEFAULT_PERMISSIONS[request.user.role] || []),
      ...(request.user.permissions || [])
    ]);

    // 检查是否拥有其中任意一个权限
    const hasAnyPermission = permissions.some(perm => allPermissions.has(perm));

    if (!hasAnyPermission) {
      return reply.status(403).send({
        success: false,
        code: 403,
        message: `权限不足：需要以下权限之一 [${permissions.join(', ')}]`,
        errorType: 'INSUFFICIENT_PERMISSION'
      });
    }
  };
}

// ============================================
// 辅助工具函数
// ============================================

/**
 * 获取角色的所有可用权限
 *
 * @param {string} role - 角色名称
 * @returns {Array<string>} 该角色拥有的权限列表
 */
export function getRolePermissions(role) {
  if (role === ROLES.SUPER_ADMIN) {
    // 返回所有已定义的权限
    return Object.values(PERMISSIONS);
  }
  return ROLE_DEFAULT_PERMISSIONS[role] || [];
}

/**
 * 比较两个角色的权限等级
 *
 * @param {string} role1 - 角色1
 * @param {string} role2 - 角色2
 * @returns {number} 正数表示role1>role2，负数表示role1<role2，0表示相等
 */
export function compareRoles(role1, role2) {
  return (ROLE_HIERARCHY[role1] || 0) - (ROLE_HIERARCHY[role2] || 0);
}

// 默认导出
export default {
  checkRole,
  checkPermission,
  checkAnyPermission,
  getRolePermissions,
  compareRoles,
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY
};
