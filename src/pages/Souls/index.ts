/**
 * Souls角色管理模块导出
 * 
 * Apple设计风格的企业级AI辩论角色管理系统
 */

// 类型定义
export type {
  Soul,
  SoulType,
  SoulStatus,
  LanguageStyle,
  PersonalityTag,
  AIBehaviorParams,
  ExampleDialogue,
  UsageStats,
  SoulFormData,
  SoulFilterParams,
  ViewMode,
} from './types';

export {
  SoulTypeLabels,
  SoulStatusLabels,
  LanguageStyleLabels,
  PersonalityTagLabels,
  SoulTypeColors,
} from './types';

// Mock数据
export {
  mockSouls,
  getSoulById,
  getActiveSouls,
  getSoulsByType,
  getRecommendedSouls,
  getMostUsedSouls,
} from './data';

// 组件
export { default as SoulCard } from './components/SoulCard';
export { default as SearchBar } from './components/SearchBar';
export { default as CreateEditModal } from './components/CreateEditModal';
export { default as SoulDetailDrawer } from './components/SoulDetailDrawer';

// 主页面
export { default as SoulsManagement } from './SoulsManagement';
