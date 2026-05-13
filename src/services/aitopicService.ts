/**
 * AI热门话题采集服务
 * 
 * 功能说明：
 * 1. 调用DeepSeek AI大模型获取最新热点话题
 * 2. 实现每日自动更新机制
 * 3. 本地缓存策略，降低API调用频率
 * 4. 熔断降级机制，确保服务稳定性
 * 5. 完整的监控日志系统
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ 配置常量 ============

const CONFIG = {
  /** DeepSeek API配置 */
  API: {
    BASE_URL: 'https://api.deepseek.com/v1',
    API_KEY: 'sk-7f85a014ff1f4fb7938163b2717b70d5',
    MODEL: 'deepseek-v4-flash',
    ENDPOINT: '/chat/completions',
    TIMEOUT: 30000,
  },

  /** 缓存配置 */
  CACHE: {
    KEY: 'ai_hot_topics_v2',           // 缓存键名
    EXPIRY_MS: 24 * 60 * 60 * 1000,   // 24小时过期
    BACKUP_KEY: 'ai_hot_topics_backup', // 备份缓存
  },

  /** 熔断器配置 */
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 3,              // 连续失败3次触发熔断
    RESET_TIMEOUT_MS: 60 * 1000,       // 60秒后尝试恢复
    HALF_OPEN_MAX_CALLS: 1,            // 半开状态允许1次试探请求
  },

  /** 话题配置 */
  TOPICS: {
    COUNT: 15,                         // 获取话题数量
    MIN_HEAT: 80,                      // 最低热度阈值
    CATEGORIES: ['科技', '社会', '经济', '政治', '文化', '教育', '生活', '娱乐'],
  },
};

// ============ 类型定义 ============

export interface AITopic {
  id: string;
  title: string;
  description: string;
  category: string;
  heat: number;                    // 热度值 0-100
  source: 'ai_generated';         // 数据来源标识
  keywords: string[];              // 关键词标签
  createdAt: string;               // 创建时间
  updatedAt: string;               // 更新时间
}

export interface CacheData {
  topics: AITopic[];
  fetchedAt: string;              // 获取时间
  expiresAt: string;              // 过期时间
  source: string;                 // 数据来源
  version: number;                // 数据版本号
}

export interface ServiceStatus {
  isHealthy: boolean;             // 服务是否健康
  lastFetchTime: string | null;   // 最后获取时间
  nextUpdateTime: string | null;   // 下次更新时间
  failureCount: number;            // 连续失败次数
  circuitState: 'closed' | 'open' | 'half-open';  // 熔断器状态
  totalCalls: number;              // 总调用次数
  successRate: number;             // 成功率
}

// ============ 日志系统 ============

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
  private static logs: Array<{ timestamp: string; level: string; message: string; data?: any }> = [];
  
  static log(level: LogLevel, message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    
    this.logs.push(entry);
    
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);  // 只保留最近500条
    }
    
    console.log(`[AITopicService][${level}] ${message}`, data || '');
  }

  static info(message: string, data?: any) { this.log(LogLevel.INFO, message, data); }
  static warn(message: string, data?: any) { this.log(LogLevel.WARN, message, data); }
  static error(message: string, data?: any) { this.log(LogLevel.ERROR, message, data); }
  static debug(message: string, data?: any) { this.log(LogLevel.DEBUG, message, data); }

  static getLogs(level?: LogLevel) {
    if (level) return this.logs.filter(l => l.level === level);
    return [...this.logs];
  }

  static clear() { this.logs = []; }
}

// ============ 熔断器实现 ============

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  getState(): 'closed' | 'open' | 'half-open' {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceLastFailure >= CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT_MS) {
        this.state = 'half-open';
        this.successCount = 0;
        Logger.info('熔断器进入半开状态，准备试探性请求');
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const currentState = this.getState();
    if (currentState === 'closed') return true;
    if (currentState === 'half-open') return this.successCount < CONFIG.CIRCUIT_BREAKER.HALF_OPEN_MAX_CALLS;
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= CONFIG.CIRCUIT_BREAKER.HALF_OPEN_MAX_CALLS) {
        this.state = 'closed';
        Logger.info('熔断器恢复正常，状态切换为关闭');
      }
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'open';
      Logger.warn(`熔断器半开状态请求失败，重新打开。连续失败${this.failureCount}次`);
    } else if (this.failureCount >= CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
      this.state = 'open';
      Logger.warn(`熔断器触发！连续失败${this.failureCount}次，进入开启状态`);
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
}

// ============ 主服务类 ============

export class AITopicService {
  private static instance: AITopicService;
  private circuitBreaker: CircuitBreaker;
  private status: ServiceStatus;
  private updateTimer: NodeJS.Timeout | null = null;
  private isUpdating = false;

  private constructor() {
    this.circuitBreaker = new CircuitBreaker();
    this.status = {
      isHealthy: true,
      lastFetchTime: null,
      nextUpdateTime: null,
      failureCount: 0,
      circuitState: 'closed',
      totalCalls: 0,
      successRate: 100,
    };

    Logger.info('AI热门话题采集服务初始化完成');
  }

  public static getInstance(): AITopicService {
    if (!AITopicService.instance) {
      AITopicService.instance = new AITopicService();
    }
    return AITopicService.instance;
  }

  /**
   * 获取AI热门话题（带缓存和自动刷新）
   */
  async getHotTopics(forceRefresh = false): Promise<AITopic[]> {
    try {
      if (!forceRefresh) {
        const cachedTopics = await this.getCachedTopics();
        if (cachedTopics && cachedTopics.length > 0) {
          Logger.debug(`从缓存返回${cachedTopics.length}条话题`);
          return cachedTopics;
        }
      }

      const freshTopics = await this.fetchFreshTopics();
      
      if (freshTopics && freshTopics.length > 0) {
        await this.saveToCache(freshTopics);
        await this.createBackup(freshTopics);
        this.updateStatus(true);
        return freshTopics;
      }

      throw new Error('获取到空的话题列表');
    } catch (error: any) {
      Logger.error('获取热门话题失败', error.message);
      this.updateStatus(false);

      const fallbackTopics = await this.getFallbackTopics();
      if (fallbackTopics) {
        Logger.warn(`使用降级方案返回${fallbackTopics.length}条缓存话题`);
        return fallbackTopics;
      }

      Logger.error('所有降级方案均失败，返回空列表');
      return [];
    }
  }

  /**
   * 从AI大模型获取最新热门话题
   */
  private async fetchFreshTopics(): Promise<AITopic[] | null> {
    if (!this.circuitBreaker.canExecute()) {
      Logger.warn('熔断器已打开，拒绝请求');
      throw new Error('服务暂时不可用（熔断保护）');
    }

    this.status.totalCalls++;

    try {
      Logger.info('正在调用DeepSeek API获取最新热门话题...');

      const prompt = this.buildPrompt();
      const response = await this.callDeepSeekAPI(prompt);
      const topics = this.parseResponse(response);

      this.circuitBreaker.recordSuccess();
      Logger.info(`成功获取${topics.length}条AI热门话题`);

      return topics;
    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      this.status.failureCount = this.circuitBreaker['failureCount'];
      this.status.circuitState = this.circuitBreaker.getState();
      throw error;
    }
  }

  /**
   * 构建AI提示词
   */
  private buildPrompt(): string {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

    return `你是一个专业的热点话题分析师。请根据当前最新的时事新闻、社交媒体趋势、公众关注焦点，生成${CONFIG.TOPICS.COUNT}个最具讨论价值的热门争议话题。

当前日期：${dateStr}

要求：
1. 话题必须具有时效性（最近一周内发生或持续发酵的事件）
2. 话题必须具有争议性（能够引发不同观点的激烈讨论）
3. 话题必须具有广泛关注度（公众普遍关心）
4. 涵盖以下分类：${CONFIG.TOPICS.CATEGORIES.join('、')}
5. 每个话题热度值在${CONFIG.TOPICS.MIN_HEAT}-99之间

请严格按照以下JSON格式输出（不要添加任何其他文字）：
[
  {
    "title": "话题标题（简洁有力，不超过30字）",
    "description": "详细描述（100-200字，包含背景、争议点、各方观点）",
    "category": "分类（必须是：${CONFIG.TOPICS.CATEGORIES.join('/')}之一）",
    "heat": 热度数值（${CONFIG.TOPICS.MIN_HEAT}-99整数）,
    "keywords": ["关键词1", "关键词2", "关键词3"]
  }
]

注意事项：
- 必须输出有效的JSON数组
- 话题要具体、有深度，避免空泛
- 优先选择近期重大事件、政策变化、科技突破、社会现象
- 确保每个话题都有明确的正反双方立场`;
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API.API_KEY}`,
        },
        body: JSON.stringify({
          model: CONFIG.API.MODEL,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的话题分析助手，只输出结构化的JSON数据，不输出任何其他内容。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 8000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('API响应中缺少内容');
      }

      return content;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('API请求超时');
      }
      throw error;
    }
  }

  /**
   * 解析AI响应
   */
  private parseResponse(rawResponse: string): AITopic[] {
    try {
      let jsonStr = rawResponse.trim();

      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        throw new Error('响应不是数组格式');
      }

      const now = new Date().toISOString();

      return parsed.map((item: any, index: number) => ({
        id: `ai_topic_${now.replace(/[-:T.Z]/g, '')}_${index}`,
        title: item.title || '未命名话题',
        description: item.description || '暂无描述',
        category: this.validateCategory(item.category),
        heat: Math.min(99, Math.max(CONFIG.TOPICS.MIN_HEAT, parseInt(item.heat) || 85)),
        source: 'ai_generated' as const,
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        createdAt: now,
        updatedAt: now,
      })).slice(0, CONFIG.TOPICS.COUNT);
    } catch (error: any) {
      Logger.error('解析AI响应失败', error.message);
      throw new Error(`解析响应失败: ${error.message}`);
    }
  }

  /**
   * 验证分类有效性
   */
  private validateCategory(category: string): string {
    if (CONFIG.TOPICS.CATEGORIES.includes(category)) {
      return category;
    }
    return '社会';  // 默认分类
  }

  /**
   * 从缓存获取话题
   */
  private async getCachedTopics(): Promise<AITopic[] | null> {
    try {
      const cacheStr = await AsyncStorage.getItem(CONFIG.CACHE.KEY);
      if (!cacheStr) return null;

      const cacheData: CacheData = JSON.parse(cacheStr);

      if (new Date(cacheData.expiresAt).getTime() < Date.now()) {
        Logger.info('缓存已过期');
        return null;
      }

      Logger.debug(`缓存有效，剩余${Math.round((new Date(cacheData.expiresAt).getTime() - Date.now()) / 3600000)}小时`);
      return cacheData.topics;
    } catch (error: any) {
      Logger.error('读取缓存失败', error.message);
      return null;
    }
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(topics: AITopic[]): Promise<void> {
    try {
      const now = new Date();
      const cacheData: CacheData = {
        topics,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + CONFIG.CACHE.EXPIRY_MS).toISOString(),
        source: 'deepseek_api',
        version: Date.now(),
      };

      await AsyncStorage.setItem(CONFIG.CACHE.KEY, JSON.stringify(cacheData));
      Logger.info(`已保存${topics.length}条话题到缓存，有效期24小时`);
    } catch (error: any) {
      Logger.error('保存缓存失败', error.message);
    }
  }

  /**
   * 创建备份
   */
  private async createBackup(topics: AITopic[]): Promise<void> {
    try {
      const backupData = {
        topics,
        backupTime: new Date().toISOString(),
        version: Date.now(),
      };
      await AsyncStorage.setItem(CONFIG.CACHE.BACKUP_KEY, JSON.stringify(backupData));
      Logger.debug('已创建数据备份');
    } catch (error: any) {
      Logger.warn('创建备份失败', error.message);
    }
  }

  /**
   * 获取降级数据
   */
  private async getFallbackTopics(): Promise<AITopic[] | null> {
    try {
      const backupStr = await AsyncStorage.getItem(CONFIG.CACHE.BACKUP_KEY);
      if (backupStr) {
        const backup = JSON.parse(backupStr);
        Logger.info(`从备份数据返回${backup.topics?.length || 0}条话题`);
        return backup.topics || null;
      }

      const cacheStr = await AsyncStorage.getItem(CONFIG.CACHE.KEY);
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        Logger.info(`从过期缓存返回${cache.topics?.length || 0}条话题`);
        return cache.topics || null;
      }

      return null;
    } catch (error: any) {
      Logger.error('获取降级数据失败', error.message);
      return null;
    }
  }

  /**
   * 更新服务状态
   */
  private updateStatus(success: boolean): void {
    if (success) {
      this.status.isHealthy = true;
      this.status.lastFetchTime = new Date().toISOString();
      this.status.nextUpdateTime = new Date(Date.now() + CONFIG.CACHE.EXPIRY_MS).toISOString();
      this.status.failureCount = 0;
      this.status.successRate = Math.round(
        ((this.status.totalCalls - this.circuitBreaker['failureCount']) / this.status.totalCalls) * 100
      );
    } else {
      this.status.isHealthy = false;
      this.status.failureCount = this.circuitBreaker['failureCount'];
      this.status.circuitState = this.circuitBreaker.getState();
    }
  }

  /**
   * 启动定时更新任务
   */
  startAutoUpdate(intervalMs: number = CONFIG.CACHE.EXPIRY_MS): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    Logger.info(`启动自动更新任务，间隔${intervalMs / 3600000}小时`);

    this.updateTimer = setInterval(async () => {
      if (this.isUpdating) {
        Logger.warn('上一次更新尚未完成，跳过本次更新');
        return;
      }

      this.isUpdating = true;
      try {
        Logger.info('执行定时更新...');
        await this.getHotTopics(true);
        Logger.info('定时更新完成');
      } catch (error: any) {
        Logger.error('定时更新失败', error.message);
      } finally {
        this.isUpdating = false;
      }
    }, intervalMs);

    setTimeout(() => this.triggerInitialUpdate(), 5000);  // 5秒后首次更新
  }

  /**
   * 触发首次更新
   */
  private async triggerInitialUpdate(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    try {
      Logger.info('执行首次初始化更新...');
      await this.getHotTopics(true);
      Logger.info('首次初始化更新完成');
    } catch (error: any) {
      Logger.error('首次初始化更新失败', error.message);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * 停止自动更新
   */
  stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      Logger.info('已停止自动更新任务');
    }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): ServiceStatus {
    return { ...this.status };
  }

  /**
   * 手动清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CONFIG.CACHE.KEY, CONFIG.CACHE.BACKUP_KEY]);
      Logger.info('已清除所有缓存');
    } catch (error: any) {
      Logger.error('清除缓存失败', error.message);
    }
  }

  /**
   * 重置熔断器
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    this.status.circuitState = 'closed';
    this.status.failureCount = 0;
    Logger.info('熔断器已重置');
  }

  /**
   * 获取日志
   */
  getLogs(level?: LogLevel) {
    return Logger.getLogs(level);
  }

  /**
   * 清除日志
   */
  clearLogs() {
    Logger.clear();
  }
}

export default AITopicService;
