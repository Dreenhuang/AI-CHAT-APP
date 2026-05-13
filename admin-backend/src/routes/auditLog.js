/**
 * 审计日志路由模块 (Audit Log Routes)
 *
 * 功能说明：
 * 本模块定义审计日志系统的所有API路由端点。
 * 提供完整的审计日志查询、统计和详情查看功能。
 *
 * 路由列表：
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 方法   路径                               认证    功能说明            │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │ GET    /                                   ✅需要  A001: 日志列表查询  │
 * │ GET    /statistics                        ✅需要  A002: 操作统计分析  │
 * │ GET    /:id                                ✅需要  A003: 单条日志详情  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * 注册方式：
 * 在主入口文件 (src/index.js) 中注册：
 * ```javascript
 * import auditLogRoutes from './routes/auditLog.js';
 * await fastify.register(auditLogRoutes, { prefix: '/api/admin/v1/audit-logs' });
 * ```
 *
 * 认证说明：
 * - 所有接口都需要JWT认证（Bearer Token）
 * - 建议限制为 super_admin 和 admin 角色（observer只读也可访问）
 *
 * 权限要求：
 * - 最低权限角色：observer（审计日志是只读操作，不涉及敏感数据修改）
 * - 推荐权限：audit_log:view（如果实现了细粒度RBAC）
 *
 * Swagger文档：
 * 启动服务后访问 http://localhost:9450/docs 查看完整API文档和在线测试
 *
 * 使用示例：
 * ```bash
 * # 1. 先登录获取Token
 * TOKEN=$(curl -s -X POST http://localhost:9450/api/admin/v1/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"username":"admin","password":"Admin@123456"}' | jq -r '.data.token')
 *
 * # 2. 查询审计日志列表（默认第1页，每页20条）
 * curl "http://localhost:9450/api/admin/v1/audit-logs?page=1&pageSize=20" \
 *   -H "Authorization: Bearer $TOKEN"
 *
 * # 3. 筛选删除操作的日志
 * curl "http://localhost:9450/api/admin/v1/audit-logs?action=DELETE&startDate=2026-05-01" \
 *   -H "Authorization: Bearer $TOKEN"
 *
 * # 4. 获取统计数据
 * curl "http://localhost:9450/api/admin/v1/audit-logs/statistics" \
 *   -H "Authorization: Bearer $TOKEN"
 *
 * # 5. 查看单条日志详情
 * curl "http://localhost:9450/api/admin/v1/audit-logs/audit_001" \
 *   -H "Authorization: Bearer $TOKEN"
 * ```
 *
 * 作者：GLM-5V-Turbo AI Assistant
 * 创建日期：2026-05-13
 * 版本：v1.0.0
 */

// ============================================
// 导入依赖
// ============================================

import {
  getAuditLogsController,
  getAuditStatisticsController,
  getAuditLogDetailController
} from '../controllers/auditLogController.js';
import { authMiddleware } from '../middleware/auth.js';

// ============================================
// 路由定义函数（Fastify插件格式）
// ============================================

/**
 * 审计日志路由注册函数
 *
 * 此函数符合Fastify的插件注册格式，
 * 会被主入口文件的 fastify.register() 调用。
 *
 * @param {FastifyInstance} fastify - Fastify应用实例
 * @param {Object} options - 配置选项（预留扩展）
 */
async function auditLogRoutes(fastify, options) {

  // ================================================================
  // A001: 审计日志列表查询接口
  // ================================================================

  /**
   * GET /api/admin/v1/audit-logs
   *
   * 功能：多条件查询审计日志记录
   * 用途：管理后台的"审计日志"页面主接口
   * 数据：分页的日志数组 + 统计摘要
   *
   * 查询参数：
   * - page: 页码（默认1，最小值1）
   * - pageSize: 每页数量（默认20，最大100）
   * - adminId: 操作人ID筛选
   * - action: 操作类型（CREATE/UPDATE/DELETE等10种）
   * - targetType: 目标类型（USER/TOPIC/SOUL等10种）
   * - targetId: 目标ID精确匹配
   * - result: 操作结果（SUCCESS/FAILURE/PARTIAL）
   * - startDate: 开始日期（YYYY-MM-DD或ISO格式）
   * - endDate: 结束日期
   * - ipAddress: IP地址模糊搜索
   *
   * 认证：✅ 需要Bearer Token
   * 权限：observer及以上角色
   * 缓存：无缓存（实时查询）
   * 响应时间：< 200ms（正常情况下）
   */
  fastify.get('/', {
    preHandler: [authMiddleware],  // JWT认证中间件
    schema: {
      description: '查询审计日志列表（支持多条件筛选和分页）',
      tags: ['Audit Log（审计日志）'],
      summary: 'A001: 多条件查询审计日志记录',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: '页码'
          },
          pageSize: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: '每页数量（最大100）'
          },
          adminId: {
            type: 'string',
            description: '操作人ID精确匹配'
          },
          action: {
            type: 'string',
            enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'CONFIG_CHANGE', 'STATUS_CHANGE', 'BATCH_OP'],
            description: '操作类型筛选'
          },
          targetType: {
            type: 'string',
            enum: ['USER', 'TOPIC', 'SOUL', 'DEBATE', 'GROUP', 'MESSAGE', 'CONFIG', 'ADMIN', 'AUDIT_LOG', 'SYSTEM'],
            description: '目标类型筛选'
          },
          targetId: {
            type: 'string',
            description: '目标ID精确匹配'
          },
          result: {
            type: 'string',
            enum: ['SUCCESS', 'FAILURE', 'PARTIAL'],
            description: '操作结果筛选'
          },
          startDate: {
            type: 'string',
            format: 'date',
            description: '开始日期（YYYY-MM-DD）'
          },
          endDate: {
            type: 'string',
            format: 'date',
            description: '结束日期（YYYY-MM-DD）'
          },
          ipAddress: {
            type: 'string',
            description: 'IP地址模糊搜索'
          }
        }
      },
      response: {
        200: {
          description: '成功获取审计日志列表',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                logs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: '日志唯一标识' },
                      adminId: { type: 'string', description: '操作人ID' },
                      adminName: { type: 'string', description: '操作人姓名' },
                      action: { type: 'string', description: '操作类型' },
                      targetType: { type: 'string', description: '目标类型' },
                      targetId: { type: 'string', nullable: true, description: '目标ID' },
                      oldData: { type: 'object', nullable: true, description: '操作前快照' },
                      newData: { type: 'object', nullable: true, description: '操作后快照' },
                      ipAddress: { type: 'string', description: '操作IP地址' },
                      userAgent: { type: 'string', description: '浏览器User-Agent' },
                      result: { type: 'string', enum: ['SUCCESS', 'FAILURE', 'PARTIAL'], description: '操作结果' },
                      errorMessage: { type: 'string', nullable: true, description: '错误信息' },
                      requestId: { type: 'string', description: '请求追踪ID' },
                      details: { type: 'object', nullable: true, description: '额外详情' },
                      durationMs: { type: 'integer', description: '操作耗时(ms)' },
                      createdAt: { type: 'string', format: 'date-time', description: '创建时间' }
                    }
                  },
                  description: '审计日志数组'
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer', description: '总记录数' },
                    page: { type: 'integer', description: '当前页码' },
                    pageSize: { type: 'integer', description: '每页数量' },
                    totalPages: { type: 'integer', description: '总页数' }
                  },
                  description: '分页信息'
                },
                summary: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    successCount: { type: 'integer' },
                    failureCount: { type: 'integer' },
                    partialCount: { type: 'integer' },
                    successRate: { type: 'number' },
                    uniqueAdmins: { type: 'integer' },
                    uniqueTargets: { type: 'integer' }
                  },
                  description: '统计摘要'
                }
              }
            },
            _meta: {
              type: 'object',
              properties: {
                queryTime: { type: 'string', description: '查询耗时' },
                endpoint: { type: 'string', description: '接口路径' },
                queriedAt: { type: 'string', format: 'date-time' },
                filtersApplied: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '应用的筛选条件列表'
                }
              }
            }
          }
        },
        400: {
          description: '参数错误（无效的筛选条件值）'
        },
        401: {
          description: '未授权（缺少或无效Token）'
        },
        500: {
          description: '服务器内部错误'
        }
      }
    }
  }, getAuditLogsController);

  // ================================================================
  // A002: 操作统计分析接口
  // ================================================================

  /**
   * GET /api/admin/v1/audit-logs/statistics
   *
   * 功能：返回多维度的审计统计数据
   * 用途：仪表盘图表展示的数据源接口
   * 数据：时间趋势 + 操作分布 + 活跃度排名 + 失败率 + 安全告警
   *
   * 特点：
   * - 无需查询参数（返回全局统计）
   * - 数据格式直接匹配ECharts要求
   * - 包含5大维度的统计分析
   * - 提供安全告警信息
   *
   * 认证：✅ 需要Bearer Token
   * 权限：observer及以上角色
   * 缓存：建议前端缓存300秒（5分钟）
   * 响应时间：< 500ms（包含复杂聚合计算）
   */
  fastify.get('/statistics', {
    preHandler: [authMiddleware],  // JWT认证中间件
    schema: {
      description: '获取审计日志的多维度统计分析数据',
      tags: ['Audit Log（审计日志）'],
      summary: 'A002: 返回操作趋势、分布、活跃度、失败率、安全告警等统计',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功获取统计数据',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                timeSummary: {
                  type: 'object',
                  properties: {
                    today: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', description: '今日操作数' },
                        date: { type: 'string', description: '日期' }
                      }
                    },
                    thisWeek: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', description: '本周操作数' },
                        startDate: { type: 'string' },
                        endDate: { type: 'string' }
                      }
                    },
                    thisMonth: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', description: '本月操作数' },
                        startDate: { type: 'string' }
                      }
                    },
                    total: { type: 'integer', description: '总计操作数' }
                  },
                  description: '时间维度汇总'
                },
                actionDistribution: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      percentage: { type: 'number' }
                    }
                  },
                  description: '操作类型分布（含百分比）'
                },
                topAdmins: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rank: { type: 'integer', description: '排名' },
                      adminId: { type: 'string' },
                      adminName: { type: 'string' },
                      totalCount: { type: 'integer', description: '总操作数' },
                      successCount: { type: 'integer' },
                      failureCount: { type: 'integer' },
                      lastActiveAt: { type: 'string', format: 'date-time' },
                      successRate: { type: 'number', description: '成功率(%)' }
                    }
                  },
                  description: 'Top 10活跃管理员'
                },
                failureAnalysis: {
                  type: 'object',
                  properties: {
                    overallFailureRate: { type: 'number', description: '整体失败率(%)' },
                    totalFailures: { type: 'integer' },
                    partialFailures: { type: 'integer' },
                    trend: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', format: 'date' },
                          total: { type: 'integer' },
                          failures: { type: 'integer' },
                          failureRate: { type: 'number' }
                        }
                      },
                      description: '近7天失败率趋势'
                    }
                  },
                  description: '失败率分析'
                },
                securityAlerts: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', description: '告警总数' },
                    recentAlerts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          level: { type: 'string', enum: ['high', 'medium'] },
                          action: { type: 'string' },
                          targetType: { type: 'string' },
                          targetId: { type: 'string' },
                          adminName: { type: 'string' },
                          result: { type: 'string' },
                          message: { type: 'string', description: '告警描述' },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      },
                      description: '最近20条安全告警'
                    },
                    alertLevels: {
                      type: 'object',
                      properties: {
                        high: { type: 'integer' },
                        medium: { type: 'integer' }
                      }
                    }
                  },
                  description: '安全告警信息'
                }
              }
            },
            _meta: {
              type: 'object',
              properties: {
                queryTime: { type: 'string' },
                generatedAt: { type: 'string', format: 'date-time' },
                dataFreshness: { type: 'string', description: '数据新鲜度说明' },
                chartIntegration: {
                  type: 'object',
                  description: '前端图表集成提示'
                }
              }
            }
          }
        },
        401: {
          description: '未授权'
        },
        500: {
          description: '服务器内部错误'
        }
      }
    }
  }, getAuditStatisticsController);

  // ================================================================
  // A003: 单条日志详情接口
  // ================================================================

  /**
   * GET /api/admin/v1/audit-logs/:id
   *
   * 功能：获取某条审计日志的完整详细信息
   * 用途：点击日志列表中的某一行查看详情
   * 数据：完整字段 + oldData/newData对比 + 关联操作链
   *
   * URL参数：
   * - id: 审计日志的唯一标识符（必填）
   *
   * 响应增强：
   * - 包含完整的oldData/newData JSON对象
   * - 显示关联的操作链（同一目标的前后操作）
   * - 提供数据展示提示（用于前端组件选择）
   *
   * 认证：✅ 需要Bearer Token
   * 权限：observer及以上角色
   * 缓存：无缓存（实时查询）
   * 响应时间：< 150ms
   */
  fastify.get('/:id', {
    preHandler: [authMiddleware],  // JWT认证中间件
    schema: {
      description: '获取单条审计日志的完整详情（含数据快照和关联操作链）',
      tags: ['Audit Log（审计日志）'],
      summary: 'A003: 查看指定日志的完整信息、变更对比和历史关联',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            minLength: 1,
            description: '审计日志ID（UUID格式或自定义格式）'
          }
        }
      },
      response: {
        200: {
          description: '成功获取日志详情',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', description: '日志唯一标识' },
                adminId: { type: 'string', description: '操作人ID' },
                adminName: { type: 'string', description: '操作人姓名' },
                action: { type: 'string', description: '操作类型' },
                targetType: { type: 'string', description: '目标类型' },
                targetId: { type: 'string', nullable: true, description: '目标ID' },
                oldData: { type: 'object', nullable: true, description: '操作前数据快照（完整JSON）' },
                newData: { type: 'object', nullable: true, description: '操作后数据快照（完整JSON）' },
                ipAddress: { type: 'string', description: '操作IP地址' },
                userAgent: { type: 'string', description: 'User-Agent字符串' },
                result: { type: 'string', description: '操作结果' },
                errorMessage: { type: 'string', nullable: true, description: '错误详情' },
                requestId: { type: 'string', description: 'API请求追踪ID' },
                details: { type: 'object', nullable: true, description: '额外详细信息' },
                durationMs: { type: 'integer', description: '操作耗时(毫秒)' },
                createdAt: { type: 'string', format: 'date-time', description: '日志创建时间' },

                // 增强字段
                _meta: {
                  type: 'object',
                  properties: {
                    retrievedAt: { type: 'string', format: 'date-time', description: '数据检索时间' },
                    hasRelatedLogs: { type: 'boolean', description: '是否存在关联操作' },
                    relatedLogsCount: { type: 'integer', description: '关联操作数量' }
                  }
                },
                relatedOperations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      action: { type: 'string' },
                      result: { type: 'string' },
                      adminName: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  },
                  description: '关联的操作链（同一目标的前后操作）'
                }
              }
            },
            _meta: {
              type: 'object',
              properties: {
                queryTime: { type: 'string', description: '查询耗时' },
                endpoint: { type: 'string', description: '接口路径' },
                retrievedAt: { type: 'string', format: 'date-time' },
                displayHints: {
                  type: 'object',
                  properties: {
                    oldDataNewDiff: { type: 'string' },
                    relatedOperations: { type: 'string' },
                    dataSecurity: { type: 'string' }
                  },
                  description: '前端展示提示'
                }
              }
            }
          }
        },
        400: {
          description: '参数错误（缺少id或id格式无效）'
        },
        404: {
          description: '指定的审计日志不存在'
        },
        401: {
          description: '未授权'
        },
        500: {
          description: '服务器内部错误'
        }
      }
    }
  }, getAuditLogDetailController);
}

// ============================================
// 导出路由模块
// ============================================

export default auditLogRoutes;
