/**
 * 主题状态管理 - Zustand Store
 * 
 * 管理应用的主题切换功能：
 * - 当前激活的主题ID
 * - 主题切换方法
 * - 持久化存储（AsyncStorage）
 */

import { create } from 'zustand';
import { ThemeId, ThemeColors, THEMES, getThemeById, getDefaultThemeId } from '../theme/colors';

// ============ State接口定义 ============

interface ThemeState {
  /** 当前激活的主题ID */
  currentThemeId: ThemeId;
  
  /** 当前主题的颜色配置（便捷访问） */
  currentColors: ThemeColors;
  
  // ============ Actions ============
  
  /**
   * 切换主题
   * @param themeId 目标主题ID
   */
  setTheme: (themeId: ThemeId) => void;
  
  /**
   * 重置为默认主题
   */
  resetToDefault: () => void;
}

// ============ Store实现 ============

export const useThemeStore = create<ThemeState>((set) => {
  // 从localStorage读取已保存的主题偏好（如果有）
  const savedThemeId = typeof window !== 'undefined' 
    ? (localStorage.getItem('app_theme') as ThemeId) 
    : null;
  
  const defaultThemeId = savedThemeId && THEMES[savedThemeId] 
    ? savedThemeId 
    : getDefaultThemeId();
  
  return {
    // ==================== 初始状态 ====================
    currentThemeId: defaultThemeId,
    currentColors: getThemeById(defaultThemeId).colors,
    
    // ==================== Actions实现 ====================
    
    /**
     * 切换主题
     */
    setTheme: (themeId: ThemeId) => {
      // 验证主题ID是否有效
      if (!THEMES[themeId]) {
        console.warn(`[Theme] Invalid theme ID: ${themeId}, using default`);
        themeId = getDefaultThemeId();
      }
      
      const newTheme = getThemeById(themeId);
      
      set({
        currentThemeId: themeId,
        currentColors: newTheme.colors,
      });
      
      // 持久化到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_theme', themeId);
      }
      
      console.log(`[Theme] Switched to: ${newTheme.name} (${themeId})`);
    },
    
    /**
     * 重置为默认主题
     */
    resetToDefault: () => {
      const defaultId = getDefaultThemeId();
      
      set({
        currentThemeId: defaultId,
        currentColors: getThemeById(defaultId).colors,
      });
      
      // 清除持久化存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app_theme');
      }
      
      console.log('[Theme] Reset to default theme');
    },
  };
});

// ============ 导出便捷Hook ============

/**
 * 获取当前主题颜色（推荐使用此Hook替代直接导入Colors）
 * 
 * 使用示例：
 * ```tsx
 * import { useCurrentColors } from '../stores/useThemeStore';
 * 
 * const colors = useCurrentColors();
 * // 现在可以使用 colors.primary, colors.background 等
 * ```
 */
export const useCurrentColors = (): ThemeColors => {
  return useThemeStore((state) => state.currentColors);
};

export default useThemeStore;
