/**
 * 用户管理路由模块 (User Routes)
 *
 * 功能说明：
 * 定义所有与用户管理相关的API端点
 * 遵循RESTful规范，统一使用 /api/admin/v1/users 前缀
 *
 * 路由列表：
 * GET    /api/admin/v1/users            - U001: 获取用户列表（分页查询）
 * GET    /api/admin/v1/users/search      - U004: 用户搜索（实时联想）
 * GET    /api/admin/v1/users/:id         - U002: 获取用户详情
 * PATCH  /api/admin/v1/users/:id/status  - U003: 修改用户状态（禁用/启用）
 *
 * 权限配置：
 * - 所有接口都需要认证（Bearer Token）
 * - 列表/详情/搜索：需要 user:view 权限
 * - 状态修改：需要 user:edit 权限
 * - super_admin 拥有所有权限
 * - admin 可以查看和禁用/启用
 * - observer 只能查看
 *
 * 使用方式：
 * 在主应用文件中注册此路由模块：
 * ```javascript
 * import userRoutes from './routes/user.js';
 * await fastify.register(userRoutes, { prefix: '/api/admin/v1/users' });
 * ```
 */

// ============================================
// 导入依赖
// ============================================

import { authMiddleware as auth } from '../middleware/auth.js';
import { checkPermission, ROLES } from '../middleware/rbac.js';
import userController from '../controllers/userController.js';

/**
 * Fastify路由插件
 * 自动注册所有用户管理相关的API端点
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项（可配置前缀等）
 */
export default async function userRoutes(fastify, options) {
  // 注意：认证中间件已直接导入，无需通过插件注册

  // ============================================
  // U001: 获取用户列表 (GET /users)
  // ============================================

  /**
   * 获取用户列表接口
   *
   * GET /
   *
   * 需要认证 ✅ | 需要权限：user:view
   *
   * 功能：
   * 分页查询平台用户列表，支持多条件筛选和排序
   *
   * 查询参数：
   * - page: 页码（默认1）
   * - pageSize: 每页数量（默认20，最大100）
   * - search: 搜索关键词（手机号/昵称模糊搜索）
   * - status: 状态筛选（active/disabled/all）
   * - sortBy: 排序字段（createdAt/lastLoginAt/nickname/debateCount）
   * - order: 排序方向（asc/desc）
   */
  fastify.get('/', {
    preHandler: [
      auth,                                    // 第一步：验证JWT Token
      checkPermission('user:view')              // 第二步：检查查看权限
    ],
    schema: {
      description: '获取用户列表',
      tags: ['User Management'],
      summary: '分页查询平台用户列表，支持筛选、搜索和排序',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: '页码（从1开始）',
            minimum: 1,
            default: 1,
            example: 1
          },
          pageSize: {
            type: 'integer',
            description: '每页数量（最大100）',
            minimum: 1,
            maximum: 100,
            default: 20,
            example: 20
          },
          search: {
            type: 'string',
            description: '搜索关键词（手机号或昵称模糊匹配）',
            minLength: 1,
            maxLength: 50,
            example: '小王'
          },
          status: {
            type: 'string',
            enum: ['active', 'disabled', 'all'],
            description: '按状态筛选用户',
            default: 'all',
            example: 'active'
          },
          sortBy: {
            type: 'string',
            enum: ['createdAt', 'lastLoginAt', 'nickname', 'debateCount'],
            description: '排序字段',
            default: 'createdAt',
            example: 'lastLoginAt'
          },
          order: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: '排序方向',
            default: 'desc',
            example: 'desc'
          }
        }
      },
      response: {
        200: {
          description: '成功获取用户列表',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: '用户ID' },
                      phone: { type: 'string', description: '手机号（脱敏）' },
                      nickname: { type: 'string', description: '昵称' },
                      avatar: { type: 'string', description: '头像URL' },
                      status: { type: 'string', enum: ['active', 'disabled'] },
                      role: { type: 'string', enum: ['user', 'vip'] },
                      createdAt: { type: 'string', format: 'date-time' },
                      lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                      debateCount: { type: 'integer' },
                      messageCount: { type: 'integer' },
                      groupCount: { type: 'integer' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer', description: '总记录数' },
                    page: { type: 'integer', description: '当前页码' },
                    pageSize: { type: 'integer', description: '每页数量' },
                    totalPages: { type: 'integer', description: '总页数' }
                  }
                }
              }
            },
            permissions: {
              type: 'object',
              properties: {
                can_edit: { type: 'boolean', description: '是否有编辑权限' },
                can_delete: { type: 'boolean', description: '是否有删除权限' },
                can_export: { type: 'boolean', description: '是否有导出权限' }
              }
            }
          }
        },
        401: {
          description: '未授权或token无效',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 401 },
            message: { type: 'string' }
          }
        },
        403: {
          description: '权限不足',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 403 },
            message: { type: 'string' }
          }
        }
      }
    }
  }, userController.getUserList);

  // ============================================
  // U004: 用户搜索 (GET /users/search)
  // ============================================

  /**
   * 用户搜索接口（实时联想）
   *
   * GET /search?q=xxx
   *
   * 需要认证 ✅ | 需要权限：user:view
   *
   * 功能：
   * 实时搜索联想，用于输入框自动补全提示
   * 响应时间要求 < 200ms
   */
  fastify.get('/search', {
    preHandler: [
      auth,
      checkPermission('user:view')
    ],
    schema: {
      description: '用户搜索（实时联想）',
      tags: ['User Management'],
      summary: '根据关键词实时搜索用户，用于输入框自动补全',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: {
            type: 'string',
            description: '搜索关键词（手机号或昵称）',
            minLength: 1,
            maxLength: 50,
            example: '小王'
          }
        }
      },
      response: {
        200: {
          description: '成功返回搜索结果',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nickname: { type: 'string' },
                  phone: { type: 'string', description: '手机号（脱敏）' },
                  avatar: { type: 'string' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                count: { type: 'integer' },
                duration: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, userController.searchUsers);

  // ============================================
  // U002: 获取用户详情 (GET /users/:id)
  // ============================================

  /**
   * 获取用户详情接口
   *
   * GET /:id
   *
   * 需要认证 ✅ | 需要权限：user:view
   *
   * 功能：
   * 返回用户的完整画像信息，包括基本信息、活跃记录、设备信息、风险标记等
   */
  fastify.get('/:id', {
    preHandler: [
      auth,
      checkPermission('user:view')
    ],
    schema: {
      description: '获取用户详情',
      tags: ['User Management'],
      summary: '获取指定用户的完整画像信息',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: '用户ID（UUID格式）',
            example: 'user_001'
          }
        }
      },
      response: {
        200: {
          description: '成功获取用户详情',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                // 基础信息
                id: { type: 'string' },
                phone: { type: 'string' },
                nickname: { type: 'string' },
                avatar: { type: 'string', nullable: true },
                status: { type: 'string' },
                role: { type: 'string' },
                email: { type: 'string', description: '邮箱（脱敏）' },
                gender: { type: 'string' },
                bio: { type: 'string' },

                // 统计数据
                debateCount: { type: 'integer' },
                messageCount: { type: 'integer' },
                groupCount: { type: 'integer' },

                // 时间戳
                createdAt: { type: 'string', format: 'date-time' },
                lastLoginAt: { type: 'string', format: 'date-time', nullable: true },

                // 扩展信息
                recentActivity: {
                  type: 'array',
                  description: '最近活跃记录（最多5条）',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['message', 'debate'] },
                      content: { type: 'string' },
                      targetId: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                deviceInfo: {
                  type: 'array',
                  description: '设备信息列表',
                  items: {
                    type: 'object',
                    properties: {
                      ip: { type: 'string' },
                      userAgent: { type: 'string' },
                      deviceType: { type: 'string' },
                      location: { type: 'string' },
                      loginTime: { type: 'string', format: 'date-time' },
                      isActive: { type: 'boolean' }
                    }
                  }
                },
                riskMarks: {
                  type: 'object',
                  description: '风险标记信息',
                  properties: {
                    isReported: { type: 'boolean' },
                    reportCount: { type: 'integer' },
                    hasViolation: { type: 'boolean' },
                    violationCount: { type: 'integer' },
                    lastViolationReason: { type: 'string', nullable: true },
                    lastViolationTime: { type: 'string', format: 'date-time', nullable: true }
                  }
                }
              }
            }
          }
        },
        404: {
          description: '用户不存在',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 404 },
            message: { type: 'string' },
            errorType: { type: 'string' }
          }
        }
      }
    }
  }, userController.getUserDetail);

  // ============================================
  // U003: 修改用户状态 (PATCH /users/:id/status)
  // ============================================

  /**
   * 修改用户状态接口（禁用/启用）
   *
   * PATCH /:id/status
   *
   * 需要认证 ✅ | 需要权限：user:edit
   *
   * 功能：
   * 将用户状态在 active 和 disabled 之间切换
   * 必须提供原因（用于审计追溯）
   * 不能禁用自己
   * 记录详细的审计日志
   */
  fastify.patch('/:id/status', {
    preHandler: [
      auth,
      checkPermission('user:edit')
    ],
    schema: {
      description: '修改用户状态（禁用/启用）',
      tags: ['User Management'],
      summary: '禁用或启用指定用户账户，必须提供操作原因',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: '目标用户ID',
            example: 'user_003'
          }
        }
      },
      body: {
        type: 'object',
        required: ['status', 'reason'],
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'disabled'],
            description: '目标状态：active（启用）或 disabled（禁用）',
            example: 'disabled'
          },
          reason: {
            type: 'string',
            description: '操作原因说明（必填，最少5个字符）',
            minLength: 5,
            maxLength: 500,
            example: '多次发布违规内容，经警告无效后执行禁用'
          }
        }
      },
      response: {
        200: {
          description: '状态修改成功',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '用户已成功禁用' },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                previousStatus: { type: 'string' },
                newStatus: { type: 'string' },
                reason: { type: 'string' },
                operatedBy: { type: 'string' },
                operatedAt: { type: 'string', format: 'date-time' },
                impact: {
                  type: 'object',
                  properties: {
                    sessionsTerminated: { type: 'integer', description: '被踢出的会话数' },
                    debatesInterrupted: { type: 'integer', description: '被打断的辩论数' },
                    messagesBlocked: { type: 'integer', description: '被拦截的消息数' }
                  }
                },
                frontend_sync: {
                  type: 'object',
                  description: '前端同步指令',
                  properties: {
                    invalidateCache: { type: 'boolean' },
                    pushNotification: { type: 'boolean' },
                    websocketBroadcast: {
                      type: 'object',
                      properties: {
                        event: { type: 'string' },
                        payload: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: '参数错误（reason太短、status值无效等）',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 400 },
            message: { type: 'string' },
            errorType: { type: 'string' }
          }
        },
        403: {
          description: '禁止操作（尝试禁用自己或权限不足）',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 403 },
            message: { type: 'string', example: '不能禁用您自己的账户' },
            errorType: { type: 'string' }
          }
        },
        404: {
          description: '目标用户不存在',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 404 },
            message: { type: 'string' },
            errorType: { type: 'string' }
          }
        }
      }
    }
  }, userController.updateUserStatus);

  // ============================================
  // 输出日志
  // ============================================
  console.log('[Routes] 用户管理路由模块已注册 | 前缀: /api/admin/v1/users');
  console.log('[Routes] 可用端点:');
  console.log('  - GET    /api/admin/v1/users           用户列表（U001）');
  console.log('  - GET    /api/admin/v1/users/search     用户搜索（U004）');
  console.log('  - GET    /api/admin/v1/users/:id        用户详情（U002）');
  console.log('  - PATCH  /api/admin/v1/users/:id/status 修改状态（U003）');
}
