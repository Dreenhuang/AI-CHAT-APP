/**
 * 认证路由模块 (Auth Routes)
 *
 * 功能说明：
 * 定义所有与认证相关的API端点
 * 遵循RESTful规范，统一使用 /api/admin/v1/auth 前缀
 *
 * 路由列表：
 * POST   /api/admin/v1/auth/login      - 管理员登录
 * GET    /api/admin/v1/auth/profile    - 获取当前用户信息
 * PUT    /api/admin/v1/auth/password   - 修改密码
 * POST   /api/admin/v1/auth/logout     - 用户登出
 * POST   /api/admin/v1/auth/refresh    - 刷新访问令牌
 *
 * 使用方式：
 * 在主应用文件中注册此路由模块：
 * ```javascript
 * import authRoutes from './routes/auth.js';
 * await fastify.register(authRoutes, { prefix: '/api/admin/v1/auth' });
 * ```
 */

import { authMiddleware as auth } from '../middleware/auth.js';
import authController from '../controllers/authController.js';

/**
 * Fastify路由插件
 * 自动注册所有认证相关的API端点
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项（可配置前缀等）
 */
export default async function authRoutes(fastify, options) {
  // 注意：认证中间件已直接导入，无需通过插件注册

  /**
   * 管理员登录接口
   *
   * POST /login
   *
   * 不需要认证（公开接口）
   * 用于获取JWT token
   */
  fastify.post('/login', {
    schema: {
      description: '管理员登录',
      tags: ['Authentication'],
      summary: '使用用户名和密码登录系统',
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            description: '管理员用户名',
            minLength: 3,
            maxLength: 50,
            examples: ['admin']
          },
          password: {
            type: 'string',
            description: '登录密码',
            minLength: 6,
            maxLength: 100,
            examples: ['Admin@123456']
          }
        }
      },
      response: {
        200: {
          description: '登录成功',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '登录成功' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT访问令牌' },
                refreshToken: { type: 'string', description: '刷新令牌（可选）' },
                expiresIn: { type: 'string', example: '24h' },
                user: {
                  type: 'object',
                  properties: {
                    admin_id: { type: 'integer' },
                    username: { type: 'string' },
                    role: { type: 'string' },
                    nickname: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          description: '认证失败（用户名或密码错误）',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 401 },
            message: { type: 'string', example: '用户名或密码错误' },
            errorType: { type: 'string' }
          }
        }
      }
    }
  }, authController.login);

  /**
   * 获取当前用户信息接口
   *
   * GET /profile
   *
   * 需要认证 ✅
   * 返回当前登录管理员的完整信息（不含密码）
   */
  fastify.get('/profile', {
    preHandler: [auth],  // 应用认证中间件
    schema: {
      description: '获取当前用户信息',
      tags: ['Authentication'],
      summary: '获取已登录管理员的个人信息',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功获取用户信息',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                admin_id: { type: 'integer' },
                username: { type: 'string' },
                role: { type: 'string' },
                nickname: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } },
                last_login_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          description: '未授权或token无效'
        }
      }
    }
  }, authController.getProfile);

  /**
   * 修改密码接口
   *
   * PUT /password
   *
   * 需要认证 ✅
   * 必须提供正确的旧密码才能修改
   */
  fastify.put('/password', {
    preHandler: [auth],
    schema: {
      description: '修改当前用户密码',
      tags: ['Authentication'],
      summary: '修改已登录管理员的登录密码',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['oldPassword', 'newPassword', 'confirmPassword'],
        properties: {
          oldPassword: {
            type: 'string',
            description: '当前密码',
            minLength: 6
          },
          newPassword: {
            type: 'string',
            description: '新密码（8-20位，必须包含字母和数字）',
            minLength: 8,
            maxLength: 20
          },
          confirmPassword: {
            type: 'string',
            description: '确认新密码（必须与新密码一致）'
          }
        }
      },
      response: {
        200: {
          description: '密码修改成功',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '密码修改成功，请重新登录' },
            data: {
              type: 'object',
              properties: {
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        400: {
          description: '参数错误（旧密码错误、两次密码不一致、密码强度不足等）'
        }
      }
    }
  }, authController.changePassword);

  /**
   * 用户登出接口
   *
   * POST /logout
   *
   * 需要认证 ✅
   * JWT是无状态的，登出主要是记录日志并通知客户端清除token
   */
  fastify.post('/logout', {
    preHandler: [auth],
    schema: {
      description: '用户登出',
      tags: ['Authentication'],
      summary: '注销当前用户的登录状态',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '登出成功',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '登出成功' },
            data: {
              type: 'object',
              properties: {
                loggedOutAt: { type: 'string', format: 'date-time' },
                hint: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, authController.logout);

  /**
   * 刷新Token接口
   *
   * POST /refresh
   *
   * 可选认证（如果refresh token有效则不需要access token）
   * 用于在access token过期前获取新的token，实现无感续期
   */
  fastify.post('/refresh', {
    schema: {
      description: '刷新访问令牌',
      tags: ['Authentication'],
      summary: '使用刷新令牌获取新的访问令牌',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: '刷新令牌（在登录时获取）'
          }
        }
      },
      response: {
        200: {
          description: 'Token刷新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                expiresIn: { type: 'string' },
                issuedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          description: '刷新令牌无效或已过期'
        }
      }
    }
  }, authController.refreshAccessToken);

  console.log('[Routes] 认证路由模块已注册 | 前缀: /api/admin/v1/auth');
}
