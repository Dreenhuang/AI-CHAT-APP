/**
 * JWT (JSON Web Token) 工具类
 *
 * 功能说明：
 * - generateToken(): 生成JWT token（用于登录成功后签发）
 * - verifyToken(): 验证并解析token（中间件调用，提取用户信息）
 * - refreshToken(): 刷新token（延长登录有效期）
 *
 * 技术细节：
 * 使用 jsonwebtoken 库实现
 * Token结构：Header.Payload.Signature
 * Payload包含：admin_id, username, role, permissions, iat(签发时间), exp(过期时间)
 *
 * 使用示例：
 * ```javascript
 * import jwt from '../utils/jwt.js';
 *
 * // 生成token
 * const token = jwt.generateToken({ admin_id: 1, username: 'admin', role: 'super_admin' });
 *
 * // 验证token
 * const payload = jwt.verifyToken(token);
 * ```
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 从环境变量读取JWT配置
 * 如果未配置，使用默认值（开发环境）
 */
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_please_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'prd-debate-admin';

/**
 * 生成JWT Token
 *
 * @param {Object} payload - 要编码的用户信息
 * @param {number} payload.admin_id - 管理员ID
 * @param {string} payload.username - 用户名
 * @param {string} payload.role - 角色 (super_admin/admin/observer)
 * @param {Array<string>} [payload.permissions] - 权限列表
 * @returns {string} 生成的JWT token字符串
 *
 * 使用场景：
 * - 用户登录成功后调用
 * - Token刷新时调用
 */
export function generateToken(payload) {
  try {
    // 构建完整的token payload
    const tokenPayload = {
      ...payload,
      // 添加标准声明
      iat: Math.floor(Date.now() / 1000),  // 签发时间（秒级时间戳）
      iss: JWT_ISSUER,                       // 签发者
      type: 'access'                         // token类型标识
    };

    // 签发token
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256'  // 使用HMAC SHA-256算法签名
    });

    console.log(`[JWT] Token已生成 | 用户: ${payload.username} | 角色: ${payload.role}`);

    return token;

  } catch (error) {
    console.error('[JWT] Token生成失败:', error.message);
    throw new Error('Token生成失败: ' + error.message);
  }
}

/**
 * 验证并解析JWT Token
 *
 * @param {string} token - 待验证的JWT token字符串
 * @returns {Object|null} 解析后的payload对象，验证失败返回null
 *   - 成功时返回：{ admin_id, username, role, permissions, iat, exp, iss }
 *   - 失败时返回：null
 *
 * 错误类型处理：
 * - TokenExpiredError: token已过期
 * - JsonWebTokenError: token无效/被篡改
 * - NotBeforeError: token尚未生效
 *
 * 使用场景：
 * - 认证中间件中调用，从请求头提取用户身份
 */
export function verifyToken(token) {
  try {
    if (!token) {
      console.warn('[JWT] verifyToken调用失败: token为空');
      return null;
    }

    // 验证并解码token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],  // 只接受HS256算法
      issuer: JWT_ISSUER       // 验证签发者
    });

    console.log(`[JWT] Token验证成功 | 用户: ${decoded.username}`);

    return decoded;

  } catch (error) {
    // 根据错误类型输出不同的日志
    if (error.name === 'TokenExpiredError') {
      console.warn(`[JWT] Token已过期 | 过期时间: ${new Date(error.expiredAt * 1000).toLocaleString()}`);
    } else if (error.name === 'JsonWebTokenError') {
      console.error(`[JWT] Token无效: ${error.message}`);
    } else {
      console.error(`[JWT] Token验证异常:`, error);
    }

    return null;
  }
}

/**
 * 刷新JWT Token（生成新token替换旧token）
 *
 * @param {string} oldToken - 即将过期的旧token
 * @returns {Object|null} 包含新token和过期时间的对象
 *   - { token: string, expiresIn: string }
 *   - 失败返回null
 *
 * 使用场景：
 * - 前端在token即将过期前（如剩余30分钟）主动请求刷新
 * - 实现无感续期，避免用户频繁重新登录
 *
 * 安全机制：
 * - 必须提供有效且未过期的旧token才能刷新
 * - 新token会继承原token的所有权限信息
 */
export function refreshToken(oldToken) {
  try {
    // 先验证旧token是否仍然有效
    const oldPayload = verifyToken(oldToken);

    if (!oldPayload) {
      console.warn('[JWT] Token刷新失败: 原token无效或已过期');
      return null;
    }

    // 移除旧的时间戳，让系统重新生成新的iat和exp
    const { iat, exp, type, ...userPayload } = oldPayload;

    // 生成新token
    const newToken = generateToken(userPayload);

    console.log(`[JWT] Token刷新成功 | 用户: ${userPayload.username}`);

    return {
      token: newToken,
      expiresIn: JWT_EXPIRES_IN,
      issuedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('[JWT] Token刷新异常:', error);
    return null;
  }
}

/**
 * 从Authorization请求头中提取Bearer Token
 *
 * @param {string} authHeader - Authorization头的值（如 "Bearer eyJhbGci..."）
 * @returns {string|null} 提取出的纯token字符串，格式错误返回null
 *
 * 使用场景：
 * - 认证中间件中从request.headers.authorization提取token
 *
 * 支持的格式：
 * - "Bearer xxx" （标准格式）✅
 * - "bearer xxx" （小写也支持）✅
 * - 直接传token字符串（兼容性处理）✅
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  // 处理 "Bearer <token>" 格式
  if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
    return authHeader.split(' ')[1];
  }

  // 兼容处理：如果整个header就是token（非标准但有些客户端这样用）
  if (authHeader.length > 50 && authHeader.includes('.')) {
    // JWT特征：包含至少2个点号，长度>50
    return authHeader;
  }

  return null;
}

// 导出默认对象（方便整体导入）
export default {
  generateToken,
  verifyToken,
  refreshToken,
  extractTokenFromHeader,
  // 配置常量（供其他模块引用）
  config: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: JWT_ISSUER
  }
};
