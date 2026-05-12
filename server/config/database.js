/**
 * Supabase数据库配置模块
 * 
 * 功能说明：
 * 1. 初始化Supabase客户端连接
 * 2. 提供数据库操作接口
 * 3. 支持用户认证、数据存储、实时订阅
 * 
 * 使用方式：
 * const supabase = require('../config/database');
 * const { data, error } = await supabase.from('table_name').select('*');
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://jaduaifzmgvaotyqnjfe.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_-oEDqL3QIqzluxLgonXHZg_hMTYXZJE';

// 创建Supabase客户端实例
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表名常量（方便统一管理）
const TABLES = {
  USERS: 'users',           // 用户表
  TOPICS: 'topics',         // 议题表
  GROUPS: 'groups',         // 群组表
  SOULS: 'souls',           // Soul角色表
  DEBATES: 'debates',       // 辩论记录表
  MESSAGES: 'messages',      // 消息表
  COMMENTS: 'comments'      // 评论表
};

// 导出配置和工具函数
module.exports = {
  supabase,
  TABLES,
  
  /**
   * 检查数据库连接状态
   * @returns {Promise<boolean>} 连接是否成功
   */
  async checkConnection() {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('数据库连接失败:', error.message);
      return false;
    }
  },

  /**
   * 安全查询包装器（自动处理错误）
   * @param {Function} queryFn - 查询函数
   * @returns {Promise<{data: any, error: any}>} 查询结果
   */
  async safeQuery(queryFn) {
    try {
      const result = await queryFn();
      if (result.error) {
        console.error('数据库查询错误:', result.error);
        return { data: null, error: result.error };
      }
      return result;
    } catch (error) {
      console.error('查询执行异常:', error);
      return { data: null, error: { message: error.message } };
    }
  }
};
