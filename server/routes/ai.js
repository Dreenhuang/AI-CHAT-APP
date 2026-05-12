/**
 * AI生成路由模块
 *
 * 提供AI智能对话接口：
 * - POST /api/ai/generate - 生成AI回复（对接MiniMax API）
 *
 * 使用方式：
 * 前端调用示例：
 * fetch('/api/ai/generate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     message: '用户消息',
 *     role: 'soul_001',
 *     personality: '角色性格描述',
 *     style: '对话风格'
 *   })
 * })
 */

const express = require('express');
const router = express.Router();

// 导入AI服务
const { chat, chatStream } = require('../services/aiService');

/**
 * 生成AI回复
 * POST /api/ai/generate
 *
 * 请求体:
 * {
 *   message: string,        // 用户消息（必填）
 *   role?: string,           // 角色ID（可选）
 *   personality?: string,    // 性格描述（可选）
 *   style?: string,          // 对话风格（可选）
 *   history?: Array,         // 历史消息（可选）
 *   conversationId?: string, // 会话ID（可选）
 *   topicId?: string         // 议题ID（可选）
 * }
 *
 * 成功响应:
 * {
 *   success: true,
 *   content: string,         // AI回复内容
 *   model: string,           // 使用的模型
 *   timestamp: string
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      message,
      role = 'default',
      personality = '你是一个理性的辩论助手',
      style = '专业、有逻辑、友好',
      history = [],
      conversationId,
      topicId
    } = req.body;

    // 参数验证
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空',
        code: 'EMPTY_MESSAGE'
      });
    }

    // 消息长度限制（防止滥用）
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: '消息长度不能超过2000个字符',
        code: 'MESSAGE_TOO_LONG'
      });
    }

    console.log(`[AI API] 收到生成请求:`, {
      messageLength: message.length,
      role,
      conversationId,
      topicId,
      timestamp: new Date().toISOString()
    });

    // 调用AI服务生成回复
    const startTime = Date.now();
    const response = await chat(message, {
      role,
      personality,
      style,
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    });
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    console.log(`[AI API] 生成成功:`, {
      responseLength: response.length,
      responseTime: `${responseTime}ms`,
      model: 'MiniMax-M2.7'
    });

    // 返回成功响应
    res.json({
      success: true,
      content: response,
      model: 'MiniMax-M2.7',
      metadata: {
        role,
        personality: personality.slice(0, 50) + '...',
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[AI API] 生成失败:', error);

    // 返回错误响应
    res.status(500).json({
      success: false,
      error: error.message || 'AI生成失败，请稍后重试',
      code: 'AI_GENERATION_FAILED',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 流式生成AI回复（用于实时显示打字效果）
 * POST /api/ai/generate/stream
 *
 * 注意：此接口使用SSE（Server-Sent Events）格式返回流式数据
 */
router.post('/generate/stream', async (req, res) => {
  try {
    const { message, role, personality, style } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 调用流式生成函数
    await chatStream(message, { role, personality, style }, (chunk, isLast) => {
      const data = {
        type: 'chunk',
        content: chunk,
        isLast: isLast
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      if (isLast) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

  } catch (error) {
    console.error('[AI Stream API] 错误:', error);
    
    const errorData = {
      type: 'error',
      error: error.message
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  }
});

/**
 * AI服务健康检查
 * GET /api/ai/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AI Generation Service',
    status: 'online',
    model: 'MiniMax-M2.7',
    features: [
      '文本生成',
      '角色扮演',
      '辩论模式',
      '流式输出'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
