import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const seedAdminData = [
  {
    id: randomUUID(),
    username: 'admin',
    password: bcrypt.hashSync('Admin@123456', 10),
    realName: '系统管理员',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    permissions: ['*'],
  },
  {
    id: randomUUID(),
    username: 'operator',
    password: bcrypt.hashSync('Admin@123456', 10),
    realName: '运营专员',
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: ['topic:*', 'user:view', 'soul:*'],
  },
  {
    id: randomUUID(),
    username: 'viewer',
    password: bcrypt.hashSync('Admin@123456', 10),
    realName: '观察员',
    role: 'OBSERVER',
    status: 'ACTIVE',
    permissions: ['topic:view', 'user:view', 'soul:view', 'config:view'],
  },
];

const seedSoulData = [
  {
    name: '苏格拉底',
    category: '哲学家',
    description: '古希腊哲学家，以提问法和辩证法闻名，擅长通过追问引导对方思考问题的本质。',
    status: 'active',
    isPreset: true,
    aiConfig: { model: 'minimax', temperature: 0.7, maxTokens: 1500, personality: '智慧、谦逊、好奇、善于追问' },
    usageStats: { totalDebates: 342, avgRating: 4.6, favoriteCount: 189 },
  },
  {
    name: '史蒂夫·乔布斯',
    category: '企业家',
    description: '苹果公司联合创始人，以极致的产品追求、现实扭曲场和创新视野著称。',
    status: 'active',
    isPreset: true,
    aiConfig: { model: 'deepseek', temperature: 0.8, maxTokens: 1200, personality: '激情、完美主义、有远见' },
    usageStats: { totalDebates: 278, avgRating: 4.4, favoriteCount: 156 },
  },
  {
    name: '爱因斯坦',
    category: '科学家',
    description: '理论物理学家，相对论创立者，以天才的想象力和深刻的科学洞察力闻名于世。',
    status: 'active',
    isPreset: true,
    aiConfig: { model: 'gpt', temperature: 0.6, maxTokens: 1800, personality: '好奇、深刻、富有想象力、幽默' },
    usageStats: { totalDebates: 256, avgRating: 4.7, favoriteCount: 203 },
  },
  {
    name: '鲁迅',
    category: '作家',
    description: '中国现代文学的奠基人，以犀利的杂文和深刻的社会批判著称。',
    status: 'active',
    isPreset: true,
    aiConfig: { model: 'claude', temperature: 0.9, maxTokens: 1500, personality: '犀利、批判、忧愤、深刻' },
    usageStats: { totalDebates: 289, avgRating: 4.5, favoriteCount: 198 },
  },
  {
    name: '孔子',
    category: '教育家',
    description: '中国古代思想家、教育家，儒家学派创始人。',
    status: 'active',
    isPreset: true,
    aiConfig: { model: 'minimax', temperature: 0.65, maxTokens: 1400, personality: '仁慈、睿智、守礼、因材施教' },
    usageStats: { totalDebates: 312, avgRating: 4.8, favoriteCount: 267 },
  },
];

const seedTopicData = [
  { title: 'AI能否取代白领？', description: '随着ChatGPT等大语言模型的爆发式发展，AI正在重塑职场格局。', category: '科技', status: 'published', hotness: 98, debateCount: 256, participantCount: 1280, viewCount: 15680 },
  { title: '远程办公是否应该成为常态？', description: '疫情改变了工作方式，但回归办公室的呼声也在增加。', category: '职场', status: 'published', hotness: 87, debateCount: 189, participantCount: 956, viewCount: 12340 },
  { title: '年轻人该不该提前还房贷？', description: '房贷压力与投资收益之间的权衡，是许多年轻人面临的现实选择。', category: '财经', status: 'published', hotness: 92, debateCount: 312, participantCount: 1580, viewCount: 18900 },
  { title: '短视频是否在毁掉年轻人的专注力？', description: '抖音、快手等短视频平台占据了大量时间，这是否导致了深度思考能力的退化？', category: '社会', status: 'published', hotness: 76, debateCount: 145, participantCount: 720, viewCount: 9800 },
  { title: '考研还是就业？毕业生的两难选择', description: '学历贬值与就业压力并存，考研是否仍是提升竞争力的最佳途径？', category: '教育', status: 'published', hotness: 85, debateCount: 203, participantCount: 1100, viewCount: 14200 },
  { title: '新能源汽车能否完全取代燃油车？', description: '技术进步与基础设施建设的博弈，新能源车的未来在哪里？', category: '汽车', status: 'draft', hotness: 65, debateCount: 78, participantCount: 390, viewCount: 5200 },
];

async function main() {
  console.log('🌱 开始播种数据...');

  // 清空旧数据（按顺序避免外键冲突）
  await prisma.auditLog.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.soul.deleteMany();
  await prisma.appUser.deleteMany();

  // 1. 播种管理员
  console.log('📝 创建管理员账号...');
  for (const admin of seedAdminData) {
    await prisma.admin.create({ data: admin });
  }
  console.log(`  ✅ 创建了 ${seedAdminData.length} 个管理员账号`);

  // 2. 播种Soul角色
  console.log('🎭 创建Soul角色...');
  for (const soul of seedSoulData) {
    await prisma.soul.create({ data: soul });
  }
  console.log(`  ✅ 创建了 ${seedSoulData.length} 个Soul角色`);

  // 3. 播种议题
  console.log('📋 创建议题...');
  for (const topic of seedTopicData) {
    await prisma.topic.create({ data: topic });
  }
  console.log(`  ✅ 创建了 ${seedTopicData.length} 个议题`);

  // 4. 播种系统配置
  console.log('⚙️ 创建系统配置...');
  const configKeys = [
    { configKey: 'system.site_name', configValue: 'PRD辩论平台', configType: 'SYSTEM', description: '站点名称', isSensitive: false },
    { configKey: 'system.maintenance', configValue: false, configType: 'SYSTEM', description: '维护模式', isSensitive: false },
    { configKey: 'security.password_min_length', configValue: 8, configType: 'SECURITY', description: '密码最小长度', isSensitive: false },
    { configKey: 'security.max_login_attempts', configValue: 5, configType: 'SECURITY', description: '最大登录失败次数', isSensitive: false },
    { configKey: 'feature.registration', configValue: true, configType: 'FEATURE_FLAG', description: '开放注册', isSensitive: false },
    { configKey: 'notif.email', configValue: false, configType: 'NOTIFICATION', description: '邮件通知', isSensitive: false },
  ];
  for (const config of configKeys) {
    await prisma.systemConfig.create({ data: config });
  }
  console.log(`  ✅ 创建了 ${configKeys.length} 个系统配置项`);

  console.log('\n🎉 数据播种完成！');
  console.log('📊 测试账号:');
  console.log('  - 超级管理员: admin / Admin@123456');
  console.log('  - 运营人员:   operator / Admin@123456');
  console.log('  - 观察员:     viewer / Admin@123456');
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
