/**
 * 议题管理路由模块 (Topic Routes)
 *
 * 功能说明：
 * 定义所有与议题管理相关的API端点
 * 遵循RESTful规范，统一使用 /api/admin/v1/topics 前缀
 *
 * 路由列表：
 *
 * ┌──────────┬─────────────────────────────────────┬──────────┬────────────────────┐
 * │  方法    │  路径                               │  权限    │  功能说明           │
 * ├──────────┼─────────────────────────────────────┼──────────┼────────────────────┤
 * │ GET      │ /topics                             │ 所有角色 │ T001: 议题列表查询   │
 * │ GET      │ /topics/:id                         │ 所有角色 │ T002: 议题详情查看   │
 * │ POST     │ /topics                             │ admin+   │ T003: 创建新议题    │
 * │ PUT      │ /topics/:id                         │ admin+   │ T003: 编辑议题      │
 * │ PATCH    │ /topics/:id/status                  │ admin+   │ T004: 上架/下架     │
 * │ PATCH    │ /topics/:id/hotness                 │ super    │ T005: 调整热度      │
 * └──────────┴─────────────────────────────────────┴──────────┴────────────────────┘
 *
 * 权限矩阵：
 * ┌──────────────────┬──────────┬────────┬───────────┐
 * │ 操作              │super_admin│ admin  │ observer  │
 * ├──────────────────┼──────────┼────────┼───────────┤
 * │ 查看列表          │    ✅    │   ✅   │     ✅    │
 * │ 查看详情          │    ✅    │   ✅   │     ✅    │
 * │ 创建议题          │    ✅    │   ✅   │     ❌    │
 * │ 编辑议题          │    ✅    │   ✅   │     ❌    │
 * │ 上架/下架         │    ✅    │   ✅   │     ❌    │
 * │ 调整热度          │    ✅    │   ❌   │     ❌    │
 * └──────────────────┴──────────┴────────┴───────────┘
 *
 * 使用方式：
 * 在主应用文件中注册此路由模块：
 * ```javascript
 * import topicRoutes from './routes/topic.js';
 * await fastify.register(topicRoutes, { prefix: '/api/admin/v1/topics' });
 * ```
 */

import { authMiddleware as auth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/rbac.js';
import topicController from '../controllers/topicController.js';

/**
 * Fastify路由插件
 * 自动注册所有议题管理相关的API端点
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项（可配置前缀等）
 */
export default async function topicRoutes(fastify, options) {
  // ============================================
  // T001: 获取议题列表 (GET /topics)
  // ============================================

  /**
   * 分页查询议题列表
   *
   * 支持多维度筛选和排序，返回议题数据 + 统计摘要 + 分页信息
   *
   * 权限要求：所有已登录角色均可访问
   */
  fastify.get('/', {
    preHandler: [auth],  // 需要认证
    schema: {
      description: '获取议题列表（分页、筛选、排序）',
      tags: ['Topic Management'],
      summary: '分页查询辩论议题列表，支持多维度筛选',
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
            enum: ['published', 'draft', 'archived', 'all'],
            description: '状态筛选',
            default: 'all'
          },
          category: {
            type: 'string',
            description: '分类筛选'
          },
          hotnessMin: {
            type: 'number',
            description: '最低热度过滤',
            minimum: 0,
            maximum: 100
          },
          search: {
            type: 'string',
            description: '搜索关键词（匹配标题和描述）'
          },
          sortBy: {
            type: 'string',
            enum: ['hotness', 'createdAt', 'debateCount'],
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
          description: '成功获取议题列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                topics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      status: { type: 'string' },
                      hotness: { type: 'number' },
                      debateCount: { type: 'integer' },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalPublished: { type: 'integer' },
                    totalDraft: { type: 'integer' },
                    totalArchived: { type: 'integer' },
                    avgHotness: { type: 'number' },
                    topTopic: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        hotness: { type: 'number' }
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
          }
        },
        401: {
          description: '未授权或token无效'
        }
      }
    }
  }, topicController.getTopicsList);

  // ============================================
  // T002: 获取议题详情 (GET /topics/:id)
  // ============================================

  /**
   * 获取单个议题的完整信息
   *
   * 返回基本信息 + 关联辩论 + 参与统计 + 热度趋势 + 编辑历史
   */
  fastify.get('/:id', {
    preHandler: [auth],
    schema: {
      description: '获取议题详细信息',
      tags: ['Topic Management'],
      summary: '获取议题完整信息，包括关联数据和编辑历史',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: '议题ID'
          }
        }
      },
      response: {
        200: {
          description: '成功获取议题详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                hotness: { type: 'number' },
                recentDebates: { type: 'array' },
                participantStats: { type: 'object' },
                hotnessTrend: { type: 'array' },
                editHistory: { type: 'array' }
              }
            }
          }
        },
        404: {
          description: '议题不存在'
        }
      }
    }
  }, topicController.getTopicDetail);

  // ============================================
  // T003: 创建新议题 (POST /topics)
  // ============================================

  /**
   * 创建新的辩论议题
   *
   * 新建议题默认为草稿状态(draft)，需要手动上架才能在前端显示
   *
   * 权限要求：super_admin, admin（observer无权创建）
   */
  fastify.post('/', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '创建新议题',
      tags: ['Topic Management'],
      summary: '创建新的辩论议题（默认状态为草稿）',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            description: '议题标题（必填，5-100字符）',
            minLength: 5,
            maxLength: 100
          },
          description: {
            type: 'string',
            description: '议题描述（可选，0-500字符）',
            maxLength: 500
          },
          category: {
            type: 'string',
            description: '议题分类'
          },
          coverImage: {
            type: 'string',
            format: 'uri',
            description: '封面图片URL'
          }
        }
      },
      response: {
        201: {
          description: '议题创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            hints: {
              type: 'object',
              properties: {
                nextStep: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: '参数验证失败或标题重复'
        },
        403: {
          description: '权限不足（observer角色无法创建议题）'
        }
      }
    }
  }, topicController.createNewTopic);

  // ============================================
  // T003 (续): 更新议题 (PUT /topics/:id)
  // ============================================

  /**
   * 更新现有议题的基本信息
   *
   * 使用乐观锁机制防止并发冲突
   *
   * 权限要求：super_admin, admin
   */
  fastify.put('/:id', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '更新议题信息',
      tags: ['Topic Management'],
      summary: '更新议题的标题、描述、分类等信息',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '议题ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 5,
            maxLength: 100,
            description: '新标题'
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
          coverImage: {
            type: 'string',
            format: 'uri',
            description: '新封面图片URL'
          },
          version: {
            type: 'integer',
            description: '乐观锁版本号（推荐提供以防止并发冲突）',
            minimum: 1
          }
        }
      },
      response: {
        200: {
          description: '议题更新成功'
        },
        400: {
          description: '参数验证失败'
        },
        404: {
          description: '议题不存在'
        },
        409: {
          description: '版本冲突或标题重复'
        }
      }
    }
  }, topicController.updateExistingTopic);

  // ============================================
  // T004: 上架/下架议题 (PATCH /topics/:id/status)
  // ============================================

  /**
   * 修改议题发布状态
   *
   * 状态说明：
   * - published: 已发布（前端可见）
   * - draft: 草稿（隐藏但保留数据）
   * - archived: 归档（前端不可见，保留历史记录）
   *
   * 权限要求：super_admin, admin
   */
  fastify.patch('/:id/status', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
    schema: {
      description: '修改议题发布状态（上架/下架/归档）',
      tags: ['Topic Management'],
      summary: '切换议题的显示状态',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '议题ID' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['published', 'draft', 'archived'],
            description: '目标状态'
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
          description: '议题不存在'
        }
      }
    }
  }, topicController.changeTopicStatus);

  // ============================================
  // T005: 调整议题热度 (PATCH /topics/:id/hotness)
  // ============================================

  /**
   * 手动调整议题热度值
   *
   * 重要提示：
   * - 此操作影响前端排序和推荐算法
   * - 只有超级管理员(super_admin)有权限操作
   * - 会记录完整的调整历史（旧值→新值）
   * - 热度范围：0-100
   *
   * 权限要求：仅 super_admin
   */
  fastify.patch('/:id/hotness', {
    preHandler: [auth, checkRole([ROLES.SUPER_ADMIN])],  // 仅超级管理员！
    schema: {
      description: '手动调整议题热度（仅超级管理员）',
      tags: ['Topic Management'],
      summary: '设置议题的热度值，影响前端排序和推荐算法',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '议题ID' }
        }
      },
      body: {
        type: 'object',
        required: ['hotness'],
        properties: {
          hotness: {
            type: 'number',
            description: '目标热度值（0-100）',
            minimum: 0,
            maximum: 100
          },
          reason: {
            type: 'string',
            description: '调整原因（将记录在审计日志中）'
          }
        }
      },
      response: {
        200: {
          description: '热度调整成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            _adjustmentInfo: {
              type: 'object',
              properties: {
                oldValue: { type: 'number', description: '调整前的热度值' },
                newValue: { type: 'number', description: '调整后的热度值' },
                change: { type: 'number', description: '变化量（正=提升，负=降低）' },
                impactHint: { type: 'string', description: '影响范围提示' },
                adjustedAt: { type: 'string', format: 'date-time' },
                adjustedBy: { type: 'string', description: '操作人' }
              }
            }
          }
        },
        400: {
          description: '参数验证失败或热度值未变化'
        },
        403: {
          description: '权限不足（仅超级管理员可操作）'
        },
        404: {
          description: '议题不存在'
        }
      }
    }
  }, topicController.adjustTopicHotness);

  // ============================================
  // 完成注册日志
  // ============================================
  console.log('[Routes] 议题管理路由模块已注册 | 前缀: /api/admin/v1/topics');
  console.log('[Routes] 可用端点:');
  console.log('  GET    /                          → T001: 议题列表');
  console.log('  GET    /:id                       → T002: 议题详情');
  console.log('  POST   /                          → T003: 创建议题');
  console.log('  PUT    /:id                       → T003: 编辑议题');
  console.log('  PATCH  /:id/status               → T004: 上架/下架');
  console.log('  PATCH  /:id/hotness              → T005: 调整热度(仅super_admin)');
}
