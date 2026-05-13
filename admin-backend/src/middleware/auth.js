/**
 * JWT 认证中间件
 *
 * 功能说明：
 * - 从HTTP请求头提取Bearer Token
 * - 验证Token的有效性（签名、过期时间、签发者）
 * - 将解析出的用户信息挂载到 request.user 对象
 * - 统一处理各种认证失败场景（401错误响应）
 *
 * 工作流程：
 * 1. 检查Authorization请求头是否存在
 * 2. 提取Bearer Token字符串
 * 3. 调用jwt.verifyToken()验证token
 * 4. 成功：将用户信息挂载到request.user，调用next()继续
 * 5. 失败：返回401错误响应，终止请求
 *
 * 使用方式（Fastify框架）：
 * ```javascript
 * // 在路由中应用中间件
 * fastify.get('/protected', { preHandler: [fastify.auth] }, handler);
 *
 * // 或在路由钩子中全局注册
 * fastify.addHook('onRequest', fastify.auth);
 * ```
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';

/**
 * 认证中间件函数（Fastify装饰器格式）
 *
 * @param {Object} request - Fastify请求对象
 * @param {Object} reply - Fastify响应对象
 * @returns {void} 认证成功继续执行，失败直接返回401响应
 *
 * request.user 结构（认证成功后）：
 * {
 *   admin_id: number,      // 管理员ID
 *   username: string,      // 用户名
 *   role: string,          // 角色 (super_admin/admin/observer)
 *   permissions: Array,    // 权限列表
 *   iat: number,           // 签发时间戳
 *   exp: number            // 过期时间戳
 * }
 */
export async function authMiddleware(request, reply) {
  try {
    // ========== 第一步：从请求头提取Token ==========
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // 场景1：未提供Authorization头（用户未登录或忘记带Token）
      console.warn('[Auth] 认证失败: 缺少Authorization头');
      return reply.status(401).send({
        success: false,
        code: 401,
        message: '未提供认证令牌，请先登录',
        errorType: 'MISSING_TOKEN'
      });
    }

    // ========== 第二步：提取Bearer Token ==========
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // 场景2：Authorization头格式不正确（不是"Bearer xxx"格式）
      console.warn('[Auth] 认证失败: Token格式无效');
      return reply.status(401).send({
        success: false,
        code: 401,
        message: '认证令牌格式无效，请使用 Bearer <token> 格式',
        errorType: 'INVALID_TOKEN_FORMAT'
      });
    }

    // ========== 第三步：验证Token有效性 ==========
    const payload = verifyToken(token);

    if (!payload) {
      // 场景3：Token验证失败（可能已过期、被篡改、签名不匹配等）
      // 注意：verifyToken内部已经记录了详细日志，这里不需要重复

      // 尝试判断是否是过期导致的失败
      try {
        const jwt = (await import('jsonwebtoken')).default;
        jwt.decode(token);  // 尝试解码查看exp字段
        return reply.status(401).send({
          success: false,
          code: 401,
          message: '认证令牌已过期，请重新登录',
          errorType: 'TOKEN_EXPIRED',
          hint: '前端可调用 /auth/refresh 接口刷新token'
        });
      } catch {
        // 解码都失败了，说明是无效的token
        return reply.status(401).send({
          success: false,
          code: 401,
          message: '认证令牌无效，请重新登录',
          errorType: 'INVALID_TOKEN'
        });
      }
    }

    // ========== 第四步：检查Token类型 ==========
    if (payload.type !== 'access') {
      // 场景4：使用了非access类型的token（如refresh token误用）
      console.warn(`[Auth] 认证失败: Token类型错误 | 实际类型: ${payload.type}`);
      return reply.status(401).send({
        success: false,
        code: 401,
        message: '使用了错误的令牌类型',
        errorType: 'WRONG_TOKEN_TYPE'
      });
    }

    // ========== 第五步：将用户信息挂载到request ==========
    // 这里只提取业务需要的核心字段，避免暴露敏感信息
    request.user = {
      admin_id: payload.admin_id,
      username: payload.username,
      role: payload.role,
      permissions: payload.permissions || [],
      iat: payload.iat,
      exp: payload.exp
    };

    // 记录认证成功的日志（debug级别，生产环境可关闭）
    console.log(
      `[Auth] 认证成功 | 用户ID: ${payload.admin_id} | ` +
      `用户名: ${payload.username} | 角色: ${payload.role}`
    );

    // ========== 第六步：继续执行后续处理器 ==========
    // 调用next()让请求继续传递给路由处理器
    // 在Fastify中，preHandler返回undefined表示继续执行

  } catch (error) {
    // 兜底异常捕获（理论上不应该走到这里）
    console.error('[Auth] 认证中间件异常:', error);
    return reply.status(500).send({
      success: false,
      code: 500,
      message: '服务器内部认证错误',
      errorType: 'INTERNAL_ERROR'
    });
  }
}

/**
 * 可选认证中间件（不会阻止请求，只是尝试提取用户信息）
 *
 * 适用场景：
 * - 有些接口既支持登录用户访问，也支持匿名访问
 * - 登录后可以显示更多个性化内容
 *
 * 使用方式：
 * ```javascript
 * fastify.get('/public-data', { preHandler: [optionalAuth] }, handler);
 * ```
 */
export async function optionalAuth(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.type === 'access') {
        request.user = {
          admin_id: payload.admin_id,
          username: payload.username,
          role: payload.role,
          permissions: payload.permissions || []
        };
      }
    }

    // 无论是否携带有效token，都继续执行
    // 如果没有token或token无效，request.user为undefined

  } catch (error) {
    // 可选认证即使出错也不应该阻断请求
    console.warn('[OptionalAuth] 解析token时出现异常（已忽略）:', error.message);
  }
}

/**
 * Fastify插件注册函数
 * 将认证中间件注册为Fastify实例的装饰器
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 配置选项（预留扩展）
 */
export async function authPlugin(fastify, options) {
  // 注册为装饰器，这样可以通过 fastify.auth 访问
  fastify.decorate('auth', authMiddleware);
  fastify.decorate('optionalAuth', optionalAuth);

  console.log('[Plugin] JWT认证中间件已注册');
}

// 默认导出主中间件
export default authMiddleware;
