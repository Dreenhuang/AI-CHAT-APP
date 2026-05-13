import { DISCUSSION_MODES, MODE_DEFAULT_SOULS } from '../data/discussionModes';
import { debateApi, DebateGenerateRequest } from './api';
import { getSoulById } from '../data/souls';
import { useAIModelStore } from '../stores/useAIModelStore';

const BASE_URL = 'http://localhost:9462';  // aichat项目后端端口（2026-05-13修正）

/**
 * 清理AI回复内容 - 移除思考过程标签和多余空白
 */
const cleanAIContent = (rawContent: string): string => {
  if (!rawContent) return '';
  let content = rawContent;
  content = content.replace(/<think->[\s\S]*?<\/think->/gi, '').trim();
  content = content.replace(/```[\s]*\n?/g, '').trim();
  content = content.replace(/\n{3,}/g, '\n\n').trim();
  return content;
};

export interface DebateRole {
  id: string;
  name: string;
  roleType: string;
  soulPresetId?: string;
  soul?: string;
  model?: string;
}

export interface DebateConfig {
  modeId: string;
  topic: string;
  roles: DebateRole[];
  outputDepth?: 'brief' | 'normal' | 'detailed';
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
  phases: DebatePhase[];
  config: DebateConfig;
  messages: DebateMessage[];
  startTime?: Date;
  endTime?: Date;
}

const DEPTH_CONFIG = {
  brief: { min: 150, max: 500 },
  normal: { min: 500, max: 1000 },
  detailed: { min: 1000, max: 2000 },
};

const ROLE_TYPE_MAP: Record<string, string> = {
  'host': '主持人', 'moderator': '主持人',
  'proposer': '立论方', 'pro-side': '正方', 'presenter': '方案方',
  'reviewer': '审查方', 'con-side': '反方', 'cons-side': '缺点方',
  'supplementer': '补充方', 'summarizer': '总结方',
  'judge': '裁判', 'neutral': '中立方', 'debater': '辩手',
  'member': '成员', 'brainstormer': '头脑风暴者',
  'main-ai': '主AI', 'sub-ai': '副AI', 'ai': 'AI助手',
  'critic': '批判方', 'questioner': '质询方',
  'asker': '提问方', 'answerer': '回答方',
  'initiator': '发起方', 'chainer': '接龙方',
  'expert-tech': '技术专家', 'expert-business': '商业专家', 'expert-risk': '风险专家',
  'participant-a': '参与者A', 'participant-b': '参与者B',
  'dimension-1': '维度1方', 'dimension-2': '维度2方', 'dimension-3': '维度3方',
};

function getRoleDisplayName(roleType: string): string {
  return ROLE_TYPE_MAP[roleType] || roleType;
}

export class DebateEngine {
  private state: DebateState;
  private onStateChange: (state: DebateState) => void;
  private onMessage: (message: DebateMessage) => void;

  constructor(
    config: DebateConfig,
    onStateChange: (state: DebateState) => void,
    onMessage: (message: DebateMessage) => void
  ) {
    const mode = DISCUSSION_MODES[config.modeId as keyof typeof DISCUSSION_MODES];
    if (!mode) {
      throw new Error(`未知辩论模式: ${config.modeId}`);
    }

    this.state = {
      status: 'idle',
      currentStep: 0,
      currentRound: 0,
      totalSteps: mode.flow.length,
      totalRounds: (mode as any).maxFollowUps || 3,
      phases: mode.flow as DebatePhase[],
      config: {
        ...config,
        outputDepth: config.outputDepth || (mode as any).defaultDepth || 'normal',
      },
      messages: [],
    };

    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
  }

  start(): DebateState {
    console.log(`[DebateEngine] ========== 启动讨论引擎 ==========`);
    console.log(`[DebateEngine] 模式: ${this.state.config.modeId}`);
    console.log(`[DebateEngine] 议题: ${this.state.config.topic}`);
    console.log(`[DebateEngine] 角色数量: ${this.state.config.roles.length}`);
    this.state.config.roles.forEach((r, i) => {
      console.log(`[DebateEngine]   角色${i}: ${r.name} (${r.roleType}) soul: ${r.soulPresetId || 'default'}`);
    });
    console.log(`[DebateEngine] 总步骤数: ${this.state.phases.length}`);
    this.state.phases.forEach((p, i) => {
      console.log(`[DebateEngine]   步骤${i + 1}: [${p.actor}] ${p.label} (${p.action})`);
    });

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

  private executeCurrentStep(): void {
    const phase = this.state.phases[this.state.currentStep];
    if (!phase) {
      console.log(`[DebateEngine] 所有步骤已完成，结束讨论`);
      this.completeDebate();
      return;
    }

    console.log(`[DebateEngine] ========== 执行步骤 ${this.state.currentStep + 1}/${this.state.phases.length} ==========`);
    console.log(`[DebateEngine] 步骤标签: ${phase.label}`);
    console.log(`[DebateEngine] 动作定义: ${phase.actor}`);
    console.log(`[DebateEngine] 当前轮次: ${this.state.currentRound}/${this.state.totalRounds}`);

    this.addSystemMessage(phase.label, phase.description);
    this.executeAIAction(phase);
  }

  private async executeAIAction(phase: DebatePhase): Promise<void> {
    const actors = this.resolveActors(phase.actor);
    console.log(`[DebateEngine] 解析出角色类型: [${actors.join(', ')}]`);

    for (const actorType of actors) {
      if (this.state.status !== 'running') {
        console.warn(`[DebateEngine] 引擎状态已变为${this.state.status}，停止执行`);
        return;
      }

      const matchedRoles = this.getRolesByType(actorType);
      console.log(`[DebateEngine] 角色类型 "${actorType}" 匹配到 ${matchedRoles.length} 个角色`);

      for (const role of matchedRoles) {
        if (!role) continue;

        try {
          console.log(`[DebateEngine] 正在为角色 "${role.name}" (${role.roleType}) 生成回复...`);
          await this.generateAIResponse(role, phase);
          console.log(`[DebateEngine] 角色 "${role.name}" 回复完成`);
        } catch (error: any) {
          console.error(`[DebateEngine] 角色 "${role.name}" 生成回复失败:`, error.message);
          const fallbackContent = this.buildFallbackResponse(role, phase);
          const fallbackMessage: DebateMessage = {
            id: `ai-${Date.now()}-fallback`,
            type: 'ai',
            role: role.roleType,
            roleName: role.name,
            content: fallbackContent,
            timestamp: new Date().toISOString(),
            isStreaming: false,
          };
          this.state.messages.push(fallbackMessage);
          this.onMessage(fallbackMessage);
        }
      }
    }

    console.log(`[DebateEngine] 步骤${this.state.currentStep + 1}所有角色已发言完毕，准备进入下一步`);

    if (phase.loop && this.state.currentRound < this.state.totalRounds) {
      this.state = {
        ...this.state,
        currentRound: this.state.currentRound + 1,
      };
      this.onStateChange(this.state);
      setTimeout(() => this.executeCurrentStep(), 1000);
    } else {
      setTimeout(() => this.nextStep(), 1000);
    }
  }

  private resolveActors(actorDef: number | string | string[]): string[] {
    let result: string[] = [];

    if (typeof actorDef === 'number') {
      const role = this.state.config.roles[actorDef];
      result = role ? [role.roleType] : [];
    } else if (actorDef === 'all') {
      result = [...new Set(this.state.config.roles.map(r => r.roleType))];
    } else if (actorDef === 'host') {
      result = ['host', 'moderator'];
    } else if (actorDef === 'all-but-host') {
      result = [...new Set(
        this.state.config.roles
          .filter(r => r.roleType !== 'host' && r.roleType !== 'moderator')
          .map(r => r.roleType)
      )];
    } else if (actorDef === 'all-critics') {
      result = ['critic', 'critic-logic', 'critic-detail', 'critic-risk'];
    } else if (actorDef === 'experts') {
      result = ['expert-tech', 'expert-business', 'expert-risk'];
    } else if (actorDef === 'voters') {
      result = ['voter'];
    } else if (Array.isArray(actorDef)) {
      actorDef.forEach(a => {
        if (typeof a === 'string') result.push(a);
      });
    } else {
      result = [actorDef as string];
    }

    console.log(`[DebateEngine] resolveActors(${JSON.stringify(actorDef)}) → [${result.join(', ')}]`);
    return result;
  }

  private getRolesByType(roleType: string): DebateRole[] {
    const matched = this.state.config.roles.filter(r => r.roleType === roleType);
    console.log(`[DebateEngine] getRolesByType("${roleType}") → 匹配到 ${matched.length} 个角色: ${matched.map(r => r.name).join(', ')}`);
    return matched;
  }

  private async generateAIResponse(role: DebateRole, phase: DebatePhase): Promise<void> {
    if (this.state.status !== 'running') return;

    this.onMessage({
      id: `ai-${Date.now()}-thinking`,
      type: 'ai',
      role: role.roleType,
      roleName: role.name,
      content: `${getRoleDisplayName(role.roleType)}正在思考中...`,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    });

    const prevMessages = this.state.messages
      .filter(m => m.type !== 'system' && m.content)
      .slice(-10)
      .map(m => ({
        role: m.role || '',
        roleName: m.roleName || '',
        roleType: m.role,
        content: m.content,
      }));

    const depth = this.state.config.outputDepth || 'normal';
    const depthConfig = DEPTH_CONFIG[depth] || DEPTH_CONFIG.normal;

    const requestData: DebateGenerateRequest = {
      topic: this.state.config.topic,
      roleType: role.roleType,
      roleName: role.name,
      soul: role.soul || '',
      action: phase.action,
      actionLabel: phase.label,
      actionDescription: phase.description,
      messages: prevMessages,
      outputDepth: depth as 'brief' | 'normal' | 'detailed',
      roundNumber: this.state.currentRound,
    };

    let content: string | null = null;

    try {
      const response = await fetch(`${BASE_URL}/api/debate/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (result.success && result.data?.content) {
        content = cleanAIContent(result.data.content);
      } else {
        throw new Error(result.message || '后端API返回异常');
      }
    } catch (backendError: any) {
      console.warn('[DebateEngine] 后端不可用，直接调用DeepSeek API:', backendError.message);

      try {
        const config = useAIModelStore.getState().currentConfig;
        const displayName = getRoleDisplayName(role.roleType);
        const roleSoul = role.soul || `你是一位${displayName}，请积极参与讨论。`;

        let contextStr = '';
        if (prevMessages.length > 0) {
          contextStr = '\n\n【讨论进展】\n';
          prevMessages.slice(-6).forEach((m, idx) => {
            const isCurrentRole = m.roleType === role.roleType;
            const prefix = isCurrentRole ? '(你的上轮发言)' : `[${m.roleName}]`;
            contextStr += `${idx + 1}. ${prefix}: ${m.content.substring(0, 150)}${m.content.length > 150 ? '...' : ''}\n`;
          });
        }

        const systemPrompt = `${roleSoul}

【当前讨论】
主题: ${this.state.config.topic}
你的角色: ${displayName} (${role.name})
当前轮次: 第 ${this.state.currentRound} 轮

【当前任务】
${phase.label ? '动作: ' + phase.label : ''}
${phase.description ? '描述: ' + phase.description : ''}
${contextStr}

【发言要求】
- 控制字数在 ${depthConfig.min}-${depthConfig.max} 字以内
- 不要重复别人已经说过的观点
- 保持角色一致性
- 不要说"我是AI"之类的话`;

        const userPrompt = `请作为${displayName} (${role.name})，${phase.description ? phase.description : `就"${this.state.config.topic}"话题发表你的观点。`}`;

        const directResponse = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: depthConfig.max,
            temperature: 0.75,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!directResponse.ok) {
          throw new Error(`DeepSeek API错误 (${directResponse.status})`);
        }

        const directData = await directResponse.json();
        content = cleanAIContent(directData.choices?.[0]?.message?.content);

        if (!content) {
          throw new Error('DeepSeek返回内容为空');
        }

        console.log(`[DebateEngine] DeepSeek直接调用成功: ${content.slice(0, 50)}...`);
      } catch (directError: any) {
        console.error('[DebateEngine] DeepSeek API也失败:', directError.message);
      }
    }

    if (content) {
      const message: DebateMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        role: role.roleType,
        roleName: role.name,
        content,
        timestamp: new Date().toISOString(),
        isStreaming: false,
      };
      this.state.messages.push(message);
      this.onMessage(message);
    } else {
      const fallbackContent = this.buildFallbackResponse(role, phase);
      const fallbackMessage: DebateMessage = {
        id: `ai-${Date.now()}-fallback`,
        type: 'ai',
        role: role.roleType,
        roleName: role.name,
        content: fallbackContent,
        timestamp: new Date().toISOString(),
        isStreaming: false,
      };
      this.state.messages.push(fallbackMessage);
      this.onMessage(fallbackMessage);
    }
  }

  private buildFallbackResponse(role: DebateRole, phase: DebatePhase): string {
    const displayName = getRoleDisplayName(role.roleType);
    const roleSoul = role.soul || '';
    const topic = this.state.config.topic;

    let response = `作为${displayName}（${role.name}），关于"${topic}"，`;

    if (phase.action === 'open' || phase.action === 'lead' || phase.action === 'thesis') {
      response += `我的核心观点如下：\n\n`;
      response += `首先，${topic}这个问题具有重要的讨论价值。从我的视角来看，有几个关键维度值得我们深入探讨。\n\n`;
      response += `第一，我们需要明确问题本身的核心矛盾所在。任何复杂的议题，都需要我们先厘清基本概念和前提假设。\n\n`;
      response += `第二，基于现有数据和分析，我认为应当从多角度、多层次来审视这个问题，而不是简单地二选一。\n\n`;
      response += `第三，展望未来，我们需要建立更系统的评估框架，以确保持续的优化和改进。`;
    } else if (phase.action === 'rebut' || phase.action === 'criticize' || phase.action === 'question') {
      response += `我注意到之前的论述中有几点值得进一步探讨：\n\n`;
      response += `首先，刚才提到的观点在逻辑上存在一些值得商榷的地方。让我从另一个角度来分析。\n\n`;
      response += `另外，我们需要考虑一些可能被忽视的边界条件和潜在风险。这些因素虽然看似次要，但在实际操作中可能产生重大影响。\n\n`;
      response += `基于以上分析，我建议我们进一步完善现有的论证框架。`;
    } else if (phase.action === 'conclude' || phase.action === 'summary' || phase.action === 'integrate') {
      response += `经过充分讨论，我总结如下：\n\n`;
      response += `我们已经从多个角度对这个问题进行了分析，各方观点各有侧重。核心共识在于：这个问题没有简单的答案，需要综合考虑多方面因素。\n\n`;
      response += `主要的分歧点集中在实施路径和优先级上，这也正是需要进一步深入讨论的方向。\n\n`;
      response += `建议下一步可以针对关键分歧点进行更聚焦的探讨。`;
    } else {
      response += `我认为这个问题有多个值得探讨的角度。首先，我们需要对核心概念达成一致理解。其次，不同立场的人可能会基于不同的前提假设得出不同结论。最后，我们需要在充分讨论的基础上寻求共识或明确分歧。`;
    }

    response += `\n\n（此回复因AI服务暂时不可用，由本地逻辑生成）`;
    return response;
  }

  submitUserMessage(content: string): DebateState {
    if (this.state.status !== 'running') {
      throw new Error('辩论未在运行中');
    }

    this.onMessage({
      id: `user-${Date.now()}`,
      type: 'user',
      role: 'user',
      roleName: '你',
      content,
      timestamp: new Date().toISOString(),
    });

    this.nextStep();
    return this.state;
  }

  nextStep(): DebateState {
    const currentPhase = this.state.phases[this.state.currentStep];
    if (currentPhase?.loop && this.state.currentRound < this.state.totalRounds) {
      this.state = {
        ...this.state,
        currentRound: this.state.currentRound + 1,
      };
      this.onStateChange(this.state);
      this.executeCurrentStep();
      return this.state;
    }

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

  completeDebate(): DebateState {
    this.state = {
      ...this.state,
      status: 'completed',
      endTime: new Date(),
    };
    this.addSystemMessage('讨论结束', '感谢所有参与者的精彩发言！');
    this.onStateChange(this.state);
    return this.state;
  }

  pause(): DebateState {
    this.state = { ...this.state, status: 'paused' };
    this.onStateChange(this.state);
    return this.state;
  }

  resume(): DebateState {
    this.state = { ...this.state, status: 'running' };
    this.onStateChange(this.state);
    this.executeCurrentStep();
    return this.state;
  }

  private addSystemMessage(title: string, description: string): void {
    const msg: DebateMessage = {
      id: `system-${Date.now()}`,
      type: 'system',
      title,
      description,
      content: `${title}: ${description}`,
      timestamp: new Date().toISOString(),
    };
    this.state.messages.push(msg);
    this.onMessage(msg);
  }

  static getRoleDisplayName(roleType: string): string {
    return getRoleDisplayName(roleType);
  }

  static getDefaultSouls(modeId: string): Record<string, string> {
    return (MODE_DEFAULT_SOULS as any)[modeId] || {};
  }

  static getAllModes() {
    return Object.values(DISCUSSION_MODES);
  }

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