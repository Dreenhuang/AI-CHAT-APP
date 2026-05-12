/**
 * AI服务调用模块
 * 
 * 提供与大模型API交互的功能：
 * - 聊天对话（单轮/多轮）
 * - 辩论内容生成
 * - 角色扮演对话
 * - 防止重复词语的输出处理
 */

import { useAIModelStore } from '../stores/useAIModelStore';
import { SoulPreset } from '../data/soulPresets';

// ============ 类型定义 ============

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============ 工具函数 ============

/**
 * 检测并移除重复的词语/短语
 * 解决之前出现的重复词语问题
 */
const removeRepetitivePhrases = (text: string): string => {
  // 移除连续重复的句子（如"我认为...我认为..."）
  let cleaned = text.replace(/(.{10,}?)\1{2,}/g, '$1');
  
  // 移除连续重复的短语（3个字以上）
  cleaned = cleaned.replace(/(.{3,}?)\1{2,}/g, '$1');
  
  // 移除开头和结尾的多余空格和换行
  cleaned = cleaned.trim();
  
  return cleaned;
};

/**
 * 构建系统提示词，包含角色设定
 */
const buildSystemPrompt = (
  context: 'chat' | 'debate' | 'discussion',
  soulPreset?: SoulPreset,
  topic?: string,
): string => {
  const basePrompt = `你是一个专业的辩论助手，擅长逻辑分析和观点表达。
要求：
- 回答要简洁明了，避免冗长
- 观点要有理有据，逻辑清晰
- 不要重复相同的内容
- 使用自然的语言表达`;

  if (context === 'chat' && soulPreset) {
    return `${basePrompt}

现在你需要扮演以下角色：
角色名称：${soulPreset.name}
角色描述：${soulPreset.description}
性格特点：${soulPreset.character.personality.join('、')}
说话风格：${soulPreset.character.speechStyle}
专业领域：${soulPreset.suitableFor.join('、')}

请完全按照这个角色的性格和风格来回答用户的问题。`;
  }

  if (context === 'debate' && topic) {
    return `${basePrompt}

当前辩题：${topic}

请针对这个辩题给出你的观点和论证。要求：
1. 明确表明立场（支持或反对）
2. 给出至少2-3个论点
3. 每个论点要有具体的论据支撑
4. 语言简洁有力，适合口头辩论`;
  }

  if (context === 'discussion') {
    return `${basePrompt}

这是一个多人讨论场景，请参与讨论并贡献有价值的观点。注意：
- 倾听他人观点后再回应
- 保持开放和尊重的态度
- 可以提出新的角度或补充`;
  }

  return basePrompt;
};

// ============ 核心API调用函数 ============

/**
 * 调用AI模型API
 */
const callAIAPI = async (
  messages: ChatMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<AIResponse> => {
  const config = useAIModelStore.getState().currentConfig;

  try {
    console.log(`[AI] Calling ${config.model} at ${config.baseUrl}`);

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: options?.maxTokens || config.maxTokens,
        temperature: options?.temperature ?? config.temperature,
      }),
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content || '';
    
    // 处理重复词语问题
    const cleanedContent = removeRepetitivePhrases(content);

    return {
      success: true,
      content: cleanedContent,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  } catch (error: any) {
    console.error('[AI] API call failed:', error);
    
    return {
      success: false,
      error: error.message || '未知错误',
    };
  }
};

// ============ 导出的服务函数 ============

/**
 * 与Soul角色进行聊天对话
 */
export const chatWithSoul = async (
  message: string,
  soulPreset: SoulPreset,
  history?: ChatMessage[],
): Promise<AIResponse> => {
  const systemPrompt = buildSystemPrompt('chat', soulPreset);
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: message },
  ];

  return callAIAPI(messages, { temperature: 0.8 });
};

/**
 * 进行辩论发言
 */
export const generateDebateArgument = async (
  topic: string,
  stance: 'support' | 'oppose' | 'neutral',
  history?: ChatMessage[],
): Promise<AIResponse> => {
  const systemPrompt = buildSystemPrompt('debate', undefined, topic);
  
  const userMessage = stance === 'support'
    ? `请从支持的角度论述这个辩题`
    : stance === 'oppose'
    ? `请从反对的角度论述这个辩题`
    : `请从中立的角度分析这个辩题的利弊`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: userMessage },
  ];

  return callAIAPI(messages, { temperature: 0.7 });
};

/**
 * 参与群组讨论
 */
export const participateInDiscussion = async (
  message: string,
  discussionTopic: string,
  participants: string[],
  history?: ChatMessage[],
): Promise<AIResponse> => {
  const systemPrompt = buildSystemPrompt('discussion');
  
  const participantList = participants.join('、');
  const contextMessage = `讨论主题：${discussionTopic}
参与者：${participantList}

${message}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: contextMessage },
  ];

  return callAIAPI(messages, { temperature: 0.75 });
};

/**
 * 通用聊天（无特定角色）
 */
export const generalChat = async (
  message: string,
  history?: ChatMessage[],
): Promise<AIResponse> => {
  const systemPrompt = buildSystemPrompt('chat');

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: message },
  ];

  return callAIAPI(messages, { temperature: 0.7 });
};

// ============ 模拟模式（用于测试） ============

/**
 * 生成模拟回复（当API不可用时使用）
 */
const generateMockResponse = (
  type: 'chat' | 'debate' | 'discussion',
  soulName?: string,
): string => {
  const responses = {
    chat: [
      `作为${soulName || 'AI助手'}，我认为这个问题很有意思...让我详细分析一下。

首先，我们需要明确几个关键点：
1. 这个问题的核心在于...
2. 从不同角度来看...
3. 综合考虑各种因素...

我的结论是...希望能对你有所帮助！`,
      
      `嗯，这是一个值得深入思考的话题。

在我看来，主要可以从以下几个方面来分析：

**第一点**：...
**第二点**：...
**第三点**：...

总的来说，我建议你可以尝试...`,
    ],
    
    debate: [
      `关于这个辩题，我持【支持】立场。

**论点一**：从实际情况来看...
**论据**：根据相关数据和研究...

**论点二**：从理论层面分析...
**论据**：...

**总结**：综上所述，我认为...`,
      
      `对于这个议题，我选择【反对】。

**理由如下**：
1. 首先，...
2. 其次，...
3. 最后，...

因此，我认为这种做法是不可取的。`,
    ],
    
    discussion: [
      `我来分享一下我的看法：

在这个问题上，我觉得大家忽略了一个重要因素...

我建议我们可以从XX角度重新思考这个问题。`,
      
      `同意楼上部分观点，但我想补充一点：

其实还有另一种可能...

不知道大家怎么看？`,
    ],
  };

  const typeResponses = responses[type];
  return typeResponses[Math.floor(Math.random() * typeResponses.length)];
};

/**
 * 带降级的AI调用（优先使用真实API，失败时返回模拟数据）
 */
export const safeAICall = async (
  type: 'chat' | 'debate' | 'discussion',
  params: any,
): Promise<AIResponse> => {
  let result: AIResponse;

  switch (type) {
    case 'chat':
      result = await chatWithSoul(params.message, params.soulPreset, params.history);
      break;
    case 'debate':
      result = await generateDebateArgument(params.topic, params.stance, params.history);
      break;
    case 'discussion':
      result = await participateInDiscussion(
        params.message,
        params.topic,
        params.participants,
        params.history,
      );
      break;
    default:
      result = await generalChat(params.message, params.history);
  }

  // 如果API调用失败，返回模拟数据
  if (!result.success) {
    console.warn('[AI] API failed, using mock response:', result.error);
    return {
      success: true,
      content: generateMockResponse(type, params.soulPreset?.name),
    };
  }

  return result;
};

export default {
  chatWithSoul,
  generateDebateArgument,
  participateInDiscussion,
  generalChat,
  safeAICall,
};
