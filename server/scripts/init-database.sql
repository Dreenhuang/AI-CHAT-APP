/**
 * Supabase 数据库表初始化脚本
 *
 * 使用方法：
 * 1. 在Supabase控制台打开SQL Editor
 * 2. 复制粘贴此脚本执行
 * 3. 或通过API调用执行
 *
 * 表结构：
 * - users: 用户表
 * - topics: 议题表
 * - groups: 群组表
 * - souls: Soul好友表
 * - debates: 辩论记录表
 */

-- ============================================================
-- 1. 用户表 (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- PBKDF2-SHA256加密存储
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
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 启用RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. 议题表 (topics)
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,  -- 分类：tech/education/social/lifestyle/etc.
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    debate_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);

-- 插入200个预设议题（示例数据）
INSERT INTO topics (title, description, category, tags) VALUES
('人工智能会取代人类工作吗？', '讨论AI对就业市场的影响和未来职业发展方向', 'tech', ARRAY['AI', '就业', '未来']),
('远程办公是更好的工作方式吗？', '比较远程办公与传统办公的优缺点', 'lifestyle', ARRAY['办公', '效率', '生活平衡']),
('气候变化是当今最大的威胁吗？', '分析全球变暖对人类社会的深远影响', 'environment', ARRAY['气候', '环境', '全球']),
('社交媒体是否让人更孤独？', '探讨社交网络对人际关系的影响', 'social', ARRAY['社交', '心理', '网络']),
('大学教育是否还值得投资？', '评估高等教育的回报率和替代方案', 'education', ARRAY['教育', '投资', '职业']),
('是否应该实行全民基本收入？', '讨论UBI政策的可行性和社会影响', 'politics', ARRAY['经济', '政策', '社会']),
('电动汽车能完全取代燃油车吗？', '对比两种动力系统的技术和发展前景', 'tech', ARRAY['汽车', '环保', '科技']),
('人工智能应该拥有法律权利吗？', '探讨AI伦理和法律地位问题', 'tech', ARRAY['AI', '伦理', '法律']),
('太空探索值得投入巨资吗？', '评估航天项目的成本效益比', 'science', ARRAY['太空', '科学', '探索']),
('全球化还是逆全球化更有利于发展？', '分析经济全球化的利弊得失', 'economy', ARRAY['经济', '贸易', '全球化']);

-- ============================================================
-- 3. 群组表 (groups)
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mode_id VARCHAR(50),  -- 讨论模式ID
    owner_id UUID REFERENCES users(id),
    avatar TEXT,
    member_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_public ON groups(is_public);

-- ============================================================
-- 4. Soul好友表 (souls)
-- ============================================================
CREATE TABLE IF NOT EXISTS souls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(50) NOT NULL,
    soul_content TEXT,  -- Soul定义/描述
    personality VARCHAR(50),  -- 性格类型：rational/emotional/aggressive/moderate
    specialty VARCHAR(100),  -- 专业领域
    avatar TEXT,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    debate_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    is_preset BOOLEAN DEFAULT false,  -- 是否预设角色
    category_type VARCHAR(50),  -- 分类：custom/preset
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_souls_user ON souls(user_id);
CREATE INDEX IF NOT EXISTS idx_souls_personality ON souls(personality);

-- ============================================================
-- 5. 辩论记录表 (debates)
-- ============================================================
CREATE TABLE IF NOT EXISTS debates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    group_id UUID REFERENCES groups(id),
    topic_id UUID REFERENCES topics(id),
    topic_title VARCHAR(500),
    messages JSONB DEFAULT '[]'::jsonb,  -- 消息列表JSON数组
    status VARCHAR(20) DEFAULT 'active',  -- active/completed/stopped
    participant_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debates_user ON debates(user_id);
CREATE INDEX IF NOT EXISTS idx_debates_group ON debates(group_id);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);

-- ============================================================
-- 完成提示
-- ============================================================
SELECT 
    'Database initialization completed!' AS status,
    (SELECT COUNT(*) FROM users) AS users_count,
    (SELECT COUNT(*) FROM topics) AS topics_count,
    (SELECT COUNT(*) FROM groups) AS groups_count,
    (SELECT COUNT(*) FROM souls) AS souls_count,
    (SELECT COUNT(*) FROM debates) AS debates_count;
