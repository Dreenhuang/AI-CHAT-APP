/**
 * Supabase 数据库初始化脚本
 * 使用方式: node init-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://jaduaifzmgvaotyqnjfe.supabase.co';
const SUPABASE_SERVICE_KEY = 'your_supabase_service_key_here';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQL初始化语句
const sqlStatements = [
  // 用户表
  `CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname VARCHAR(50) DEFAULT '新用户',
    avatar TEXT,
    bio TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    total_debates INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 议题表
  `CREATE TABLE IF NOT EXISTS topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    debate_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 群组表
  `CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mode_id VARCHAR(50),
    owner_id UUID REFERENCES users(id),
    avatar TEXT,
    member_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Soul好友表
  `CREATE TABLE IF NOT EXISTS souls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(50) NOT NULL,
    soul_content TEXT,
    personality VARCHAR(50),
    specialty VARCHAR(100),
    avatar TEXT,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    debate_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    is_preset BOOLEAN DEFAULT false,
    category_type VARCHAR(50),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 辩论记录表
  `CREATE TABLE IF NOT EXISTS debates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    group_id UUID REFERENCES groups(id),
    topic_id UUID REFERENCES topics(id),
    topic_title VARCHAR(500),
    messages JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    participant_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`
];

async function initDatabase() {
  console.log('==========================================');
  console.log('  AI Chat - Supabase 数据库初始化');
  console.log('==========================================\n');

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const tableName = sql.match(/IF NOT EXISTS (\w+)/)[1];
    
    try {
      console.log(`[${i + 1}/${sqlStatements.length}] 创建表: ${tableName}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // 尝试直接使用REST API创建表（通过插入测试数据）
        console.log(`  ⚠️ RPC不可用，尝试REST API验证...`);
        
        // 验证表是否存在（通过查询）
        const { data, error: queryError } = await supabase.from(tableName).select('id').limit(1);
        if (queryError && queryError.code === '42P01') {
          console.log(`  ❌ 表 ${tableName} 不存在且无法自动创建`);
          console.log(`     请在Supabase控制台手动执行SQL`);
        } else {
          console.log(`  ✅ 表 ${tableName} 已存在或创建成功`);
        }
      } else {
        console.log(`  ✅ 表 ${tableName} 创建成功`);
      }
    } catch (err) {
      console.log(`  ⚠️ 表 ${tableName} 处理异常: ${err.message}`);
    }
  }

  console.log('\n==========================================');
  console.log('  初始化完成！');
  console.log('==========================================');
  console.log('\n📌 后续步骤:');
  console.log('1. 访问 https://jaduaifzmgvaotyqnjfe.supabase.co');
  console.log('2. 打开 SQL Editor');
  console.log('3. 执行 server/scripts/init-database.sql');
}

initDatabase().catch(console.error);