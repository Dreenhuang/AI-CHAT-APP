const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://jaduaifzmgvaotyqnjfe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_-oEDqL3QIqzluxLgonXHZg_hMTYXZJE';

if (!supabaseServiceKey) {
  console.error('[Supabase] 错误: 缺少 SUPABASE_SERVICE_KEY 环境变量');
  console.error('[Supabase] 请在 .env 文件中设置 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// 创建服务端客户端（使用service_role key，拥有完全权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

// 创建匿名客户端（用于前端直接调用，权限受限）- 同样需要设置ws transport
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

console.log('[Supabase] 数据库连接初始化完成');
console.log('[Supabase] 项目URL: ' + supabaseUrl);

module.exports = {
  supabase,
  supabaseAnon,
  supabaseUrl,
  supabaseAnonKey
};