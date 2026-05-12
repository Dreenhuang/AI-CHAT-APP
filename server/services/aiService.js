/**
 * AI对话服务模块 v3.0
 *
 * 功能说明：
 * 1. 双模型支持：MiniMax（默认）+ DeepSeek（备用）
 * 2. 自动切换：默认模型失败时自动切换到备用模型
 * 3. 支持多种对话模式（辩论、问答、闲聊）
 * 4. 支持Soul角色扮演（根据不同性格生成回复）
 *
 * 使用方式：
 * const aiService = require('./aiService');
 * const response = await aiService.chat(message, { role: 'soul_001', personality: '...' });
 */

const https = require('https');

// 从环境变量读取API配置
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M2.7';

// DeepSeek配置（备用模型）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

/**
 * 调用MiniMax API进行AI对话
 * @param {string} message - 用户消息
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} AI回复内容
 */
async function chat(message, options = {}) {
  const {
    role = 'default',
    personality = '你是一个理性的辩手',
    style = '专业、有逻辑',
    history = []
  } = options;

  try {
    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(role, personality, style);

    // 构建消息数组
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log(`[AI] 正在调用MiniMax API... 角色: ${role}`);

    // 调用MiniMax API
    const response = await callMinimaxAPI(messages);

    console.log(`[AI] MiniMax API调用成功，回复长度: ${response.length}`);

    return response;
  } catch (error) {
    console.error('[AI] MiniMax API调用失败:', error.message);
    console.log('[AI] 正在切换到备用模型 DeepSeek...');

    try {
      // 调用DeepSeek API作为备用
      const fallbackResponse = await callDeepSeekAPI(messages);
      console.log(`[AI] DeepSeek API调用成功，回复长度: ${fallbackResponse.length}`);
      return fallbackResponse;
    } catch (deepseekError) {
      console.error('[AI] DeepSeek API也调用失败:', deepseekError.message);
      console.log('[AI] 使用模拟回复作为降级方案');
      return generateFallbackResponse(message, role, personality);
    }
  }
}

/**
 * 调用MiniMax API
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} API响应内容
 */
function callMinimaxAPI(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MINIMAX_MODEL,
      messages: messages,
      temperature: 0.8,
      max_tokens: 500,
      top_p: 0.9
    });

    const url = new URL(`${MINIMAX_BASE_URL}/chat/completions`);
    
    const requestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log(`[AI] 发送请求到 MiniMax: ${url.href}`);

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`[AI] MiniMax响应状态: ${res.statusCode}`);
          const jsonResponse = JSON.parse(responseData);
          
          if (jsonResponse.error) {
            reject(new Error(jsonResponse.error.message || 'MiniMax API错误'));
            return;
          }

          if (jsonResponse.choices && jsonResponse.choices.length > 0) {
            resolve(jsonResponse.choices[0].message.content);
          } else {
            reject(new Error('MiniMax API返回格式异常'));
          }
        } catch (parseError) {
          console.error('[AI] 解析MiniMax响应失败:', parseError.message);
          reject(new Error('解析API响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[AI] MiniMax请求错误:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('MiniMax API请求超时'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 调用DeepSeek API（备用模型）
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} API响应内容
 */
function callDeepSeekAPI(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: messages,
      temperature: 0.8,
      max_tokens: 500,
      top_p: 0.9
    });

    const url = new URL(`${DEEPSEEK_BASE_URL}/chat/completions`);
    
    const requestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log(`[AI] 发送请求到 DeepSeek: ${url.href}`);

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`[AI] DeepSeek响应状态: ${res.statusCode}`);
          const jsonResponse = JSON.parse(responseData);
          
          if (jsonResponse.error) {
            reject(new Error(jsonResponse.error.message || 'DeepSeek API错误'));
            return;
          }

          if (jsonResponse.choices && jsonResponse.choices.length > 0) {
            resolve(jsonResponse.choices[0].message.content);
          } else {
            reject(new Error('DeepSeek API返回格式异常'));
          }
        } catch (parseError) {
          console.error('[AI] 解析DeepSeek响应失败:', parseError.message);
          reject(new Error('解析API响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[AI] DeepSeek请求错误:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('DeepSeek API请求超时'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 构建系统提示词
 * @param {string} role - 角色ID
 * @param {string} personality - 性格描述
 * @param {string} style - 风格描述
 * @returns {string} 系统提示词
 */
function buildSystemPrompt(role, personality, style) {
  return `你是PRD辩论APP中的AI辩论角色。

【你的身份】
- 角色ID: ${role}
- 性格特点: ${personality}
- 对话风格: ${style}

【任务目标】
你正在参与一场关于当前话题的辩论。请根据你的性格特点和对话风格，对用户的观点进行回应。

【回应要求】
1. 保持角色性格的一致性，不要脱离人设
2. 回应有理有据，可以举例或引用数据
3. 语言生动有趣，避免过于生硬
4. 回复长度控制在100-200字之间
5. 可以适当反驳或补充用户观点
6. 保持辩论的激烈但不失礼貌

【注意事项】
- 不要说"我是AI"或"作为语言模型"之类的话
- 完全沉浸在角色中，就像一个真实的参与者在辩论
- 可以使用反问、设问等修辞手法增强说服力`;
}

/**
 * 生成降级回复（当所有API都不可用时）
 * @param {string} userMessage - 用户消息
 * @param {string} role - 角色ID
 * @param {string} personality - 性格描述
 * @returns {string} 模拟回复
 */
function generateFallbackResponse(userMessage, role, personality) {
  const templates = [
    `我觉得你这个观点挺有意思的。${userMessage.slice(0, 20)}... 不过从另一个角度来看，事情可能并没有那么简单。我们需要综合考虑各方面的因素。`,
    
    `嗯，我理解你的意思了。但我想说的是，这个问题不能只看表面。${personality ? '作为一个' + personality.split('、')[0] + '的人，' : ''}我认为我们应该更深入地分析一下。`,
    
    `这个观点确实值得思考。不过呢，我有一些不同的看法想和你分享一下。首先...其次...最后...你觉得呢？`,
    
    `好吧，我明白你的立场了。但是，有没有可能从另一个角度看这个问题呢？比如说...`,
    
    `你说得有一定道理。但在我看来，还有几个关键点需要考虑：第一...第二...第三...这些都会影响最终的结论。`
  ];

  // 随机选择一个模板
  const baseResponse = templates[Math.floor(Math.random() * templates.length)];
  
  // 根据用户消息长度调整回复
  if (userMessage.length > 100) {
    return baseResponse + '\n\n（注：由于网络原因，当前使用离线模式回复）';
  }
  
  return baseResponse;
}

/**
 * 流式对话（用于实时显示打字效果）
 * @param {string} message - 用户消息
 * @param {Object} options - 配置选项
 * @param {Function} onChunk - 每收到一段文本的回调
 * @returns {Promise<void>}
 */
async function chatStream(message, options = {}, onChunk) {
  try {
    const response = await chat(message, options);
    
    // 模拟流式输出（逐字发送）
    const words = response.split('');
    for (let i = 0; i < words.length; i++) {
      if (onChunk) {
        onChunk(words[i], i === words.length - 1);
      }
      
      // 模拟打字延迟（每10个字符暂停一下）
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  chat,
  chatStream,
  buildSystemPrompt,
  generateFallbackResponse
};