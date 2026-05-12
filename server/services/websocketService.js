/**
 * WebSocket服务模块
 * 
 * 功能说明：
 * 1. 管理WebSocket连接
 * 2. 处理辩论相关的实时通信
 * 3. 支持多人在线辩论
 * 4. 提供连接状态管理
 * 
 * 消息类型：
 * - debate:start - 开始辩论
 * - debate:message - 发送辩论消息
 * - debate:stop - 停止辩论
 * - debate:pause - 暂停辩论
 * - debate:resume - 继续辩论
 * - ping - 心跳检测
 */

const { chat } = require('./aiService');

// 存储所有活跃的WebSocket连接
const connections = new Map();

// 存储活跃的辩论会话
const activeDebates = new Map();

/**
 * 初始化WebSocket服务器
 * @param {WebSocket.Server} wss - WebSocket服务器实例
 */
function setupWebSocket(wss) {
  console.log('[WebSocket] WebSocket服务初始化完成');

  wss.on('connection', (ws, req) => {
    const connectionId = generateConnectionId();
    
    // 存储连接信息
    const connectionInfo = {
      id: connectionId,
      ws: ws,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      debateId: null,
      userId: null
    };
    
    connections.set(connectionId, connectionInfo);
    
    console.log(`[WebSocket] 新连接建立: ${connectionId}`);
    console.log(`[WebSocket] 当前在线连接数: ${connections.size}`);

    // 发送欢迎消息
    sendToClient(ws, {
      type: 'connection:established',
      connectionId: connectionId,
      message: '连接成功！欢迎使用PRD辩论APP',
      timestamp: new Date().toISOString()
    });

    // 监听消息事件
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        connectionInfo.lastActivity = Date.now();
        
        await handleMessage(ws, connectionInfo, data);
      } catch (error) {
        console.error('[WebSocket] 消息处理错误:', error.message);
        sendToClient(ws, {
          type: 'error',
          message: '消息格式错误或处理失败',
          timestamp: new Date().toISOString()
        });
      }
    });

    // 监听关闭事件
    ws.on('close', () => {
      handleConnectionClose(connectionInfo);
    });

    // 监听错误事件
    ws.onerror = (error) => {
      console.error(`[WebSocket] 连接 ${connectionId} 发生错误:`, error.message);
    };
  });

  // 定时清理不活跃的连接（每5分钟）
  setInterval(() => {
    cleanupInactiveConnections();
  }, 5 * 60 * 1000);
}

/**
 * 处理客户端消息
 * @param {WebSocket} ws - WebSocket连接
 * @param {Object} connectionInfo - 连接信息
 * @param {Object} data - 消息数据
 */
async function handleMessage(ws, connectionInfo, data) {
  const { type } = data;

  switch (type) {
    case 'debate:start':
      await handleDebateStart(ws, connectionInfo, data);
      break;
      
    case 'debate:message':
      await handleDebateMessage(ws, connectionInfo, data);
      break;
      
    case 'debate:stop':
      handleDebateStop(ws, connectionInfo, data);
      break;
      
    case 'debate:pause':
      handleDebatePause(ws, connectionInfo, data);
      break;
      
    case 'debate:resume':
      handleDebateResume(ws, connectionInfo, data);
      break;
      
    case 'ping':
      handlePing(ws, connectionInfo);
      break;
      
    case 'join:debate':
      handleJoinDebate(ws, connectionInfo, data);
      break;
      
    case 'leave:debate':
      handleLeaveDebate(ws, connectionInfo, data);
      break;
      
    default:
      sendToClient(ws, {
        type: 'error',
        message: `未知消息类型: ${type}`,
        timestamp: new Date().toISOString()
      });
  }
}

/**
 * 处理开始辩论
 */
async function handleDebateStart(ws, connectionInfo, data) {
  const { topicId, souls, mode } = data;
  
  const debateId = generateDebateId();
  
  // 创建辩论会话
  const debateSession = {
    id: debateId,
    topicId,
    souls: souls || [],
    mode: mode || 'soul',
    status: 'active',
    participants: [connectionInfo.id],
    messages: [],
    createdAt: Date.now(),
    startedAt: Date.now()
  };
  
  activeDebates.set(debateId, debateSession);
  connectionInfo.debateId = debateId;

  console.log(`[辩论] 辩论开始: ${debateId}, 参与者: ${souls?.join(', ')}`);

  sendToClient(ws, {
    type: 'debate:start:success',
    debateId: debateId,
    status: 'active',
    message: '辩论已开始！',
    timestamp: new Date().toISOString()
  });
}

/**
 * 处理辩论消息
 */
async function handleDebateMessage(ws, connectionInfo, data) {
  const { message, role, soulId } = data;
  const debateId = connectionInfo.debateId;

  if (!debateId) {
    sendToClient(ws, {
      type: 'error',
      message: '您还没有加入任何辩论',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const debateSession = activeDebates.get(debateId);
  if (!debateSession || debateSession.status !== 'active') {
    sendToClient(ws, {
      type: 'error',
      message: '辩论不存在或已结束',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 记录用户消息
  const userMessageRecord = {
    id: generateMessageId(),
    role: 'user',
    content: message,
    senderId: connectionInfo.id,
    soulId: soulId || null,
    timestamp: new Date().toISOString()
  };
  
  debateSession.messages.push(userMessageRecord);

  // 广播用户消息给其他参与者（如果有）
  broadcastToDebate(debateId, {
    type: 'debate:message:user',
    messageId: userMessageRecord.id,
    content: message,
    senderId: connectionInfo.id,
    timestamp: userMessageRecord.timestamp
  }, connectionInfo.id);

  // 发送"正在输入中..."状态
  sendToClient(ws, {
    type: 'debate:status',
    status: 'typing',
    soulId: soulId,
    timestamp: new Date().toISOString()
  });

  try {
    // 调用AI服务生成回复
    const aiResponse = await chat(message, {
      role: soulId || 'default',
      personality: getSoulPersonality(soulId),
      style: getSoulStyle(soulId),
      history: debateSession.messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    // 记录AI回复
    const aiMessageRecord = {
      id: generateMessageId(),
      role: 'assistant',
      content: aiResponse,
      soulId: soulId || null,
      timestamp: new Date().toISOString()
    };
    
    debateSession.messages.push(aiMessageRecord);

    // 发送AI回复
    sendToClient(ws, {
      type: 'debate:message:ai',
      messageId: aiMessageRecord.id,
      content: aiResponse,
      role: soulId || 'assistant',
      soulId: soulId || null,
      timestamp: aiMessageRecord.timestamp
    });

    console.log(`[辩论] AI回复已发送, 辩论ID: ${debateId}, 消息数: ${debateSession.messages.length}`);

  } catch (error) {
    console.error('[辩论] AI回复生成失败:', error.message);
    
    sendToClient(ws, {
      type: 'debate:error',
      message: 'AI回复生成失败，请稍后重试',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 处理停止辩论
 */
function handleDebateStop(ws, connectionInfo, data) {
  const debateId = connectionInfo.debateId;
  
  if (debateId && activeDebates.has(debateId)) {
    const debateSession = activeDebates.get(debateId);
    debateSession.status = 'finished';
    debateSession.finishedAt = Date.now();

    broadcastToDebate(debateId, {
      type: 'debate:stopped',
      debateId: debateId,
      message: '辩论已结束',
      totalMessages: debateSession.messages.length,
      duration: Math.floor((Date.now() - debateSession.startedAt) / 1000),
      timestamp: new Date().toISOString()
    });

    console.log(`[辩论] 辩论结束: ${debateId}, 总消息数: ${debatemessages.length}`);
  }

  connectionInfo.debateId = null;

  sendToClient(ws, {
    type: 'debate:stopped:ack',
    message: '您已离开辩论',
    timestamp: new Date().toISOString()
  });
}

/**
 * 处理暂停辩论
 */
function handleDebatePause(ws, connectionInfo, data) {
  const debateId = connectionInfo.debateId;
  
  if (debateId && activeDebates.has(debateId)) {
    const debateSession = activeDebates.get(debateId);
    debateSession.status = 'paused';

    sendToClient(ws, {
      type: 'debate:paused',
      debateId: debateId,
      message: '辩论已暂停',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 处理继续辩论
 */
function handleDebateResume(ws, connectionInfo, data) {
  const debateId = connectionInfo.debateId;
  
  if (debateId && activeDebates.has(debateId)) {
    const debateSession = activeDebates.get(debateId);
    debateSession.status = 'active';

    sendToClient(ws, {
      type: 'debate:resumed',
      debateId: debateId,
      message: '辩论已继续',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 处理心跳检测
 */
function handlePing(ws, connectionInfo) {
  sendToClient(ws, {
    type: 'pong',
    timestamp: new Date().toISOString(),
    serverTime: Date.now()
  });
}

/**
 * 处理加入辩论
 */
function handleJoinDebate(ws, connectionInfo, data) {
  const { debateId } = data;
  
  if (activeDebates.has(debateId)) {
    const debateSession = activeDebates.get(debateId);
    
    if (!debateSession.participants.includes(connectionInfo.id)) {
      debateSession.participants.push(connectionInfo.id);
    }
    
    connectionInfo.debateId = debateId;

    sendToClient(ws, {
      type: 'join:debate:success',
      debateId: debateId,
      status: debateSession.status,
      participantCount: debateSession.participants.length,
      recentMessages: debateSession.messages.slice(-10),
      timestamp: new Date().toISOString()
    });

    // 通知其他参与者
    broadcastToDebate(debateId, {
      type: 'participant:joined',
      participantId: connectionInfo.id,
      totalCount: debateSession.participants.length,
      timestamp: new Date().toISOString()
    }, connectionInfo.id);
  } else {
    sendToClient(ws, {
      type: 'error',
      message: '辩论不存在',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 处理离开辩论
 */
function handleLeaveDebate(ws, connectionInfo, data) {
  const debateId = connectionInfo.debateId;
  
  if (debateId && activeDebates.has(debateId)) {
    const debateSession = activeDebates.get(debateId);
    
    debateSession.participants = debateSession.participants.filter(
      p => p !== connectionInfo.id
    );
    
    connectionInfo.debateId = null;

    sendToClient(ws, {
      type: 'leave:debate:success',
      message: '已离开辩论',
      timestamp: new Date().toISOString()
    });

    broadcastToDebate(debateId, {
      type: 'participant:left',
      participantId: connectionInfo.id,
      totalCount: debateSession.participants.length,
      timestamp: new Date().toISOString()
    }, connectionInfo.id);
  }
}

/**
 * 处理连接关闭
 */
function handleConnectionClose(connectionInfo) {
  connections.delete(connectionInfo.id);
  
  console.log(`[WebSocket] 连接关闭: ${connectionInfo.id}`);
  console.log(`[WebSocket] 当前在线连接数: ${connections.size}`);

  // 如果在辩论中，通知其他参与者
  if (connectionInfo.debateId && activeDebates.has(connectionInfo.debateId)) {
    broadcastToDebate(connectionInfo.debateId, {
      type: 'participant:disconnected',
      participantId: connectionInfo.id,
      timestamp: new Date().toISOString()
    }, connectionInfo.id);
  }
}

/**
 * 清理不活跃的连接（超过30分钟无活动）
 */
function cleanupInactiveConnections() {
  const now = Date.now();
  const TIMEOUT = 30 * 60 * 1000; // 30分钟

  for (const [id, conn] of connections.entries()) {
    if (now - conn.lastActivity > TIMEOUT) {
      console.log(`[WebSocket] 清理不活跃连接: ${id}`);
      conn.ws.terminate();
      connections.delete(id);
    }
  }
}

/**
 * 向指定客户端发送消息
 */
function sendToClient(ws, data) {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(data));
  }
}

/**
 * 向辩论中的所有参与者广播消息
 */
function broadcastToDebate(debateId, message, excludeConnectionId = null) {
  const debateSession = activeDebates.get(debateId);
  
  if (!debateSession) return;

  debateSession.participants.forEach(participantId => {
    if (participantId !== excludeConnectionId) {
      const conn = connections.get(participantId);
      if (conn && conn.ws.readyState === 1) {
        sendToClient(conn.ws, message);
      }
    }
  });
}

/**
 * 获取Soul角色的性格描述
 */
function getSoulPersonality(soulId) {
  const personalities = {
    'soul_001': '理性、数据驱动、追求创新的科技极客',
    'soul_002': '传统、稳重、经验丰富的保守派长者',
    'soul_003': '激情、理想主义、勇于挑战的热血青年',
    'soul_004': '务实、精明、注重效率的经济学人',
    'soul_005': '执着、有远见、关爱自然的环保斗士',
    'soul_006': '感性、细腻、追求美感的文艺青年',
    'soul_007': '严谨、公正、讲求证据的法律专家',
    'soul_008': '耐心、循循善诱、重视成长的教育工作者',
    'soul_009': '自律、积极、充满活力的健身达人',
    'soul_010': '热情、享受生活、品味独特的美食家'
  };
  
  return personalities[soulId] || '理性、客观的辩手';
}

/**
 * 获取Soul角色的对话风格
 */
function getSoulStyle(soulId) {
  const styles = {
    'soul_001': '喜欢用数据和案例说话，善于从技术角度分析问题',
    'soul_002': '喜欢引用历史和传统，强调稳定和循序渐进',
    'soul_003': '言辞犀利，敢于打破常规，追求公平正义',
    'soul_004': '从成本收益角度分析，关注经济效益和市场规律',
    'sool_005': '强调可持续发展，关注生态平衡和环境保护',
    'soul_006': '语言优美，善于从人文角度思考，重视情感体验',
    'soul_007': '依法依规分析，强调程序正义和权利保障',
    'soul_008': '从教育角度出发，关注人才培养和知识传承',
    'soul_009': '强调健康生活方式，关注身体素质和心理健康',
    'soul_010': '从生活品质角度思考，重视体验和感受'
  };
  
  return styles[soulId] || '专业、有逻辑';
}

/**
 * 生成唯一连接ID
 */
function generateConnectionId() {
  return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 生成唯一辩论ID
 */
function generateDebateId() {
  return 'debate_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 生成唯一消息ID
 */
function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  setupWebSocket,
  connections,
  activeDebates
};
