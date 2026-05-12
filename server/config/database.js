/**
 * Supabase 数据库配置模块
 *
 * 连接信息：
 * - URL: https://jaduaifzmgvaotyqnjfe.supabase.co
 * - 项目: AI Chat (aichat-app)
 *
 * 数据库表：
 * - users: 用户表
 * - topics: 议题表
 * - groups: 群组表
 * - souls: Soul好友表
 * - debates: 辩论记录表
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase连接配置
const supabaseUrl = 'https://jaduaifzmgvaotyqnjfe.supabase.co';
const supabaseServiceKey = 'your_supabase_service_key_here';
const supabaseAnonKey = 'your_supabase_anon_key_here';

// 创建服务端客户端（使用service_role key，拥有完全权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    params: {
      ws: require('ws')  // 为Node.js < 22提供WebSocket支持
    }
  }
});

// 创建匿名客户端（用于前端直接调用，权限受限）
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] 数据库连接初始化完成');
console.log(`[Supabase] 项目URL: ${supabaseUrl}`);

module.exports = {
  supabase,
  supabaseAnon,
  supabaseUrl,
  supabaseAnonKey
};
