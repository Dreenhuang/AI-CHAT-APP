/**
 * 系统配置 API 服务
 * 
 * 提供系统配置的读取、更新、测试等接口
 */

import { SystemConfig, DEFAULT_CONFIG } from './types';

// ============ 模拟存储 ============

let currentConfig: SystemConfig = {
  ...DEFAULT_CONFIG,
  basic: { ...DEFAULT_CONFIG.basic },
  email: { ...DEFAULT_CONFIG.email },
  security: { ...DEFAULT_CONFIG.security },
  notification: { ...DEFAULT_CONFIG.notification },
  integration: { ...DEFAULT_CONFIG.integration },
};

// ============ API 接口定义 ============

export const configApi = {
  /**
   * 获取所有配置
   */
  getAll: async (): Promise<SystemConfig> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return JSON.parse(JSON.stringify(currentConfig));
  },

  /**
   * 获取指定分类的配置
   */
  getByType: async <K extends keyof SystemConfig>(
    type: K
  ): Promise<SystemConfig[K]> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return JSON.parse(JSON.stringify(currentConfig[type]));
  },

  /**
   * 更新单个配置项
   */
  update: async (keyPath: string, value: any): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
    
    // 简单的路径解析：basic.systemName -> config.basic.systemName = value
    const keys = keyPath.split('.');
    let target: any = currentConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (target[keys[i]] !== undefined) {
        target = target[keys[i]];
      } else {
        return { success: false };
      }
    }
    
    target[keys[keys.length - 1]] = value;
    
    console.log(`[Config] Updated ${keyPath} =`, value);
    
    return { success: true };
  },

  /**
   * 批量更新配置
   */
  batchUpdate: async (
    configs: Partial<SystemConfig>
  ): Promise<{ success: boolean; updated: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const updatedKeys: string[] = [];
    
    Object.entries(configs).forEach(([category, categoryConfig]) => {
      if (category in currentConfig && typeof categoryConfig === 'object') {
        Object.entries(categoryConfig as any).forEach(([key, value]) => {
          (currentConfig as any)[category][key] = value;
          updatedKeys.push(`${category}.${key}`);
        });
      }
    });
    
    console.log(`[Config] Batch updated:`, updatedKeys);
    
    return { success: true, updated: updatedKeys };
  },

  /**
   * 重置为默认配置
   */
  resetToDefault: async (category?: keyof SystemConfig): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (category) {
      currentConfig[category] = JSON.parse(JSON.stringify(DEFAULT_CONFIG[category]));
    } else {
      currentConfig = {
        basic: { ...DEFAULT_CONFIG.basic },
        email: { ...DEFAULT_CONFIG.email },
        security: { ...DEFAULT_CONFIG.security },
        notification: { ...DEFAULT_CONFIG.notification },
        integration: { ...DEFAULT_CONFIG.integration },
      };
    }
    
    return { success: true };
  },

  /**
   * 发送测试邮件
   */
  testEmail: async (toEmail?: string): Promise<{ 
    success: boolean; 
    message: string;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    
    // 模拟80%成功率
    if (Math.random() > 0.2) {
      return {
        success: true,
        message: `测试邮件已成功发送至 ${toEmail || currentConfig.email.senderEmail}`,
      };
    }
    
    return {
      success: false,
      message: '发送失败：无法连接到SMTP服务器，请检查网络和配置',
    };
  },
};

export default configApi;
