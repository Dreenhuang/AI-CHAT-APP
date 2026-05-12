/**
 * 用户状态管理 - Zustand Store
 * 
 * 管理当前用户信息、登录状态、个人设置等
 */

import { create } from 'zustand';
import { User } from '../types';

// ============ State接口定义 ============

interface UserState {
  // 当前用户信息
  user: User | null;
  
  // 是否已登录
  isLoggedIn: boolean;
  
  // Token（用于API认证）
  token: string | null;
  
  // 主题设置：light / dark
  theme: 'light' | 'dark';
  
  // 通知开关
  notificationsEnabled: boolean;
  
  // 加载状态
  isLoading: boolean;
  
  // ============ Actions ============
  
  /** 设置用户信息 */
  setUser: (user: User) => void;
  
  /** 更新用户部分信息 */
  updateUser: (updates: Partial<User>) => void;
  
  /** 登录 */
  login: (user: User, token: string) => void;
  
  /** 登出 */
  logout: () => void;
  
  /** 设置Token */
  setToken: (token: string | null) => void;
  
  /** 切换主题 */
  toggleTheme: () => void;
  
  /** 切换通知开关 */
  toggleNotifications: () => void;
  
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  
  /** 增加经验值 */
  addExperience: (amount: number) => void;
}

// ============ 默认用户数据 ============

const defaultUser: User = {
  id: 'user_001',
  nickname: '辩论新手',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bio: '热爱思考，喜欢从不同角度看问题',
  level: 1,
  experience: 0,
  totalDebates: 0,
  winRate: 0,
  createdAt: new Date().toISOString(),
};

// ============ Store实现 ============

export const useUserStore = create<UserState>((set, get) => ({
  // 初始状态
  user: defaultUser,
  isLoggedIn: true, // 默认已登录（Demo模式）
  token: null,
  theme: 'light',
  notificationsEnabled: true,
  isLoading: false,
  
  // Actions
  setUser: (user) => set({ user }),
  
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  
  login: (user, token) =>
    set({
      user,
      token,
      isLoggedIn: true,
    }),
  
  logout: () =>
    set({
      user: null,
      token: null,
      isLoggedIn: false,
    }),
  
  setToken: (token) => set({ token }),
  
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  
  toggleNotifications: () =>
    set((state) => ({
      notificationsEnabled: !state.notificationsEnabled,
    })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  addExperience: (amount) =>
    set((state) => {
      if (!state.user) return {};
      
      const newExperience = state.user.experience + amount;
      // 每100经验升1级
      const newLevel = Math.floor(newExperience / 100) + 1;
      
      return {
        user: {
          ...state.user,
          experience: newExperience,
          level: newLevel,
        },
      };
    }),
}));
