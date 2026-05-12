/**
 * AI Chat - 对话引擎服务
 * 基于taolun-web的debateEngine.js适配
 *
 * 功能说明：
 * 1. 管理辩论的完整生命周期（初始化、运行、暂停、完成）
 * 2. 控制辩论流程的步骤推进
 * 3. 管理角色和AI响应
 * 4. 提供状态回调和消息回调
 */

import { DISCUSSION_MODES, getModeById, MODE_DEFAULT_SOULS } from '../data/discussionModes';

// ══════════════════════════════════════
// 类型定义
// ══════════════════════════════════════

export interface DebateRole {
  id: string;
  name: string;
  roleType: string;        // host/proposer/reviewer/supplementer/summarizer/debater/brainstormer
  soulPresetId?: string;   // Soul预设ID
  soul?: string;           // Soul提示词内容
  model?: string;         // AI模型
}

export interface DebateConfig {
  modeId: string;          // 辩论模式ID
  topic: string;           // 议题
  roles: DebateRole[];     // 角色列表
  outputDepth?: 'brief' | 'normal' | 'detailed';  // 输出深度
}

export interface DebatePhase {
  step: number;
  actor: number | string | string[];
  action: string;
  label: string;
  description: string;
  loop?: boolean;
  parallel?: boolean;
}

export interface DebateMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  role?: string;
  roleName?: string;
  content: string;
  title?: string;
  description?: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface DebateState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentStep: number;
  currentRound: number;
  totalSteps: number;
  totalRounds: number;
  currentActorIndex: number;
  phases: DebatePhase[];
  config: DebateConfig;
  messages: DebateMessage[];
  startTime?: Date;
  endTime?: Date;
}

// ══════════════════════════════════════
// DebateEngine 类
// ══════════════════════════════════════

export class DebateEngine {
  private state: DebateState;
  private onStateChange: (state: DebateState) => void;
  private onMessage: (message: DebateMessage) => void;

  constructor(
    config: DebateConfig,
    onStateChange: (state: DebateState) => void,
    onMessage: (message: DebateMessage) => void
  ) {
    // 验证模式是否存在
    const mode = getModeById(config.modeId);
    if (!mode) {
      throw new Error(`未知辩论模式: ${config.modeId}`);
    }

    // 初始化状态
    this.state = {
      status: 'idle',
      currentStep: 0,
      currentRound: 0,
      totalSteps: mode.flow.length,
      totalRounds: mode.maxRounds || 3,
      currentActorIndex: 0,
      phases: mode.flow,
      config: {
        ...config,
        outputDepth: config.outputDepth || mode.defaultDepth || 'normal',
      },
      messages: [],
    };

    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
  }

  /**
   * 开始辩论
   */
  start(): DebateState {
    this.state = {
      ...this.state,
      status: 'running',
      startTime: new Date(),
      currentStep: 0,
      currentRound: 1,
    };
    
    this.onStateChange(this.state);
    this.executeCurrentStep();
    
    return this.state;
  }

  /**
   * 执行当前步骤
   */
  private executeCurrentStep(): void {
    const phase = this.state.phases[this.state.currentStep];
    if (!phase) {
      this.completeDebate();
      return;
    }

    // 发送系统消息说明当前步骤
    this.addSystemMessage(`📋 ${phase.label}`, phase.description);

    // 确定当前行动者
    const actor = this.resolveActor(phase.actor);
    
    // 如果是用户行动，等待用户输入
    if (this.isUserTurn(actor)) {
      this.onStateChange({
        ...this.state,
        currentActorIndex: Array.isArray(actor) ? actor[0] : actor as number,
      });
    } else {
      // AI自动行动
      this.executeAIAction(phase);
    }
  }

  /**
   * 解析行动者
   */
  private resolveActor(actorDef: number | string | string[]): number | number[] {
    if (typeof actorDef === 'number') return actorDef;
    if (actorDef === 'all') return -1; // 所有参与者
    if (actorDef === 'host') return this.getHostIndex();
    if (actorDef === 'all-but-host') return this.getAllExceptHost();
    if (Array.isArray(actorDef)) return actorDef.map(a => this.resolveActorByName(a));
    return this.resolveActorByName(actorDef as string);
  }

  private resolveActorByName(roleType: string): number {
    return this.state.config.roles.findIndex(r => r.roleType === roleType);
  }

  private getHostIndex(): number {
    return this.state.config.roles.findIndex(r => 
      r.roleType === 'host' || r.roleType === 'moderator'
    );
  }

  private getAllExceptHost(): number[] {
    return this.state.config.roles
      .map((r, i) => ({ role: r, index: i }))
      .filter(({ role }) => role.roleType !== 'host' && role.roleType !== 'moderator')
      .map(({ index }) => index);
  }

  /**
   * 判断是否是用户回合
   */
  private isUserTurn(actor: number | number[]): boolean {
    // 假设第一个角色是用户，其余是AI
    if (Array.isArray(actor)) return actor.includes(0);
    return actor === 0;
  }

  /**
   * 执行AI行动
   */
  private async executeAIAction(phase: DebatePhase): Promise<void> {
    const actor = this.resolveActor(phase.actor);
    const actors = Array.isArray(actor) ? actor : [actor];
    
    for (const actorIndex of actors) {
      if (actorIndex < 0 || actorIndex >= this.state.config.roles.length) continue;
      
      const role = this.state.config.roles[actorIndex];
      if (!role?.soul) continue;

      // 生成AI回复
      await this.generateAIResponse(role, phase.action);
    }

    // 自动推进到下一步
    setTimeout(() => this.nextStep(), 1000);
  }

  /**
   * 生成AI响应
   */
  private async generateAIResponse(role: DebateRole, action: string): Promise<void> {
    // TODO: 使用prompt调用AI API生成真实回复
    // const depthInstruction = this.getDepthInstruction();
    // const prompt = `${role.soul}\n\n${depthInstruction}\n\n当前行动: ${action}`;
    
    // 发送AI正在思考的消息
    this.onMessage({
      id: `ai-${Date.now()}`,
      type: 'ai',
      role: role.roleType,
      roleName: role.name,
      content: `[AI正在思考${action}...]`,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    });

    // TODO: 对接后端API生成真实回复
    // 这里先使用模拟回复
    setTimeout(() => {
      const mockResponse = this.generateMockResponse(role.name, action);
      this.onMessage({
        id: `ai-${Date.now()}`,
        type: 'ai',
        role: role.roleType,
        roleName: role.name,
        content: mockResponse,
        timestamp: new Date().toISOString(),
        isStreaming: false,
      });
    }, 1500 + Math.random() * 1500);
  }

  /**
   * 生成模拟回复（实际使用时替换为真实AI API调用）
   */
  private generateMockResponse(roleName: string, action: string): string {
    const responses = [
      `我是${roleName}，关于这个议题，我的看法是...`,
      `作为${roleName}，我认为需要从多个角度来分析这个问题...`,
      `基于${action}的要求，我想表达以下几点...`,
    ];
    return responses[Math.floor(Math.random() * responses.length)] + 
      `\n\n（这是模拟回复，实际使用时会调用AI API生成真实内容）`;
  }

  /**
   * 获取输出深度指令
   * TODO: 对接AI API时启用此方法
   */
  /*
  private getDepthInstruction(): string {
    const depths = {
      brief: '请用简洁的语言回答，控制在150-500字以内。',
      normal: '请用适中的长度回答，控制在500-1000字以内。',
      detailed: '请详细深入地回答，控制在1000-2000字以内。',
    };
    return depths[this.state.config.outputDepth || 'normal'] || depths.normal;
  }
  */

  /**
   * 用户提交消息
   */
  submitUserMessage(content: string): DebateState {
    if (this.state.status !== 'running') {
      throw new Error('辩论未在运行中');
    }

    // 添加用户消息
    this.onMessage({
      id: `user-${Date.now()}`,
      type: 'user',
      role: 'user',
      roleName: '你',
      content,
      timestamp: new Date().toISOString(),
    });

    // 推进到下一步
    this.nextStep();
    return this.state;
  }

  /**
   * 下一步
   */
  nextStep(): DebateState {
    const currentPhase = this.state.phases[this.state.currentStep];
    
    // 检查是否循环步骤
    if (currentPhase?.loop && this.state.currentRound < this.state.totalRounds) {
      this.state = {
        ...this.state,
        currentRound: this.state.currentRound + 1,
      };
      this.onStateChange(this.state);
      this.executeCurrentStep();
      return this.state;
    }

    // 推进到下一个步骤
    this.state = {
      ...this.state,
      currentStep: this.state.currentStep + 1,
    };

    if (this.state.currentStep >= this.state.phases.length) {
      this.completeDebate();
    } else {
      this.onStateChange(this.state);
      this.executeCurrentStep();
    }
    
    return this.state;
  }

  /**
   * 完成辩论
   */
  completeDebate(): DebateState {
    this.state = {
      ...this.state,
      status: 'completed',
      endTime: new Date(),
    };
    
    this.addSystemMessage('🏁 辩论结束', '感谢所有参与者的精彩发言！');
    this.onStateChange(this.state);
    return this.state;
  }

  /**
   * 暂停辩论
   */
  pause(): DebateState {
    this.state = { ...this.state, status: 'paused' };
    this.onStateChange(this.state);
    return this.state;
  }

  /**
   * 恢复辩论
   */
  resume(): DebateState {
    this.state = { ...this.state, status: 'running' };
    this.onStateChange(this.state);
    this.executeCurrentStep();
    return this.state;
  }

  /**
   * 添加系统消息
   */
  private addSystemMessage(title: string, description: string): void {
    this.onMessage({
      id: `system-${Date.now()}`,
      type: 'system',
      title,
      description,
      content: `${title}: ${description}`, // 添加必需的content字段
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取当前应该行动的角色
   */
  getCurrentActor(): DebateRole | null {
    const phase = this.state.phases[this.state.currentStep];
    if (!phase) return null;
    
    const actor = this.resolveActor(phase.actor);
    const index = Array.isArray(actor) ? actor[0] : actor as number;
    return this.state.config.roles[index] || null;
  }

  /**
   * 获取默认Soul推荐
   */
  static getDefaultSouls(modeId: string): Record<string, string> {
    return (MODE_DEFAULT_SOULS as any)[modeId] || {};
  }

  /**
   * 获取所有可用模式
   */
  static getAllModes() {
    return Object.values(DISCUSSION_MODES);
  }

  /**
   * 获取模式分类
   */
  static getModeCategories() {
    const categories: Record<string, any[]> = {};
    Object.values(DISCUSSION_MODES).forEach(mode => {
      if (!categories[mode.category]) {
        categories[mode.category] = [];
      }
      categories[mode.category].push(mode);
    });
    return categories;
  }
}

export default DebateEngine;
