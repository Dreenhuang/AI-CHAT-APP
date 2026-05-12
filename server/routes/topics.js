/**
 * 议题路由模块
 * 
 * 提供议题相关接口：
 * - GET /api/topics - 获取议题列表（支持分类筛选）
 * - GET /api/topics/random - 获取随机议题
 * - GET /api/topics/categories - 获取所有分类
 * - GET /api/topics/:id - 获取单个议题详情
 * - GET /api/topics/hot - 获取热门议题
 */

const express = require('express');
const router = express.Router();
const topicsData = require('../data/topics.json');

/**
 * 获取议题列表
 * GET /api/topics?category=科技&page=1&limit=20
 */
router.get('/', (req, res) => {
  try {
    const { category, page = 1, limit = 20, search } = req.query;
    
    let topics = [...topicsData];

    // 按分类筛选
    if (category && category !== 'all') {
      topics = topics.filter(t => t.category === category);
    }

    // 搜索功能（按标题和标签）
    if (search) {
      const keyword = search.toLowerCase();
      topics = topics.filter(t => 
        t.title.toLowerCase().includes(keyword) ||
        t.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }

    // 分页处理
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTopics = topics.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedTopics,
        total: topics.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(topics.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取议题列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取议题列表失败'
    });
  }
});

/**
 * 获取随机议题
 * GET /api/topics/random?count=20&category=科技
 */
router.get('/random', (req, res) => {
  try {
    const { count = 20, category } = req.query;
    let topics = [...topicsData];

    // 按分类筛选
    if (category && category !== 'all') {
      topics = topics.filter(t => t.category === category);
    }

    // 随机打乱数组（Fisher-Yates洗牌算法）
    for (let i = topics.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topics[i], topics[j]] = [topics[j], topics[i]];
    }

    // 返回指定数量的随机议题
    const randomTopics = topics.slice(0, Math.min(parseInt(count), topics.length));

    res.json({
      success: true,
      data: randomTopics,
      count: randomTopics.length
    });
  } catch (error) {
    console.error('获取随机议题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取随机议题失败'
    });
  }
});

/**
 * 获取所有分类
 * GET /api/topics/categories
 */
router.get('/categories', (req, res) => {
  try {
    // 从议题数据中提取所有唯一分类
    const categories = [...new Set(topicsData.map(t => t.category))];
    
    // 统计每个分类的议题数量
    const categoryStats = categories.map(category => ({
      name: category,
      count: topicsData.filter(t => t.category === category).length,
      icon: getCategoryIcon(category)
    }));

    res.json({
      success: true,
      data: categoryStats.sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

/**
 * 获取单个议题详情
 * GET /api/topics/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const topic = topicsData.find(t => t.id === id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '议题不存在'
      });
    }

    // 获取同分类的推荐议题
    const relatedTopics = topicsData
      .filter(t => t.category === topic.category && t.id !== id)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        ...topic,
        relatedTopics
      }
    });
  } catch (error) {
    console.error('获取议题详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取议题详情失败'
    });
  }
});

/**
 * 获取热门议题
 * GET /api/topics/hot?count=10
 */
router.get('/hot', (req, res) => {
  try {
    const { count = 10 } = req.query;
    
    // 筛选热门议题（hot字段为true）
    const hotTopics = topicsData
      .filter(t => t.hot)
      .slice(0, parseInt(count));

    res.json({
      success: true,
      data: hotTopics,
      count: hotTopics.length
    });
  } catch (error) {
    console.error('获取热门议题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门议题失败'
    });
  }
});

/**
 * 获取分类图标（辅助函数）
 * @param {string} category 分类名称
 * @returns {string} 图标名称
 */
function getCategoryIcon(category) {
  const iconMap = {
    '科技': '💻',
    '教育': '📚',
    '社会': '🏙️',
    '生活': '🏠',
    '娱乐': '🎬',
    '体育': '⚽',
    '政治': '🏛️',
    '经济': '💰',
    '文化': '🎭',
    '环境': '🌍'
  };
  return iconMap[category] || '📋';
}

module.exports = router;
