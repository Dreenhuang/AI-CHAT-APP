/**
 * PRD辩论APP后端服务主入口
 * 
 * 功能说明：
 * 1. Express HTTP服务器 - 提供RESTful API接口
 * 2. WebSocket服务器 - 实时辩论通信
 * 3. 对接MiniMax AI API - 智能辩论对话
 * 
 * 端口：9461（已锁定）
 * 作者：BOSS Engineer
 * 日期：2026-05-12
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// 导入路由模块
const authRoutes = require('./routes/auth');
const topicsRoutes = require('./routes/topics');
const groupsRoutes = require('./routes/groups');
const soulsRoutes = require('./routes/souls');
const debatesRoutes = require('./routes/debates');
const aiRoutes = require('./routes/ai');         // AI生成接口（新增）
const debateGenRoutes = require('./routes/debate-generation'); // 多角色辩论生成接口

// 导入服务模块
const { setupWebSocket } = require('./services/websocketService');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 9462;

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// API路由注册
app.use('/api/auth', authRoutes);       // 认证相关接口
app.use('/api/topics', topicsRoutes);   // 议题相关接口
app.use('/api/groups', groupsRoutes);   // 群组相关接口
app.use('/api/souls', soulsRoutes);     // Soul角色相关接口
app.use('/api/debates', debatesRoutes); // 辩论记录相关接口
app.use('/api/ai', aiRoutes);           // AI生成接口（新增）
app.use('/api/debate', debateGenRoutes); // 多角色辩论生成接口

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    port: PORT,
    service: 'PRD辩论APP后端服务',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API根路径
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用PRD辩论APP后端API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      topics: '/api/topics',
      groups: '/api/groups',
      souls: '/api/souls',
      debates: '/api/debates',
      websocket: 'ws://localhost:' + PORT + '/ws'
    }
  });
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器，挂载在 /ws 路径上
const wss = new WebSocket.Server({ server, path: '/ws' });

// 初始化WebSocket服务
setupWebSocket(wss);

// 启动服务器
server.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('  PRD辩论APP后端服务已成功启动！');
  console.log('==========================================');
  console.log(`  服务端口: ${PORT}`);
  console.log(`  API地址: http://localhost:${PORT}`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log('==========================================');
  console.log('');
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('HTTP服务器已关闭');
    wss.close(() => {
      console.log('WebSocket服务器已关闭');
      process.exit(0);
    });
  });
});

module.exports = { app, server, wss };
