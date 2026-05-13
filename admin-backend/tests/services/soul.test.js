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
 * 技术说明：
 * soulService 使用内存模拟数据（mockSouls 数组）
 * 包含 8 个预设角色（苏格拉底、乔布斯、爱因斯坦等）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// 导入被测试模块
// ============================================
import {
  getSouls,
  getSoulById,
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

/** 操作员信息 */
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
    vi.restoreAllMocks();
  });

  // ==========================================
  // 获取角色列表
  // ==========================================

  describe('getSouls() - 获取角色列表', () => {
    it('应该返回分页的角色列表（默认参数）', async () => {
      const result = await getSouls({});

      // 验证基本结构
      expect(result).toBeDefined();
      expect(result).toHaveProperty('souls');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('pagination');

      // 验证分页信息
