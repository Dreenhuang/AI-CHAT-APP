/**
 * 系统配置管理路由模块 (Config Routes)
 *
 * 功能说明：
 * 定义所有与系统配置管理相关的API端点
 * 遵循RESTful规范，统一使用 /api/admin/v1/configs 前缀
 *
 * 路由列表：
 *
 * ┌──────────┬───────────────────────────────────────┬──────────┬────────────────────┐
 * │  方法    │  路径                                  │  权限    │  功能说明           │
 * ├──────────┼───────────────────────────────────────┼──────────┼────────────────────┤
 * │ GET      │ /configs                               │ 所有角色 │ C001: 配置项列表    │
 * │ GET      │ /configs/history                       │ admin+   │ 查询变更历史       │
 * │ GET      │ /configs/:key                          │ 所有角色 │ C002: 单个配置详情  │
 * │ PUT      │ /configs/:key                          │ admin+   │ C003: 更新配置      │
 * │ PUT      │ /configs/batch                         │ super    │ C004: 批量更新      │
 * │ POST     │ /configs/:key/reset                    │ super    │ C005: 重置为默认值  │
 * └──────────┴───────────────────────────────────────┴──────────┴────────────────────┘
 *
 * 权限矩阵：
 * ┌──────────────────┬──────────┬────────┬───────────┐
 * │ 操作              │super_admin│ admin  │ observer  │
 * ├──────────────────┼──────────┼────────┼───────────┤
 * │ 查看配置列表      │    ✅    │   ✅   │     ✅    │
 * │ 查看单个配置      │    ✅    │   ✅   │     ✅    │
 * │ 查看敏感值(明文)  │    ✅    │   ❌   │     ❌    │
 * │ 修改非敏感配置    │    ✅    │   ✅   │     ❌    │
 * │ 修改敏感配置      │    ✅    │   ❌   │     ❌    │
 * │ 批量修改配置      │    ✅    │   ❌   │     ❌    │
 * │ 重置为默认值      │    ✅    │   ❌   │     ❌    │
 * │ 查看变更历史      │    ✅    │   ✅   │     ❌    │
 * └──────────────────┴──────────┴────────┴───────────┘
 *
 * 使用方式：
 * 在主应用文件中注册此路由模块：
 * ```javascript
 * import configRoutes from './routes/config.js';
 * await fastify.register(configRoutes, { prefix: '/api/admin/v1/configs' });
 * ```
 */

import { authMiddleware as auth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/rbac.js';
import configController from '../controllers/configController.js';

/**
 * Fastify路由插件
 * 自动注册所有系统配置管理相关的API端点
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项（可配置前缀等）
 */
export default async function configRoutes(fastify, options) {
  // ============================================
  // C001: 获取配置项列表 (GET /configs)
  // ============================================

  /**
   * 分页查询系统配置项列表
   *
   * 支持多维度筛选和搜索，返回配置数据 + 类型统计 + 分页信息
   *
   * 权限要求：所有已登录角色均可访问（包括observer）
   */
  fastify.get('/', {
    preHandler: [auth],  // 需要认证
    schema: {
      description: '获取系统配置项列表（分页、筛选、搜索）',
      tags: ['System Configuration'],
      summary: '查询所有系统配置项，支持按类型筛选和关键词搜索',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'all', 'AI_API_KEY', 'FEATURE_FLAG', 'AI_PARAM',
              'RATE_LIMIT', 'SYSTEM', 'THIRD_PARTY', 'SECURITY', 'NOTIFICATION',
              // 支持简写形式
              'api_key', 'feature_flag', 'ai_param', 'rate_limit',
              'system', 'third_party', 'security', 'notification'
            ],
            description: '配置类型筛选（默认all表示全部）'
          },
          search: {
            type: 'string',
            description: '搜索关键词（匹配配置键名和描述）'
          },
          isSensitive: {
            type: 'string',
            enum: ['true', 'false', 'all'],
            default: 'all',
            description: '敏感性过滤（true=仅敏感 / false=仅非敏感 / all=全部）'
          },
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
          }
        }
      },
      response: {
        200: {
          description: '成功获取配置列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                configs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      configKey: { type: 'string' },
                      configValue: { type: 'string' },
                      maskedValue: { type: 'string' },
                      configType: { type: 'string' },
                      description: { type: 'string' },
                      isSensitive: { type: 'boolean' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                typeStats: {
                  type: 'object',
                  description: '各类型配置数量统计'
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
          }
        },
        401: {
          description: '未授权或token无效'
        }
      }
    }
  }, configController.getConfigsList);

  // ============================================
  // 获取配置变更历史 (GET /configs/history)
  // ============================================

  /**
   * 查询配置项的变更历史记录
   *
   * 用于安全审计和问题排查
   */
  fastify.get('/history', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '获取配置变更历史（审计日志）',
      tags: ['System Configuration'],
      summary: '查询配置修改记录，用于安全审计和问题排查',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          configKey: {
            type: 'string',
            description: '指定配置键名（不传则返回所有配置的历史）'
          },
          limit: {
            type: 'integer',
            description: '返回条数（最大200）',
            minimum: 1,
            maximum: 200,
            default: 50
          }
        }
      },
      response: {
        200: {
          description: '成功获取配置历史',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  logId: { type: 'string' },
                  action: { type: 'string' },
                  operator: { type: 'string' },
                  configKey: { type: 'string' },
                  oldValue: { type: 'string' },
                  newValue: { type: 'string' },
                  ip: { type: 'string' },
                  reason: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        403: {
          description: '权限不足（仅admin及以上可查看）'
        }
      }
    }
  }, configController.getConfigHistory);

  // ============================================
  // C002: 获取单个配置详情 (GET /configs/:key)
  // ============================================

  /**
   * 获取指定配置项的完整信息
   *
   * 敏感配置默认返回脱敏值，可通过 reveal=true 参数查看明文（需要super_admin权限）
   */
  fastify.get('/:key', {
    preHandler: [auth],
    schema: {
      description: '获取单个配置项的详细信息',
      tags: ['System Configuration'],
      summary: '按键名获取配置详情，支持敏感值脱敏显示',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: {
            type: 'string',
            description: '配置键名（如 ai.minimax.api_key）'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          reveal: {
            type: 'boolean',
            default: false,
            description: '是否显示敏感值的明文（仅super_admin有效）'
          }
        }
      },
      response: {
        200: {
          description: '成功获取配置详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                configKey: { type: 'string' },
                configValue: { type: 'string' },
                maskedValue: { type: 'string' },
                configType: { type: 'string' },
                description: { type: 'string' },
                isSensitive: { type: 'boolean' },
                defaultValue: { type: 'string' },
                updatedBy: { type: 'string' },
                updatedAt: { type: 'string', format: 'date-time' },
                version: { type: 'integer' }
              }
            }
          }
        },
        404: {
          description: '配置项不存在'
        }
      }
    }
  }, configController.getConfigDetail);

  // ============================================
  // C003: 更新单个配置 (PUT /configs/:key)
  // ============================================

  /**
   * 修改指定配置项的值
   *
   * 权限控制：
   * - super_admin: 可以修改所有配置（包括API Key等敏感配置）
   * - admin: 只能修改非敏感配置
   * - observer: 无法修改任何配置
   */
  fastify.put('/:key', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '更新单个配置项的值',
      tags: ['System Configuration'],
      summary: '修改配置值，自动记录变更历史到审计日志',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: '配置键名' }
        }
      },
      body: {
        type: 'object',
        required: ['value'],
        properties: {
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' }
            ],
            description: '新的配置值（字符串/数字/布尔）'
          },
          reason: {
            type: 'string',
            maxLength: 200,
            description: '修改原因（可选，会记录到审计日志）'
          }
        }
      },
      response: {
        200: {
          description: '配置更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                config: { type: 'object' },
                changeLog: {
                  type: 'object',
                  properties: {
                    action: { type: 'string' },
                    oldValue: { type: 'string' },
                    newValue: { type: 'string' },
                    changedAt: { type: 'string' },
                    changedBy: { type: 'string' },
                    versionChange: { type: 'string' }
                  }
                },
                _notice: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: '参数验证失败或值没有变化'
        },
        403: {
          description: '权限不足（如尝试修改敏感配置但不是super_admin）'
        },
        404: {
          description: '配置项不存在'
        }
      }
    }
  }, configController.updateSingleConfig);

  // ============================================
  // C004: 批量更新配置 (PUT /configs/batch)
  // ============================================

  /**
   * 批量修改多个配置项
   *
   * 重要特性：
   * ✅ 原子操作：要么全部成功，要么全部失败（自动回滚）
   * ✅ 数量限制：单次最多20个配置项
   * ✅ 完整审计：每个变更都会记录
   *
   * 权限要求：仅 super_admin（因为可能涉及敏感配置）
   */
  fastify.put('/batch', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN])],  // 仅超级管理员！
    schema: {
      description: '批量更新多个配置项（原子操作，仅超级管理员）',
      tags: ['System Configuration'],
      summary: '一次性修改多个配置，支持原子性保证（全部成功或全部回滚）',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            maxItems: 20,
            minItems: 1,
            items: {
              type: 'object',
              required: ['key', 'value'],
              properties: {
                key: {
                  type: 'string',
                  description: '配置键名（必填）'
                },
                value: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' }
                  ],
                  description: '新的配置值（必填）'
                },
                reason: {
                  type: 'string',
                  maxLength: 200,
                  description: '修改原因（可选）'
                }
              }
            },
            description: '要更新的配置数组（最多20个）'
          }
        },
        example: {
          items: [
            { key: 'feature.debate.enable', value: 'true', reason: '重新启用辩论功能' },
            { key: 'ai.minimax.model', value: 'MiniMax-M2.7', reason: '升级模型版本' }
          ]
        }
      },
      response: {
        200: {
          description: '批量更新完成',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      key: { type: 'string' },
                      oldValue: { type: 'string' },
                      newValue: { type: 'string' },
                      version: { type: 'integer' }
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalRequested: { type: 'integer' },
                    successCount: { type: 'integer' },
                    failCount: { type: 'integer' },
                    atomicOperation: { type: 'boolean' },
                    operatedAt: { type: 'string' },
                    operatedBy: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: {
          description: '参数错误或验证失败'
        },
        403: {
          description: '权限不足（仅super_admin可执行批量更新）'
        },
        409: {
          description: '部分更新失败，已自动回滚所有更改'
        }
      }
    }
  }, configController.batchUpdateConfigs);

  // ============================================
  // C005: 重置配置为默认值 (POST /configs/:key/reset)
  // ============================================

  /**
   * 将指定配置重置为系统预设的默认值
   *
   * ⚠️ 这是一个重要操作！
   * - 只有 super_admin 可以执行
   * - 会影响系统运行状态
   * - 强制记录审计日志
   * - 某些关键配置不允许重置（如安全相关）
   */
  fastify.post('/:key/reset', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN])],  // 仅超级管理员！
    schema: {
      description: '将配置重置为系统默认值（仅超级管理员）',
      tags: ['System Configuration'],
      summary: '恢复配置到初始默认值，用于故障恢复或环境重置',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: '要重置的配置键名' }
        }
      },
      body: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            maxLength: 200,
            description: '重置原因（强烈建议填写）'
          }
        }
      },
      response: {
        200: {
          description: '配置已重置为默认值',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                config: { type: 'object' },
                resetLog: {
                  type: 'object',
                  properties: {
                    action: { type: 'string' },
                    previousValue: { type: 'string' },
                    restoredToDefault: { type: 'string' },
                    resetAt: { type: 'string' },
                    resetBy: { type: 'string' },
                    versionChange: { type: 'string' }
                  }
                },
                _notice: { type: 'string' }
              }
            }
          }
        },
        403: {
          description: '权限不足或该配置不允许重置'
        },
        404: {
          description: '配置项不存在'
        },
        400: {
          description: '当前值已经是默认值'
        }
      }
    }
  }, configController.resetConfig);

  // ============================================
  // 完成注册日志
  // ============================================
  console.log('[Routes] 系统配置管理路由模块已注册 | 前缀: /api/admin/v1/configs');
  console.log('[Routes] 可用端点:');
  console.log('  GET    /                        → C001: 配置项列表');
  console.log('  GET    /history                 → 查询变更历史');
  console.log('  GET    /:key                    → C002: 单个配置详情');
  console.log('  PUT    /:key                    → C003: 更新配置');
  console.log('  PUT    /batch                   → C004: 批量更新(仅super_admin)');
  console.log('  POST   /:key/reset              → C005: 重置为默认(仅super_admin)');
}
