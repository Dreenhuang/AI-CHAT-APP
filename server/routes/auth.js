/**
 * 认证路由模块 v3.0 (Supabase版)
 *
 * 重构说明：
 * 1. 完全移除内存Map，改用Supabase PostgreSQL
 * 2. 采用"手机号+密码"登录方式
 * 3. 密码使用PBKDF2-SHA256加密存储
 *
 * 数据库表: users (已自动创建)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase } = require('../config/database');

/**
 * 密码加密工具 (PBKDF2-SHA256)
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
    return hash === verifyHash;
  } catch (error) {
    console.error('[Auth] 密码验证失败:', error);
    return false;
  }
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

function validatePasswordStrength(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: '密码长度不能少于6位' };
  }
  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个字母' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个数字' };
  }
  return { valid: true, message: '密码强度符合要求' };
}

/**
 * 用户注册 - 使用Supabase
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    // 参数验证
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // 检查是否已注册（通过Supabase查询）
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: '该手机号已注册，请直接登录' });
    }

    // 加密密码
    const hashedPassword = hashPassword(password);

    // 插入用户到Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        phone,
        password: hashedPassword,
        nickname: nickname || `用户${phone.slice(-4)}`,
        avatar: null,
        created_at: new Date().toISOString(),
        login_count: 0,
        last_login_at: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Auth] Supabase插入失败:', insertError);
      return res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
    }

    console.log(`[Auth] 新用户注册成功( Supabase): ${phone}`);

    // 生成Token
    const token = `token_${newUser.id}_${Date.now()}`;

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: newUser.id,
          phone: newUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
          nickname: newUser.nickname,
          avatar: newUser.avatar
        }
      }
    });

  } catch (error) {
    console.error('[Auth] 注册异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 用户登录 - 使用Supabase
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' });
    }

    // 从Supabase查询用户
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, message: '该手机号未注册，请先注册账号' });
    }

    // 验证密码
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: '密码错误，请重新输入' });
    }

    // 更新登录统计
    const { error: updateError } = await supabase
      .from('users')
      .update({
        login_count: (user.login_count || 0) + 1,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Auth] 登录统计更新失败:', updateError);
    }

    const token = `token_${user.id}_${Date.now()}`;

    console.log(`[Auth] 用户登录成功(Supabase): ${phone}`);

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          ...safeUser,
          phone: safeUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        },
        loginCount: (user.login_count || 0) + 1
      }
    });

  } catch (error) {
    console.error('[Auth] 登录异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 获取用户信息 - 使用Supabase
 * GET /api/auth/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未提供有效的认证令牌' });
    }

    const token = authHeader.split(' ')[1];
    const userId = token.replace('token_', '').split('_')[0];

    // 从Supabase查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在或Token已失效' });
    }

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        ...safeUser,
        phone: safeUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      }
    });

  } catch (error) {
    console.error('[Auth] 获取用户信息异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 更新用户信息 - 使用Supabase
 * PUT /api/auth/profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const token = authHeader.split(' ')[1];
    const userId = token.replace('token_', '').split('_')[0];

    // 更新Supabase
    const { data, error } = await supabase
      .from('users')
      .update({
        ...(nickname && { nickname }),
        ...(avatar && { avatar }),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Auth] 更新用户信息失败:', error);
      return res.status(500).json({ success: false, message: '更新失败' });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { updatedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[Auth] 更新用户信息异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 修改密码 - 使用Supabase
 * PUT /api/auth/password
 */
router.put('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const token = authHeader.split(' ')[1];
    const userId = token.replace('token_', '').split('_')[0];

    // 查询当前用户
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 验证旧密码
    if (!verifyPassword(oldPassword, user.password)) {
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }

    // 加密新密码并更新
    const newHashedPassword = hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newHashedPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('[Auth] 修改密码失败:', updateError);
      return res.status(500).json({ success: false, message: '修改密码失败' });
    }

    res.json({
      success: true,
      message: '密码修改成功',
      data: { updatedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[Auth] 修改密码异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
