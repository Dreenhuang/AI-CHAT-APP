const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = 'https://jaduaifzmgvaotyqnjfe.supabase.co';
const supabaseServiceKey = 'sb_secret_JVY4_cy3xpr9G4Bx9MFoEA_OyOLb3pR';
const supabaseAnonKey = 'sb_publishable_-oEDqL3QIqzluxLgonXHZg_hMTYXZJE';

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
