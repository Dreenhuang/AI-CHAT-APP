/**
 * 真实历史人物角色管理器 v1.0
 *
 * 核心功能：
 * 1. 统一的角色数据访问接口
 * 2. 分类检索与筛选
 * 3. 角色格式转换（适配前端展示需求）
 * 4. 角色统计与分析
 * 5. 推荐系统（根据场景推荐合适角色）
 *
 * 使用方式：
 * const RoleManager = require('./roleManager');
 * const allRoles = RoleManager.getAllRoles();
 * const philosophers = RoleManager.getRolesByCategory('philosophers');
 */

const { realPersonPresets } = require('../../src/data/realPersonPresets');

class RealPersonRoleManager {
  constructor() {
    this.presets = realPersonPresets;
    this.cache = new Map();
    this._buildIndex();
  }

  /**
   * 构建索引以加速查询
   */
  _buildIndex() {
    this.byId = new Map();
    this.byCategory = new Map();
    this.byRoleType = new Map();
    this.allRoles = [];

    for (const [category, roles] of Object.entries(this.presets)) {
      if (Array.isArray(roles)) {
        roles.forEach(role => {
          this.byId.set(role.id, role);
          this.allRoles.push(role);
          
          if (!this.byCategory.has(category)) {
            this.byCategory.set(category, []);
          }
          this.byCategory.get(category).push(role);

          if (role.roleType) {
            if (!this.byRoleType.has(role.roleType)) {
              this.byRoleType.set(role.roleType, []);
            }
          this.byRoleType.get(role.roleType).push(role);
          }
        });
      }
    }
  }

  /**
   * 获取所有角色
   */
  getAllRoles() {
    return this.allRoles;
  }

  /**
   * 根据ID获取单个角色
   */
  getRoleById(id) {
    return this.byId.get(id) || null;
  }

  /**
   * 根据分类获取角色
   */
  getRolesByCategory(category) {
    return this.byCategory.get(category) || [];
  }

  /**
   * 根据角色类型获取角色
   */
  getRolesByType(roleType) {
    return this.byRoleType.get(roleType) || [];
  }

  /**
   * 获取所有分类列表
   */
  getCategories() {
    return Array.from(this.byCategory.keys());
  }

  /**
   * 获取所有角色类型
   */
  getRoleTypes() {
    return Array.from(this.byRoleType.keys());
  }

  /**
   * 转换为前端展示格式
   */
  toDisplayFormat(role, options = {}) {
    const {
      includeSoul = false,
      includeFullIdentity = true,
      language = 'zh'
    } = options;

    const display = {
      id: role.id,
      name: role.name,
      englishName: role.englishName || '',
      avatar: role.avatar || '',
      category: role.category || '',
      era: role.era || '',
      description: role.description || '',
      roleType: role.roleType || 'unknown',
      
      // 基础信息（用于卡片展示）
      shortInfo: `${role.name} - ${role.description?.substring(0, 50) || ''}`,
      
      // 标签信息
      tags: [
        role.category,
        role.era?.split(' ')[0] || '',
        role.roleType || ''
      ].filter(Boolean),
    };

    if (includeFullIdentity && role.identity) {
      display.identity = role.identity;
      display.famousQuotes = role.famousQuotes || [];
      display.works = role.works || role.achievements || [];
    }

    if (includeSoul) {
      display.soul = role.soul;
      display.character = role.character;
    }

    return display;
  }

  /**
   * 批量转换为前端展示格式
   */
  batchToDisplayFormat(roles, options = {}) {
    return roles.map(role => this.toDisplayFormat(role, options));
  }

  /**
   * 搜索角色（支持模糊匹配）
   */
  search(query, options = {}) {
    const {
      fields = ['name', 'englishName', 'description', 'category'],
      limit = 20
    } = options;

    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const role of this.allRoles) {
      let score = 0;
      
      for (const field of fields) {
        const value = role[field];
        if (value && typeof value === 'string') {
          if (value.toLowerCase().includes(lowerQuery)) {
            score += field === 'name' ? 10 : (field === 'description' ? 5 : 2);
          }
        }
        
        if (role.identity && role.identity[field]) {
          const identityValue = role.identity[field];
          if (typeof identityValue === 'string' && 
              identityValue.toLowerCase().includes(lowerQuery)) {
            score += 3;
          }
        }
      }

      if (score > 0) {
        results.push({ role, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map(r => r.role);
  }

  /**
   * 根据讨论场景推荐角色
   */
  recommendForScenario(scenario, count = 5) {
    const scenarioLower = scenario.toLowerCase();
    const scored = [];

    const recommendations = {
      '哲学思辨': ['aristotle', 'kant', 'confucius', 'nietzsche', 'wang-yangming', 'schopenhauer', 'marx'],
      '科技创新': ['elon-musk', 'steve-jobs', 'einstein', 'turing', 'jensen-huang', 'da-vinci'],
      '商业经济': ['jeff-bezos', 'jack-ma', 'ren-zhengfei', 'warren-buffett', 'keynes', 'tim-cook', 'satya-nadella'],
      '政治领导': ['napoleon', 'churchill', 'lincoln', 'gandhi', 'qin-shihuang'],
      '文学艺术': ['shakespeare', 'lu-xun', 'mark-twain', 'murakami', 'da-vinci'],
      '科学探索': ['darwin', 'curie', 'hawking', 'tu-youyou', 'turing', 'einstein'],
    };

    for (const [scenarioKey, preferredIds] of Object.entries(recommendations)) {
      if (scenarioLower.includes(scenarioKey) || 
          scenarioLower.split('').some(char => scenarioKey.includes(char))) {
        preferredIds.forEach(id => {
          const role = this.getRoleById(id);
          if (role) scored.push({ role, priorityBonus: 3 });
        });
      }
    }

    for (const role of this.allRoles) {
      if (!scored.find(s => s.role.id === role.id)) {
        scored.push({ role, priorityBonus: 0 });
      }
    }

    scored.sort((a, b) => b.priorityBonus - a.priorityBonus);
    return scored.slice(0, count).map(s => s.role);
  }

  /**
   * 获取角色统计信息
   */
  getStatistics() {
    const stats = {
      totalRoles: this.allRoles.length,
      categories: {},
      roleTypes: {},
      eras: {},
    };

    for (const role of this.allRoles) {
      if (role.category) {
        stats.categories[role.category] = (stats.categories[role.category] || 0) + 1;
      }
      if (role.roleType) {
        stats.roleTypes[role.roleType] = (stats.roleTypes[role.roleType] || 0) + 1;
      }
      if (role.era) {
        const eraShort = role.era.split(' ')[0];
        stats.eras[eraShort] = (stats.eras[eraShort] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * 随机获取指定数量的角色（用于测试）
   */
  getRandomRoles(count = 3) {
    const shuffled = [...this.allRoles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * 验证角色数据完整性
   */
  validateRole(role) {
    const requiredFields = ['id', 'name', 'soul'];
    const missingFields = requiredFields.filter(field => !role[field]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      completeness: (requiredFields.length - missingFields.length) / requiredFields.length * 100
    };
  }

  /**
   * 批量验证所有角色
   */
  validateAllRoles() {
    const results = this.allRoles.map(role => ({
      id: role.id,
      ...this.validateRole(role)
    }));

    const validCount = results.filter(r => r.isValid).length;
    
    return {
      total: results.length,
      valid: validCount,
      invalid: results.length - validCount,
      validityRate: (validCount / results.length * 100).toFixed(1) + '%',
      details: results.filter(r => !r.isValid)
    };
  }
}

module.exports = new RealPersonRoleManager();