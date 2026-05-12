/**
 * 通讯录状态管理 - Zustand Store
 * 
 * 管理Soul好友、群组等联系人相关状态
 * 
 * 更新说明：
 * - 现在使用完整的35个soulPresets角色数据
 * - 支持按角色类型分类显示
 * - 包含群组讨论功能
 */

import { create } from 'zustand';
import { Soul, Group } from '../types';
import { mockGroups } from '../data/groups';
import { getAllSouls, soulPresets, roleTypeNames } from '../data/soulPresets';

// ============ 将soulPresets转换为Soul格式 ============

/**
 * 根据角色ID和类别生成可爱的头像URL
 * 使用多种风格随机选择，增加视觉多样性
 */
const generateCuteAvatar = (soulId: string, categoryType: string): string => {
  // 可爱的头像风格列表
  const avatarStyles = [
    'adventurer',      // 冒险者风格（最可爱）
    'bottts',          // 机器人风格（可爱Q版）
    'pixel-art',       // 像素艺术（复古可爱）
    'fun-emoji',       // 活泼表情
    'lorelei',         // 精致人物
    'notionists',      // 简约中性
  ];
  
  // 根据ID确定性选择风格（保证同一角色总是同一样式）
  const styleIndex = soulId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarStyles.length;
  const selectedStyle = avatarStyles[styleIndex];
  
  return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${soulId}&backgroundColor=transparent`;
};

/**
 * 将soulPresets中的角色数据转换为Soul类型
 */
const convertPresetsToSouls = (): Soul[] => {
  const souls: Soul[] = [];
  
  // 遍历所有角色类别
  Object.entries(soulPresets).forEach(([categoryType, presets]) => {
    presets.forEach((preset) => {
      souls.push({
        id: preset.id,
        name: preset.name,
        avatar: generateCuteAvatar(preset.id, categoryType), // 使用新的可爱头像生成函数
        personality: preset.character.personality as Soul['personality'],
        description: preset.description,
        specialty: preset.suitableFor.join('、'),
        winRate: Math.floor(60 + Math.random() * 35), // 随机胜率60-95%
        debateCount: Math.floor(100 + Math.random() * 400), // 随机辩论数100-500
        isOnline: Math.random() > 0.3, // 70%概率在线
        addedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        
        // 扩展字段：存储原始preset数据以便辩论使用
        _presetData: preset,
        _categoryType: categoryType,
      });
    });
  });
  
  return souls;
};

// 生成完整的Soul列表（35个角色）
const allSouls: Soul[] = convertPresetsToSouls();

// ============ State接口定义 ============

interface ContactState {
  // Soul好友列表（完整35个角色）
  souls: Soul[];
  
  // 群组列表
  groups: Group[];
  
  // 搜索关键词
  searchKeyword: string;
  
  // 当前选中的分类筛选
  activeFilter: 'all' | 'online' | string; // 可以是roleType
  
  // 加载状态
  isLoading: boolean;
  
  // ============ Actions ============
  
  /** 初始化联系人数据（从完整Presets加载） */
  initializeContacts: () => void;
  
  /** 设置Soul列表 */
  setSouls: (souls: Soul[]) => void;
  
  /** 添加Soul好友 */
  addSoul: (soul: Soul) => void;
  
  /** 移除Soul好友 */
  removeSoul: (id: string) => void;
  
  /** 更新Soul在线状态 */
  updateSoulOnlineStatus: (id: string, isOnline: boolean) => void;
  
  /** 设置群组列表 */
  setGroups: (groups: Group[]) => void;
  
  /** 设置搜索关键词 */
  setSearchKeyword: (keyword: string) => void;
  
  /** 设置分类筛选 */
  setActiveFilter: (filter: 'all' | 'online' | string) => void;
  
  /** 获取筛选后的Soul列表 */
  getFilteredSouls: () => Soul[];
  
  /** 搜索Soul */
  searchSouls: (keyword: string) => Soul[];
  
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  
  /** 获取所有角色类型分类 */
  getRoleTypeCategories: () => Array<{ key: string; label: string; count: number }>;
}

// ============ Store实现 ============

export const useContactStore = create<ContactState>((set, get) => ({
  // 初始状态（使用完整35个角色）
  souls: allSouls,
  groups: mockGroups,
  searchKeyword: '',
  activeFilter: 'all',
  isLoading: false,
  
  // Actions
  initializeContacts: () => {
    set({
      souls: allSouls,
      groups: mockGroups,
    });
    console.log(`[ContactStore] Initialized with ${allSouls.length} souls and ${mockGroups.length} groups`);
  },
  
  setSouls: (souls) => set({ souls }),
  
  addSoul: (soul) =>
    set((state) => ({
      souls: [...state.souls, soul],
    })),
  
  removeSoul: (id) =>
    set((state) => ({
      souls: state.souls.filter(soul => soul.id !== id),
    })),
  
  updateSoulOnlineStatus: (id, isOnline) =>
    set((state) => ({
      souls: state.souls.map(soul =>
        soul.id === id ? { ...soul, isOnline } : soul
      ),
    })),
  
  setGroups: (groups) => set({ groups }),
  
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  
  getFilteredSouls: () => {
    const { souls, activeFilter, searchKeyword } = get();
    
    let filtered = [...souls];
    
    // 应用分类筛选
    if (activeFilter === 'online') {
      filtered = filtered.filter(soul => soul.isOnline);
    } else if (activeFilter !== 'all') {
      // 按角色类型筛选（_categoryType字段）
      filtered = filtered.filter(soul => 
        (soul as any)._categoryType === activeFilter
      );
    }
    
    // 应用搜索关键词
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        soul =>
          soul.name.toLowerCase().includes(keyword) ||
          soul.specialty.toLowerCase().includes(keyword) ||
          soul.description.toLowerCase().includes(keyword)
      );
    }
    
    return filtered;
  },
  
  searchSouls: (keyword) => {
    const { souls } = get();
    const lowerKeyword = keyword.toLowerCase();
    
    return souls.filter(
      soul =>
        soul.name.toLowerCase().includes(lowerKeyword) ||
        soul.specialty.toLowerCase().includes(lowerKeyword) ||
        soul.description.toLowerCase().includes(lowerKeyword)
    );
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  /**
   * 获取所有角色类型分类及数量
   */
  getRoleTypeCategories: () => {
    const { souls } = get();
    const categories: Array<{ key: string; label: string; count: number }> = [
      { key: 'all', label: '全部', count: souls.length },
      { key: 'online', label: '在线', count: souls.filter(s => s.isOnline).length },
    ];
    
    // 统计各角色类型的数量
    const typeCount: Record<string, number> = {};
    souls.forEach(soul => {
      const type = (soul as any)._categoryType || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    Object.entries(typeCount).forEach(([type, count]) => {
      categories.push({
        key: type,
        label: roleTypeNames[type as keyof typeof roleTypeNames] || type,
        count,
      });
    });
    
    return categories;
  },
}));

export default useContactStore;
