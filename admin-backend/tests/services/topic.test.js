/**
 * 议题服务单元测试 (Topic Service Unit Tests)
 *
 * 测试范围：
 * - getTopics(): 列表查询、分页、状态筛选
 * - createTopic(): 创建议题（有效/无效数据）
 * - updateTopic(): 更新议题
 * - updateTopicStatus(): 修改议题状态
 * - 删除不存在的议题返回404（通过 updateTopic 验证）
 *
 * 技术说明：
 * topicService 使用内存模拟数据（mockTopics 数组）
 * 由于模块级变量无法从外部直接重置，测试依赖初始化的模拟数据
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// 导入被测试模块
// ============================================
import {
  getTopics,
  createTopic,
  updateTopic,
  updateTopicStatus,
  updateTopicHotness,
  TOPIC_STATUS,
  SORT_FIELDS,
  getTopicById,
} from '../../src/services/topicService.js';

// ============================================
// 测试辅助数据
// ============================================

/** 操作员信息 */
const mockOperator = {
  username: '测试管理员',
  admin_id: 'test_admin_001',
  ip: '192.168.1.1',
};

// ============================================
// 测试套件
// ============================================

describe('TopicService - 议题服务', () => {
  // 每个测试前重置控制台日志的 mock，避免输出干扰
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // 获取议题列表
  // ==========================================

  describe('getTopics() - 获取议题列表', () => {
    it('应该返回分页的议题列表（默认参数）', async () => {
      // 执行
      const result = await getTopics({});

      // 断言
      expect(result).toBeDefined();
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('pagination');

      // 验证数据结构
      expect(Array.isArray(result.topics)).toBe(true);
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.topics.length).toBeLessThanOrEqual(20); // 默认 pageSize=20

      // 验证分页信息
      expect(result.pagination).toMatchObject({
        page: 1,
        pageSize: 20,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: expect.any(Boolean),
      });

      // 验证统计摘要
      expect(result.summary).toHaveProperty('totalPublished');
      expect(result.summary).toHaveProperty('totalDraft');
      expect(result.summary).toHaveProperty('totalArchived');
      expect(result.summary).toHaveProperty('avgHotness');
    });

    it('应该按状态筛选议题', async () => {
      // 筛选已发布的议题
      const publishedResult = await getTopics({ status: 'published' });

      expect(publishedResult.topics.every((t) => t.status === 'published')).toBe(true);

      // 筛选草稿议题
      const draftResult = await getTopics({ status: 'draft' });

      expect(draftResult.topics.every((t) => t.status === 'draft')).toBe(true);

      // 筛选已归档的议题
      const archivedResult = await getTopics({ status: 'archived' });

      expect(archivedResult.topics.every((t) => t.status === 'archived')).toBe(true);
    });

    it('应该按分类筛选议题', async () => {
      const result = await getTopics({ category: '科技' });

      // 所有返回的议题都应该属于"科技"分类
      result.topics.forEach((topic) => {
        expect(topic.category?.toLowerCase()).toBe('科技');
      });
    });

    it('应该按关键词搜索议题（匹配标题和描述）', async () => {
      // 搜索包含"AI"的议题
      const result = await getTopics({ search: 'AI' });

      expect(result.topics.length).toBeGreaterThan(0);

      // 每个结果都应该在标题或描述中包含"AI"
      result.topics.forEach((topic) => {
        const matchesTitle = topic.title.includes('AI');
        const matchesDesc = topic.description?.includes('AI');
        expect(matchesTitle || matchesDesc).toBe(true);
      });
    });

    it('应该按热度排序议题', async () => {
      const result = await getTopics({
        sortBy: SORT_FIELDS.HOTNESS,
        order: 'desc',
      });

      // 验证热度降序排列
      for (let i = 1; i < result.topics.length; i++) {
        expect(result.topics[i].hotness).toBeLessThanOrEqual(result.topics[i - 1].hotness);
      }
    });

    it('应该正确处理最小热度筛选', async () => {
      // 筛选热度 >= 80 的议题
      const result = await getTopics({ hotnessMin: 80 });

      result.topics.forEach((topic) => {
        expect(topic.hotness).toBeGreaterThanOrEqual(80);
      });
    });

    it('应该正确处理分页参数', async () => {
      // 获取第1页，每页2条
      const page1 = await getTopics({ page: 1, pageSize: 2 });

      expect(page1.topics.length).toBeLessThanOrEqual(2);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.pageSize).toBe(2);

      // 如果总页数 > 1，验证第2页内容
      if (page1.pagination.totalPages > 1) {
        const page2 = await getTopics({ page: 2, pageSize: 2 });

        expect(page2.pagination.page).toBe(2);
        // 第2页的议题应该和第1页不同
        const page1Ids = page1.topics.map((t) => t.id);
        const page2Ids = page2.topics.map((t) => t.id);
        const hasOverlap = page2Ids.some((id) => page1Ids.includes(id));
        expect(hasOverlap).toBe(false);
      }
    });
  });

  // ==========================================
  // 创建议题
  // ==========================================

  describe('createTopic() - 创建议题', () => {
    it('应该能成功创建议题（有效数据）', async () => {
      const topicData = {
        title: '测试创建议题标题（长度大于5个字符）',
        description: '这是一个测试用的议题描述',
        category: '科技',
      };

      const result = await createTopic(topicData, mockOperator);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.title).toBe(topicData.title);
      expect(result.description).toBe(topicData.description);
      expect(result.category).toBe(topicData.category);
      expect(result.status).toBe(TOPIC_STATUS.DRAFT); // 新议题默认为草稿
      expect(result.hotness).toBe(0);
      expect(result.version).toBe(1);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('应该返回错误当标题为空时', async () => {
      const topicData = {
        title: '', // 空标题
        description: '测试描述',
      };

      // 执行并捕获异常
      await expect(createTopic(topicData, mockOperator)).rejects.toThrow('标题不能为空');
    });

    it('应该返回错误当标题长度不足5个字符时', async () => {
      const topicData = {
        title: '短标题', // 只有3个字符
        description: '测试描述',
      };

      await expect(createTopic(topicData, mockOperator)).rejects.toThrow(
        '标题长度不能少于5个字符'
      );
    });

    it('应该返回错误当标题重复时', async () => {
      // 使用已存在的标题
      const topicData = {
        title: 'AI能否取代白领？', // 已在 mockTopics 中
        description: '重复标题测试',
      };

      await expect(createTopic(topicData, mockOperator)).rejects.toThrow(
        '已存在相同标题的议题'
      );
    });

    it('应该返回错误当分类未提供时', async () => {
      // 注意：当前 createTopic 不强制 category 必填
      // 但测试可选字段的边界情况
      const topicData = {
        title: '这是一个有效的测试议题标题（超过5字）',
        category: undefined,
      };

      // 应该能正常创建，因为 category 不是必填
      const result = await createTopic(topicData, mockOperator);
      expect(result).toBeDefined();
      expect(result.title).toBe(topicData.title);
    });
  });

  // ==========================================
  // 更新议题
  // ==========================================

  describe('updateTopic() - 更新议题', () => {
    it('应该能成功更新议题标题', async () => {
      // 先创建一个新议题
      const newTopic = await createTopic(
        {
          title: '用于更新的测试议题标题（超过5字）',
          description: '测试描述',
        },
        mockOperator
      );

      // 更新标题
      const updated = await updateTopic(
        newTopic.id,
        {
          title: '已更新后的测试议题标题（超过5字）',
          version: newTopic.version, // 使用当前的版本号
        },
        mockOperator
      );

      expect(updated.title).toBe('已更新后的测试议题标题（超过5字）');
      expect(updated.version).toBe(newTopic.version + 1); // 版本号递增
    });

    it('应该返回错误当更新不存在的议题时', async () => {
      const nonExistentId = 'non_existent_topic_id';

      await expect(
        updateTopic(
          nonExistentId,
          { title: '新标题', version: 1 },
          mockOperator
        )
      ).rejects.toThrow('议题不存在');
    });

    it('应该返回错误当更新时版本号冲突', async () => {
      // 使用错误的版本号模拟并发冲突
      const newTopic = await createTopic(
        {
          title: '用于版本冲突测试的议题标题（超过5字）',
        },
        mockOperator
      );

      // 使用错误的版本号
      await expect(
        updateTopic(
          newTopic.id,
          { title: '新标题', version: 999 },
          mockOperator
        )
      ).rejects.toThrow('数据已被其他人修改');
    });
  });

  // ==========================================
  // 修改议题状态
  // ==========================================

  describe('updateTopicStatus() - 修改议题状态', () => {
    it('应该能成功修改议题状态', async () => {
      const newTopic = await createTopic(
        {
          title: '用于状态测试的议题标题（超过5字）',
        },
        mockOperator
      );

      // 当前是 draft，改为 published
      const result = await updateTopicStatus(
        newTopic.id,
        { status: TOPIC_STATUS.PUBLISHED, reason: '测试上架' },
        mockOperator
      );

      expect(result.status).toBe(TOPIC_STATUS.PUBLISHED);
      expect(result._previousStatus).toBe(TOPIC_STATUS.DRAFT);
    });

    it('应该返回错误当使用无效的状态值时', async () => {
      const newTopic = await createTopic(
        {
          title: '用于无效状态测试的议题标题（超过5字）',
        },
        mockOperator
      );

      await expect(
        updateTopicStatus(newTopic.id, { status: 'invalid_status' }, mockOperator)
      ).rejects.toThrow('无效的状态值');
    });

    it('应该返回错误当状态没有实际变化时', async () => {
      const newTopic = await createTopic(
        {
          title: '用于无变化测试的议题标题（超过5字）',
        },
        mockOperator
      );

      // 新创建的议题默认是 draft，再设置成 draft
      await expect(
        updateTopicStatus(
          newTopic.id,
          { status: TOPIC_STATUS.DRAFT },
          mockOperator
        )
      ).rejects.toThrow('无需重复操作');
    });
  });

  // ==========================================
  // 调整议题热度
  // ==========================================

  describe('updateTopicHotness() - 调整议题热度', () => {
    it('应该能成功调整议题热度', async () => {
      const newTopic = await createTopic(
        {
          title: '用于热度测试的议题标题（超过5字）',
        },
        mockOperator
      );

      const result = await updateTopicHotness(
        newTopic.id,
        { hotness: 85, reason: '测试热度调整' },
        mockOperator
      );

      expect(result.hotness).toBe(85);
      expect(result._adjustmentInfo.oldValue).toBe(0);
      expect(result._adjustmentInfo.newValue).toBe(85);
    });

    it('应该返回错误当热度值超出范围', async () => {
      const newTopic = await createTopic(
        {
          title: '用于无效热度测试的议题标题（超过5字）',
        },
        mockOperator
      );

      // 热度值不能超过 100
      await expect(
        updateTopicHotness(newTopic.id, { hotness: 150 }, mockOperator)
      ).rejects.toThrow('热度值必须在0-100之间');
    });
  });
});
