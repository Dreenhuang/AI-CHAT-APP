/**
 * 认证路由模块
 * 
 * 提供用户认证相关接口：
 * - POST /api/auth/send-code - 发送验证码
 * - POST /api/auth/login - 用户登录
 * - POST /api/auth/register - 用户注册
 * - GET /api/auth/profile - 获取用户信息
 * - PUT /api/auth/profile - 更新用户信息
 */

const express = require('express');
const router = express.Router();

// 模拟用户存储（生产环境应使用数据库）
const users = new Map();
const verificationCodes = new Map();

/**
 * 发送验证码
 * POST /api/auth/send-code
 * 请求体: { phone: "13800138000" }
 */
router.post('/send-code', (req, res) => {
  try {
    const { phone } = req.body;

    // 参数验证
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号不能为空'
      });
    }

    // 手机号格式验证（简单验证）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 生成6位随机验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));
    
    // 存储验证码（实际应该用Redis，设置5分钟过期）
    verificationCodes.set(phone, {
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000 // 5分钟有效
    });

    console.log(`[认证] 验证码已发送至 ${phone}: ${code}（测试环境）`);

    res.json({
      success: true,
      message: '验证码已发送',
      data: {
        phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 脱敏显示
        expiresIn: 300 // 有效期5分钟
      }
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 * 请求体: { phone: "13800138000", code: "123456" }
 */
router.post('/login', (req, res) => {
  try {
    const { phone, code } = req.body;

    // 参数验证
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: '手机号和验证码不能为空'
      });
    }

    // 验证验证码
    const storedCode = verificationCodes.get(phone);
    if (!storedCode) {
      return res.status(400).json({
        success: false,
        message: '请先获取验证码'
      });
    }

    // 检查验证码是否过期
    if (Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: '验证码已过期，请重新获取'
      });
    }

    // 检查验证码是否正确
    if (storedCode.code !== code) {
      return res.status(400).json({
        success: false,
        message: '验证码错误'
      });
    }

    // 清除已使用的验证码
    verificationCodes.delete(phone);

    // 查找或创建用户
    let user = users.get(phone);
    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        avatar: null,
        createdAt: new Date().toISOString(),
        loginCount: 1
      };
      users.set(phone, user);
    } else {
      user.loginCount++;
      user.lastLoginAt = new Date().toISOString();
    }

    // 生成模拟Token（生产环境应使用JWT）
    const token = `mock_token_${user.id}_${Date.now()}`;

    console.log(`[认证] 用户登录成功: ${phone}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 用户注册
 * POST /api/auth/register
 * 请求体: { phone: "13800138000", code: "123456", nickname: "昵称" }
 */
router.post('/register', (req, res) => {
  try {
    const { phone, code, nickname } = req.body;

    // 参数验证
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: '手机号和验证码不能为空'
      });
    }

    // 检查是否已注册
    if (users.has(phone)) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    // 验证验证码（复用登录逻辑）
    const storedCode = verificationCodes.get(phone);
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expiresAt) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 清除验证码
    verificationCodes.delete(phone);

    // 创建新用户
    const user = {
      id: `user_${Date.now()}`,
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`,
      avatar: null,
      createdAt: new Date().toISOString(),
      loginCount: 1
    };
    
    users.set(phone, user);

    // 生成Token
    const token = `mock_token_${user.id}_${Date.now()}`;

    console.log(`[认证] 新用户注册成功: ${phone}`);

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
          nickname: user.nickname
        }
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/profile
 * Header: Authorization: Bearer <token>
 */
router.get('/profile', (req, res) => {
  try {
    // 从Header获取Token（简化版，生产环境应验证JWT）
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供有效的认证令牌'
      });
    }

    // 模拟Token解析
    const token = authHeader.split(' ')[1];
    const userId = token.replace('mock_token_', '').split('_')[0];

    // 查找用户（简化版）
    let foundUser = null;
    for (let [, user] of users) {
      if (user.id === userId) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: foundUser.id,
        phone: foundUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        nickname: foundUser.nickname,
        avatar: foundUser.avatar,
        createdAt: foundUser.createdAt,
        loginCount: foundUser.loginCount
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新用户信息
 * PUT /api/auth/profile
 * Header: Authorization: Bearer <token>
 * 请求体: { nickname: "新昵称", avatar: "头像URL" }
 */
router.put('/profile', (req, res) => {
  try {
    const { nickname, avatar } = req.body;

    // 简化版：直接返回成功（生产环境应更新数据库）
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { nickname, avatar }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
