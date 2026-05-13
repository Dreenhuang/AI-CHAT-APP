/**
 * 系统配置类型定义
 * 
 * Apple Design Style - 管理后台系统配置
 */

// ============ 配置分类枚举 ============

export type ConfigCategory = 
  | 'basic'       // 基本设置
  | 'email'       // 邮件配置
  | 'security'    // 安全设置
  | 'notification' // 通知设置
  | 'integration'; // 第三方集成

// ============ 配置项基础类型 ============

export interface ConfigItem {
  /** 配置键 */
  key: string;
  
  /** 配置值 */
  value: string | number | boolean;
  
  /** 显示名称 */
  label: string;
  
  /** 描述信息 */
  description?: string;
  
  /** 字段类型 */
  type: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'password';
  
  /** 选项列表（type为select时） */
  options?: Array<{ label: string; value: string }>;
  
  /** 是否必填 */
  required?: boolean;
  
  /** 是否敏感（密码等） */
  sensitive?: boolean;
  
  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============ 基本设置 ============

export interface BasicConfig {
  systemName: string;
  systemDescription: string;
  defaultLanguage: string;
  timezone: string;
  itemsPerPage: number;
  copyrightInfo: string;
  maintenanceMode: boolean;
}

// ============ 邮件配置 ============

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  encryption: 'none' | 'ssl' | 'tls';
  senderEmail: string;
  senderPassword: string;
  senderName: string;
  testEmailTo?: string;
}

// ============ 安全配置 ============

export interface SecurityConfig {
  passwordMinLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // 分钟
  sessionTimeout: number;   // 分钟
  enableTwoFactor: boolean;
  ipWhitelist: string;
  ipBlacklist: string;
}

// ============ 通知配置 ============

export interface NotificationConfig {
  emailNotification: boolean;
  inAppNotification: boolean;
  notifyOnUserCreate: boolean;
  notifyOnTopicCreate: boolean;
  notifyOnComment: boolean;
  notifyOnError: boolean;
  notifyOnLogin: boolean;
}

// ============ 第三方集成配置 ============

export interface IntegrationConfig {
  enableWechat: boolean;
  wechatAppId: string;
  wechatAppSecret: string;
  enableDingTalk: boolean;
  dingTalkAppKey: string;
  dingTalkAppSecret: string;
  enableOSS: boolean;
  ossProvider: 'aliyun' | 'aws' | 'tencent';
  ossEndpoint: string;
  ossBucket: string;
  ossAccessKey: string;
  ossSecretKey: string;
  enableCDN: boolean;
  cdnDomain: string;
}

// ============ 完整配置 ============

export interface SystemConfig {
  basic: BasicConfig;
  email: EmailConfig;
  security: SecurityConfig;
  notification: NotificationConfig;
  integration: IntegrationConfig;
}

// ============ Tab 配置映射 ============

export const CONFIG_TABS: Array<{
  id: ConfigCategory;
  label: string;
  icon: string;
}> = [
  { id: 'basic', label: '基本设置', icon: '📌' },
  { id: 'email', label: '邮件配置', icon: '✉️' },
  { id: 'security', label: '安全设置', icon: '🔒' },
  { id: 'notification', label: '通知设置', icon: '🔔' },
  { id: 'integration', label: '第三方集成', icon: '🔗' },
];

// ============ 默认配置值 ============

export const DEFAULT_CONFIG: SystemConfig = {
  basic: {
    systemName: 'PRD辩论管理系统',
    systemDescription: '一个专业的在线辩论和讨论平台',
    defaultLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
    itemsPerPage: 20,
    copyrightInfo: `© ${new Date().getFullYear()} PRD Debate. All rights reserved.`,
    maintenanceMode: false,
  },
  email: {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    encryption: 'tls',
    senderEmail: 'noreply@prd-debate.com',
    senderPassword: '',
    senderName: 'PRD辩论系统',
  },
  security: {
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 120,
    enableTwoFactor: false,
    ipWhitelist: '',
    ipBlacklist: '',
  },
  notification: {
    emailNotification: true,
    inAppNotification: true,
    notifyOnUserCreate: true,
    notifyOnTopicCreate: true,
    notifyOnComment: true,
    notifyOnError: true,
    notifyOnLogin: false,
  },
  integration: {
    enableWechat: false,
    wechatAppId: '',
    wechatAppSecret: '',
    enableDingTalk: false,
    dingTalkAppKey: '',
    dingTalkAppSecret: '',
    enableOSS: false,
    ossProvider: 'aliyun',
    ossEndpoint: '',
    ossBucket: '',
    ossAccessKey: '',
    ossSecretKey: '',
    enableCDN: false,
    cdnDomain: '',
  },
};
