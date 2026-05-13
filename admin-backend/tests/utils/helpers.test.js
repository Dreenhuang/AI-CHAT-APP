/**
 * 工具函数单元测试 (Helper Functions Unit Tests)
 *
 * 测试范围：
 * - maskPhone(): 手机号脱敏（数据脱敏功能）
 * - maskEmail(): 邮箱脱敏（敏感值掩码）
 * - 日期格式化：通过 toISOString 测试日期边界
 *
 * 数据脱敏说明：
 * 数据脱敏是信息安全的重要实践，用于保护用户隐私。
 * 前端展示时，敏感信息（手机号、邮箱）需要部分隐藏，
 * 防止泄露完整信息。
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 导入被测试模块
// ============================================
import { maskPhone, maskEmail } from '../../src/types/user.js';

// ============================================
// 测试套件
// ============================================

describe('数据脱敏功能', () => {
  // ==========================================
  // 手机号脱敏
  // ==========================================

  describe('maskPhone() - 手机号脱敏', () => {
    it('应该将11位手机号中间4位替换为****', () => {
      // 标准11位手机号：前3位 + **** + 后4位
      expect(maskPhone('13812345678')).toBe('138****5678');
      expect(maskPhone('13987654321')).toBe('139****4321');
      expect(maskPhone('13666666666')).toBe('136****6666');
    });

    it('应该处理非标准长度的手机号（原样返回）', () => {
      // 非11位手机号不进行脱敏
      expect(maskPhone('1234567890')).toBe('1234567890'); // 10位
      expect(maskPhone('123456789012')).toBe('123456789012'); // 12位
      expect(maskPhone('12345')).toBe('12345'); // 5位
    });

    it('应该处理空值和边界情况', () => {
      // 空值处理
      expect(maskPhone(null)).toBe(null);
      expect(maskPhone(undefined)).toBe(undefined);
      expect(maskPhone('')).toBe('');
    });

    it('应该处理非字符串类型', () => {
      // 非字符串类型
      expect(maskPhone(13812345678)).toBe(13812345678);
    });
  });

  // ==========================================
  // 邮箱脱敏
  // ==========================================

  describe('maskEmail() - 邮箱脱敏', () => {
    it('应该将邮箱本地部分前2位后替换为***', () => {
      // 标准邮箱格式
      expect(maskEmail('admin@example.com')).toBe('ad***@example.com');
      expect(maskEmail('user@test.com')).toBe('us***@test.com');
      expect(maskEmail('xiaowang@example.com')).toBe('xi***@example.com');
    });

    it('应该处理短本地部分的邮箱', () => {
      // 本地部分 <= 2 个字符
      expect(maskEmail('ab@test.com')).toBe('ab@test.com');
      expect(maskEmail('a@test.com')).toBe('a@test.com');
    });

    it('应该处理无效的邮箱格式', () => {
      // 没有@符号
      expect(maskEmail('invalid-email')).toBe('invalid-email');
      expect(maskEmail('admin')).toBe('admin');
    });

    it('应该处理空值和边界情况', () => {
      // 空值处理
      expect(maskEmail(null)).toBe(null);
      expect(maskEmail(undefined)).toBe(undefined);
      expect(maskEmail('')).toBe('');
    });

    it('应该处理多级域名邮箱', () => {
      // 多级域名
      expect(maskEmail('user@sub.domain.com')).toBe('us***@sub.domain.com');
    });
  });

  // ==========================================
  // 日期格式化与边界测试
  // ==========================================

  describe('日期与时间处理', () => {
    it('应该正确创建和格式化日期', () => {
      const date = new Date('2026-05-13T08:00:00.000Z');

      // 验证日期各部分的正确性
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(4); // 月份从0开始：5月=4
      expect(date.getUTCDate()).toBe(13);
      expect(date.getUTCHours()).toBe(8);
    });

    it('应该正确处理ISO日期格式', () => {
      const dateStr = '2026-05-13T08:00:00.000Z';
      const date = new Date(dateStr);

      // ISO格式转换验证
      expect(date.toISOString()).toBe(dateStr);
    });

    it('应该正确处理时间戳', () => {
      // 测试 Date.now() 返回的时间戳格式
      const timestamp = Date.now();
      const date = new Date(timestamp);

      // 时间戳应该是数值类型
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);

      // 从时间戳创建的日期应该有效
      expect(date instanceof Date).toBe(true);
      expect(date.getTime()).toBe(timestamp);
    });

    it('日期比较应该正确工作', () => {
      const earlier = new Date('2026-01-01');
      const later = new Date('2026-06-01');

      // 验证日期比较逻辑（服务于排序功能）
      expect(later.getTime()).toBeGreaterThan(earlier.getTime());
      expect(later - earlier).toBeGreaterThan(0);

      // 验证日期减法（用于计算时间差）
      const diffInMs = later - earlier;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      expect(diffInDays).toBe(151); // 2026-01-01 到 2026-06-01 共151天
    });
  });

  // ==========================================
  // 综合测试：脱敏功能在业务场景中的使用
  // ==========================================

  describe('脱敏功能综合使用场景', () => {
    it('应该能同时处理手机号和邮箱的脱敏', () => {
      const userData = {
        phone: '13812345678',
        email: 'admin@example.com',
      };

      const maskedData = {
        phone: maskPhone(userData.phone),
        email: maskEmail(userData.email),
      };

      // 验证结果
      expect(maskedData.phone).toBe('138****5678');
      expect(maskedData.email).toBe('ad***@example.com');

      // 验证格式：脱敏后应该包含 ***
      expect(maskedData.phone).toContain('****');
      expect(maskedData.email).toContain('***');
    });

    it('应该正确处理边界值（部分字段为null）', () => {
      const userData = {
        phone: null,
        email: undefined,
      };

      // 即使原始数据为空，函数也不应该抛出异常
      expect(() => {
        const phone = maskPhone(userData.phone);
        const email = maskEmail(userData.email);
        return { phone, email };
      }).not.toThrow();

      expect(maskPhone(null)).toBeNull();
      expect(maskEmail(undefined)).toBeUndefined();
    });
  });
});
