/**
 * Dashboard（数据仪表盘）路由模块
 *
 * 功能说明：
 * 本模块定义管理员后台数据监控仪表盘的所有API路由。
 * 提供核心指标、用户趋势、系统健康三大功能接口。
 *
 * 路由列表：
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ 方法   路径                          认证    功能说明          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ GET    /metrics                      ✅需要  获取核心运营指标   │
 * │ GET    /user-trend?period=7d         ✅需要  获取用户增长趋势   │
 * │ GET    /health                       ❌公开  系统健康状态检查   │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * 注册方式：
 * 在主入口文件 (src/index.js) 中注册：
 * ```javascript
 * import dashboardRoutes from './routes/dashboard.js';
 * await fastify.register(dashboardRoutes, { prefix: '/api/admin/v1/dashboard' });
 * ```
 *
 * 认证说明：
 * - /metrics 和 /user-trend 需要JWT认证（Bearer Token）
 * - /health 为公开接口（无需认证），方便监控系统调用
 *
 * 权限要求：
 * - 所有接口最低权限角色：observer（只读数据，不涉及敏感操作）
 *
 * Swagger文档：
 * 启动服务后访问 http://localhost:9450/docs 查看完整API文档
 *
 * 使用示例：
 * ```bash
 * # 1. 先登录获取Token
 * TOKEN=$(curl -s -X POST http://localhost:9450/api/admin/v1/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"username":"admin","password":"Admin@123456"}' | jq -r '.data.token')
 *
 * # 2. 获取核心指标
 * curl http://localhost:9450/api/admin/v1/dashboard/metrics \
 *   -H "Authorization: Bearer $TOKEN"
 *
 * # 3. 获取7天用户趋势
 * curl "http://localhost:9450/api/admin/v1/dashboard/user-trend?period=7d" \
 *   -H "Authorization: Bearer $TOKEN"
 *
 * # 4. 获取系统健康状态（无需Token）
 * curl http://localhost:9450/api/admin/v1/dashboard/health
 * ```
 *
 * 作者：GLM-5V-Turbo AI Assistant
 * 创建日期：2026-05-13
 * 版本：v1.0.0
 */

// ============================================
// 导入依赖
// ============================================

import Fastify from 'fastify';
import {
  getMetrics,
  getUserTrend,
  getSystemHealth
} from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

// ============================================
// 路由定义函数（Fastify插件格式）
// ============================================

/**
 * Dashboard路由注册函数
 *
 * 此函数符合Fastify的插件注册格式，
 * 会被主入口文件的 fastify.register() 调用。
 *
 * @param {FastifyInstance} fastify - Fastify应用实例
 * @param {Object} options - 配置选项（预留扩展）
 */
async function dashboardRoutes(fastify, options) {

  // ================================================================
  // D001: 核心指标卡片接口
  // ================================================================

  /**
   * GET /api/admin/v1/dashboard/metrics
   *
   * 功能：获取平台运营的核心数字指标
   * 用途：仪表盘顶部4-8个关键指标卡片展示
   * 数据：总用户数、今日新增、总辩论数、进行中辩论、消息数、API调用量等
   *
   * 认证：✅ 需要Bearer Token
   * 缓存：60秒自动刷新
   * 响应时间：< 100ms（缓存命中时）
   */
  fastify.get('/metrics', {
    preHandler: [authMiddleware],  // JWT认证中间件
    schema: {
      description: '获取核心运营指标',
      tags: ['Dashboard（数据仪表盘）'],
      summary: '返回平台8大核心运营指标数据',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功获取指标数据',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                totalUsers: { type: 'integer', description: '总注册用户数' },
                todayNewUsers: { type: 'integer', description: '今日新增用户' },
                totalDebates: { type: 'integer', description: '总辩论数' },
                activeDebates: { type: 'integer', description: '进行中的辩论' },
                totalMessages: { type: 'integer', description: '总消息数' },
                apiCallCountToday: { type: 'integer', description: '今日API调用量' },
                apiErrorRate: { type: 'number', description: 'API错误率(%)' },
                avgResponseTime: { type: 'integer', description: '平均响应时间(ms)' }
              }
            },
            _meta: {
              type: 'object',
              properties: {
                lastUpdated: { type: 'string', format: 'date-time' },
                dataSource: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, getMetrics);

  // ================================================================
  // D002: 用户趋势图接口
  // ================================================================

  /**
   * GET /api/admin/v1/dashboard/user-trend
   *
   * 功能：获取用户增长趋势数据（ECharts格式）
   * 用途：绘制折线图/面积图展示用户增长曲线
   * 数据：每日新增用户、活跃用户、留存率
   *
   * 查询参数：
   * - period: 时间周期 (7d|30d|90d)，默认7天
   *
   * 认证：✅ 需要Bearer Token
   * 缓存：300秒（5分钟）自动刷新
   * 响应时间：< 150ms（缓存命中时）
   *
   * ECharts前端集成示例：
   * ```javascript
   * const response = await fetch('/api/admin/v1/dashboard/user-trend?period=7d');
   * const { data } = await response.json();
   *
   * chart.setOption({
   *   xAxis: { data: data.dates },
   *   series: [
   *     { name: '新增用户', type: 'line', data: data.newUsers },
   *     { name: '活跃用户', type: 'line', data: data.activeUsers },
   *     { name: '留存率', type: 'line', yAxisIndex: 1, data: data.retentionRate }
   *   ]
   * });
   * ```
   */
  fastify.get('/user-trend', {
    preHandler: [authMiddleware],  // JWT认证中间件
    schema: {
      description: '获取用户增长趋势数据',
      tags: ['Dashboard（数据仪表盘）'],
      summary: '返回近N天的用户增长趋势（ECharts格式）',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['7d', '30d', '90d'],
            default: '7d',
            description: '时间周期：7d=近7天, 30d=近30天, 90d=近90天'
          }
        }
      },
      response: {
        200: {
          description: '成功获取趋势数据',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                dates: {
                  type: 'array',
                  items: { type: 'string', format: 'date' },
                  description: '日期数组'
                },
                newUsers: {
                  type: 'array',
                  items: { type: 'integer' },
                  description: '每日新增用户数'
                },
                activeUsers: {
                  type: 'array',
                  items: { type: 'integer' },
                  description: '每日活跃用户数'
                },
                retentionRate: {
                  type: 'array',
                  items: { type: 'number' },
                  description: '每日留存率(%)'
                }
              }
            },
            _meta: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                dataPoints: { type: 'integer' },
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, getUserTrend);

  // ================================================================
  // D003: 系统健康状态接口
  // ================================================================

  /**
   * GET /api/admin/v1/dashboard/health
   *
   * 功能：检测各子系统运行状态
   * 用途：系统监控面板、负载均衡器健康检查、容器探针
   * 数据：数据库、AI服务、磁盘、内存等子系统状态
   *
   * 特点：
   * - ❌ 无需认证（公开接口）
   * - 可用于Docker HEALTHCHECK指令
   * - 可用于Kubernetes liveness/readiness probe
   * - 缓存30秒（平衡实时性和性能）
   *
   * 监控系统集成示例：
   * ```bash
   * # Shell脚本定时检查
   * while true; do
   *   curl -sf http://localhost:9450/api/admin/v1/dashboard/health > /dev/null
   *   if [ $? -ne 0 ]; then
   *     echo "[ALERT] Dashboard health check failed!"
   *     send_alert_notification
   *   fi
   *   sleep 30
   * done
   * ```
   */
  fastify.get('/health', {
    // 注意：此接口不需要认证中间件（公开访问）
    schema: {
      description: '系统健康状态检查',
      tags: ['Dashboard（数据仪表盘）'],
      summary: '检测各子系统运行状态（无需认证）',
      response: {
        200: {
          description: '成功获取健康状态',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                overallStatus: {
                  type: 'string',
                  enum: ['healthy', 'warning', 'critical'],
                  description: '整体健康状态'
                },
                uptime: { type: 'string', description: '系统运行时间' },
                checks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: '子系统名称' },
                      status: { type: 'string', enum: ['ok', 'warning', 'critical'] },
                      responseTime: { type: 'string', description: '响应时间或使用率' },
                      usage: { type: 'string', description: '资源使用率（可选）' }
                    }
                  }
                }
              }
            },
            _meta: {
              type: 'object',
              properties: {
                checkTime: { type: 'string', format: 'date-time' },
                nodeVersion: { type: 'string' },
                platform: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, getSystemHealth);
}

// ============================================
// 导出路由模块
// ============================================

export default dashboardRoutes;
