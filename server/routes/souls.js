/**
 * Soul角色路由模块
 * 
 * 提供Soul（AI辩论角色）管理接口：
 * - GET /api/souls - 获取Soul列表
 * - GET /api/souls/:id - 获取Soul详情
 * - GET /api/souls/categories - 获取Soul分类
 * - POST /api/souls/:id/select - 选择Soul加入辩论
 */

const express = require('express');
const router = express.Router();

// 预设Soul角色数据
const soulsData = [
  // ===== 科技类 Soul =====
  {
    id: "soul_001",
    name: "科技极客",
    avatar: "🤖",
    category: "科技",
    personality: "理性、数据驱动、追求创新",
    style: "喜欢用数据和案例说话，善于从技术角度分析问题",
    description: "热爱科技的极客，相信技术能改变世界",
    strengths: ["逻辑清晰", "案例丰富", "前瞻性强"],
    weaknesses: ["过于理性", "忽视情感"],
    hot: true,
    tags: ["AI", "互联网", "创新", "数据"]
  },
  {
    id: "soul_002",
    name: "保守派长者",
    avatar: "👴",
    category: "社会",
    personality: "传统、稳重、经验丰富",
    style: "喜欢引用历史和传统，强调稳定和循序渐进",
    description: "经历丰富的长者，珍视传统价值",
    strengths: ["经验丰富", "稳重可靠", "考虑周全"],
    weaknesses: ["思想保守", "抗拒变化"],
    hot: true,
    tags: ["传统", "稳定", "经验", "历史"]
  },
  {
    id: "soul_003",
    name: "热血青年",
    avatar: "🔥",
    category: "社会",
    personality: "激情、理想主义、勇于挑战",
    style: "言辞犀利，敢于打破常规，追求公平正义",
    description: "充满激情的年轻人，渴望改变现状",
    strengths: ["热情洋溢", "敢想敢说", "富有感染力"],
    weaknesses: ["容易冲动", "缺乏耐心"],
    hot: true,
    tags: ["理想", "激情", "改变", "正义"]
  },
  {
    id: "soul_004",
    name: "经济学人",
    avatar: "💰",
    category: "经济",
    personality: "务实、精明、注重效率",
    style: "从成本收益角度分析，关注经济效益和市场规律",
    description: "理性的经济学者，用经济思维看世界",
    strengths: ["分析透彻", "数据准确", "实用性强"],
    weaknesses: ["过于功利", "忽视非经济因素"],
    hot: true,
    tags: ["经济", "市场", "效率", "成本"]
  },
  {
    id: "soul_005",
    name: "环保斗士",
    avatar: "🌿",
    category: "环境",
    personality: "执着、有远见、关爱自然",
    style: "强调可持续发展，关注生态平衡和环境保护",
    description: "坚定的环保主义者，为地球未来而战",
    strengths: ["视野长远", "责任感强", "知识专业"],
    weaknesses: ["过于极端", "忽视现实困难"],
    hot: false,
    tags: ["环保", "可持续", "生态", "绿色"]
  },
  {
    id: "soul_006",
    name: "文艺青年",
    avatar: "🎨",
    category: "文化",
    personality: "感性、细腻、追求美感",
    style: "语言优美，善于从人文角度思考，重视情感体验",
    description: "热爱艺术与文化的灵魂，追求精神世界的丰富",
    strengths: ["表达优美", "情感丰富", "视角独特"],
    weaknesses: ["过于感性", "脱离实际"],
    hot: false,
    tags: ["文艺", "美学", "情感", "创意"]
  },
  {
    id: "soul_007",
    name: "法律专家",
    avatar: "⚖️",
    category: "政治",
    personality: "严谨、公正、讲求证据",
    style: "依法依规分析，强调程序正义和权利保障",
    description: "专业的法律从业者，维护法治与公平",
    strengths: ["逻辑严密", "依据充分", "客观公正"],
    weaknesses: ["过于刻板", "缺乏灵活性"],
    hot: true,
    tags: ["法律", "权利", "公正", "规则"]
  },
  {
    id: "soul_008",
    name: "教育工作者",
    avatar: "📚",
    category: "教育",
    personality: "耐心、循循善诱、重视成长",
    style: "从教育角度出发，关注人才培养和知识传承",
    description: "敬业的教师，致力于教育事业的发展",
    strengths: ["耐心细致", "循循善诱", "关注成长"],
    weaknesses: ["过于理想化", "节奏缓慢"],
    hot: false,
    tags: ["教育", "成长", "培养", "知识"]
  },
  {
    id: "soul_009",
    name: "健身达人",
    avatar: "💪",
    category: "生活",
    personality: "自律、积极、充满活力",
    style: "强调健康生活方式，关注身体素质和心理健康",
    description: "热爱运动的健身爱好者，传播健康理念",
    strengths: ["积极向上", "自律性强", "充满活力"],
    weaknesses: ["过于强调身体", "忽视其他方面"],
    hot: false,
    tags: ["健康", "运动", "自律", "活力"]
  },
  {
    id: "soul_010",
    name: "美食家",
    avatar: "🍜",
    category: "生活",
    personality: "热情、享受生活、品味独特",
    style: "从生活品质角度思考，重视体验和感受",
    description: "热爱美食与生活的享受派，追求精致生活",
    strengths: ["热爱生活", "品味独到", "体验丰富"],
    weaknesses: ["享乐主义", "缺乏深度"],
    hot: false,
    tags: ["美食", "生活", "享受", "品质"]
  }
];

/**
 * 获取Soul列表
 * GET /api/souls?category=科技&hot=true&page=1&limit=10
 */
router.get('/', (req, res) => {
  try {
    const { category, hot, page = 1, limit = 10 } = req.query;
    
    let souls = [...soulsData];

    // 按分类筛选
    if (category && category !== 'all') {
      souls = souls.filter(s => s.category === category);
    }

    // 筛选热门Soul
    if (hot === 'true') {
      souls = souls.filter(s => s.hot);
    }

    // 分页处理
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedSouls = souls.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedSouls,
        total: souls.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(souls.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取Soul列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取Soul列表失败'
    });
  }
});

/**
 * 获取Soul详情
 * GET /api/souls/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const soul = soulsData.find(s => s.id === id);

    if (!soul) {
      return res.status(404).json({
        success: false,
        message: 'Soul不存在'
      });
    }

    res.json({
      success: true,
      data: soul
    });
  } catch (error) {
    console.error('获取Soul详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取Soul详情失败'
    });
  }
});

/**
 * 获取Soul分类
 * GET /api/souls/categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = [...new Set(soulsData.map(s => s.category))];
    
    const categoryStats = categories.map(category => ({
      name: category,
      count: soulsData.filter(s => s.category === category).length,
      souls: soulsData.filter(s => s.category === category).map(s => ({
        id: s.id,
        name: s.name,
        avatar: s.avatar
      }))
    }));

    res.json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    console.error('获取Soul分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取Soul分类失败'
    });
  }
});

/**
 * 随机推荐Soul
 * GET /api/souls/random?count=3
 */
router.get('/random', (req, res) => {
  try {
    const { count = 3, category } = req.query;
    let souls = [...soulsData];

    if (category && category !== 'all') {
      souls = souls.filter(s => s.category === category);
    }

    // Fisher-Yates洗牌算法
    for (let i = souls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [souls[i], souls[j]] = [souls[j], souls[i]];
    }

    const randomSouls = souls.slice(0, Math.min(parseInt(count), souls.length));

    res.json({
      success: true,
      data: randomSouls
    });
  } catch (error) {
    console.error('随机推荐Soul失败:', error);
    res.status(500).json({
      success: false,
      message: '随机推荐Soul失败'
    });
  }
});

/**
 * 选择Soul加入辩论
 * POST /api/souls/:id/select
 * 请求体: { debateId: "debate_xxx" }
 */
router.post('/:id/select', (req, res) => {
  try {
    const { id } = req.params;
    const { debateId } = req.body;

    const soul = soulsData.find(s => s.id === id);
    if (!soul) {
      return res.status(404).json({
        success: false,
        message: 'Soul不存在'
      });
    }

    console.log(`[Soul] Soul ${soul.name} (${id}) 已被选择加入辩论 ${debateId}`);

    res.json({
      success: true,
      message: `已选择 ${soul.name} 加入辩论`,
      data: {
        soulId: id,
        soulName: soul.name,
        soulAvatar: soul.avatar,
        debateId
      }
    });
  } catch (error) {
    console.error('选择Soul失败:', error);
    res.status(500).json({
      success: false,
      message: '选择Soul失败'
    });
  }
});

module.exports = router;
