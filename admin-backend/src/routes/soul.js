/**
 * Soul角色管理路由模块 (Soul Routes)
 *
 * 功能说明：
 * 定义所有与Soul角色管理相关的API端点
 * 遵循RESTful规范，统一使用 /api/admin/v1/souls 前缀
 *
 * 路由列表：
 *
 * ┌──────────┬─────────────────────────────────────┬──────────┬────────────────────┐
 * │  方法    │  路径                               │  权限    │  功能说明           │
 * ├──────────┼─────────────────────────────────────┼──────────┼────────────────────┤
 * │ GET      │ /souls                             │ 所有角色 │ S001: 角色列表查询   │
 * │ GET      │ /souls/:id                         │ 所有角色 │ S002: 角色详情查看   │
 * │ POST     │ /souls                             │ admin+   │ S003: 创建新角色    │
 * │ PUT      │ /souls/:id                         │ admin+   │ S003: 编辑角色      │
 * │ PATCH    │ /souls/:id/status                  │ admin+   │ S004: 激活/停用     │
 * │ PATCH    │ /souls/:id/ai-config               │ admin+   │ S005: 调整AI参数   │
 * └──────────┴─────────────────────────────────────┴──────────┴────────────────────┘
 *
 * 权限矩阵：
 * ┌──────────────────┬──────────┬────────┬───────────┐
 * │ 操作              │super_admin│ admin  │ observer  │
 * ├──────────────────┼──────────┼────────┼───────────┤
 * │ 查看列表          │    ✅    │   ✅   │     ✅    │
 * │ 查看详情          │    ✅    │   ✅   │     ✅    │
 * │ 创建角色          │    ✅    │   ✅   │     ❌    │
 * │ 编辑角色          │    ✅    │   ✅*  │     ❌    │
 * │ 激活/停用         │    ✅    │   ✅   │     ❌    │
 * │ 调整AI参数        │    ✅    │   ✅   │     ❌    │
 * └──────────────────┴──────────┴────────┴───────────┘
 * (*admin不能修改预设角色的name和category字段)
 *
 * 使用方式：
 * 在主应用文件中注册此路由模块：
 * ```javascript
 * import soulRoutes from './routes/soul.js';
 * await fastify.register(soulRoutes, { prefix: '/api/admin/v1/souls' });
 * ```
 */

import { authMiddleware as auth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/rbac.js';
import soulController from '../controllers/soulController.js';

/**
 * Fastify路由插件
 * 自动注册所有Soul角色管理相关的API端点
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项（可配置前缀等）
 */
export default async function soulRoutes(fastify, options) {
  // ============================================
  // S001: 获取Soul角色列表 (GET /souls)
  // ============================================

  /**
   * 分页查询Soul角色列表
   *
   * 支持多维度筛选和排序，返回角色数据 + 统计摘要 + 分页信息
   *
   * 权限要求：所有已登录角色均可访问
   */
  fastify.get('/', {
    preHandler: [auth],  // 需要认证
    schema: {
      description: '获取Soul角色列表（分页、筛选、排序）',
      tags: ['Soul Management'],
      summary: '分页查询AI辩论角色列表，支持多维度筛选和排序',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: '页码',
            minimum: 1,
            default: 1
          },
          pageSize: {
            type: 'integer',
            description: '每页条数（最大100）',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'all'],
            description: '状态筛选：active(已激活)/inactive(已停用)/all(全部)',
            default: 'all'
          },
          category: {
            type: 'string',
            description: '分类筛选：哲学家/企业家/科学家/艺术家/历史学家/政治家/教育家/作家/自定义角色'
          },
          search: {
            type: 'string',
            description: '搜索关键词（匹配角色名称和描述）'
          },
          sortBy: {
            type: 'string',
            enum: ['name', 'createdAt', 'totalDebates', 'avgRating'],
            description: '排序字段',
            default: 'createdAt'
          },
          order: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: '排序方向',
            default: 'desc'
          }
        }
      },
      response: {
        200: {
          description: '成功获取Soul角色列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                souls: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      category: { type: 'string' },
                      status: { type: 'string' },
                      usageStats: {
                        type: 'object',
                        properties: {
                          totalDebates: { type: 'integer' },
                          avgRating: { type: 'number' },
                          favoriteCount: { type: 'integer' }
                        }
                      },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalActive: { type: 'integer' },
                    totalInactive: { type: 'integer' },
                    totalPreset: { type: 'integer' },
                    totalCustom: { type: 'integer' },
                    avgRating: { type: 'number' },
                    mostPopular: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        favoriteCount: { type: 'integer' }
                      }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    totalItems: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            }
          },
          401: {
            description: '未授权或token无效'
          }
        }
      }
    }
  }, soulController.getSoulsList);

  // ============================================
  // S002: 获取Soul角色详情 (GET /souls/:id)
  // ============================================

  /**
   * 获取单个Soul角色的完整信息
   *
   * 返回基本信息 + AI配置 + 使用统计 + 辩论历史 + 反馈摘要 + 配置变更历史
   */
  fastify.get('/:id', {
    preHandler: [auth],
    schema: {
      description: '获取Soul角色详细信息',
      tags: ['Soul Management'],
      summary: '获取角色完整信息，包括AI配置、使用统计、辩论历史和变更记录',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Soul角色ID'
          }
        }
      },
      response: {
        200: {
          description: '成功获取Soul角色详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                category: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                aiConfig: {
                  type: 'object',
                  properties: {
                    model: { type: 'string' },
                    systemPrompt: { type: 'string' },
                    temperature: { type: 'number' },
                    maxTokens: { type: 'integer' },
                    personality: { type: 'string' }
                  }
                },
                usageStats: {
                  type: 'object',
                  properties: {
                    totalDebates: { type: 'integer' },
                    avgRating: { type: 'number' },
                    favoriteCount: { type: 'integer' }
                  }
                },
                debateHistory: { type: 'array' },
                feedbackSummary: { type: 'object' },
                configChangeHistory: { type: 'array' }
              }
            }
          },
          404: {
            description: 'Soul角色不存在'
          }
        }
      }
    }
  }, soulController.getSoulDetail);

  // ============================================
  // S003: 创建新Soul角色 (POST /souls)
  // ============================================

  /**
   * 创建新的AI辩论角色
   *
   * 新建角色默认为激活状态(active)，可立即被选择参与辩论
   *
   * 权限要求：super_admin, admin（observer无权创建）
   */
  fastify.post('/', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '创建新Soul角色',
      tags: ['Soul Management'],
      summary: '创建新的AI辩论角色（默认状态为已激活）',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: {
            type: 'string',
            description: '角色名称（必填，2-50字符）',
            minLength: 2,
            maxLength: 50
          },
          category: {
            type: 'string',
            description: '角色分类（必填）：哲学家/企业家/科学家/艺术家/历史学家/政治家/教育家/作家/自定义角色'
          },
          description: {
            type: 'string',
            description: '角色简介（可选，0-500字符）',
            maxLength: 500
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: '角色头像URL'
          },
          aiConfig: {
            type: 'object',
            description: 'AI配置（可选，有默认值）',
            properties: {
              model: {
                type: 'string',
                enum: ['minimax', 'deepseek', 'gpt', 'claude'],
                description: '使用的AI模型'
              },
              temperature: {
                type: 'number',
                description: '温度参数（0-1，默认0.7）',
                minimum: 0,
                maximum: 1
              },
              maxTokens: {
                type: 'integer',
                description: '最大生成长度（100-4000，默认1500）',
                minimum: 100,
                maximum: 4000
              },
              systemPrompt: {
                type: 'string',
                description: '系统提示词/人设（最长2000字符）',
                maxLength: 2000
              },
              personality: {
                type: 'string',
                description: '性格特征描述'
              }
            }
          }
        }
      },
      response: {
        201: {
          description: 'Soul角色创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                category: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            hints: {
              type: 'object',
              properties: {
                nextStep: { type: 'string' },
                tip: { type: 'string' }
              }
            }
          },
          400: {
            description: '参数验证失败或名称重复'
          },
          403: {
            description: '权限不足（observer角色无法创建角色）'
          }
        }
      }
    }
  }, soulController.createNewSoul);

  // ============================================
  // S003 (续): 更新Soul角色 (PUT /souls/:id)
  // ============================================

  /**
   * 更新现有Soul角色的基本信息和AI配置
   *
   * 注意预设角色保护机制：
   * - super_admin: 可以修改所有字段
   * - admin: 不能修改预设角色的name和category字段
   *
   * 权限要求：super_admin, admin
   */
  fastify.put('/:id', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '更新Soul角色信息',
      tags: ['Soul Management'],
      summary: '更新角色的名称、描述、分类、头像或AI配置',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Soul角色ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: '新名称'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: '新描述'
          },
          category: {
            type: 'string',
            description: '新分类'
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: '新头像URL'
          },
          aiConfig: {
            type: 'object',
            description: '完整替换AI配置（会与现有配置合并）',
            properties: {
              model: { type: 'string', enum: ['minimax', 'deepseek', 'gpt', 'claude'] },
              temperature: { type: 'number', minimum: 0, maximum: 1 },
              maxTokens: { type: 'integer', minimum: 100, maximum: 4000 },
              systemPrompt: { type: 'string', maxLength: 2000 },
              personality: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Soul角色更新成功'
        },
        400: {
          description: '参数验证失败'
        },
        403: {
          description: '无权修改预设角色的某些字段（仅admin受限时返回）'
        },
        404: {
          description: 'Soul角色不存在'
        },
        409: {
          description: '名称重复'
        }
      }
    }
  }, soulController.updateExistingSoul);

  // ============================================
  // S004: 激活/停用Soul角色 (PATCH /souls/:id/status)
  // ============================================

  /**
   * 修改Soul角色激活状态
   *
   * 状态说明：
   * - active: 已激活（出现在可选列表中，可以被选择参与辩论）
   * - inactive: 已停用（前端不可见但保留数据和配置）
   *
   * 权限要求：super_admin, admin
   */
  fastify.patch('/:id/status', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '修改Soul角色激活状态（激活/停用）',
      tags: ['Soul Management'],
      summary: '切换角色的显示状态，停用后该角色不再出现在可选列表中',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Soul角色ID' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            description: '目标状态：active(激活)/inactive(停用)'
          },
          reason: {
            type: 'string',
            description: '变更原因（将记录在审计日志中）'
          }
        }
      },
      response: {
        200: {
          description: '状态修改成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            _meta: {
              type: 'object',
              properties: {
                previousStatus: { type: 'string' },
                newStatus: { type: 'string' },
                changedAt: { type: 'string', format: 'date-time' },
                operator: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: '参数错误或状态未变化'
        },
        404: {
          description: 'Soul角色不存在'
        }
      }
    }
  }, soulController.changeSoulStatus);

  // ============================================
  // S005: 调整AI参数配置 (PATCH /souls/:id/ai-config)
  // ============================================

  /**
   * 单独调整Soul角色的AI参数配置
   *
   * 重要提示：
   * - 此接口用于精细调整单个AI参数，不需要更新整个角色对象
   * - 支持的参数：temperature, maxTokens, systemPrompt, personality, model
   * - 所有参数变更都会被记录到审计日志（重要操作！）
   * - 参数修改后下次辩论立即生效（无需重启服务）
   * - AI参数有严格的范围校验，确保系统安全稳定
   *
   * 参数影响说明：
   * - temperature: 控制回答的创造性（低=确定，高=多样）
   * - maxTokens: 控制回答长度（短=简洁，长=详细）
   * - systemPrompt: 定义角色的人设和行为模式
   * - personality: 描述角色的性格特征
   * - model: 切换底层AI模型（影响能力和风格）
   *
   * 权限要求：super_admin, admin
   */
  fastify.patch('/:id/ai-config', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '调整Soul角色AI参数配置',
      tags: ['Soul Management'],
      summary: '单独修改AI参数（temperature/maxTokens/systemPrompt等），下次辩论立即生效',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Soul角色ID' }
        }
      },
      body: {
        type: 'object',
        description: '至少需要提供一个参数（支持同时调整多个参数）',
        properties: {
          temperature: {
            type: 'number',
            description: '温度参数（0-1），控制回答的创造性和多样性',
            minimum: 0,
            maximum: 1
          },
          maxTokens: {
            type: 'integer',
            description: '最大Token数（100-4000），控制回答的最大长度',
            minimum: 100,
            maximum: 4000
          },
          systemPrompt: {
            type: 'string',
            description: '新的系统提示词/人设（最长2000字符），定义角色的行为模式',
            maxLength: 2000
          },
          personality: {
            type: 'string',
            description: '新的性格特征描述'
          },
          model: {
            type: 'string',
            enum: ['minimax', 'deepseek', 'gpt', 'claude'],
            description: '切换AI模型（会影响角色的能力风格）'
          }
        }
      },
      response: {
        200: {
          description: 'AI配置调整成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            _configChangeInfo: {
              type: 'object',
              properties: {
                changedParams: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '本次修改的参数列表'
                },
                changes: {
                  type: 'object',
                  description: '每个参数的详细变更信息（包含新旧值和影响提示）'
                },
                changedAt: { type: 'string', format: 'date-time' },
                changedBy: { type: 'string' },
                effectiveImmediately: {
                  type: 'boolean',
                  description: '是否立即生效（始终为true）'
                }
              }
            }
          },
          400: {
            description: '参数验证失败或未提供任何更新参数'
          },
          404: {
            description: 'Soul角色不存在'
          }
        }
      }
    }
  }, soulController.adjustSoulAIConfig);

  // ============================================
  // 完成注册日志
  // ============================================
  console.log('[Routes] Soul角色管理路由模块已注册 | 前缀: /api/admin/v1/souls');
  console.log('[Routes] 可用端点:');
  console.log('  GET    /                          → S001: Soul角色列表');
  console.log('  GET    /:id                       → S002: Soul角色详情');
  console.log('  POST   /                          → S003: 创建角色');
  console.log('  PUT    /:id                       → S003: 编辑角色');
  console.log('  PATCH  /:id/status               → S004: 激活/停用');
  console.log('  PATCH  /:id/ai-config             → S005: 调整AI参数');
}
