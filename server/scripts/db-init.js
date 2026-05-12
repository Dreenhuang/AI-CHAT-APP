const { Client } = require('pg');

const SUPABASE_URL = 'https://jaduaifzmgvaotyqnjfe.supabase.co';
const SUPABASE_KEY = 'your_supabase_service_key_here';

const config = {
  host: 'db.jaduaifzmgvaotyqnjfe.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: SUPABASE_KEY,
  ssl: { rejectUnauthorized: false },
  family: 4
};

const sqlStatements = [
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
  
  `CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
   CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);`,

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
  
  `CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
   CREATE INDEX IF NOT EXISTS idx_groups_public ON groups(is_public);`,

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

  `CREATE INDEX IF NOT EXISTS idx_souls_user ON souls(user_id);
   CREATE INDEX IF NOT EXISTS idx_souls_personality ON souls(personality);`,

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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_debates_user ON debates(user_id);
   CREATE INDEX IF NOT EXISTS idx_debates_group ON debates(group_id);
   CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);`
];

async function initDatabase() {
  console.log('==========================================');
  console.log('  AI Chat - Supabase 数据库初始化');
  console.log('==========================================\n');

  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ 连接Supabase PostgreSQL成功\n');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      try {
        await client.query(sql);
        console.log(`[${i + 1}/${sqlStatements.length}] ✅ 执行成功`);
      } catch (err) {
        console.log(`[${i + 1}/${sqlStatements.length}] ⚠️ ${err.message.substring(0, 80)}`);
      }
    }

    console.log('\n==========================================');
    console.log('  🎉 数据库初始化完成！');
    console.log('==========================================');
    
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 当前数据库表:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
  } finally {
    await client.end();
  }
}

initDatabase();