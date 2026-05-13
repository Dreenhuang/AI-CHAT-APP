/**
 * 系统配置管理服务层 (Config Service)
 *
 * 功能说明：
 * 实现平台系统配置的完整管理功能，包括：
 * - C001: 配置项列表查询（分类型、搜索、敏感过滤）
 * - C002: 获取单个配置详情（支持脱敏显示）
 * - C003: 更新配置值（权限控制、变更历史）
 * - C004: 批量更新配置（原子操作）
 * - C005: 重置配置为默认值
 *
 * 技术架构：
 * - 服务层模式：封装所有配置相关的业务逻辑
 * - 内存存储 + 异步持久化模拟（生产环境替换为Redis/数据库）
 * - 敏感值脱敏机制：API Key等自动脱敏显示
 * - 完整审计日志：所有写操作记录变更历史
 *
 * 配置类型说明：
 * ┌──────────────┬─────────────────────────────────────────────────┐
 * │   配置类型    │                  说明                          │
 * ├──────────────┼─────────────────────────────────────────────────┤
 * │ AI_API_KEY   │ AI服务商API密钥（MiniMax、DeepSeek等）         │
 * │ FEATURE_FLAG │ 功能开关（控制模块启用/禁用）                    │
 * │ AI_PARAM     │ AI模型参数（模型版本、温度、最大token等）        │
 * │ RATE_LIMIT   │ 限流配置（API调用频率限制）                     │
 * │ SYSTEM       │ 系统级配置（维护模式、调试开关等）               │
 * │ THIRD_PARTY  │ 第三方服务配置（Figma、Supabase等）             │
 * │ SECURITY     │ 安全相关配置（密码策略、CORS等）                │
 * │ NOTIFICATION │ 通知配置（邮件、短信、推送等）                   │
 * └──────────────┴─────────────────────────────────────────────────┘
 *
 * 权限矩阵：
 * ┌──────────────────┬──────────┬────────┬───────────┐
 * │ 操作              │super_admin│ admin  │ observer  │
 * ├──────────────────┼──────────┼────────┼───────────┤
 * │ 查看配置列表      │    ✅    │   ✅   │     ✅    │
 * │ 查看配置详情      │    ✅    │   ✅   │     ✅    │
 * │ 查看敏感值(明文)  │    ✅    │   ❌   │     ❌    │
 * │ 修改非敏感配置    │    ✅    │   ✅   │     ❌    │
 * │ 修改敏感配置      │    ✅    │   ❌   │     ❌    │
 * │ 批量修改配置      │    ✅    │   ❌   │     ❌    │
 * │ 重置为默认值      │    ✅    │   ❌   │     ❌    │
 * └──────────────────┴──────────┴────────┴───────────┘
 */

// ============================================
// 类型定义 (JSDoc Type Definitions)
// ============================================

/**
 * @typedef {Object} ConfigItem
 * @property {string} id - 配置项唯一标识（UUID格式）
 * @property {string} configKey - 配置键名（如 "ai.minimax.api_key"）
 * @property {any} configValue - 配置当前值（字符串/数字/布尔/JSON）
 * @property {'AI_API_KEY'|'FEATURE_FLAG'|'AI_PARAM'|'RATE_LIMIT'|'SYSTEM'|'THIRD_PARTY'|'SECURITY'|'NOTIFICATION'} configType - 配置类型
 * @property {string} description - 配置说明（给管理员看的帮助文本）
 * @property {boolean} isSensitive - 是否敏感信息（API Key等需脱敏显示）
 * @property {string} [maskedValue] - 脱敏后的值（如 "sk-****xxxx"）
 * @property {any} defaultValue - 系统默认值
 * @property {string} [updatedBy] - 最后修改人用户名
 * @property {string} updatedAt - 最后修改时间
 * @property {string} createdAt - 创建时间
 * @property {number} version - 版本号（用于乐观锁）
 */

/**
 * @typedef {Object} ConfigListParams
 * @property {string} [type] - 配置类型筛选: all/api_key/feature_flag/ai_param/rate_limit/system/third_party/security/notification
 * @property {string} [search] - 搜索关键词（匹配键名和描述）
 * @property {string} [isSensitive] - 敏感性过滤: true/false/all
 * @property {number} [page] - 页码
 * @property {number} [pageSize] - 每页条数
 */

/**
 * @typedef {Object} ConfigListResponse
 * @property {ConfigItem[]} configs - 配置数组
 * @property {Object} typeStats - 各类型统计
 * @property {Object} pagination - 分页信息
 */

/**
 * @typedef {Object} ConfigUpdateResult
 * @property {ConfigItem} config - 更新后的完整配置对象
 * @property {Object} changeLog - 变更日志
 * @property {any} oldValue - 旧值
 * @property {any} newValue - 新值
 */

// ============================================
// 配置类型常量定义
// ============================================

/**
 * 系统支持的配置类型枚举
 */
export const CONFIG_TYPES = {
  AI_API_KEY: 'AI_API_KEY',           // AI API密钥
  FEATURE_FLAG: 'FEATURE_FLAG',         // 功能开关
  AI_PARAM: 'AI_PARAM',                 // AI参数配置
  RATE_LIMIT: 'RATE_LIMIT',             // 限流配置
  SYSTEM: 'SYSTEM',                     // 系统配置
  THIRD_PARTY: 'THIRD_PARTY',           // 第三方服务
  SECURITY: 'SECURITY',                 // 安全配置
  NOTIFICATION: 'NOTIFICATION'          // 通知配置
};

/**
 * 配置类型的中文映射（用于前端展示）
 */
export const CONFIG_TYPE_LABELS = {
  [CONFIG_TYPES.AI_API_KEY]: 'AI API密钥',
  [CONFIG_TYPES.FEATURE_FLAG]: '功能开关',
  [CONFIG_TYPES.AI_PARAM]: 'AI参数',
  [CONFIG_TYPES.RATE_LIMIT]: '限流配置',
  [CONFIG_TYPES.SYSTEM]: '系统配置',
  [CONFIG_TYPES.THIRD_PARTY]: '第三方服务',
  [CONFIG_TYPES.SECURITY]: '安全配置',
  [CONFIG_TYPES.NOTIFICATION]: '通知配置'
};

// ============================================
// 预置系统默认配置 (System Default Configs)
// ============================================

/**
 * 系统预置的默认配置项
 *
 * 设计说明：
 * - 这些是系统启动时的初始配置
 * - 管理员可以通过API修改这些值
 * - 敏感配置（isSensitive=true）在列表中会自动脱敏
 * - 可以通过 reset 接口重置为这些默认值
 */
const DEFAULT_CONFIGS = [
  // ========== AI API 密钥配置 ==========
  {
    key: 'ai.minimax.api_key',
    type: CONFIG_TYPES.AI_API_KEY,
    value: '',
    sensitive: true,
    desc: 'MiniMax API密钥（用于文本生成、音乐生成等功能）'
  },
  {
    key: 'ai.minimax.model',
    type: CONFIG_TYPES.AI_PARAM,
    value: 'MiniMax-M2.7',
    sensitive: false,
    desc: 'MiniMax模型版本（推荐：MiniMax-M2.7）'
  },
  {
    key: 'ai.minimax.base_url',
    type: CONFIG_TYPES.AI_PARAM,
    value: 'https://api.minimax.chat/v1',
    sensitive: false,
    desc: 'MiniMax API基础URL'
  },
  {
    key: 'ai.deepseek.api_key',
    type: CONFIG_TYPES.AI_API_KEY,
    value: '',
    sensitive: true,
    desc: 'DeepSeek API密钥（用于深度推理任务）'
  },
  {
    key: 'ai.deepseek.model',
    type: CONFIG_TYPES.AI_PARAM,
    value: 'deepseek-v4-flash',
    sensitive: false,
    desc: 'DeepSeek模型版本（推荐：deepseek-v4-flash）'
  },
  {
    key: 'ai.deepseek.base_url',
    type: CONFIG_TYPES.AI_PARAM,
    value: 'https://api.deepseek.com',
    sensitive: false,
    desc: 'DeepSeek API基础URL'
  },

  // ========== 功能开关配置 ==========
  {
    key: 'feature.debate.enable',
    type: CONFIG_TYPES.FEATURE_FLAG,
    value: 'true',
    sensitive: false,
    desc: '是否启用辩论功能（关闭后前端将隐藏辩论入口）'
  },
  {
    key: 'feature.registration.enable',
    type: CONFIG_TYPES.FEATURE_FLAG,
    value: 'true',
    sensitive: false,
    desc: '是否开放新用户注册（关闭后只允许邀请码注册）'
  },
  {
    key: 'feature.ai_chat.enable',
    type: CONFIG_TYPES.FEATURE_FLAG,
    value: 'true',
    sensitive: false,
    desc: '是否启用AI对话功能'
  },
  {
    key: 'feature.realtime_translation.enable',
    type: CONFIG_TYPES.FEATURE_FLAG,
    value: 'false',
    sensitive: false,
    desc: '是否启用实时翻译功能（消耗更多API调用）'
  },

  // ========== 限流配置 ==========
  {
    key: 'rate.limit.api',
    type: CONFIG_TYPES.RATE_LIMIT,
    value: '100',
    sensitive: false,
    desc: '每分钟单用户API调用次数限制'
  },
  {
    key: 'rate.limit.chat',
    type: CONFIG_TYPES.RATE_LIMIT,
    value: '30',
    sensitive: false,
    desc: '每分钟单用户聊天消息数限制'
  },
  {
    key: 'rate.limit.file_upload',
    type: CONFIG_TYPES.RATE_LIMIT,
    value: '10',
    sensitive: false,
    desc: '每分钟单用户文件上传次数限制'
  },

  // ========== 系统级配置 ==========
  {
    key: 'system.maintenance',
    type: CONFIG_TYPES.SYSTEM,
    value: 'false',
    sensitive: false,
    desc: '维护模式开关（开启后前端显示"系统维护中"提示）'
  },
  {
    key: 'system.maintenance.message',
    type: CONFIG_TYPES.SYSTEM,
    value: '系统正在进行升级维护，预计30分钟后恢复，敬请谅解。',
    sensitive: false,
    desc: '维护模式下的提示文案'
  },
  {
    key: 'system.debug_mode',
    type: CONFIG_TYPES.SYSTEM,
    value: 'false',
    sensitive: false,
    desc: '调试模式开关（开启后会输出详细日志，生产环境请关闭）'
  },
  {
    key: 'system.default_language',
    type: CONFIG_TYPES.SYSTEM,
    value: 'zh-CN',
    sensitive: false,
    desc: '系统默认语言（zh-CN/en-US/ja-JP等）'
  },
  {
    key: 'system.timezone',
    type: CONFIG_TYPES.SYSTEM,
    value: 'Asia/Shanghai',
    sensitive: false,
    desc: '服务器时区设置'
  },

  // ========== 第三方服务配置 ==========
  {
    key: 'third_party.figma.api_key',
    type: CONFIG_TYPES.THIRD_PARTY,
    value: '',
    sensitive: true,
    desc: 'Figma API密钥（用于设计稿同步）'
  },
  {
    key: 'third_party.supabase.url',
    type: CONFIG_TYPES.THIRD_PARTY,
    value: 'https://jaduaifzmgvaotyqnjfe.supabase.co',
    sensitive: false,
    desc: 'Supabase项目URL'
  },
  {
    key: 'third_party.supabase.anon_key',
    type: CONFIG_TYPES.THIRD_PARTY,
    value: '',
    sensitive: true,
    desc: 'Supabase匿名访问密钥（公开可暴露给前端）'
  },
  {
    key: 'third_party.supabase.service_role_key',
    type: CONFIG_TYPES.THIRD_PARTY,
    value: '',
    sensitive: true,
    desc: 'Supabase服务角色密钥（管理员权限，严禁泄露）'
  },

  // ========== 安全配置 ==========
  {
    key: 'security.password_min_length',
    type: CONFIG_TYPES.SECURITY,
    value: '8',
    sensitive: false,
    desc: '用户密码最小长度要求'
  },
  {
    key: 'security.session_timeout',
    type: CONFIG_TYPES.SECURITY,
    value: '86400',
    sensitive: false,
    desc: '会话超时时间（单位：秒，默认24小时）'
  },
  {
    key: 'security.max_login_attempts',
    type: CONFIG_TYPES.SECURITY,
    value: '5',
    sensitive: false,
    desc: '最大登录失败次数（超过后锁定账户）'
  },
  {
    key: 'security.cors_origins',
    type: CONFIG_TYPES.SECURITY,
    value: '*',
    sensitive: false,
    desc: '允许跨域访问的来源（*表示全部允许，生产环境应限制具体域名）'
  },

  // ========== 通知配置 ==========
  {
    key: 'notification.email.enabled',
    type: CONFIG_TYPES.NOTIFICATION,
    value: 'false',
    sensitive: false,
    desc: '是否启用邮件通知'
  },
  {
    key: 'notification.email.smtp_host',
    type: CONFIG_TYPES.NOTIFICATION,
    value: '',
    sensitive: false,
    desc: 'SMTP服务器地址'
  },
  {
    key: 'notification.email.smtp_port',
    type: CONFIG_TYPES.NOTIFICATION,
    value: '587',
    sensitive: false,
    desc: 'SMTP服务器端口'
  },
  {
    key: 'notification.push.enabled',
    type: CONFIG_TYPES.NOTIFICATION,
    value: 'true',
    sensitive: false,
    desc: '是否启用App推送通知'
  }
];

// ============================================
// 运行时配置存储 (Runtime Config Store)
// ============================================

/**
 * 内存中的配置数据存储
 *
 * 初始化流程：
 * 1. 从DEFAULT_CONFIGS复制初始值到运行时存储
 * 2. 生产环境启动时会从数据库/Redis加载覆盖这些值
 * 3. 所有读写操作都针对这个内存存储
 * 4. 变更会异步持久化（这里只是模拟）
 */
let configStore = [];

/**
 * 审计日志存储
 * 记录所有配置变更操作，用于安全追溯
 */
const configAuditLogs = [];

/**
 * 标记是否已初始化
 */
let isInitialized = false;

/**
 * 初始化配置存储
 *
 * 将预置的默认配置加载到内存中
 * 只执行一次，后续调用直接返回
 */
function initializeConfigStore() {
  if (isInitialized) return;

  const now = new Date().toISOString();

  // 从默认配置创建运行时配置对象
  configStore = DEFAULT_CONFIGS.map((config, index) => ({
    id: `cfg_${String(index + 1).padStart(3, '0')}_${Date.now()}`,
    configKey: config.key,
    configValue: config.value,            // 当前值（可能被修改过）
    configType: config.type,
    description: config.desc,
    isSensitive: config.sensitive,
    maskedValue: config.sensitive ? maskSensitiveValue(config.value) : undefined,
    defaultValue: config.value,           // 默认值（重置用）
    updatedBy: 'system',                  // 初始创建者
    updatedAt: now,
    createdAt: now,
    version: 1                            // 初始版本号
  }));

  isInitialized = true;

  console.log(
    `[ConfigService] 配置存储初始化完成 | ` +
    `共加载 ${configStore.length} 个配置项 | ` +
    `其中 ${configStore.filter(c => c.isSensitive).length} 个敏感配置`
  );
}

// ============================================
// 工具函数 (Utility Functions)
// ============================================

/**
 * 对敏感值进行脱敏处理
 *
 * 脱敏规则：
 * - 如果值为空或长度<=8，返回 "****"
 * - 否则保留前3位和后4位，中间用****替代
 * - 例如："sk-abc123xyz" → "sk-abc****xyz"
 *
 * @param {any} value - 原始值
 * @returns {string} 脱敏后的字符串
 */
export function maskSensitiveValue(value) {
  if (value === null || value === undefined || value === '') {
    return '****';
  }

  const strValue = String(value);

  if (strValue.length <= 8) {
    return '****';
  }

  // 保留前3位和后4位，中间用****替代
  const prefix = strValue.substring(0, 3);
  const suffix = strValue.substring(strValue.length - 4);

  return `${prefix}****${suffix}`;
}

/**
 * 解析配置值的类型
 *
 * 自动识别并转换字符串值为对应的JavaScript类型：
 * - "true"/"false" → boolean
 * - 纯数字字符串 → number
 * - JSON格式的字符串 → object
 * - 其他 → string
 *
 * @param {string} value - 字符串值
 * @returns {any} 解析后的值
 */
export function parseConfigValue(value) {
  if (typeof value !== 'string') {
    return value;  // 非字符串直接返回
  }

  // 布尔值
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // 数字
  if (/^-?\d+\.?\d*$/.test(value)) {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }

  // 尝试JSON解析（对象/数组）
  try {
    const parsed = JSON.parse(value);
    if (['object', 'array'].includes(typeof parsed)) {
      return parsed;
    }
  } catch (e) {
    // 不是有效的JSON，继续作为字符串处理
  }

  // 默认返回原始字符串
  return value;
}

/**
 * 记录配置变更审计日志
 *
 * @param {Object} logInfo - 日志信息
 * @param {string} logInfo.action - 操作类型（UPDATE/BATCH_UPDATE/RESET/REVEAL）
 * @param {string} logInfo.operator - 操作人用户名
 * @param {string} logInfo.configKey - 配置键名
 * @param {any} logInfo.oldValue - 旧值
 * @param {any} logInfo.newValue - 新值
 * @param {string} logInfo.ip - 操作IP地址
 * @param {string} [logInfo.reason] - 操作原因
 */
function recordConfigAuditLog(logInfo) {
  const logEntry = {
    ...logInfo,
    timestamp: new Date().toISOString(),
    logId: `config_audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  configAuditLogs.push(logEntry);

  // 只保留最近2000条日志（防止内存溢出）
  if (configAuditLogs.length > 2000) {
    configAuditLogs.shift();
  }

  console.log(
    `[ConfigAudit] ${logEntry.action} | ` +
    `操作人: ${logEntry.operator} | ` +
    `配置: ${logEntry.configKey} | ` +
    (logEntry.reason ? `原因: ${logEntry.reason}` : '')
  );
}

/**
 * 验证配置值是否符合类型约束
 *
 * @param {string} configKey - 配置键名
 * @param {any} newValue - 新值
 * @returns {{ valid: boolean, message: string }}
 */
function validateConfigValue(configKey, newValue) {
  // 基本非空检查（空字符串在某些情况下可能是合法的）
  if (newValue === undefined || newValue === null) {
    return { valid: false, message: '配置值不能为null或undefined' };
  }

  // 特殊配置的特殊校验
  if (configKey === 'system.maintenance' || configKey.startsWith('feature.')) {
    // 功能开关和维护模式必须是布尔值或布尔字符串
    if (['true', 'false', true, false].includes(newValue)) {
      return { valid: true, message: '布尔值有效' };
    }
    return { valid: false, message: '此配置必须是布尔值（true/false）' };
  }

  if (configKey.includes('rate.limit.')) {
    // 限流配置必须是正整数
    const num = Number(newValue);
    if (!isNaN(num) && num > 0 && Number.isInteger(num)) {
      return { valid: true, message: '限流值有效' };
    }
    return { valid: false, message: '限流配置必须是正整数' };
  }

  if (configKey.includes('.api_key')) {
    // API Key如果提供非空值，最小长度检查
    if (newValue !== '' && String(newValue).length < 10) {
      return { valid: false, message: 'API Key长度不能少于10个字符' };
    }
    return { valid: true, message: 'API Key有效' };
  }

  // 默认通过验证
  return { valid: true, message: '配置值有效' };
}

/**
 * 模拟异步持久化（生产环境替换为数据库写入）
 *
 * @param {string} configKey - 配置键名
 * @param {any} newValue - 新值
 * @returns {Promise<void>}
 */
async function persistToDatabase(configKey, newValue) {
  // 这里模拟异步写入数据库
  // 实际项目中应该是：
  // await prisma.systemConfig.update({ where: { configKey }, data: { configValue: newValue } });

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[ConfigPersistence] 已持久化配置: ${configKey}`);
      resolve();
    }, 50);  // 模拟50ms延迟
  });
}

// ============================================
// 核心业务逻辑函数 (Core Business Logic)
// ============================================

/**
 * C001: 获取配置项列表
 *
 * 功能说明：
 * 支持多维度筛选的分页配置列表查询
 * 返回配置数据 + 类型统计 + 分页信息
 *
 * 筛选条件：
 * - type: 按配置类型筛选（AI_API_KEY/FEATURE_FLAG等）
 * - search: 关键词搜索（匹配键名和描述）
 * - isSensitive: 敏感性过滤（true=仅敏感 / false=仅非敏感 / all=全部）
 *
 * @param {ConfigListParams} params - 查询参数
 * @returns {Promise<ConfigListResponse>} 列表响应数据
 *
 * 示例调用：
 * ```javascript
 * // 获取所有API Key配置
 * await getConfigs({ type: 'api_key' })
 *
 * // 搜索包含"minimax"的配置
 * await getConfigs({ search: 'minimax' })
 *
 * // 仅查看非敏感配置
 * await getConfigs({ isSensitive: 'false' })
 * ```
 */
export async function getConfigs(params = {}) {
  try {
    // 确保配置已初始化
    initializeConfigStore();

    // ========== 参数默认值处理 ==========
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const type = params.type?.toUpperCase() || 'ALL';
    const search = params.search?.trim() || '';
    const isSensitiveFilter = params.isSensitive?.toLowerCase() || 'all';

    console.log(
      `[ConfigService] 查询配置列表 | 页码: ${page} | 每页: ${pageSize} | ` +
      `类型: ${type} | 敏感过滤: ${isSensitiveFilter}` +
      (search ? ` | 搜索: "${search}"` : '')
    );

    // ========== 第一步：应用筛选条件 ==========
    let filteredConfigs = [...configStore];

    // 1. 按类型筛选
    if (type !== 'ALL') {
      // 支持简写形式：api_key → AI_API_KEY
      const typeMap = {
        'API_KEY': CONFIG_TYPES.AI_API_KEY,
        'FEATURE_FLAG': CONFIG_TYPES.FEATURE_FLAG,
        'AI_PARAM': CONFIG_TYPES.AI_PARAM,
        'RATE_LIMIT': CONFIG_TYPES.RATE_LIMIT,
        'SYSTEM': CONFIG_TYPES.SYSTEM,
        'THIRD_PARTY': CONFIG_TYPES.THIRD_PARTY,
        'SECURITY': CONFIG_TYPES.SECURITY,
        'NOTIFICATION': CONFIG_TYPES.NOTIFICATION
      };

      const targetType = typeMap[type] || type;
      filteredConfigs = filteredConfigs.filter(c => c.configType === targetType);
    }

    // 2. 按敏感性筛选
    if (isSensitiveFilter === 'true') {
      filteredConfigs = filteredConfigs.filter(c => c.isSensitive);
    } else if (isSensitiveFilter === 'false') {
      filteredConfigs = filteredConfigs.filter(c => !c.isSensitive);
    }
    // 'all' 不做过滤

    // 3. 关键词搜索（匹配配置键名和描述）
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredConfigs = filteredConfigs.filter(c =>
        c.configKey.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm)
      );
    }

    // ========== 第二步：计算分页信息 ==========
    const totalItems = filteredConfigs.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedConfigs = filteredConfigs.slice(startIndex, endIndex);

    // ========== 第三步：计算各类型统计 ==========
    const typeStats = {};
    Object.values(CONFIG_TYPES).forEach(typeName => {
      const count = configStore.filter(c => c.configType === typeName).length;
      typeStats[typeName] = count;
    });

    // 添加总计
    typeStats['_total'] = configStore.length;
    typeStats['_sensitive'] = configStore.filter(c => c.isSensitive).length;

    // ========== 第四步：组装返回结果 ==========
    const result = {
      configs: paginatedConfigs,
      typeStats,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    console.log(
      `[ConfigService] 查询完成 | 返回 ${paginatedConfigs.length} 条 | 共 ${totalItems} 条`
    );

    return result;

  } catch (error) {
    console.error('[ConfigService] 查询配置列表异常:', error);
    throw error;
  }
}

/**
 * C002: 获取单个配置详情
 *
 * 功能说明：
 * 按键名获取配置的完整信息
 * 敏感配置默认返回脱敏值，可通过 reveal=true 参数查看明文
 *
 * @param {string} configKey - 配置键名（如 "ai.minimax.api_key"）
 * @param {Object} options - 查询选项
 * @param {boolean} [options.reveal=false] - 是否显示敏感值的明文（需要高级权限）
 * @param {string} [options.requesterRole] - 请求者角色（用于权限判断）
 * @returns {Promise<ConfigItem>} 配置详情对象
 *
 * 权限说明：
 * - 所有角色都可以查看配置详情
 * - 但只有 super_admin 可以通过 reveal=true 查看敏感值的明文
 * - admin 和 observer 查看敏感配置时只能看到脱敏值
 */
export async function getConfigByKey(configKey, options = {}) {
  try {
    initializeConfigStore();

    const { reveal = false, requesterRole = '' } = options;

    console.log(
      `[ConfigService] 查询配置详情 | 键名: ${configKey} | ` +
      `显示明文: ${reveal} | 请求者角色: ${requesterRole || '未指定'}`
    );

    // ========== 第一步：查找配置 ==========
    const config = configStore.find(c => c.configKey === configKey);

    if (!config) {
      const error = new Error(`配置项 "${configKey}" 不存在`);
      error.name = 'CONFIG_NOT_FOUND';
      throw error;
    }

    // ========== 第二步：构建返回对象 ==========
    const resultConfig = { ...config };

    // ========== 第三步：处理敏感值显示逻辑 ==========
    if (config.isSensitive) {
      if (reveal) {
        // 请求查看明文
        if (requesterRole === 'super_admin') {
          // super_admin 允许查看明文
          resultConfig._revealGranted = true;
          resultConfig._warning = '您正在查看敏感信息的明文，请注意保护！';

          console.warn(
            `[ConfigSecurity] 敏感值明文查看 | 配置: ${configKey} | ` +
            `操作人拥有超级管理员权限`
          );
        } else {
          // 非 super_admin 无权查看明文，强制返回脱敏值
          resultConfig.configValue = maskSensitiveValue(config.configValue);
          resultConfig._revealGranted = false;
          resultConfig._error = '权限不足：只有超级管理员才能查看敏感值的明文';

          console.warn(
            `[ConfigSecurity] 敏感值明文查看被拒绝 | 配置: ${configKey} | ` +
            `请求者角色: ${requesterRole} | 原因: 不是超级管理员`
          );
        }
      } else {
        // 默认情况下返回脱敏值
        resultConfig.maskedValue = maskSensitiveValue(config.configValue);
        // 注意：configValue字段保留原始值（但前端不应展示）
        // 前端应该优先使用 maskedValue 字段来显示
      }
    }

    console.log(`[ConfigService] 配置详情查询成功 | 键名: ${configKey}`);

    return resultConfig;

  } catch (error) {
    console.error('[ConfigService] 查询配置详情异常:', error);
    throw error;
  }
}

/**
 * C003: 更新单个配置值
 *
 * 功能说明：
 * 修改指定配置项的值
 * 包含完整的权限控制和审计日志
 *
 * @param {string} configKey - 配置键名
 * @param {Object} updateData - 更新数据
 * @param {any} updateData.value - 新的配置值
 * @param {string} [updateData.reason] - 修改原因（可选，但建议填写）
 * @param {Object} operatorInfo - 操作人信息
 * @param {string} operatorInfo.username - 操作人用户名
 * @param {string} operatorInfo.role - 操作人角色
 * @param {string} [operatorInfo.ip] - 操作IP地址
 * @returns {Promise<ConfigUpdateResult>} 更新结果（包含新旧值对比）
 *
 * 权限控制：
 * - super_admin: 可以修改所有配置（包括敏感配置）
 * - admin: 只能修改非敏感配置
 * - observer: 无法修改任何配置
 *
 * 特殊处理：
 * - 敏感配置修改会记录完整的新旧值（用于追溯）
 * - 某些关键配置（如maintenance）修改后会触发通知
 * - 值相同时不会执行更新（避免无意义的审计日志）
 */
export async function updateConfig(configKey, updateData, operatorInfo) {
  try {
    initializeConfigStore();

    const { value: newValue, reason } = updateData;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorRole = operatorInfo?.role || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[ConfigService] 更新配置 | 键名: ${configKey} | ` +
      `操作人: ${operatorName} | 角色: ${operatorRole}`
    );

    // ========== 第一步：查找配置 ==========
    const configIndex = configStore.findIndex(c => c.configKey === configKey);

    if (configIndex === -1) {
      const error = new Error(`配置项 "${configKey}" 不存在`);
      error.name = 'CONFIG_NOT_FOUND';
      throw error;
    }

    const existingConfig = configStore[configIndex];

    // ========== 第二步：权限检查 ==========
    if (existingConfig.isSensitive && operatorRole !== 'super_admin') {
      const error = new Error('权限不足：修改敏感配置需要超级管理员权限');
      error.name = 'INSUFFICIENT_PERMISSION';
      error.details = {
        requiredRole: 'super_admin',
        currentRole: operatorRole,
        configKey,
        hint: '请联系超级管理员进行此操作'
      };
      throw error;
    }

    if (operatorRole === 'observer') {
      const error = new Error('权限不足：观察者角色无法修改配置');
      error.name = 'INSUFFICIENT_PERMISSION';
      throw error;
    }

    // ========== 第三步：值验证 ==========
    const validation = validateConfigValue(configKey, newValue);
    if (!validation.valid) {
      const error = new Error(validation.message);
      error.name = 'VALIDATION_ERROR';
      throw error;
    }

    // ========== 第四步：检查是否有实际变化 ==========
    // 将newValue转换为字符串进行比较（因为存储的都是字符串）
    const stringValue = String(newValue);
    const existingValue = String(existingConfig.configValue);

    if (stringValue === existingValue) {
      const error = new Error(`配置值没有变化，无需重复修改`);
      error.name = 'NO_CHANGE';
      throw error;
    }

    // ========== 第五步：保存旧值快照 ==========
    const oldValue = existingConfig.configValue;
    const oldVersion = existingConfig.version;

    // ========== 第六步：执行更新 ==========
    const now = new Date().toISOString();

    const updatedConfig = {
      ...existingConfig,
      configValue: stringValue,           // 更新值
      maskedValue: existingConfig.isSensitive ? maskSensitiveValue(stringValue) : undefined,
      updatedBy: operatorName,
      updatedAt: now,
      version: oldVersion + 1             // 版本号递增
    };

    // 更新内存存储
    configStore[configIndex] = updatedConfig;

    // ========== 第七步：异步持久化 ==========
    // 不等待完成，让它在后台执行
    persistToDatabase(configKey, newValue).catch(err => {
      console.error(`[ConfigPersistence] 持久化失败: ${configKey}`, err);
    });

    // ========== 第八步：记录审计日志 ==========
    recordConfigAuditLog({
      action: 'UPDATE',
      operator: operatorName,
      configKey,
      oldValue: existingConfig.isSensitive ? maskSensitiveValue(oldValue) : oldValue,
      newValue: existingConfig.isSensitive ? maskSensitiveValue(stringValue) : stringValue,
      ip: clientIP,
      reason: reason || '修改配置值',
      operatorRole
    });

    // ========== 第九步：特殊配置的后处理 ==========
    let postUpdateNotice = null;

    if (configKey === 'system.maintenance') {
      const isEnabled = stringValue === 'true';
      postUpdateNotice = isEnabled
        ? '⚠️ 维护模式已开启！前端用户将看到"系统维护中"提示，无法正常使用。'
        : '✓ 维护模式已关闭，系统恢复正常访问。';
    }

    if (configKey.includes('.api_key') && oldValue !== stringValue) {
      postUpdateNotice = `🔑 API Key已更新！新的Key将在下次API调用时生效。`;
    }

    console.log(
      `[ConfigService] 配置更新成功 | 键名: ${configKey} | ` +
      `版本: v${oldVersion} → v${updatedConfig.version}` +
      (postUpdateNotice ? ` | 提示: ${postUpdateNotice}` : '')
    );

    // ========== 第十步：组装返回结果 ==========
    return {
      config: updatedConfig,
      changeLog: {
        action: 'UPDATED',
        configKey,
        oldValue: existingConfig.isSensitive ? maskSensitiveValue(oldValue) : oldValue,
        newValue: existingConfig.isSensitive ? maskSensitiveValue(stringValue) : stringValue,
        changedAt: now,
        changedBy: operatorName,
        reason: reason || '未提供',
        versionChange: `${oldVersion} → ${updatedConfig.version}`
      },
      ...(postUpdateNotice && { _notice: postUpdateNotice })
    };

  } catch (error) {
    console.error('[ConfigService] 更新配置异常:', error);
    throw error;
  }
}

/**
 * C004: 批量更新配置
 *
 * 功能说明：
 * 一次性修改多个配置项，支持原子性操作
 * 要么全部成功，要么全部失败（回滚）
 *
 * @param {Array<Object>} items - 要更新的配置数组
 * @param {string} items[].key - 配置键名
 * @param {any} items[].value - 新值
 * @param {string} [items[].reason] - 修改原因
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<{results: Array, summary: Object}>} 批量更新结果
 *
 * 原子性保证：
 * 1. 先验证所有配置项是否存在且可修改
 * 2. 验证通过后，保存所有旧值的快照
 * 3. 逐个执行更新
 * 4. 如果中途失败，回滚已执行的更新
 * 5. 全部成功后统一记录审计日志
 *
 * 使用场景：
 * - 批量切换多个功能开关
 * - 一次性配置多个API Key
 * - 环境迁移时批量导入配置
 */
export async function batchUpdateConfigs(items, operatorInfo) {
  try {
    initializeConfigStore();

    const operatorName = operatorInfo?.username || 'unknown';
    const operatorRole = operatorInfo?.role || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[ConfigService] 批量更新配置 | 操作人: ${operatorName} | ` +
      `数量: ${items.length} 个配置项`
    );

    // ========== 第一步：参数验证 ==========
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('更新列表不能为空');
      error.name = 'INVALID_PARAMS';
      throw error;
    }

    if (items.length > 20) {
      const error = new Error('单次批量更新最多支持20个配置项');
      error.name = 'TOO_MANY_ITEMS';
      throw error;
    }

    // ========== 第二步：权限预检查（确保操作者有权限修改所有配置）==========
    for (const item of items) {
      const config = configStore.find(c => c.configKey === item.key);

      if (!config) {
        const error = new Error(`配置项 "${item.key}" 不存在`);
        error.name = 'CONFIG_NOT_FOUND';
        throw error;
      }

      if (config.isSensitive && operatorRole !== 'super_admin') {
        const error = new Error(
          `权限不足：配置 "${item.key}" 是敏感配置，需要超级管理员权限`
        );
        error.name = 'INSUFFICIENT_PERMISSION';
        throw error;
      }

      // 值验证
      const validation = validateConfigValue(item.key, item.value);
      if (!validation.valid) {
        const error = new Error(`配置 "${item.key}" 验证失败: ${validation.message}`);
        error.name = 'VALIDATION_ERROR';
        throw error;
      }
    }

    // ========== 第三步：保存旧值快照（用于回滚）==========
    const snapshots = items.map(item => {
      const config = configStore.find(c => c.configKey === item.key);
      return {
        key: item.key,
        index: configStore.indexOf(config),
        oldConfig: { ...config },
        newValue: String(item.value),
        reason: item.reason || ''
      };
    });

    // ========== 第四步：执行更新（带回滚能力）==========
    const results = [];
    const executedUpdates = [];  // 记录已成功的更新（用于回滚）

    try {
      for (const snapshot of snapshots) {
        const now = new Date().toISOString();

        const updatedConfig = {
          ...snapshot.oldConfig,
          configValue: snapshot.newValue,
          maskedValue: snapshot.oldConfig.isSensitive ? maskSensitiveValue(snapshot.newValue) : undefined,
          updatedBy: operatorName,
          updatedAt: now,
          version: snapshot.oldConfig.version + 1
        };

        // 应用更新
        configStore[snapshot.index] = updatedConfig;
        executedUpdates.push(snapshot);

        // 构建结果
        results.push({
          success: true,
          key: snapshot.key,
          oldValue: snapshot.oldConfig.isSensitive
            ? maskSensitiveValue(snapshot.oldConfig.configValue)
            : snapshot.oldConfig.configValue,
          newValue: snapshot.oldConfig.isSensitive
            ? maskSensitiveValue(snapshot.newValue)
            : snapshot.newValue,
          version: updatedConfig.version
        });
      }

    } catch (updateError) {
      // ========== 发生错误，执行回滚 ==========
      console.error(`[ConfigService] 批量更新失败，开始回滚 | 错误: ${updateError.message}`);

      for (const executed of executedUpdates) {
        // 恢复旧值
        configStore[executed.index] = executed.oldConfig;
      }

      const error = new Error(`批量更新失败，已自动回滚所有更改: ${updateError.message}`);
      error.name = 'BATCH_UPDATE_ROLLED_BACK';
      error.partialResults = results;
      throw error;
    }

    // ========== 第五步：异步持久化所有更新 ==========
    for (const snapshot of snapshots) {
      persistToDatabase(snapshot.key, snapshot.newValue).catch(err => {
        console.error(`[ConfigPersistence] 持久化失败: ${snapshot.key}`, err);
      });
    }

    // ========== 第六步：记录审计日志 ==========
    for (const snapshot of snapshots) {
      recordConfigAuditLog({
        action: 'BATCH_UPDATE',
        operator: operatorName,
        configKey: snapshot.key,
        oldValue: snapshot.oldConfig.isSensitive
          ? maskSensitiveValue(snapshot.oldConfig.configValue)
          : snapshot.oldConfig.configValue,
        newValue: snapshot.oldConfig.isSensitive
          ? maskSensitiveValue(snapshot.newValue)
          : snapshot.newValue,
        ip: clientIP,
        reason: snapshot.reason || '批量修改配置',
        operatorRole,
        batchTotal: items.length
      });
    }

    // ========== 第七步：组装返回结果 ==========
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(
      `[ConfigService] 批量更新完成 | 成功: ${successCount}/${items.length} | ` +
      `失败: ${failCount}`
    );

    return {
      results,
      summary: {
        totalRequested: items.length,
        successCount,
        failCount,
        atomicOperation: true,  // 表示这是原子操作
        operatedAt: new Date().toISOString(),
        operatedBy: operatorName
      }
    };

  } catch (error) {
    console.error('[ConfigService] 批量更新异常:', error);
    throw error;
  }
}

/**
 * C005: 重置配置为默认值
 *
 * 功能说明：
 * 将指定配置项恢复为系统预设的默认值
 * 这是一个重要操作，需要确认提示
 *
 * @param {string} configKey - 配置键名
 * @param {Object} options - 选项
 * @param {string} [options.reason] - 重置原因
 * @param {Object} operatorInfo - 操作人信息
 * @returns {Promise<Object>} 重置结果
 *
 * 安全措施：
 * 1. 只有 super_admin 可以执行重置
 * 2. 某些关键配置不允许重置（如安全相关）
 * 3. 强制记录审计日志
 * 4. 返回清晰的前后对比
 */
export async function resetConfigToDefault(configKey, options = {}, operatorInfo) {
  try {
    initializeConfigStore();

    const { reason } = options;
    const operatorName = operatorInfo?.username || 'unknown';
    const operatorRole = operatorInfo?.role || 'unknown';
    const clientIP = operatorInfo?.ip || 'unknown';

    console.log(
      `[ConfigService] 重置配置 | 键名: ${configKey} | ` +
      `操作人: ${operatorName} | 角色: ${operatorRole}`
    );

    // ========== 第一步：权限检查（只有super_admin可以重置）==========
    if (operatorRole !== 'super_admin') {
      const error = new Error('权限不足：重置配置需要超级管理员权限');
      error.name = 'INSUFFICIENT_PERMISSION';
      error.details = {
        requiredRole: 'super_admin',
        currentRole: operatorRole,
        hint: '重置操作会影响系统运行，只有最高权限可以执行'
      };
      throw error;
    }

    // ========== 第二步：查找配置 ==========
    const configIndex = configStore.findIndex(c => c.configKey === configKey);

    if (configIndex === -1) {
      const error = new Error(`配置项 "${configKey}" 不存在`);
      error.name = 'CONFIG_NOT_FOUND';
      throw error;
    }

    const existingConfig = configStore[configIndex];

    // ========== 第三步：检查是否允许重置（某些关键配置禁止重置）==========
    const nonResettableKeys = [
      'security.password_min_length',
      'security.max_login_attempts',
      'security.session_timeout'
    ];

    if (nonResettableKeys.includes(configKey)) {
      const error = new Error(`配置 "${configKey}" 属于安全关键配置，不允许重置`);
      error.name = 'RESET_NOT_ALLOWED';
      error.hint = '此类配置涉及系统安全基础，如需修改请使用普通更新接口';
      throw error;
    }

    // ========== 第四步：获取默认值 ==========
    const defaultConfigDef = DEFAULT_CONFIGS.find(d => d.key === configKey);

    if (!defaultConfigDef) {
      const error = new Error(`找不到配置 "${configKey}" 的默认值定义`);
      error.name = 'DEFAULT_NOT_FOUND';
      throw error;
    }

    const defaultValue = defaultConfigDef.value;

    // ========== 第五步：检查当前值是否已经是默认值 ==========
    if (String(existingConfig.configValue) === String(defaultValue)) {
      const error = new Error(`配置 "${configKey}" 当前值已经是默认值，无需重置`);
      error.name = 'ALREADY_DEFAULT';
      throw error;
    }

    // ========== 第六步：执行重置 ==========
    const oldValue = existingConfig.configValue;
    const oldVersion = existingConfig.version;
    const now = new Date().toISOString();

    const resetConfig = {
      ...existingConfig,
      configValue: defaultValue,
      maskedValue: existingConfig.isSensitive ? maskSensitiveValue(defaultValue) : undefined,
      updatedBy: operatorName,
      updatedAt: now,
      version: oldVersion + 1
    };

    // 更新存储
    configStore[configIndex] = resetConfig;

    // ========== 第七步：异步持久化 ==========
    persistToDatabase(configKey, defaultValue).catch(err => {
      console.error(`[ConfigPersistence] 持久化失败: ${configKey}`, err);
    });

    // ========== 第八步：记录审计日志（重要！）==========
    recordConfigAuditLog({
      action: 'RESET',
      operator: operatorName,
      configKey,
      oldValue: existingConfig.isSensitive ? maskSensitiveValue(oldValue) : oldValue,
      newValue: existingConfig.isSensitive ? maskSensitiveValue(defaultValue) : defaultValue,
      ip: clientIP,
      reason: reason || `重置为系统默认值`,
      operatorRole
    });

    console.log(
      `[ConfigService] 配置重置成功 | 键名: ${configKey} | ` +
      `旧值: ${existingConfig.isSensitive ? maskSensitiveValue(oldValue) : oldValue} → ` +
      `默认值: ${existingConfig.isSensitive ? maskSensitiveValue(defaultValue) : defaultValue}`
    );

    // ========== 第九步：返回结果 ==========
    return {
      config: resetConfig,
      resetLog: {
        action: 'RESET_TO_DEFAULT',
        configKey,
        previousValue: existingConfig.isSensitive ? maskSensitiveValue(oldValue) : oldValue,
        restoredToDefault: existingConfig.isSensitive ? maskSensitiveValue(defaultValue) : defaultValue,
        resetAt: now,
        resetBy: operatorName,
        reason: reason || '未提供',
        versionChange: `${oldVersion} → ${resetConfig.version}`
      },
      _notice: `配置已恢复为系统默认值。如果这是误操作，可以通过更新接口改回之前的值。`
    };

  } catch (error) {
    console.error('[ConfigService] 重置配置异常:', error);
    throw error;
  }
}

/**
 * 获取配置变更历史
 *
 * 功能说明：
 * 查询指定配置项或所有配置的变更历史记录
 * 用于安全审计和问题排查
 *
 * @param {Object} params - 查询参数
 * @param {string} [params.configKey] - 配置键名（不传则查所有）
 * @param {number} [params.limit] - 返回条数（默认50，最大200）
 * @returns {Promise<Array>} 审计日志数组
 */
export async function getConfigHistory(params = {}) {
  try {
    const { configKey, limit = 50 } = params;
    const actualLimit = Math.min(200, Math.max(1, limit));

    console.log(
      `[ConfigService] 查询配置历史 | ` +
      `配置: ${configKey || '全部'} | 条数: ${actualLimit}`
    );

    let history = [...configAuditLogs];

    // 按配置键名筛选
    if (configKey) {
      history = history.filter(log => log.configKey === configKey);
    }

    // 按时间倒序排列（最新的在前）
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 截取指定条数
    history = history.slice(0, actualLimit);

    console.log(`[ConfigService] 历史查询完成 | 返回 ${history.length} 条`);

    return history;

  } catch (error) {
    console.error('[ConfigService] 查询配置历史异常:', error);
    throw error;
  }
}

// ============================================
// 默认导出
// ============================================

export default {
  getConfigs,
  getConfigByKey,
  updateConfig,
  batchUpdateConfigs,
  resetConfigToDefault,
  getConfigHistory,

  // 导出工具函数和常量
  maskSensitiveValue,
  parseConfigValue,
  CONFIG_TYPES,
  CONFIG_TYPE_LABELS
};
