/**
 * 议题服务单元测试 (Topic Service Unit Tests)
 *
 * 测试范围：
 * - getTopics(): 列表查询、分页、状态筛选
 * - createTopic(): 创建议题（有效/无效数据）
 * - updateTopic(): 更新议题
 * - updateTopicStatus(): 修改议题状态
 * - 删除不存在的议题返回404
 *
 * Mock策略：
 * - 使用 vi.mock() Mock Prisma client
 * - 所有数据库操作返回模拟数据
 * - 按测试用例需要灵活控制返回值
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// 使用 vi.hoisted 创建 Mock 数据（避免 hoisting 问题）
// vi.mock 的工厂函数会被提升到文件顶部执行，
// 所以需要用 vi.hoisted 来确保变量先声明
// ============================================

const { mockTopics, mockPrisma, resetMockData } = vi.hoisted(() => {
  const mockTopics = [
    {
      id: 'topic_001',
      title: 'AI能否取代白领？',
      description: '探讨AI对大模型的影响',
      slug: 'ai-replace-white-collar',
      category: '科技',
      coverImage: null,
      status: 'published',
      hotness: 98,
      debateCount: 256,
      participantCount: 1280,
      viewCount: 15680,
      version: 5,
      createdBy: 'admin',
      createdByName: '内容运营',
      createdAt: new Date('2026-05-01T08:00:00.000Z'),
      updatedAt: new Date('2026-05-13T10:30:00.000Z'),
    },
    {
      id: 'topic_002',
      title: '远程办公是否应该成为常态？',
      description: '疫情改变了工作方式',
      slug: 'remote-work-normal',
      category: '职场',
      coverImage: null,
      status: 'published',
      hotness: 87,
      debateCount: 189,
      participantCount: 956,
      viewCount: 12340,
      version: 3,
      createdBy: 'admin',
      createdByName: '内容运营',
      createdAt: new Date('2026-05-03T10:00:00.000Z'),
      updatedAt: new Date('2026-05-12T15:20:00.000Z'),
    },
    {
      id: 'topic_003',
      title: '年轻人该不该提前还房贷？',
      description: '房贷压力与投资收益之间的权衡',
      slug: 'early-mortgage-payment',
      category: '财经',
      coverImage: null,
      status: 'draft',
      hotness: 0,
      debateCount: 0,
      participantCount: 0,
      viewCount: 0,
      version: 1,
      createdBy: 'admin',
      createdByName: '内容运营',
      createdAt: new Date('2026-05-10T09:00:00.000Z'),
      updatedAt: new Date('2026-05-10T09:00:00.000Z'),
    },
  ];

  // 可变的 mock 数据状态
  let mockDataState = {
    topics: [...mockTopics],
    nextId: 4,
  };

  function resetMockData() {
    mockDataState = {
      topics: [...mockTopics],
      nextId: 4,
    };
  }

  // 创建 mock prisma 对象
  const mockPrisma = {
    topic: {
      findMany: vi.fn(({ where, orderBy, skip, take }) => {
        let results = [...mockDataState.topics];

        if (where) {
          if (where.status) {
            results = results.filter((t) => t.status === where.status);
          }
          if (where.id) {
            results = results.filter((t) => t.id === where.id);
          }
          if (where.OR) {
            results = results.filter((t) => {
              return where.OR.some((condition) => {
                if (condition.title?.contains) {
                  return t.title.toLowerCase().includes(condition.title.contains.toLowerCase());
                }
                if (condition.description?.contains) {
                  return t.description?.toLowerCase().includes(condition.description.contains.toLowerCase());
                }
                return false;
              });
            });
          }
        }

        if (orderBy) {
          const [field, dir] = Object.entries(orderBy)[0];
          results.sort((a, b) => {
            if (dir === 'desc') return b[field] - a[field];
            return a[field] - b[field];
          });
        }

        if (skip !== undefined && take !== undefined) {
          results = results.slice(skip, skip + take);
        }

        return Promise.resolve(results);
      }),

      count: vi.fn(({ where } = {}) => {
        let results = [...mockDataState.topics];
        if (where?.status) {
          results = results.filter((t) => t.status === where.status);
        }
        if (where?.OR) {
          results = results.filter((t) => {
            return where.OR.some((condition) => {
              if (condition.title?.contains) {
                return t.title.toLowerCase().includes(condition.title.contains.toLowerCase());
              }
              if (condition.description?.contains) {
                return t.description?.toLowerCase().includes(condition.description.contains.toLowerCase());
              }
              return false;
            });
          });
        }
        return Promise.resolve(results.length);
      }),

      findUnique: vi.fn(({ where: { id } }) => {
        const topic = mockDataState.topics.find((t) => t.id === id);
        return Promise.resolve(topic || null);
      }),

      findFirst: vi.fn(({ where, orderBy, select } = {}) => {
        let results = [...mockDataState.topics];
        if (where) {
          if (where.title) {
            const titleFilter = where.title;
            if (titleFilter.equals) {
              const mode = titleFilter.mode || 'default';
              if (mode === 'insensitive') {
                results = results.filter((t) => t.title.toLowerCase() === titleFilter.equals.toLowerCase());
              } else {
                results = results.filter((t) => t.title === titleFilter.equals);
              }
            }
          }
          if (where.status) {
            results = results.filter((t) => t.status === where.status);
          }
          if (where.id) {
            results = results.filter((t) => t.id === where.id);
          }
        }

        if (orderBy) {
          const [field, dir] = Object.entries(orderBy)[0];
          results.sort((a, b) => {
            if (dir === 'desc') return b[field] - a[field];
            return a[field] - b[field];
          });
        }

        if (select && results.length > 0) {
          const result = results[0];
          const selected = {};
          for (const key of Object.keys(select)) {
            if (key in result) selected[key] = result[key];
          }
          return Promise.resolve(selected);
        }

        return Promise.resolve(results[0] || null);
      }),

      create: vi.fn(({ data }) => {
        const newTopic = {
          id: `topic_${String(mockDataState.nextId).padStart(3, '0')}`,
          ...data,
          hotness: data.hotness ?? 0,
          debateCount: data.debateCount ?? 0,
          participantCount: data.participantCount ?? 0,
          viewCount: data.viewCount ?? 0,
          version: data.version ?? 1,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
        };
        mockDataState.topics.unshift(newTopic);
        mockDataState.nextId++;
        return Promise.resolve(newTopic);
      }),

      update: vi.fn(({ where: { id }, data }) => {
        const index = mockDataState.topics.findIndex((t) => t.id === id);
        if (index === -1) {
          const error = new Error('议题不存在');
          error.name = 'NOT_FOUND';
          throw error;
        }
        // 处理 Prisma 的 { increment: N } 语法
        const resolvedData = {};
        for (const [key, val] of Object.entries(data)) {
          if (val !== null && typeof val === 'object' && 'increment' in val) {
            resolvedData[key] = mockDataState.topics[index][key] + val.increment;
          } else {
            resolvedData[key] = val;
          }
        }
        const updated = {
          ...mockDataState.topics[index],
          ...resolvedData,
          updatedAt: data.updatedAt || new Date(),
        };
        mockDataState.topics[index] = updated;
        return Promise.resolve(updated);
      }),

      aggregate: vi.fn(({ where, _avg }) => {
        let results = [...mockDataState.topics];
        if (where?.status) {
          results = results.filter((t) => t.status === where.status);
        }

        if (_avg?.hotness && results.length > 0) {
          const sum = results.reduce((s, t) => s + t.hotness, 0);
          return Promise.resolve({ _avg: { hotness: sum / results.length } });
        }
        return Promise.resolve({ _avg: { hotness: 0 } });
      }),
    },
  };

  return { mockTopics, mockPrisma, resetMockData };
});

// Mock Prisma client 模块
vi.mock('../../src/lib/prisma.js', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

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
} from '../../src/services/topicService.js';

// ============================================
// 测试辅助数据
// ============================================

const mockOperator = {
  username: '测试管理员',
  admin_id: 'test_admin_001',
  ip: '192.168.1.1',
};

// ============================================
// 测试套件
// ============================================

describe('TopicService - 议题服务', () => {
  beforeEach(() => {
    // 重置所有 mock 状态
    vi.clearAllMocks();
    resetMockData();
  });

  // ==========================================
  // 获取议题列表
  // ==========================================

  describe('getTopics() - 获取议题列表', () => {
    it('应该返回分页的议题列表（默认参数）', async () => {
      const result = await getTopics({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('pagination');

      expect(Array.isArray(result.topics)).toBe(true);
      expect(result.topics.length).toBeGreaterThan(0);

      expect(result.pagination).toMatchObject({
        page: 1,
        pageSize: 20,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: expect.any(Boolean),
      });

      expect(result.summary).toHaveProperty('totalPublished');
      expect(result.summary).toHaveProperty('totalDraft');
      expect(result.summary).toHaveProperty('totalArchived');
      expect(result.summary).toHaveProperty('avgHotness');
    });

    it('应该按状态筛选议题', async () => {
      const publishedResult = await getTopics({ status: 'published' });
      expect(publishedResult.topics.every((t) => t.status === 'published')).toBe(true);

      const draftResult = await getTopics({ status: 'draft' });
      expect(draftResult.topics.every((t) => t.status === 'draft')).toBe(true);
    });

    it('应该按关键词搜索议题', async () => {
      const result = await getTopics({ search: 'AI' });

      expect(result.topics.length).toBeGreaterThan(0);
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

      for (let i = 1; i < result.topics.length; i++) {
        expect(result.topics[i].hotness).toBeLessThanOrEqual(result.topics[i - 1].hotness);
      }
    });

    it('应该正确处理分页参数', async () => {
      const page1 = await getTopics({ page: 1, pageSize: 2 });

      expect(page1.topics.length).toBeLessThanOrEqual(2);
      expect(page1.pagination.page).toBe(1);

      if (page1.pagination.totalPages > 1) {
        const page2 = await getTopics({ page: 2, pageSize: 2 });
        expect(page2.pagination.page).toBe(2);

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

      expect(result).toBeDefined();
      expect(result.title).toBe(topicData.title);
      expect(result.description).toBe(topicData.description);
      expect(result.status).toBe(TOPIC_STATUS.DRAFT);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('应该返回错误当标题为空时', async () => {
      const topicData = { title: '', description: '测试描述' };

      await expect(createTopic(topicData, mockOperator)).rejects.toThrow('标题不能为空');
    });

    it('应该返回错误当标题长度不足5个字符时', async () => {
      const topicData = { title: '短标题', description: '测试描述' };

      await expect(createTopic(topicData, mockOperator)).rejects.toThrow(
        '标题长度不能少于5个字符'
      );
    });

    it('应该返回错误当标题重复时', async () => {
      // findFirst 会返回已存在的议题，触发重复检测
      const topicData = { title: 'AI能否取代白领？' };

      await expect(createTopic(topicData, mockOperator)).rejects.toThrow(
        '已存在相同标题的议题'
      );
    });
  });

  // ==========================================
  // 更新议题
  // ==========================================

  describe('updateTopic() - 更新议题', () => {
    it('应该能成功更新议题标题', async () => {
      const newTopic = await createTopic(
        { title: '用于更新的测试议题标题（超过5字）', description: '测试描述' },
        mockOperator
      );

      const updated = await updateTopic(
        newTopic.id,
        { title: '已更新后的测试议题标题（超过5字）', version: newTopic.version },
        mockOperator
      );

      expect(updated.title).toBe('已更新后的测试议题标题（超过5字）');
      expect(updated.version).toBe(newTopic.version + 1);
    });

    it('应该返回错误当更新不存在的议题时', async () => {
      const nonExistentId = 'non_existent_topic_id';

      await expect(
        updateTopic(nonExistentId, { title: '这是一个新标题（超过5字）', version: 1 }, mockOperator)
      ).rejects.toThrow('议题不存在');
    });

    // 注意：当前版本已移除乐观锁版本号冲突检查（version 使用 { increment: 1 } 自动递增）
    // 所以暂时没有版本冲突的测试用例
  });

  // ==========================================
  // 修改议题状态
  // ==========================================

  describe('updateTopicStatus() - 修改议题状态', () => {
    it('应该能成功修改议题状态', async () => {
      const newTopic = await createTopic(
        { title: '用于状态测试的议题标题（超过5字）' },
        mockOperator
      );

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
        { title: '用于无效状态测试的议题标题（超过5字）' },
        mockOperator
      );

      await expect(
        updateTopicStatus(newTopic.id, { status: 'invalid_status' }, mockOperator)
      ).rejects.toThrow('无效的状态值');
    });

    it('应该返回错误当状态没有实际变化时', async () => {
      const newTopic = await createTopic(
        { title: '用于无变化测试的议题标题（超过5字）' },
        mockOperator
      );

      await expect(
        updateTopicStatus(newTopic.id, { status: TOPIC_STATUS.DRAFT }, mockOperator)
      ).rejects.toThrow('无需重复操作');
    });
  });

  // ==========================================
  // 调整议题热度
  // ==========================================

  describe('updateTopicHotness() - 调整议题热度', () => {
    it('应该能成功调整议题热度', async () => {
      const newTopic = await createTopic(
        { title: '用于热度测试的议题标题（超过5字）' },
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
        { title: '用于无效热度测试的议题标题（超过5字）' },
        mockOperator
      );

      await expect(
        updateTopicHotness(newTopic.id, { hotness: 150 }, mockOperator)
      ).rejects.toThrow('热度值必须在0-100之间');
    });
  });
});
