/**
 * 群组路由模块
 * 
 * 提供群组管理接口：
 * - POST /api/groups - 创建群组
 * - GET /api/groups - 获取群组列表
 * - GET /api/groups/:id - 获取群组详情
 * - PUT /api/groups/:id - 更新群组信息
 * - DELETE /api/groups/:id - 删除群组
 * - POST /api/groups/:id/join - 加入群组
 * - POST /api/groups/:id/leave - 离开群组
 */

const express = require('express');
const router = express.Router();

// 模拟群组数据存储
const groups = new Map();
let groupIdCounter = 1;

/**
 * 创建群组
 * POST /api/groups
 * 请求体: { name: "群组名称", description: "描述", topicId: "topic_001" }
 */
router.post('/', (req, res) => {
  try {
    const { name, description, topicId, maxMembers = 10 } = req.body;

    // 参数验证
    if (!name || !topicId) {
      return res.status(400).json({
        success: false,
        message: '群组名称和议题ID不能为空'
      });
    }

    // 创建群组对象
    const group = {
      id: `group_${groupIdCounter++}`,
      name,
      description: description || '',
      topicId,
      creatorId: `user_mock`, // 应从Token中获取
      members: [`user_mock`],
      maxMembers: parseInt(maxMembers),
      status: 'active', // active, full, closed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberCount: 1,
      debateCount: 0
    };

    groups.set(group.id, group);

    console.log(`[群组] 新群组创建成功: ${name} (${group.id})`);

    res.status(201).json({
      success: true,
      message: '群组创建成功',
      data: group
    });
  } catch (error) {
    console.error('创建群组失败:', error);
    res.status(500).json({
      success: false,
      message: '创建群组失败'
    });
  }
});

/**
 * 获取群组列表
 * GET /api/groups?page=1&limit=20&status=active
 */
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, status, topicId } = req.query;
    
    let groupList = Array.from(groups.values());

    // 按状态筛选
    if (status) {
      groupList = groupList.filter(g => g.status === status);
    }

    // 按议题ID筛选
    if (topicId) {
      groupList = groupList.filter(g => g.topicId === topicId);
    }

    // 按创建时间倒序排列
    groupList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页处理
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedGroups = groupList.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedGroups,
        total: groupList.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(groupList.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取群组列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取群组列表失败'
    });
  }
});

/**
 * 获取群组详情
 * GET /api/groups/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const group = groups.get(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('获取群组详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取群组详情失败'
    });
  }
});

/**
 * 更新群组信息
 * PUT /api/groups/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, maxMembers, status } = req.body;

    const group = groups.get(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 更新允许修改的字段
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (maxMembers) group.maxMembers = parseInt(maxMembers);
    if (status) group.status = status;
    group.updatedAt = new Date().toISOString();

    groups.set(id, group);

    console.log(`[群组] 群组信息更新: ${id}`);

    res.json({
      success: true,
      message: '群组信息更新成功',
      data: group
    });
  } catch (error) {
    console.error('更新群组信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新群组信息失败'
    });
  }
});

/**
 * 删除群组
 * DELETE /api/groups/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!groups.has(id)) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    groups.delete(id);

    console.log(`[群组] 群组已删除: ${id}`);

    res.json({
      success: true,
      message: '群组删除成功'
    });
  } catch (error) {
    console.error('删除群组失败:', error);
    res.status(500).json({
      success: false,
      message: '删除群组失败'
    });
  }
});

/**
 * 加入群组
 * POST /api/groups/:id/join
 */
router.post('/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || 'user_mock';

    const group = groups.get(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 检查是否已是成员
    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '您已经是该群组成员'
      });
    }

    // 检查群组是否已满
    if (group.members.length >= group.maxMembers) {
      group.status = 'full';
      return res.status(400).json({
        success: false,
        message: '群组人数已满'
      });
    }

    // 添加成员
    group.members.push(userId);
    group.memberCount = group.members.length;
    group.updatedAt = new Date().toISOString();

    if (group.members.length >= group.maxMembers) {
      group.status = 'full';
    }

    groups.set(id, group);

    console.log(`[群组] 用户 ${userId} 加入群组 ${id}`);

    res.json({
      success: true,
      message: '加入群组成功',
      data: {
        groupId: id,
        memberCount: group.memberCount
      }
    });
  } catch (error) {
    console.error('加入群组失败:', error);
    res.status(500).json({
      success: false,
      message: '加入群组失败'
    });
  }
});

/**
 * 离开群组
 * POST /api/groups/:id/leave
 */
router.post('/:id/leave', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || 'user_mock';

    const group = groups.get(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 检查是否是成员
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '您不是该群组成员'
      });
    }

    // 移除成员
    group.members = group.members.filter(m => m !== userId);
    group.memberCount = group.members.length;
    group.updatedAt = new Date().toISOString();

    if (group.memberCount === 0) {
      group.status = 'closed';
    } else if (group.status === 'full') {
      group.status = 'active';
    }

    groups.set(id, group);

    console.log(`[群组] 用户 ${userId} 离开群组 ${id}`);

    res.json({
      success: true,
      message: '离开群组成功',
      data: {
        groupId: id,
        memberCount: group.memberCount
      }
    });
  } catch (error) {
    console.error('离开群组失败:', error);
    res.status(500).json({
      success: false,
      message: '离开群组失败'
    });
  }
});

module.exports = router;
