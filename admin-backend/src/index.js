/**
 * 管理员后端系统 - 主入口文件
 *
 * 项目名称：PRD辩论APP Admin Backend
 * 技术栈：Fastify 5 + JWT + bcryptjs + ES Module
 * 端口：9450（已锁定）
 *
 * 功能模块：
 * - ✅ JWT认证系统（登录/登出/Token刷新）
 * - ✅ RBAC权限控制（三级角色体系）
 * - ✅ 审计日志记录
 * - ✅ 数据仪表盘（核心指标/用户趋势/系统健康）
 * - ✅ 议题管理（全生命周期：创建/编辑/上架/下架/热度调整）
 * - 🔜 用户管理（待开发）
 *
 * 启动方式：
 *   开发环境: bun run dev
 *   生产环境: bun run start
 *
 * API文档：
 *   启动后访问 http://localhost:9450/docs 查看Swagger UI
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import topicRoutes from './routes/topic.js';
import userRoutes from './routes/user.js';           // 导入用户管理路由
import configRoutes from './routes/config.js';         // 导入系统配置管理路由
import soulRoutes from './routes/soul.js';             // 导入Soul角色管理路由
import auditLogRoutes from './routes/auditLog.js';    // 导入审计日志路由
import { auditLoggerPlugin } from './middleware/auditLogger.js';  // 导入全局审计中间件
import { authMiddleware as auth } from './middleware/auth.js';
import { checkRole, checkPermission, ROLES } from './middleware/rbac.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// ============================================
// 配置常量
// ============================================
const PORT = parseInt(process.env.PORT) || 9450;
const HOST = process.env.HOST || '0.0.0.0';
const API_PREFIX = process.env.API_PREFIX || '/api/admin/v1';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// 创建Fastify实例
// ============================================
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  },
  // 允许JSON Schema中的example关键字（用于API文档）
  ajv: {
    customOptions: { allErrors: true, strict: false }
  }
});

// ============================================
// 注册插件
// ============================================

/**
 * 1. 注册CORS跨域支持
 * 允许前端应用（不同端口/域名）访问API
 */
await fastify.register(cors, {
  origin: true,                // 允许所有来源（生产环境应限制具体域名）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true            // 支持携带cookie（如果需要的话）
});

/**
 * 2. 注册Swagger API文档生成器
 * 用于自动生成API文档，方便前后端联调
 */
await fastify.register(swagger, {
  openapi: {
    openapi: '3.0.3',
    info: {
      title: 'PRD辩论APP - 管理员后端API',
      description: `
## 📋 项目概述

管理员后台管理系统API，基于 **Fastify 5** + **JWT** + **RBAC** 构建。

### 🔐 认证方式

所有需要认证的接口使用 **Bearer Token** 方式：

\`\`\`bash
Authorization: Bearer <your_jwt_token>
\`\`\`

### 👥 角色权限

| 角色 | 权限说明 |
|------|----------|
| \`super_admin\` | 超级管理员，拥有所有权限 |
| \`admin\` | 普通管理员，拥有业务操作权限 |
| \`observer\` | 只读观察者，只能查看数据 |

### 📝 使用示例

1. **登录获取Token**
   \`\`\`bash
   curl -X POST http://localhost:${PORT}${API_PREFIX}/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"username":"admin","password":"Admin@123456"}'
   \`\`\`

2. **使用Token访问受保护接口**
   \`\`\`bash
   curl http://localhost:${PORT}${API_PREFIX}/auth/profile \\
     -H "Authorization: Bearer <token_from_login>"
   \`\`\`
      `,
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@prd-debate.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '本地开发服务器'
      },
      {
        url: 'https://api.renrenup.cn',
        description: '生产服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer' },
            message: { type: 'string' },
            errorType: { type: 'string' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  }
});

/**
 * 3. 注册Swagger UI界面
 * 访问 /docs 路径可查看交互式API文档
 */
await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',       // 默认展开侧边栏列表
    deepLinking: false           // 禁用深度链接
  },
  staticCSP: true,
  transformStaticCsp: (header) => header
});

// ============================================
// 注册路由模块
// ============================================

/**
 * 注册认证路由
 * 前缀: /api/admin/v1/auth
 * 包含：login, profile, password, logout, refresh
 */
await fastify.register(authRoutes, { prefix: `${API_PREFIX}/auth` });

/**
 * 注册Dashboard数据仪表盘路由
 * 前缀: /api/admin/v1/dashboard
 * 包含：metrics（核心指标）、user-trend（用户趋势）、health（系统健康）
 */
await fastify.register(dashboardRoutes, { prefix: `${API_PREFIX}/dashboard` });

/**
 * 注册议题管理路由
 * 前缀: /api/admin/v1/topics
 * 包含：列表查询(T001)、详情查看(T002)、创建/编辑(T003)、上架/下架(T004)、热度调整(T005)
 */
await fastify.register(topicRoutes, { prefix: `${API_PREFIX}/topics` });

/**
 * 注册用户管理路由
 * 前缀: /api/admin/v1/users
 * 包含：
 *   - GET    /                    用户列表（U001）- 分页查询、筛选、排序
 *   - GET    /search              用户搜索（U004）- 实时联想
 *   - GET    /:id                 用户详情（U002）- 完整用户画像
 *   - PATCH  /:id/status          修改状态（U003）- 禁用/启用用户
 */
await fastify.register(userRoutes, { prefix: `${API_PREFIX}/users` });

/**
 * 注册全局审计日志中间件插件
 *
 * 功能：自动拦截所有写操作（POST/PUT/PATCH/DELETE）并记录审计日志
 * 特性：
 * - 异步非阻塞（不影响API响应速度）
 * - 智能推断操作类型和目标类型
 * - 敏感数据自动过滤
 * - 异常容错（日志失败不阻断主流程）
 *
 * 所有后续注册的路由都会自动被此中间件监控
 */
await fastify.register(auditLoggerPlugin);

/**
 * 注册审计日志路由
 * 前缀: /api/admin/v1/audit-logs
 * 包含：
 *   - GET    /                     A001: 审计日志列表查询（多条件筛选+分页）
 *   - GET    /statistics            A002: 操作统计分析（趋势/分布/活跃度/告警）
 *   - GET    /:id                  A003: 单条日志详情查看（数据快照+关联操作链）
 */
await fastify.register(auditLogRoutes, { prefix: `${API_PREFIX}/audit-logs` });

/**
 * 注册系统配置管理路由
 * 前缀: /api/admin/v1/configs
 * 包含：
 *   - GET    /                    配置项列表（C001）- 分类型筛选、搜索、分页
 *   - GET    /history             配置变更历史 - 审计日志查询
 *   - GET    /:key                单个配置详情（C002）- 支持脱敏/明文显示
 *   - PUT    /:key                更新配置值（C003）- 权限控制、变更记录
 *   - PUT    /batch               批量更新配置（C004）- 原子操作
 *   - POST   /:key/reset          重置为默认值（C005）- 仅超级管理员
 */
await fastify.register(configRoutes, { prefix: `${API_PREFIX}/configs` });

/**
 * 注册Soul角色管理路由
 * 前缀: /api/admin/v1/souls
 * 包含：
 *   - GET    /                    角色列表（S001）- 分页查询、筛选、排序
 *   - GET    /:id                 角色详情（S002）- 完整配置+AI参数+统计
 *   - POST   /                    创建角色（S003）- 名称/分类必填校验
 *   - PUT    /:id                 编辑角色（S003续）- 预设保护机制
 *   - PATCH  /:id/status          修改状态（S004）- 激活/停用切换
 *   - PATCH  /:id/ai-config       调整AI参数（S005）- temperature/maxTokens等
 */
await fastify.register(soulRoutes, { prefix: `${API_PREFIX}/souls` });

// ============================================
// 示例路由（演示RBAC用法）
// ============================================

/**
 * 公开接口示例（无需认证）
 */
fastify.get(`${API_PREFIX}/public`, async (request, reply) => {
  return {
    success: true,
    message: '这是一个公开接口，无需认证即可访问',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        auth: `${API_PREFIX}/auth/*`,
        docs: `/docs`
      }
    }
  };
});

/**
 * 需要认证的接口示例
 */
fastify.get(`${API_PREFIX}/protected`, {
  preHandler: [auth],
  schema: {
    description: '需要认证的接口示例',
    tags: ['Examples'],
    security: [{ bearerAuth: [] }]
  }
}, async (request, reply) => {
  return {
    success: true,
    message: '您已通过认证！',
    data: {
      user: request.user,
      hint: '这是一个需要登录才能访问的接口'
    }
  };
});

/**
 * 需要特定角色的接口示例（只有super_admin和admin能访问）
 */
fastify.get(`${API_PREFIX}/admin-only`, {
  preHandler: [auth, checkRole([ROLES.SUPER_ADMIN, ROLES.ADMIN])],
  schema: {
    description: '仅管理员可访问的接口示例',
    tags: ['Examples'],
    security: [{ bearerAuth: [] }]
  }
}, async (request, reply) => {
  return {
    success: true,
    message: '欢迎，管理员！您拥有足够的角色权限。',
    data: {
      user: request.user,
      hint: '此接口要求 super_admin 或 admin 角色'
    }
  };
});

/**
 * 需要特定权限的接口示例（需要用户查看权限）
 */
fastify.get(`${API_PREFIX}/permission-example`, {
  preHandler: [auth, checkPermission('user:view')],
  schema: {
    description: '需要特定权限的接口示例',
    tags: ['Examples'],
    security: [{ bearerAuth: [] }]
  }
}, async (request, reply) => {
  return {
    success: true,
    message: '您拥有 user:view 权限！',
    data: {
      user: request.user,
      permissions: request.user.permissions,
      hint: '此接口要求 user:view 权限'
    }
  };
});

// ============================================
// 全局错误处理
// ============================================

/**
 * 全局错误处理钩子
 * 统一捕获未处理的异常并返回标准格式响应
 */
fastify.setErrorHandler((error, request, reply) => {
  // 记录错误日志
  fastify.log.error({
    error: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
    params: request.params,
    query: request.query
  });

  // 根据错误类型返回不同的HTTP状态码
  let statusCode = error.statusCode || 500;
  let errorCode = statusCode;
  let errorMessage = error.message || '服务器内部错误';

  // Fastify验证错误
  if (error.validation) {
    statusCode = 400;
    errorCode = 400;
    errorMessage = '请求参数验证失败';
  }

  return reply.status(statusCode).send({
    success: false,
    code: errorCode,
    message: errorMessage,
    errorType: error.code || 'INTERNAL_ERROR',
    ...(NODE_ENV === 'development' && { stack: error.stack })  // 开发环境返回堆栈信息
  });
});

// ============================================
// 健康检查端点
// ============================================

/**
 * 健康检查接口
 * 用于负载均衡器、容器编排系统检测服务状态
 */
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'prd-debate-admin-backend',
    version: '1.0.0',
    environment: NODE_ENV
  };
});

// ============================================
// 启动服务器
// ============================================

/**
 * 启动HTTP服务器并监听指定端口
 */
const startServer = async () => {
  try {
    // 先尝试监听端口
    await fastify.listen({ port: PORT, host: HOST });

    console.log('');
    console.log('====================================================');
    console.log('  PRD辩论APP - 管理员后端系统已启动');
    console.log('====================================================');
    console.log('  服务地址: http://' + HOST + ':' + PORT);
    console.log('  API前缀:  ' + API_PREFIX);
    console.log('  环境:     ' + NODE_ENV);
    console.log('----------------------------------------------------');
    console.log('  可用接口:');
    console.log('  - 健康检查: http://localhost:' + PORT + '/health');
    console.log('  - API文档:  http://localhost:' + PORT + '/docs');
    console.log('  - 登录接口: POST ' + API_PREFIX + '/auth/login');
    console.log('  - 核心指标: GET  ' + API_PREFIX + '/dashboard/metrics');
    console.log('  - 用户趋势: GET  ' + API_PREFIX + '/dashboard/user-trend?period=7d');
    console.log('  - 系统健康: GET  ' + API_PREFIX + '/dashboard/health');
    console.log('  - 议题列表: GET  ' + API_PREFIX + '/topics');
    console.log('  - 议题详情: GET  ' + API_PREFIX + '/topics/:id');
    console.log('  - 创建议题: POST ' + API_PREFIX + '/topics');
    console.log('  - 上架下架: PATCH' + API_PREFIX + '/topics/:id/status');
    console.log('  - 用户列表: GET  ' + API_PREFIX + '/users');                    // U001
  console.log('  - 用户搜索: GET  ' + API_PREFIX + '/users/search?q=xxx');    // U004
  console.log('  - 用户详情: GET  ' + API_PREFIX + '/users/:id');              // U002
  console.log('  - 状态修改: PATCH' + API_PREFIX + '/users/:id/status');       // U003
  console.log('  - 审计日志: GET  ' + API_PREFIX + '/audit-logs');             // A001
  console.log('  - 审计统计: GET  ' + API_PREFIX + '/audit-logs/statistics');  // A002
  console.log('  - 日志详情: GET  ' + API_PREFIX + '/audit-logs/:id');         // A003
    console.log('  - 配置列表: GET  ' + API_PREFIX + '/configs');                // C001
    console.log('  - 配置历史: GET  ' + API_PREFIX + '/configs/history');        // 审计日志
    console.log('  - 配置详情: GET  ' + API_PREFIX + '/configs/:key');           // C002
    console.log('  - 更新配置: PUT  ' + API_PREFIX + '/configs/:key');           // C003
    console.log('  - 批量更新: PUT  ' + API_PREFIX + '/configs/batch');          // C004
    console.log('  - 重置配置: POST ' + API_PREFIX + '/configs/:key/reset');     // C005
    console.log('  - Soul列表: GET  ' + API_PREFIX + '/souls');                   // S001
    console.log('  - Soul详情: GET  ' + API_PREFIX + '/souls/:id');               // S002
    console.log('  - 创建Soul: POST ' + API_PREFIX + '/souls');                   // S003
    console.log('  - 编辑Soul: PUT  ' + API_PREFIX + '/souls/:id');               // S003续
    console.log('  - 状态修改: PATCH' + API_PREFIX + '/souls/:id/status');        // S004
    console.log('  - AI参数:   PATCH' + API_PREFIX + '/souls/:id/ai-config');     // S005
    console.log('----------------------------------------------------');
    console.log('  测试账号:');
    console.log('  - 超级管理员: admin / Admin@123456');
    console.log('  - 运营人员:  operator / Admin@123456');
    console.log('  - 观察员:    viewer / Admin@123456');
    console.log('====================================================');
    console.log('');

  } catch (err) {
    fastify.log.error(err);

    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用，请检查是否有其他服务正在运行`);
      console.error('💡 提示: 可以修改 .env 文件中的 PORT 变量更换端口');
    } else {
      console.error('❌ 服务器启动失败:', err.message);
    }

    process.exit(1);
  }
};

// 处理未捕获的异常
process.on('unhandledRejection', (promise, reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 启动服务器
startServer();

// 导出fastify实例（用于测试）
export default fastify;
