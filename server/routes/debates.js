/**
 * 辩论记录路由模块
 * 
 * 提供辩论记录管理接口：
 * - POST /api/debates - 创建辩论
 * - GET /api/debates - 获取辩论列表
 * - GET /api/debates/:id - 获取辩论详情
 * - PUT /api/debates/:id - 更新辩论状态
 * - DELETE /api/debates/:id - 删除辩论记录
 * - GET /api/debates/:id/messages - 获取辩论消息
 * - POST /api/debates/:id/summary - 生成辩论总结
 */

const express = require('express');
const router = express.Router();

// 模拟辩论数据存储
const debates = new Map();
let debateIdCounter = 1;

/**
 * 创建辩论
 * POST /api/debates
 * 请求体: { topicId: "topic_001", groupId: "group_001", souls: ["soul_001", "soul_002"] }
 */
router.post('/', (req, res) => {
  try {
    const { topicId, groupId, souls, mode = 'soul' } = req.body;

    // 参数验证
    if (!topicId || !souls || souls.length === 0) {
      return res.status(400).json({
        success: false,
        message: '议题ID和参与Soul不能为空'
      });
    }

    // 创建辩论对象
    const debate = {
      id: `debate_${debateIdCounter++}`,
      topicId,
      groupId: groupId || null,
      souls: souls,
      mode, // soul vs pvp vs mixed
      status: 'pending', // pending, active, paused, finished, cancelled
      creatorId: `user_mock`,
      messages: [],
      summary: null,
      winner: null,
      scores: {},
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      duration: 0,
      messageCount: 0
    };

    debates.set(debate.id, debate);

    console.log(`[辩论] 新辩论创建成功: ${debate.id}`);

    res.status(201).json({
      success: true,
      message: '辩论创建成功',
      data: debate
    });
  } catch (error) {
    console.error('创建辩论失败:', error);
    res.status(500).json({
      success: false,
      message: '创建辩论失败'
    });
  }
});

/**
 * 获取辩论列表
 * GET /api/debates?status=active&page=1&limit=20
 */
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, status, mode } = req.query;
    
    let debateList = Array.from(debates.values());

    // 按状态筛选
    if (status) {
      debateList = debateList.filter(d => d.status === status);
    }

    // 按模式筛选
    if (mode) {
      debateList = debateList.filter(d => d.mode === mode);
    }

    // 按创建时间倒序排列
    debateList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页处理
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedDebates = debateList.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedDebates,
        total: debateList.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(debateList.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取辩论列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取辩论列表失败'
    });
  }
});

/**
 * 获取辩论详情
 * GET /api/debates/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const debate = debates.get(id);

    if (!debate) {
      return res.status(404).json({
        success: false,
        message: '辩论不存在'
      });
    }

    res.json({
      success: true,
      data: debate
    });
  } catch (error) {
    console.error('获取辩论详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取辩论详情失败'
    });
  }
});

/**
 * 更新辩论状态
 * PUT /api/debates/:id
 * 请求体: { status: "active", winner: "soul_001" }
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, winner, scores, summary } = req.body;

    const debate = debates.get(id);
    if (!debate) {
      return res.status(404).json({
        success: false,
        message: '辩论不存在'
      });
    }

    // 更新状态
    if (status) {
      debate.status = status;
      
      // 记录时间戳
      if (status === 'active' && !debate.startedAt) {
        debate.startedAt = new Date().toISOString();
      }
      if (status === 'finished' && !debate.finishedAt) {
        debate.finishedAt = new Date().toISOString();
        // 计算持续时间
        const start = new Date(debate.startedAt).getTime();
        const end = new Date(debate.finishedAt).getTime();
        debate.duration = Math.floor((end - start) / 1000); // 秒
      }
    }

    // 更新获胜者
    if (winner) {
      debate.winner = winner;
    }

    // 更新分数
    if (scores) {
      debate.scores = { ...debate.scores, ...scores };
    }

    // 更新总结
    if (summary) {
      debate.summary = summary;
    }

    debate.updatedAt = new Date().toISOString();
    debates.set(id, debate);

    console.log(`[辩论] 辩论 ${id} 状态更新为: ${status}`);

    res.json({
      success: true,
      message: '辩论信息更新成功',
      data: debate
    });
  } catch (error) {
    console.error('更新辩论信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新辩论信息失败'
    });
  }
});

/**
 * 删除辩论记录
 * DELETE /api/debates/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!debates.has(id)) {
      return res.status(404).json({
        success: false,
        message: '辩论不存在'
      });
    }

    debates.delete(id);

    console.log(`[辩论] 辩论记录已删除: ${id}`);

    res.json({
      success: true,
      message: '辩论记录删除成功'
    });
  } catch (error) {
    console.error('删除辩论记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除辩论记录失败'
    });
  }
});

/**
 * 获取辩论消息
 * GET /api/debates/:id/messages?page=1&limit=50
 */
router.get('/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const debate = debates.get(id);
    if (!debate) {
      return res.status(404).json({
        success: false,
        message: '辩论不存在'
      });
    }

    // 分页处理消息
    const messages = debate.messages || [];
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = messages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedMessages,
        total: messages.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取辩论消息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取辩论消息失败'
    });
  }
});

/**
 * 生成辩论总结
 * POST /api/debates/:id/summary
 */
router.post('/:id/summary', (req, res) => {
  try {
    const { id } = req.params;

    const debate = debates.get(id);
    if (!debate) {
      return res.status(404).json({
        success: false,
        message: '辩论不存在'
      });
    }

    // 生成模拟总结（实际应调用AI服务）
    const summary = {
      debateId: id,
      topicId: debate.topicId,
      totalMessages: debate.messages?.length || 0,
      duration: debate.duration || 0,
      participants: debate.souls,
      keyPoints: [
        "双方就核心议题展开了深入讨论",
        "正方主要强调了XX的重要性",
        "反方则从YY角度提出了不同观点",
        "最终在某些关键点上达成了共识"
      ],
      conclusion: "这是一场精彩的辩论，双方都展现出了优秀的思辨能力",
      generatedAt: new Date().toISOString()
    };

    debate.summary = summary;
    debates.set(id, debate);

    console.log(`[辩论] 辩论 ${id} 总结已生成`);

    res.json({
      success: true,
      message: '辩论总结生成成功',
      data: summary
    });
  } catch (error) {
    console.error('生成辩论总结失败:', error);
    res.status(500).json({
      success: false,
      message: '生成辩论总结失败'
    });
  }
});

module.exports = router;
