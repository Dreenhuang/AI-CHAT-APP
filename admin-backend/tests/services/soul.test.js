/**
 * Soul角色服务单元测试 (Soul Service Unit Tests)
 *
 * 测试范围：
 * - getSouls(): 获取角色列表（分页、筛选）
 * - createSoul(): 创建角色（有效/无效数据）
 * - updateSoul(): 更新角色
 * - updateSoulStatus(): 角色状态变更
 * - updateSoulAIConfig(): AI参数调整
 *
 * Mock策略：
 * - 使用 vi.hoisted + vi.mock Mock Prisma client
 * - 所有数据库操作返回模拟数据
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// 使用 vi.hoisted 创建 Mock 数据（避免 hoisting 问题）
// ============================================

const { mockPrisma, resetMockData } = vi.hoisted(() => {
  const mockSouls = [
    { id: 'soul_001', name: '苏格拉底', avatar: null, category: '哲学家', description: '古希腊哲学家', status: 'active', isPreset: true, createdBy: 'system', createdByName: '系统预设', aiConfig: { model: 'minimax', systemPrompt: '你是一位经验丰富的古希腊哲学家苏格拉底...', temperature: 0.7, maxTokens: 1500, personality: '智慧、谦逊、好奇' }, usageStats: { totalDebates: 342, avgRating: 4.6, favoriteCount: 189 }, createdAt: new Date('2026-04-01T08:00:00.000Z'), updatedAt: new Date('2026-05-12T15:30:00.000Z') },
    { id: 'soul_002', name: '史蒂夫·乔布斯', avatar: null, category: '企业家', description: '苹果公司联合创始人', status: 'active', isPreset: true, createdBy: 'system', createdByName: '系统预设', aiConfig: { model: 'deepseek', systemPrompt: '你是苹果公司联合创始人史蒂夫·乔布斯...', temperature: 0.8, maxTokens: 1200, personality: '激情、完美主义' }, usageStats: { totalDebates: 278, avgRating: 4.4, favoriteCount: 156 }, createdAt: new Date('2026-04-01T08:00:00.000Z'), updatedAt: new Date('2026-05-11T10:20:00.000Z') },
    { id: 'soul_003', name: '玛丽·居里', avatar: null, category: '科学家', description: '放射性研究的先驱', status: 'inactive', isPreset: true, createdBy: 'system', createdByName: '系统预设', aiConfig: { model: 'gpt', systemPrompt: '你是玛丽·居里...', temperature: 0.55, maxTokens: 1400, personality: '坚韧、严谨' }, usageStats: { totalDebates: 145, avgRating: 4.6, favoriteCount: 112 }, createdAt: new Date('2026-04-06T14:00:00.000Z'), updatedAt: new Date('2026-05-08T11:20:00.000Z') },
  ];

  let mockDataState = {
    souls: [...mockSouls],
    nextId: 4,
  };

  function resetMockData() {
    mockDataState = { souls: [...mockSouls], nextId: 4 };
  }

  const mockPrisma = {
    soul: {
      findMany: vi.fn(({ where, orderBy, skip, take, select } = {}) => {
        let results = [...mockDataState.souls];
        if (where) {
          if (where.status) results = results.filter((s) => s.status === where.status);
          if (where.isPreset !== undefined) results = results.filter((s) => s.isPreset === where.isPreset);
          if (where.id) results = results.filter((s) => s.id === where.id);
          if (where.OR) {
            results = results.filter((s) => where.OR.some((c) =>
              (c.name?.contains && s.name.includes(c.name.contains)) ||
              (c.description?.contains && s.description?.includes(c.description.contains))
            ));
          }
        }
        if (orderBy) {
          const [field, dir] = Object.entries(orderBy)[0];
          if (field === 'avgRating') {
            results.sort((a, b) => dir === 'desc' ? b.usageStats.avgRating - a.usageStats.avgRating : a.usageStats.avgRating - b.usageStats.avgRating);
          } else {
            results.sort((a, b) => dir === 'desc' ? (b[field] > a[field] ? 1 : -1) : (a[field] > b[field] ? 1 : -1));
          }
        }
        if (select && results.length > 0) {
          results = results.map((s) => Object.fromEntries(Object.keys(select).filter(k => k in s).map(k => [k, s[k]])));
        }
        if (skip !== undefined && take !== undefined) results = results.slice(skip, skip + take);
        return Promise.resolve(results);
      }),
      count: vi.fn(({ where } = {}) => {
        let results = [...mockDataState.souls];
        if (where?.status) results = results.filter((s) => s.status === where.status);
        if (where?.isPreset !== undefined) results = results.filter((s) => s.isPreset === where.isPreset);
        return Promise.resolve(results.length);
      }),
      findUnique: vi.fn(({ where: { id } }) => Promise.resolve(mockDataState.souls.find((s) => s.id === id) || null)),
      findFirst: vi.fn(({ where } = {}) => {
        let results = [...mockDataState.souls];
        if (where?.name?.equals) {
          const mode = where.name.mode || 'default';
          results = results.filter((s) => mode === 'insensitive' ? s.name.toLowerCase() === where.name.equals.toLowerCase() : s.name === where.name.equals);
        }
        return Promise.resolve(results[0] || null);
      }),
      create: vi.fn(({ data }) => {
        const newSoul = { id: `soul_${String(mockDataState.nextId).padStart(3, '0')}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockDataState.souls.unshift(newSoul);
        mockDataState.nextId++;
        return Promise.resolve(newSoul);
      }),
      update: vi.fn(({ where: { id }, data }) => {
        const index = mockDataState.souls.findIndex((s) => s.id === id);
        if (index === -1) { const e = new Error('Soul角色不存在'); e.name = 'NOT_FOUND'; throw e; }
        const updated = { ...mockDataState.souls[index], ...data, updatedAt: new Date() };
        mockDataState.souls[index] = updated;
        return Promise.resolve(updated);
      }),
    },
  };

  return { mockPrisma, resetMockData };
});

vi.mock('../../src/lib/prisma.js', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

// ============================================
// 导入被测试模块
// ============================================
import {
  getSouls,
  createSoul,
  updateSoul,
  updateSoulStatus,
  updateSoulAIConfig,
  SOUL_STATUS,
  AI_MODELS,
  SOUL_CATEGORIES,
} from '../../src/services/soulService.js';

// ============================================
// 测试辅助数据
// ============================================

const mockOperator = {
  username: '测试管理员',
  admin_id: 'test_admin_001',
  ip: '192.168.1.1',
  role: 'admin',
};

// ============================================
// 测试套件
// ============================================

describe('SoulService - Soul角色服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData();
  });

  // ==========================================
  // 获取角色列表
  // ==========================================

  describe('getSouls() - 获取角色列表', () => {
    it('应该返回分页的角色列表（默认参数）', async () => {
      const result = await getSouls({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('souls');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('pagination');

      expect(Array.isArray(result.souls)).toBe(true);
      expect(result.souls.length).toBeGreaterThan(0);

      expect(result.pagination).toMatchObject({
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
      });

      expect(result.summary).toHaveProperty('totalActive');
      expect(result.summary).toHaveProperty('totalInactive');
      expect(result.summary).toHaveProperty('avgRating');
      expect(result.summary).toHaveProperty('totalDebates');
    });

    it('应该按状态筛选角色', async () => {
      const activeResult = await getSouls({ status: 'active' });
      expect(activeResult.souls.length).toBeGreaterThan(0);
      activeResult.souls.forEach((soul) => {
        expect(soul.status).toBe(SOUL_STATUS.ACTIVE);
      });

      const inactiveResult = await getSouls({ status: 'inactive' });
      if (inactiveResult.souls.length > 0) {
        inactiveResult.souls.forEach((soul) => {
          expect(soul.status).toBe(SOUL_STATUS.INACTIVE);
        });
      }
    });

    it('应该按关键词搜索角色', async () => {
      const result = await getSouls({ search: '苏格拉底' });

      expect(result.souls.length).toBeGreaterThan(0);
      result.souls.forEach((soul) => {
        const matchesName = soul.name.includes('苏格拉底');
        const matchesDesc = soul.description?.includes('苏格拉底');
        expect(matchesName || matchesDesc).toBe(true);
      });
    });

    it('统计摘要中的avgRating应该计算正确', async () => {
      const result = await getSouls({ sortBy: 'avgRating', order: 'desc' });

      // avgRating 是用于统计摘要的，计算已激活角色的平均评分
      expect(result.summary.avgRating).toBeGreaterThan(0);
      // 2个active角色(4.6+4.4)/2 = 4.5
      expect(result.summary.avgRating).toBe(4.5);
      // 最受欢迎的角色应该是苏格拉底
      expect(result.summary.mostPopular.name).toBe('苏格拉底');
      expect(result.summary.mostPopular.favoriteCount).toBe(189);
    });
  });

  // ==========================================
  // 创建角色
  // ==========================================

  describe('createSoul() - 创建角色', () => {
    it('应该能成功创建角色（有效数据）', async () => {
      const soulData = {
        name: '测试角色名称',
        category: SOUL_CATEGORIES.PHILOSOPHER,
        description: '这是一个测试用的Soul角色',
        aiConfig: { model: AI_MODELS.MINIMAX, temperature: 0.7, maxTokens: 1500 },
      };

      const result = await createSoul(soulData, mockOperator);

      expect(result).toBeDefined();
      expect(result.name).toBe(soulData.name);
      expect(result.category).toBe(soulData.category);
      expect(result.status).toBe(SOUL_STATUS.ACTIVE);
      expect(result.isPreset).toBe(false);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('aiConfig');
    });

    it('应该返回错误当名称重复时', async () => {
      await expect(createSoul({ name: '苏格拉底', category: SOUL_CATEGORIES.PHILOSOPHER }, mockOperator)).rejects.toThrow('已存在相同名称的角色');
    });

    it('应该返回错误当名称为空时', async () => {
      await expect(createSoul({ name: '', category: SOUL_CATEGORIES.PHILOSOPHER }, mockOperator)).rejects.toThrow('角色名称不能为空');
    });

    it('应该返回错误当名称长度不足2个字符时', async () => {
      await expect(createSoul({ name: 'A', category: SOUL_CATEGORIES.PHILOSOPHER }, mockOperator)).rejects.toThrow('角色名称长度不能少于2个字符');
    });

    it('应该返回错误当分类无效时', async () => {
      await expect(createSoul({ name: '测试角色', category: '无效分类' }, mockOperator)).rejects.toThrow('无效的分类值');
    });

    it('应该使用默认AI配置当未提供时', async () => {
      const result = await createSoul({ name: '无AI配置测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);

      expect(result.aiConfig).toBeDefined();
      expect(result.aiConfig.model).toBe(AI_MODELS.MINIMAX);
      expect(result.aiConfig.temperature).toBe(0.7);
      expect(result.aiConfig.maxTokens).toBe(1500);
    });
  });

  // ==========================================
  // 更新角色
  // ==========================================

  describe('updateSoul() - 更新角色', () => {
    it('应该能成功更新角色信息', async () => {
      const newSoul = await createSoul({ name: '将被更新的测试角色', category: SOUL_CATEGORIES.ARTIST }, mockOperator);
      const updated = await updateSoul(newSoul.id, { name: '已更新的测试角色', description: '已更新的描述' }, mockOperator);

      expect(updated.name).toBe('已更新的测试角色');
      expect(updated.description).toBe('已更新的描述');
    });

    it('应该返回错误当更新不存在的角色时', async () => {
      await expect(updateSoul('non_existent_id', { name: '新名称' }, mockOperator)).rejects.toThrow('Soul角色不存在');
    });
  });

  // ==========================================
  // 角色状态变更
  // ==========================================

  describe('updateSoulStatus() - 角色状态变更', () => {
    it('应该能成功停用角色', async () => {
      const newSoul = await createSoul({ name: '将被停用的测试角色', category: SOUL_CATEGORIES.WRITER }, mockOperator);
      const result = await updateSoulStatus(newSoul.id, { status: SOUL_STATUS.INACTIVE, reason: '测试停用' }, mockOperator);

      expect(result.status).toBe(SOUL_STATUS.INACTIVE);
      expect(result._previousStatus).toBe(SOUL_STATUS.ACTIVE);
    });

    it('应该能成功激活角色', async () => {
      const newSoul = await createSoul({ name: '将被激活的测试角色', category: SOUL_CATEGORIES.TEACHER }, mockOperator);
      await updateSoulStatus(newSoul.id, { status: SOUL_STATUS.INACTIVE }, mockOperator);
      const result = await updateSoulStatus(newSoul.id, { status: SOUL_STATUS.ACTIVE, reason: '测试激活' }, mockOperator);

      expect(result.status).toBe(SOUL_STATUS.ACTIVE);
    });

    it('应该返回错误当状态无效时', async () => {
      const newSoul = await createSoul({ name: '无效状态测试角色', category: SOUL_CATEGORIES.CUSTOM }, mockOperator);
      await expect(updateSoulStatus(newSoul.id, { status: 'invalid_status' }, mockOperator)).rejects.toThrow('无效的状态值');
    });

    it('应该返回错误当状态没有实际变化时', async () => {
      const newSoul = await createSoul({ name: '无变化测试角色', category: SOUL_CATEGORIES.CUSTOM }, mockOperator);
      await expect(updateSoulStatus(newSoul.id, { status: SOUL_STATUS.ACTIVE }, mockOperator)).rejects.toThrow('无需重复操作');
    });
  });

  // ==========================================
  // AI参数调整
  // ==========================================

  describe('updateSoulAIConfig() - AI参数调整', () => {
    it('应该能成功调整AI温度参数', async () => {
      const newSoul = await createSoul({ name: 'AI参数测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);
      const result = await updateSoulAIConfig(newSoul.id, { temperature: 0.5 }, mockOperator);

      expect(result.aiConfig.temperature).toBe(0.5);
    });

    it('应该能成功调整多个AI参数', async () => {
      const newSoul = await createSoul({ name: '多参数测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);
      const result = await updateSoulAIConfig(newSoul.id, { temperature: 0.3, maxTokens: 2000, model: AI_MODELS.GPT }, mockOperator);

      expect(result.aiConfig.temperature).toBe(0.3);
      expect(result.aiConfig.maxTokens).toBe(2000);
      expect(result.aiConfig.model).toBe(AI_MODELS.GPT);
    });

    it('应该返回错误当温度参数超出范围', async () => {
      const newSoul = await createSoul({ name: '无效温度测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);
      await expect(updateSoulAIConfig(newSoul.id, { temperature: 2.5 }, mockOperator)).rejects.toThrow('温度参数必须在0-1之间');
    });

    it('应该返回错误当maxTokens超出范围', async () => {
      const newSoul = await createSoul({ name: '无效Token测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);
      await expect(updateSoulAIConfig(newSoul.id, { maxTokens: 5000 }, mockOperator)).rejects.toThrow('最大Token数必须在100-4000之间');
    });

    it('应该返回错误当模型值无效时', async () => {
      const newSoul = await createSoul({ name: '无效模型测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);
      await expect(updateSoulAIConfig(newSoul.id, { model: 'invalid_model' }, mockOperator)).rejects.toThrow('无效的AI模型');
    });

    it('应该返回错误当未提供任何更新参数时', async () => {
      const newSoul = await createSoul({ name: '无参数测试角色', category: SOUL_CATEGORIES.SCIENTIST }, mockOperator);
      await expect(updateSoulAIConfig(newSoul.id, {}, mockOperator)).rejects.toThrow('至少需要提供一个要更新的AI参数');
    });
  });
});
