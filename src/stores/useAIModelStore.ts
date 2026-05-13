/**
 * AI模型状态管理 - Zustand Store
 * 
 * 管理大模型API配置：
 * - 默认使用DeepSeek V4 Flash模型
 * - 支持用户自定义API Key和Base URL
 * - 支持多种大模型适配（OpenAI兼容格式）
 */

import { create } from 'zustand';

// ============ 类型定义 ============

export interface AIModelConfig {
  /** 模型名称 */
  model: string;
  
  /** API Base URL */
  baseUrl: string;
  
  /** API Key */
  apiKey: string;
  
  /** 模型显示名称 */
  displayName: string;
  
  /** 模型描述 */
  description: string;
  
  /** 最大token数 */
  maxTokens: number;
  
  /** 温度参数（0-2，越高越随机） */
  temperature: number;
}

/** 预设模型配置 */
export const PRESET_MODELS: Record<string, AIModelConfig> = {
  'deepseek-v4-flash': {
    model: 'deepseek-v4-flash',
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'sk-7f85a014ff1f4fb7938163b2717b70d5',
    displayName: 'DeepSeek V4 Flash',
    description: 'DeepSeek最新版本，响应快速，适合日常对话和讨论',
    maxTokens: 4096,
    temperature: 0.7,
  },
  'deepseek-v4-pro': {
    model: 'deepseek-v4-pro',
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'sk-7f85a014ff1f4fb7938163b2717b70d5',
    displayName: 'DeepSeek V4 Pro',
    description: 'DeepSeek专业版，深度推理能力强，适合复杂辩论',
    maxTokens: 8192,
    temperature: 0.7,
  },
};

// ============ State接口定义 ============

interface AIModelState {
  /** 当前激活的模型ID */
  activeModelId: string;
  
  /** 当前模型配置 */
  currentConfig: AIModelConfig;
  
  /** 是否使用自定义配置 */
  isCustomConfig: boolean;
  
  // ============ Actions ============
  
  /**
   * 切换到预设模型
   */
  setPresetModel: (modelId: string) => void;
  
  /**
   * 设置自定义模型配置
   */
  setCustomConfig: (config: Partial<AIModelConfig>) => void;
  
  /**
   * 更新API Key
   */
  updateApiKey: (apiKey: string) => void;
  
  /**
   * 重置为默认模型
   */
  resetToDefault: () => void;
  
  /**
   * 测试API连接是否正常
   */
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

// ============ Store实现 ============

export const useAIModelStore = create<AIModelState>((set, get) => {
  // 从localStorage读取保存的配置
  let savedModelId = 'deepseek-v4-flash'; // 默认模型
  let savedCustomConfig: Partial<AIModelConfig> | null = null;
  
  if (typeof window !== 'undefined') {
    const savedId = localStorage.getItem('ai_model_id');
    if (savedId && PRESET_MODELS[savedId]) {
      savedModelId = savedId;
    }
    
    const customConfigStr = localStorage.getItem('ai_model_custom');
    if (customConfigStr) {
      try {
        savedCustomConfig = JSON.parse(customConfigStr);
      } catch (e) {
        console.warn('[AIModel] Failed to parse custom config');
      }
    }
  }
  
  // 确定初始配置
  const initialConfig: AIModelConfig = savedCustomConfig
    ? { ...PRESET_MODELS['deepseek-v4-flash'], ...savedCustomConfig }
    : PRESET_MODELS[savedModelId];
  
  return {
    // ==================== 初始状态 ====================
    activeModelId: savedModelId,
    currentConfig: initialConfig,
    isCustomConfig: !!savedCustomConfig,
    
    // ==================== Actions实现 ====================
    
    /**
     * 切换到预设模型
     */
    setPresetModel: (modelId: string) => {
      const preset = PRESET_MODELS[modelId];
      if (!preset) {
        console.error(`[AIModel] Unknown preset model: ${modelId}`);
        return;
      }
      
      set({
        activeModelId: modelId,
        currentConfig: preset,
        isCustomConfig: false,
      });
      
      // 持久化
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_model_id', modelId);
        localStorage.removeItem('ai_model_custom');
      }
      
      console.log(`[AIModel] Switched to preset: ${preset.displayName}`);
    },
    
    /**
     * 设置自定义模型配置
     */
    setCustomConfig: (config: Partial<AIModelConfig>) => {
      const newConfig: AIModelConfig = {
        ...get().currentConfig,
        ...config,
      };
      
      set({
        currentConfig: newConfig,
        isCustomConfig: true,
        activeModelId: 'custom',
      });
      
      // 持久化
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_model_custom', JSON.stringify(config));
        localStorage.setItem('ai_model_id', 'custom');
      }
      
      console.log(`[AIModel] Updated custom config: ${newConfig.model || 'custom'}`);
    },
    
    /**
     * 更新API Key
     */
    updateApiKey: (apiKey: string) => {
      set((state) => ({
        currentConfig: {
          ...state.currentConfig,
          apiKey,
        },
      }));
      
      // 同步更新持久化存储
      if (typeof window !== 'undefined') {
        const customConfig = {
          apiKey,
          ...(get().isCustomConfig ? get().currentConfig : {}),
        };
        localStorage.setItem('ai_model_custom', JSON.stringify(customConfig));
      }
      
      console.log('[AIModel] API Key updated');
    },
    
    /**
     * 重置为默认模型
     */
    resetToDefault: () => {
      const defaultModelId = 'deepseek-v4-flash';
      
      set({
        activeModelId: defaultModelId,
        currentConfig: PRESET_MODELS[defaultModelId],
        isCustomConfig: false,
      });
      
      // 清除持久化
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ai_model_id');
        localStorage.removeItem('ai_model_custom');
      }
      
      console.log('[AIModel] Reset to default model');
    },
    
    /**
     * 测试API连接
     */
    testConnection: async () => {
      const config = get().currentConfig;
      
      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'user', content: 'Hi' }
            ],
            max_tokens: 5,
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(10000), // 10秒超时
        });
        
        if (response.ok) {
          return { success: true, message: '✅ 连接成功！API配置有效' };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { 
            success: false, 
            message: `❌ 连接失败 (${response.status}): ${errorData?.error?.message || response.statusText}` 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          message: `❌ 连接错误: ${error.message || '网络异常或CORS限制'}` 
        };
      }
    },
  };
});

export default useAIModelStore;
