/**
 * 认证服务层 (Auth Service)
 *
 * 功能说明：
 * 实现管理员认证的全流程管理，包括：
 * - AUTH001: 管理员登录（密码验证 + JWT签发）
 * - AUTH002: 获取当前管理员个人信息
 * - AUTH003: 修改当前管理员密码
 *
 * 技术架构：
 * - 使用 Prisma ORM 操作数据库
 * - 使用 bcryptjs 进行密码加密和比对
 * - 使用 jsonwebtoken 管理登录态
 * - 所有错误使用 Error 对象 + statusCode/code 属性
 */

import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * AUTH001: 管理员登录
 *
 * @param {string} username - 用户名
 * @param {string} password - 密码（明文）
 * @returns {Promise<{token: string, user: Object}>} 登录结果
 * @throws {Error} 用户不存在/密码错误/账户禁用
 */
export async function login(username, password) {
  const admin = await prisma.admin.findUnique({ where: { username } });

  if (!admin) {
    const err = new Error('用户不存在');
    err.statusCode = 401;
    err.code = 'AUTH_FAILED';
    throw err;
  }

  if (admin.status !== 'ACTIVE') {
    let message = '账户已被禁用';
    if (admin.status === 'LOCKED') {
      message = '账户已被锁定，请联系系统管理员解锁';
    }
    const err = new Error(message);
    err.statusCode = 403;
    err.code = 'ACCOUNT_DISABLED';
    throw err;
  }

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) {
    const err = new Error('密码错误');
    err.statusCode = 401;
    err.code = 'AUTH_FAILED';
    throw err;
  }

  // 更新最后登录时间
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });

  // 生成JWT
  const token = jwt.sign(
    {
      admin_id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      admin_id: admin.id,
      username: admin.username,
      role: admin.role,
      realName: admin.realName
    }
  };
}

/**
 * AUTH002: 获取当前管理员个人信息
 *
 * @param {string} adminId - 管理员ID（UUID格式）
 * @returns {Promise<Object>} 管理员资料（不含密码）
 * @throws {Error} 管理员不存在
 */
export async function getProfile(adminId) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });

  if (!admin) {
    const err = new Error('管理员不存在');
    err.statusCode = 404;
    throw err;
  }

  const { password, ...profile } = admin;
  return profile;
}

/**
 * AUTH003: 修改当前管理员密码
 *
 * @param {string} adminId - 管理员ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<{message: string}>} 修改结果
 * @throws {Error} 原密码错误/管理员不存在
 */
export async function changePassword(adminId, oldPassword, newPassword) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });

  if (!admin) {
    const err = new Error('管理员不存在');
    err.statusCode = 404;
    throw err;
  }

  const valid = bcrypt.compareSync(oldPassword, admin.password);
  if (!valid) {
    const err = new Error('原密码错误');
    err.statusCode = 400;
    err.code = 'WRONG_PASSWORD';
    throw err;
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  await prisma.admin.update({
    where: { id: adminId },
    data: { password: hashed }
  });

  return { message: '密码修改成功' };
}

export default { login, getProfile, changePassword };
