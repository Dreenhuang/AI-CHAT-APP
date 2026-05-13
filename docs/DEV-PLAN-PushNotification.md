# 每日精选话题推送通知 - 功能开发计划

> **For agentic workers:** 使用此计划按任务逐步实现功能。步骤使用复选框（`- [ ]`）语法追踪进度。

**目标：** 为PRD辩论APP实现"每日精选话题推送通知"功能，每天早上定时推送1条AI精选热门话题到用户通知栏，用户点击后直接跳转到该话题的辩论页面。

**架构：** 前端利用 `expo-notifications`（兼容Web的 `Notification` API）实现本地推送调度，复用已有的 `AITopicService` 获取每日精选话题内容。后端新增通知偏好API和管理后台推送统计。用户设置页（"我的"Tab）新增通知控制入口。

**技术栈：** Expo SDK 51 / React Native Web / TypeScript / Zustand / expo-notifications / Vite / Express / Prisma (PostgreSQL)

**前提条件：** 项目已存在于 `g:\ai-gongju\prd-debate\aichat-app`，使用 `bun` 作为包管理器

---

## 一、兼容性评估与架构决策

### 1.1 项目架构分析

| 维度 | 分析结果 | 对推送功能的影响 |
|------|---------|----------------|
| **渲染目标** | Vite + react-native-web（浏览器为主） | 需同时支持Web Notification API和expo-notifications |
| **运行模式** | `bun run dev` → Vite开发服务器（端口8081） | 通知调度基于前端定时器 |
| **后端服务** | Express端口9461（可选用于持久化） | 可扩展推送记录API |
| **数据库** | Prisma + PostgreSQL（仅管理员后台） | 通知偏好可选持久化到后端 |
| **状态管理** | Zustand（全应用统一模式） | 通知状态存入Zustand store |
| **已有基础** | `useUserStore.notificationsEnabled` 已有通知开关 | 可直接复用 |
| **主题系统** | 4套主题（deep-tech/deep-space/aurora-blue/nebula-purple） | 通知设置页需适配所有主题 |
| **AI话题服务** | `AITopicService` 单例 + DeepSeek API + 24h缓存 | **直接复用获取每日话题** |
| **页面导航** | 点击通知 → 跳转 ChatDetail（topicId参数） | 导航逻辑已有现成实现 |

### 1.2 通知方案选型

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **expo-notifications** | 跨平台统一API；支持定时调度 | Web端支持有限（无后台定时） | ✅ **主方案** |
| **Web Notification API** | 浏览器原生支持 | 无法定时触发 | ✅ **Web降级方案** |
| **后端推送 (FCM/APNs)** | 支持离线推送 | 需额外配置Firebase/APNs | ❌ 超出MVP范围 |

**决策：** 采用**双层架构** — expo-notifications（移动端）+ Web Notification API定时检查（Web端）

### 1.3 现有代码复用清单

```typescript
// ✅ 已有 - 可直接复用
import AITopicService from './aitopicService';          // 获取每日话题
import { Colors } from '../theme/colors';               // 主题色系统
import { useUserStore } from '../stores/useUserStore';  // 用户状态（含notificationsEnabled）
import { useThemeStore } from '../stores/useThemeStore'; // 主题切换
```

### 1.4 需要新增/修改的文件清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| **新建** | `src/services/notificationService.ts` | 通知服务核心（单例模式，类似AITopicService） |
| **新建** | `src/hooks/useDailyNotification.ts` | 每日通知Hook，封装调度逻辑 |
| **新建** | `src/components/NotificationSettingsModal.tsx` | 通知设置Modal组件 |
| **新建** | `src/components/DailyTopicPreview.tsx` | 每日话题预览卡片 |
| **修改** | `src/screens/tabs/me.tsx` | 增加"通知设置"菜单项 |
| **修改** | `src/App.tsx` | 初始化通知服务和权限请求 |
| **新建** | `server/routes/notifications.js` | 后端通知偏好API（可选） |
| **修改** | `server/index.js` | 注册通知路由 |
| **新建** | `server/data/notificationStats.json` | 推送统计数据文件 |

---

## 二、详细实施任务

---

### Task 1: 依赖安装与项目配置

**文件：**
- 修改：`package.json`（已在根目录）
- 修改：`vite.config.ts`（已有）
- 新建：`app.json`（创建Expo配置）
- 验证：依赖安装成功

- [ ] **Step 1: 安装 expo-notifications 和 expo-device**

```bash
cd g:\ai-gongju\prd-debate\aichat-app
bun add expo-notifications
bun add expo-device
bun add expo-task-manager
bun add expo-background-fetch
```

- [ ] **Step 2: 创建 app.json（如不存在）**

```json
{
  "expo": {
    "name": "PRD辩论APP",
    "slug": "prd-debate-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "backgroundColor": "#0EA5E9"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.prddebate.app",
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0EA5E9"
      },
      "package": "com.prddebate.app",
      "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "SCHEDULE_EXACT_ALARM"]
    },
    "web": {
      "bundler": "vite"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#0EA5E9"
        }
      ]
    ]
  }
}
```

- [ ] **Step 3: 验证安装成功**

```bash
cd g:\ai-gongju\prd-debate\aichat-app
bun ls expo-notifications
```

预期输出：显示 `expo-notifications` 已安装的版本号

---

### Task 2: 创建通知服务核心模块

**文件：**
- 新建：`src/services/notificationService.ts`

- [ ] **Step 1: 创建通知服务单例类**

```typescript
/**
 * 通知推送服务 - 每日精选话题推送
 *
 * 职责：
 * 1. 管理通知权限（请求/检查）
 * 2. 调度每日精选话题推送
 * 3. 取消已调度的推送
 * 4. 处理通知点击事件
 *
 * 设计模式：单例（与 AITopicService 保持一致）
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AITopicService from './aitopicService';
import { useUserStore } from '../stores/useUserStore';

// ============ 配置常量 ============

const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'daily-topics',
  CHANNEL_NAME: '每日精选话题',
  CHANNEL_DESCRIPTION: '每天早上推送一条精选辩论话题',
  DEFAULT_HOUR: 9,
  DEFAULT_MINUTE: 0,
  STORAGE_KEY: 'notification_settings',
  TOPIC_PREVIEW_COUNT: 3,
};

// ============ 类型定义 ============

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  soundEnabled: boolean;
  subscribedCategories: string[];
  lastTopicId: string | null;
  lastPushDate: string | null;
}

export interface PushRecord {
  id: string;
  topicId: string;
  topicTitle: string;
  pushedAt: string;
  clicked: boolean;
  clickedAt?: string;
}

export interface PushStats {
  totalPushes: number;
  todayPushes: number;
  totalClicks: number;
  clickRate: number;
  lastPushTime: string | null;
}

// ============ 默认设置 ============

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: NOTIFICATION_CONFIG.DEFAULT_HOUR,
  minute: NOTIFICATION_CONFIG.DEFAULT_MINUTE,
  soundEnabled: true,
  subscribedCategories: [],
  lastTopicId: null,
  lastPushDate: null,
};

// ============ 通知服务 ============

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = { ...DEFAULT_SETTINGS };
  private pushRecords: PushRecord[] = [];
  private isInitialized = false;

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ==================== 初始化 ====================

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await this.setupChannel();
      const granted = await this.requestPermission();

      if (granted) {
        this.setupNotificationHandler();
        this.isInitialized = true;
        console.log('[NotificationService] 初始化成功');
        return true;
      }

      console.warn('[NotificationService] 用户拒绝了通知权限');
      return false;
    } catch (error) {
      console.error('[NotificationService] 初始化失败:', error);
      return false;
    }
  }

  // ==================== 权限管理 ====================

  private async requestPermission(): Promise<boolean> {
    if (!Device.isDevice && Platform.OS === 'web') {
      // Web平台使用浏览器Notification API
      if (!('Notification' in window)) {
        console.warn('[NotificationService] 浏览器不支持通知');
        return false;
      }
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    // 移动端使用expo-notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async checkPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return 'Notification' in window && Notification.permission === 'granted';
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // ==================== 通知频道（Android） ====================

  private async setupChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        NOTIFICATION_CONFIG.CHANNEL_ID,
        {
          name: NOTIFICATION_CONFIG.CHANNEL_NAME,
          description: NOTIFICATION_CONFIG.CHANNEL_DESCRIPTION,
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0EA5E9',
        }
      );
    }
  }

  // ==================== 通知内容处理 ====================

  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: this.settings.enabled,
        shouldPlaySound: this.settings.soundEnabled,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // ==================== 核心：调度每日通知 ====================

  async scheduleDailyTopic(): Promise<boolean> {
    try {
      const userPrefs = useUserStore.getState();
      if (!userPrefs.notificationsEnabled) {
        console.log('[NotificationService] 用户已关闭通知，跳过调度');
        return false;
      }

      // 获取今日精选话题
      const aiService = AITopicService.getInstance();
      const topics = await aiService.getHotTopics(true);

      if (!topics || topics.length === 0) {
        console.warn('[NotificationService] 无可推送的话题');
        return false;
      }

      // 选热度最高的话题
      const todayTopic = topics.sort((a, b) => b.heat - a.heat)[0];

      // 如果今天已经推送过同一个话题，跳过
      if (this.settings.lastTopicId === todayTopic.id) {
        const today = new Date().toDateString();
        if (this.settings.lastPushDate === today) {
          console.log('[NotificationService] 今日已推送，跳过');
          return true;
        }
      }

      await this.scheduleNotification(todayTopic);

      // 更新推送记录
      this.settings.lastTopicId = todayTopic.id;
      this.settings.lastPushDate = new Date().toDateString();
      this.saveSettings();

      // 记录推送
      this.recordPush(todayTopic.id, todayTopic.title);

      console.log(`[NotificationService] 已调度推送: ${todayTopic.title}`);
      return true;
    } catch (error) {
      console.error('[NotificationService] 调度推送失败:', error);
      return false;
    }
  }

  private async scheduleNotification(topic: {
    id: string;
    title: string;
    description: string;
    category: string;
  }): Promise<void> {
    const { hour, minute } = this.settings;

    // 取消已有的定时任务
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 调度新的每日通知（使用exp-notifications的trigger）
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 今日精选话题',
        subtitle: topic.category ? `分类: ${topic.category}` : undefined,
        body: topic.title,
        data: {
          topicId: topic.id,
          type: 'daily_topic',
          title: topic.title,
          screen: 'ChatDetail',
        },
        sound: this.settings.soundEnabled,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#0EA5E9',
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    // Web平台的降级方案：使用setTimeout检查
    if (Platform.OS === 'web') {
      this.setupWebCheckTimer(hour, minute, topic);
    }
  }

  private setupWebCheckTimer(
    hour: number,
    minute: number,
    topic: { id: string; title: string; description: string }
  ): void {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0
    );

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const delayMs = target.getTime() - now.getTime();

    setTimeout(() => {
      if (!this.settings.enabled) return;

      // 使用浏览器Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔥 今日精选话题', {
          body: topic.title,
          icon: '/assets/notification-icon.png',
          tag: 'daily-topic',
          data: { topicId: topic.id, screen: 'ChatDetail' },
        });
      }
    }, delayMs);
  }

  // ==================== 取消调度 ====================

  async cancelScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[NotificationService] 已取消所有定时通知');
  }

  // ==================== 设置管理 ====================

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();

    if (this.settings.enabled) {
      await this.scheduleDailyTopic();
    } else {
      await this.cancelScheduledNotifications();
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // 使用默认设置
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(
        NOTIFICATION_CONFIG.STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('[NotificationService] 保存设置失败:', error);
    }
  }

  // ==================== 推送记录 ====================

  private recordPush(topicId: string, topicTitle: string): void {
    const record: PushRecord = {
      id: `push_${Date.now()}`,
      topicId,
      topicTitle,
      pushedAt: new Date().toISOString(),
      clicked: false,
    };
    this.pushRecords.push(record);

    if (this.pushRecords.length > 100) {
      this.pushRecords = this.pushRecords.slice(-50);
    }
  }

  markAsClicked(topicId: string): void {
    const record = this.pushRecords.find(
      (r) => r.topicId === topicId && !r.clicked
    );
    if (record) {
      record.clicked = true;
      record.clickedAt = new Date().toISOString();
    }
  }

  getPushStats(): PushStats {
    const totalPushes = this.pushRecords.length;
    const todayStr = new Date().toDateString();
    const todayPushes = this.pushRecords.filter(
      (r) => new Date(r.pushedAt).toDateString() === todayStr
    ).length;
    const totalClicks = this.pushRecords.filter((r) => r.clicked).length;

    return {
      totalPushes,
      todayPushes,
      totalClicks,
      clickRate: totalPushes > 0 ? Math.round((totalClicks / totalPushes) * 100) : 0,
      lastPushTime:
        this.pushRecords.length > 0
          ? this.pushRecords[this.pushRecords.length - 1].pushedAt
          : null,
    };
  }

  // ==================== 调试工具 ====================

  async sendTestNotification(): Promise<void> {
    const aiService = AITopicService.getInstance();
    const topics = await aiService.getHotTopics(false);
    const testTopic = topics[0] || {
      id: 'test_topic',
      title: 'AI是否会取代人类工作？',
      description: '测试推送',
      category: '科技',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 测试通知',
        body: testTopic.title,
        data: { topicId: testTopic.id, type: 'test' },
      },
      trigger: null,
    });

    console.log('[NotificationService] 测试通知已发送');
  }
}

export default NotificationService;
```

---

### Task 3: 创建通知交互Hook

**文件：**
- 新建：`src/hooks/useDailyNotification.ts`

- [ ] **Step 1: 创建通知生命周期管理Hook**

```typescript
/**
 * useDailyNotification - 每日精选话题通知Hook
 *
 * 职责：
 * 1. App启动时初始化通知服务
 * 2. 监听通知点击事件
 * 3. 处理通知点击后的页面跳转
 * 4. 组件卸载时清理监听器
 *
 * 使用方式：在 App.tsx 或 需要监听通知的页面调用
 * const notificationHandler = useDailyNotification();
 * notificationHandler.lastPushedTopic // 最后一次推送的话题
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NotificationService, { NotificationSettings, PushStats } from '../services/notificationService';

export interface NotificationState {
  isInitialized: boolean;
  permissionGranted: boolean;
  settings: NotificationSettings;
  stats: PushStats;
  lastPushedTopic: { id: string; title: string } | null;
}

export function useDailyNotification() {
  const navigation = useNavigation();
  const notificationService = NotificationService.getInstance();
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const notificationListenerRef = useRef<Notifications.EventSubscription | null>(null);

  const [state, setState] = useState<NotificationState>({
    isInitialized: false,
    permissionGranted: false,
    settings: notificationService.getSettings(),
    stats: notificationService.getPushStats(),
    lastPushedTopic: null,
  });

  // ==================== 初始化 ====================

  useEffect(() => {
    const init = async () => {
      const granted = await notificationService.initialize();
      setState((prev) => ({
        ...prev,
        isInitialized: true,
        permissionGranted: granted,
        settings: notificationService.getSettings(),
      }));
    };

    init();

    return () => {
      cleanup();
    };
  }, []);

  // ==================== 监听通知事件 ====================

  useEffect(() => {
    if (!state.isInitialized) return;

    // 监听通知接收（App在前台时）
    notificationListenerRef.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        if (data?.topicId) {
          console.log('[useDailyNotification] 收到通知:', data.topicId);
        }
      });

    // 监听通知点击（用户点击通知）
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.topicId && data?.screen === 'ChatDetail') {
          const topicId = data.topicId;
          const topicTitle = data.title || '';

          // 标记为已点击
          notificationService.markAsClicked(topicId);

          // 更新状态
          setState((prev) => ({
            ...prev,
            stats: notificationService.getPushStats(),
            lastPushedTopic: { id: topicId, title: topicTitle },
          }));

          // 跳转到辩论页面
          navigation.navigate('ChatDetail' as never, {
            id: `push_topic_${topicId}`,
            topicId,
          } as never);

          console.log('[useDailyNotification] 通知点击跳转:', topicId);
        }
      });

    // Web平台处理：监听Service Worker消息或手动检查
    if (Platform.OS === 'web') {
      setupWebNotificationHandler();
    }

    return () => {
      cleanup();
    };
  }, [state.isInitialized, navigation]);

  // ==================== Web平台处理 ====================

  const setupWebNotificationHandler = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click' && event.data?.topicId) {
          navigation.navigate('ChatDetail' as never, {
            id: `push_topic_${event.data.topicId}`,
            topicId: event.data.topicId,
          } as never);
        }
      });
    }
  };

  // ==================== 清理 ====================

  const cleanup = () => {
    if (notificationListenerRef.current) {
      Notifications.removeNotificationSubscription(notificationListenerRef.current);
    }
    if (responseListenerRef.current) {
      Notifications.removeNotificationSubscription(responseListenerRef.current);
    }
  };

  // ==================== 操作方法 ====================

  const refreshSettings = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: notificationService.getSettings(),
      stats: notificationService.getPushStats(),
    }));
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      await notificationService.updateSettings(updates);
      refreshSettings();
    },
    [refreshSettings]
  );

  const sendTestNotification = useCallback(async () => {
    await notificationService.sendTestNotification();
  }, []);

  const scheduleNow = useCallback(async () => {
    await notificationService.scheduleDailyTopic();
    refreshSettings();
  }, [refreshSettings]);

  return {
    ...state,
    refreshSettings,
    updateSettings,
    sendTestNotification,
    scheduleNow,
    notificationService,
  };
}

export default useDailyNotification;
```

---

### Task 4: 创建通知设置Modal组件

**文件：**
- 新建：`src/components/NotificationSettingsModal.tsx`

- [ ] **Step 1: 创建通知设置UI组件**

```typescript
/**
 * NotificationSettingsModal - 通知设置弹窗
 *
 * 显示在"我的"页面，用户可配置：
 * 1. 推送总开关
 * 2. 推送时间选择
 * 3. 声音开关
 * 4. 话题分类订阅
 * 5. 手动测试推送
 * 6. 推送统计概览
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, useCurrentColors } from '../stores/useThemeStore';
import { useDailyNotification } from '../hooks/useDailyNotification';

// ============ 话题分类选项 ============

const CATEGORY_OPTIONS = [
  { key: '科技', icon: 'hardware-chip-outline' as const, color: '#2196F3' },
  { key: '社会', icon: 'people-outline' as const, color: '#FF9800' },
  { key: '经济', icon: 'trending-up-outline' as const, color: '#607D8B' },
  { key: '教育', icon: 'school-outline' as const, color: '#4CAF50' },
  { key: '文化', icon: 'musical-notes-outline' as const, color: '#8BC34A' },
  { key: '生活', icon: 'leaf-outline' as const, color: '#9C27B0' },
  { key: '娱乐', icon: 'film-outline' as const, color: '#E91E63' },
  { key: '环境', icon: 'earth-outline' as const, color: '#009688' },
];

// ============ 时间选项 ============

const TIME_OPTIONS = [
  { label: '早上 7:00', value: 7 },
  { label: '早上 8:00', value: 8 },
  { label: '早上 9:00', value: 9 },
  { label: '早上 10:00', value: 10 },
  { label: '中午 12:00', value: 12 },
  { label: '下午 18:00', value: 18 },
  { label: '晚上 20:00', value: 20 },
  { label: '晚上 22:00', value: 22 },
];

// ============ 组件 ============

interface Props {
  visible: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<Props> = ({ visible, onClose }) => {
  const colors = useCurrentColors();
  const {
    settings,
    stats,
    permissionGranted,
    isInitialized,
    updateSettings,
    sendTestNotification,
    scheduleNow,
    refreshSettings,
  } = useDailyNotification();

  const [showTimePicker, setShowTimePicker] = useState(false);

  // Modal打开时刷新设置
  useEffect(() => {
    if (visible) {
      refreshSettings();
    }
  }, [visible, refreshSettings]);

  // ==================== 渲染 ====================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView
          style={[styles.modalContent, { backgroundColor: colors.card }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 标题 */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              通知设置
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 初始化状态 */}
          {!isInitialized && (
            <View style={[styles.statusBanner, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="sync" size={20} color="#F57C00" />
              <Text style={styles.statusBannerText}>正在初始化通知服务...</Text>
            </View>
          )}

          {/* 权限状态 */}
          {isInitialized && !permissionGranted && (
            <View style={[styles.statusBanner, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="warning" size={20} color="#D32F2F" />
              <Text style={[styles.statusBannerText, { color: '#D32F2F' }]}>
                通知权限未开启，请前往系统设置中允许通知
              </Text>
            </View>
          )}

          {/* ====== 推送开关 ====== */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="notifications"
                  size={22}
                  color={settings.enabled ? colors.primary : colors.textSecondary}
                />
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    每日精选话题推送
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    每天早上推送一条AI精选热门话题
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{
                  false: colors.border,
                  true: colors.primaryLight,
                }}
                thumbColor={settings.enabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* ====== 推送时间 ====== */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              推送时间
            </Text>

            {showTimePicker ? (
              <View style={styles.timePickerGrid}>
                {TIME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeOption,
                      settings.hour === option.value && {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      updateSettings({ hour: option.value, minute: 0 });
                      setShowTimePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color:
                            settings.hour === option.value
                              ? colors.primary
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {settings.hour === option.value && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                        style={styles.timeCheck}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.timeDisplay, { backgroundColor: colors.background }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.timeDisplayText, { color: colors.textPrimary }]}>
                  每天 {String(settings.hour).padStart(2, '0')}:{String(settings.minute).padStart(2, '0')}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* ====== 声音开关 ====== */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="volume-medium"
                  size={22}
                  color={settings.soundEnabled ? colors.primary : colors.textSecondary}
                />
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    推送声音
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    接收通知时播放提示音
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{
                  false: colors.border,
                  true: colors.primaryLight,
                }}
                thumbColor={settings.soundEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* ====== 话题分类订阅 ====== */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              订阅分类（可选，留空则推送全部分类）
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => {
                const isSubscribed = settings.subscribedCategories.includes(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryTag,
                      isSubscribed && {
                        backgroundColor: cat.color + '20',
                        borderColor: cat.color,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      const newCategories = isSubscribed
                        ? settings.subscribedCategories.filter((c) => c !== cat.key)
                        : [...settings.subscribedCategories, cat.key];
                      updateSettings({ subscribedCategories: newCategories });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSubscribed ? cat.color : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: isSubscribed ? cat.color : colors.textSecondary,
                          fontWeight: isSubscribed ? '600' : '400',
                        },
                      ]}
                    >
                      {cat.key}
                    </Text>
                    {isSubscribed && (
                      <Ionicons name="checkmark-circle" size={14} color={cat.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ====== 操作按钮 ====== */}
          <View style={styles.actionsSection}>
            {/* 手动推送 */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={scheduleNow}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>立即获取今日精选</Text>
            </TouchableOpacity>

            {/* 测试推送 */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.background, borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={sendTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="bug-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                发送测试通知
              </Text>
            </TouchableOpacity>
          </View>

          {/* ====== 推送统计 ====== */}
          <View style={[styles.statsSection, { backgroundColor: colors.background }]}>
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>
              推送统计
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.totalPushes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  累计推送
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  {stats.todayPushes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  今日推送
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  {stats.clickRate}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  点击率
                </Text>
              </View>
            </View>
          </View>

          {/* 底部说明 */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              推送内容由AI自动生成，基于当前热门话题
            </Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              设置仅保存在本地设备中
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ============ 样式 ============

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },

  // ====== 状态Banner ======
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  statusBannerText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },

  // ====== 设置项 ======
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingTextGroup: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },

  // ====== 时间选择 ======
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timeDisplayText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  timePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  timeCheck: {
    marginLeft: 4,
  },

  // ====== 分类订阅 ======
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
  },

  // ====== 操作按钮 ======
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ====== 统计 ======
  statsSection: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },

  // ====== 底部 ======
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default NotificationSettingsModal;
```

---

### Task 5: 创建每日话题预览卡片组件

**文件：**
- 新建：`src/components/DailyTopicPreview.tsx`

- [ ] **Step 1: 创建今日精选话题预览卡片**

```typescript
/**
 * DailyTopicPreview - 今日精选话题预览卡片
 *
 * 在"发现"页面顶部展示今日已推送/待推送的精选话题
 * 包含推送倒计时、话题标题预览、热度指示
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import NotificationService, { NotificationSettings } from '../services/notificationService';
import AITopicService from '../services/aitopicService';
import { useNavigation } from '@react-navigation/native';

interface Props {
  onPress?: () => void;
}

const DailyTopicPreview: React.FC<Props> = ({ onPress }) => {
  const navigation = useNavigation();
  const [topicPreview, setTopicPreview] = useState<{
    title: string;
    category: string;
    heat: number;
  } | null>(null);
  const [timeUntilPush, setTimeUntilPush] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const notificationService = NotificationService.getInstance();
  const settings = notificationService.getSettings();

  useEffect(() => {
    loadPreview();

    // 每分钟更新时间显示
    const timer = setInterval(updateCountdown, 60000);
    updateCountdown();

    // 淡入动画
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(timer);
  }, []);

  const loadPreview = async () => {
    try {
      const aiService = AITopicService.getInstance();
      const topics = await aiService.getHotTopics(false);
      if (topics && topics.length > 0) {
        const top = topics.sort((a, b) => b.heat - a.heat)[0];
        setTopicPreview({
          title: top.title,
          category: top.category,
          heat: top.heat,
        });
      }
    } catch {
      // 静默失败，不显示预览
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      settings.hour,
      settings.minute,
      0
    );

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    setTimeUntilPush(`${hours}小时${minutes}分钟`);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (topicPreview) {
      navigation.navigate('ChatDetail' as never, {
        id: `preview_topic_${Date.now()}`,
        topicId: topicPreview.title,
      } as never);
    }
  };

  if (!topicPreview) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.headerTitle}>今日精选话题</Text>
          </View>
          <View style={styles.countdownBadge}>
            <Ionicons name="time-outline" size={12} color="#FF6B35" />
            <Text style={styles.countdownText}>{timeUntilPush}</Text>
          </View>
        </View>

        {/* 话题内容 */}
        <View style={styles.content}>
          {/* 分类标签和热度 */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryTag, getCategoryStyle(topicPreview.category)]}>
              <Text style={styles.categoryText}>{topicPreview.category}</Text>
            </View>
            <View style={styles.heatIndicator}>
              <Ionicons name="trending-up" size={12} color="#FF6B35" />
              <Text style={styles.heatText}>{topicPreview.heat}</Text>
            </View>
          </View>

          {/* 标题 */}
          <Text style={styles.title} numberOfLines={2}>
            {topicPreview.title}
          </Text>
        </View>

        {/* 操作提示 */}
        <View style={styles.actionRow}>
          <Ionicons name="notifications" size={14} color={Colors.primary} />
          <Text style={styles.actionText}>
            {settings.enabled ? '推送已开启，到时自动提醒' : '推送已关闭，点击开启'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============ 辅助函数 ============

const getCategoryStyle = (category: string) => {
  const styles: Record<string, { backgroundColor: string }> = {
    '科技': { backgroundColor: '#E3F2FD' },
    '社会': { backgroundColor: '#FFF3E0' },
    '经济': { backgroundColor: '#ECEFF1' },
    '教育': { backgroundColor: '#E8F5E9' },
    '文化': { backgroundColor: '#F1F8E9' },
    '生活': { backgroundColor: '#F3E5F5' },
    '娱乐': { backgroundColor: '#FCE4EC' },
    '环境': { backgroundColor: '#E0F2F1' },
  };
  return styles[category] || { backgroundColor: '#F5F5F5' };
};

// ============ 样式 ============

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  countdownText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  heatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
});

export default DailyTopicPreview;
```

---

### Task 6: 修改"我的"页面 - 新增通知设置入口

**文件：**
- 修改：`src/screens/tabs/me.tsx`

- [ ] **Step 1: 在菜单列表中添加"通知设置"项**

在 `menuItems` 数组中找到合适位置，插入通知设置项：

```typescript
// 在 menuItems 数组的 'theme' 和 'ai-model' 之间添加：
const menuItems = [
  {
    id: 'souls',
    icon: 'people-outline' as const,
    title: 'Soul角色管理',
    screen: 'SoulsManagement' as const,
  },
  // +++ 新增 +++
  {
    id: 'notification',
    icon: 'notifications-outline' as const,
    title: '通知设置',
    screen: 'NotificationSettings' as const,
  },
  // +++ 结束 +++
  {
    id: 'theme',
    icon: 'color-palette-outline' as const,
    title: '主题设置',
    screen: 'ThemeSettings' as const,
  },
  // ... 其余项保持不变
];
```

- [ ] **Step 2: 导入通知设置Modal组件**

```typescript
// 在文件顶部导入
import NotificationSettingsModal from '../../components/NotificationSettingsModal';
```

- [ ] **Step 3: 添加通知设置Modal状态**

```typescript
// 在 ProfileScreen 组件内，与 showThemePicker、showAISettings 并列
const [showNotificationSettings, setShowNotificationSettings] = useState(false);
```

- [ ] **Step 4: 在 handleMenuPress 中添加通知设置的逻辑**

```typescript
// 在 handleMenuPress 函数中，theme 判断之后添加
if (itemId === 'notification') {
  setShowNotificationSettings(true);
  return;
}
```

- [ ] **Step 5: 在 JSX 中渲染通知设置Modal**

在主题选择Modal（`showThemePicker`）之后添加：

```tsx
{/* ========== 通知设置Modal ========== */}
<NotificationSettingsModal
  visible={showNotificationSettings}
  onClose={() => setShowNotificationSettings(false)}
/>
```

---

### Task 7: 修改App.tsx - 初始化通知服务

**文件：**
- 修改：`src/App.tsx`

- [ ] **Step 1: 导入通知相关模块**

```typescript
// 在文件顶部添加导入
import NotificationService from './services/notificationService';
import { useDailyNotification } from './hooks/useDailyNotification';
```

- [ ] **Step 2: 在App组件中添加通知初始化**

```typescript
// 在 startConnectionMonitor() 的 useEffect 下方添加

// 初始化每日精选话题推送
useEffect(() => {
  const initNotification = async () => {
    try {
      const service = NotificationService.getInstance();
      const granted = await service.initialize();

      if (granted) {
        // 检查用户是否开启了通知
        const userPrefs = useUserStore.getState();
        if (userPrefs.notificationsEnabled) {
          await service.scheduleDailyTopic();
          console.log('[App] 每日精选话题推送已调度');
        }
      }
    } catch (error) {
      console.error('[App] 初始化推送服务失败:', error);
    }
  };

  initNotification();
}, []);

// 监听通知点击事件
// 注意：useDailyNotification Hook 中已经包含了通知点击的监听逻辑
// 但为了确保全局只创建一次监听，我们在 App 级别使用它
const DailyNotificationWatcher: React.FC = () => {
  useDailyNotification();
  return null;
};
```

- [ ] **Step 3: 在组件树中放置通知监听器**

```tsx
// 在 SafeAreaProvider 内部，NavigationContainer 之前或之后添加
<View style={{ flex: 1 }}>
  <DailyNotificationWatcher />
  <NavigationContainer>
    {/* ... 原有的导航代码 ... */}
  </NavigationContainer>
</View>
```

---

### Task 8: 后端API扩展 - 通知偏好管理

**文件：**
- 新建：`server/routes/notifications.js`
- 修改：`server/index.js`

- [ ] **Step 1: 创建通知偏好API路由**

```javascript
/**
 * 通知偏好管理路由
 *
 * 提供接口：
 * - GET /api/notifications/settings - 获取通知设置
 * - POST /api/notifications/settings - 保存通知设置
 * - GET /api/notifications/stats - 获取推送统计
 * - POST /api/notifications/records - 记录推送事件
 * - POST /api/notifications/click - 记录点击事件
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'notificationSettings.json');
const STATS_FILE = path.join(DATA_DIR, 'notificationStats.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============ 辅助函数 ============

/**
 * 读取JSON文件
 */
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件失败 ${filePath}:`, error.message);
    return defaultValue;
  }
}

/**
 * 写入JSON文件
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`写入文件失败 ${filePath}:`, error.message);
    return false;
  }
}

// ============ API接口 ============

/**
 * 获取通知设置
 * GET /api/notifications/settings?userId=xxx
 */
router.get('/settings', (req, res) => {
  try {
    const { userId } = req.query;
    const allSettings = readJsonFile(SETTINGS_FILE, {});

    const settings = userId ? allSettings[userId] : null;

    res.json({
      success: true,
      data: settings || {
        enabled: true,
        hour: 9,
        minute: 0,
        soundEnabled: true,
        subscribedCategories: [],
      },
    });
  } catch (error) {
    console.error('获取通知设置失败:', error);
    res.status(500).json({ success: false, message: '获取通知设置失败' });
  }
});

/**
 * 保存通知设置
 * POST /api/notifications/settings
 * Body: { userId, settings }
 */
router.post('/settings', (req, res) => {
  try {
    const { userId, settings } = req.body;

    if (!userId || !settings) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId, settings',
      });
    }

    const allSettings = readJsonFile(SETTINGS_FILE, {});
    allSettings[userId] = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    writeJsonFile(SETTINGS_FILE, allSettings);

    res.json({
      success: true,
      data: allSettings[userId],
      message: '通知设置已保存',
    });
  } catch (error) {
    console.error('保存通知设置失败:', error);
    res.status(500).json({ success: false, message: '保存通知设置失败' });
  }
});

/**
 * 获取推送统计
 * GET /api/notifications/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = readJsonFile(STATS_FILE, {
      totalPushes: 0,
      todayPushes: 0,
      totalClicks: 0,
      clickRate: 0,
      records: [],
    });

    // 计算今日推送数
    const todayStr = new Date().toDateString();
    const todayRecords = (stats.records || []).filter(
      (r) => new Date(r.pushedAt).toDateString() === todayStr
    );

    const totalPushes = stats.records?.length || 0;
    const totalClicks = (stats.records || []).filter((r) => r.clicked).length;

    res.json({
      success: true,
      data: {
        totalPushes,
        todayPushes: todayRecords.length,
        totalClicks,
        clickRate: totalPushes > 0 ? Math.round((totalClicks / totalPushes) * 100) : 0,
        lastPushTime: stats.records?.[stats.records.length - 1]?.pushedAt || null,
      },
    });
  } catch (error) {
    console.error('获取推送统计失败:', error);
    res.status(500).json({ success: false, message: '获取推送统计失败' });
  }
});

/**
 * 记录推送事件
 * POST /api/notifications/record
 * Body: { topicId, topicTitle, userId? }
 */
router.post('/record', (req, res) => {
  try {
    const { topicId, topicTitle, userId } = req.body;

    if (!topicId || !topicTitle) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: topicId, topicTitle',
      });
    }

    const stats = readJsonFile(STATS_FILE, {
      totalPushes: 0,
      todayPushes: 0,
      totalClicks: 0,
      clickRate: 0,
      records: [],
    });

    stats.records.push({
      id: `push_${Date.now()}`,
      topicId,
      topicTitle,
      userId: userId || 'anonymous',
      pushedAt: new Date().toISOString(),
      clicked: false,
    });

    // 只保留最近1000条记录
    if (stats.records.length > 1000) {
      stats.records = stats.records.slice(-500);
    }

    writeJsonFile(STATS_FILE, stats);

    res.json({ success: true, message: '推送事件已记录' });
  } catch (error) {
    console.error('记录推送事件失败:', error);
    res.status(500).json({ success: false, message: '记录推送事件失败' });
  }
});

/**
 * 记录点击事件
 * POST /api/notifications/click
 * Body: { topicId, userId? }
 */
router.post('/click', (req, res) => {
  try {
    const { topicId, userId } = req.body;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: topicId',
      });
    }

    const stats = readJsonFile(STATS_FILE, {
      totalPushes: 0,
      todayPushes: 0,
      totalClicks: 0,
      clickRate: 0,
      records: [],
    });

    // 找到最近一条未点击的推送记录并标记
    for (let i = stats.records.length - 1; i >= 0; i--) {
      const record = stats.records[i];
      if (record.topicId === topicId && !record.clicked) {
        record.clicked = true;
        record.clickedAt = new Date().toISOString();
        break;
      }
    }

    writeJsonFile(STATS_FILE, stats);

    res.json({ success: true, message: '点击事件已记录' });
  } catch (error) {
    console.error('记录点击事件失败:', error);
    res.status(500).json({ success: false, message: '记录点击事件失败' });
  }
});

module.exports = router;
```

- [ ] **Step 2: 在 server/index.js 中注册通知路由**

```javascript
// 在现有路由注册区域添加（建议放在 app.use('/api/ai', aiRoutes); 后面）

// 通知偏好管理
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);
```

---

### Task 9: 在"发现"页面添加每日话题预览区域

**文件：**
- 修改：`src/screens/tabs/discover.tsx`

- [ ] **Step 1: 导入DailyTopicPreview组件**

```typescript
// 在文件顶部的导入区域添加
import DailyTopicPreview from '../../components/DailyTopicPreview';
```

- [ ] **Step 2: 在FlatList上方添加预览区域**

在 `renderAIHotTopicsSection()` 之后、FlatList 之前添加：

```tsx
{/* ==================== 每日精选话题预览 ==================== */}
<DailyTopicPreview onPress={() => {
  // 点击预览卡片时，先尝试跳转到通知设置
  // 如果用户想查看话题详情，导航到对应的ChatDetail
  console.log('每日精选话题被点击');
}} />
```

---

### Task 10: 端到端功能验证

**启动前后端服务，验证完整功能流程**

- [ ] **Step 1: 启动后端服务**

```bash
cd g:\ai-gongju\prd-debate\aichat-app\server
bun run dev
```

预期输出：`PRD辩论APP后端服务已成功启动！` 端口 9461

- [ ] **Step 2: 启动前端服务**

```bash
cd g:\ai-gongju\prd-debate\aichat-app
bun run dev
```

预期输出：Vite开发服务器启动，端口 8081

- [ ] **Step 3: 验证通知服务初始化**

打开浏览器控制台，查看日志：
```
[NotificationService] 初始化成功
[App] 每日精选话题推送已调度
```

- [ ] **Step 4: 验证通知设置页面**

1. 点击底部Tab "我"
2. 在菜单列表中找到"通知设置"项
3. 点击进入通知设置Modal
4. 验证：开关、时间选择、分类订阅、统计数据显示正常

- [ ] **Step 5: 发送测试通知**

在通知设置页点击"发送测试通知"按钮
预期：系统通知栏弹出测试通知

- [ ] **Step 6: 验证通知点击跳转**

点击测试通知
预期：App自动打开并跳转到辩论页面

- [ ] **Step 7: 验证"发现"页预览**

1. 切换到"发现"Tab
2. 确认每日精选话题预览卡片显示
3. 确认倒计时显示正常

---

### Task 11: 管理后台扩展（可选）

**文件：**
- 修改：`admin-dashboard/src/pages/Dashboard.tsx`

- [ ] **Step 1: 在管理后台仪表盘添加推送统计卡片**

在Dashboard.tsx中添加推送统计组件（建议放在现有统计卡片旁边）：

```tsx
// 新增推送统计卡片组件
const PushStatsCard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPushes: 0,
    todayPushes: 0,
    totalClicks: 0,
    clickRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPushStats();
  }, []);

  const fetchPushStats = async () => {
    try {
      const response = await fetch('http://localhost:9461/api/notifications/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取推送统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stat-card">加载中...</div>;
  }

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-icon">🔔</span>
        <h3>推送通知统计</h3>
      </div>
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.totalPushes}</span>
          <span className="stat-label">累计推送</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.todayPushes}</span>
          <span className="stat-label">今日推送</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalClicks}</span>
          <span className="stat-label">点击次数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.clickRate}%</span>
          <span className="stat-label">点击率</span>
        </div>
      </div>
    </div>
  );
};
```

---

## 三、测试计划

### 3.1 单元测试

| 测试项 | 测试方法 | 预期结果 |
|--------|---------|---------|
| NotificationService 单例 | 多次调用 `getInstance()` | 返回同一实例 |
| 获取每日话题 | 调用 `scheduleDailyTopic()` | 返回 true，日志输出话题标题 |
| 通知权限检查 | 调用 `checkPermission()` | 返回布尔值 |
| 设置持久化 | 更新设置后重新读取 | 设置值与更新前一致 |
| 推送记录 | 调用 `recordPush()` 和 `getPushStats()` | 统计数字正确 |

### 3.2 集成测试

| 测试项 | 前置条件 | 验证步骤 |
|--------|---------|---------|
| 通知服务初始化 | 启动整个项目 | 控制台输出初始化成功日志 |
| 权限请求 | 首次启动 | 浏览器弹出权限请求弹窗 |
| 通知调度 | 通知权限已授予 | 每日指定时间收到通知 |
| 通知点击跳转 | 收到通知 | 点击后跳转到正确页面 |

### 3.3 兼容性测试

| 平台 | 测试内容 | 预期表现 |
|------|---------|---------|
| Chrome | 通知权限、调度、点击跳转 | 正常工作 |
| Edge | 通知权限、调度、点击跳转 | 正常工作 |
| Firefox | 通知权限、调度、点击跳转 | 正常工作 |
| iOS Safari | 通知权限提示 | 显示但可能不支持定时调度 |
| Android Chrome | 通知权限、调度 | 正常工作 |

---

## 四、时间估算

| 阶段 | 任务 | 预估时间 |
|------|------|---------|
| **准备** | 安装依赖、配置项目 | 0.5小时 |
| **核心开发** | 通知服务 + Hook + 设置Modal | 3-4小时 |
| **UI集成** | 修改"我的"页、发现页预览 | 1-2小时 |
| **后端扩展** | API路由、数据持久化 | 1-2小时 |
| **测试验证** | 端到端测试、兼容性验证 | 1-2小时 |
| **管理后台** | 推送统计卡片 | 0.5-1小时 |
| **总计** | | **7-12小时（1-2天）** |

---

## 五、潜在风险与应对

| 风险 | 概率 | 影响 | 应对方案 |
|------|------|------|---------|
| Web端定时调度不精确 | 高 | 低 | 使用 setTimeout 降级 + 下次App启动时补偿推送 |
| 用户关闭通知权限 | 中 | 中 | 设置页显示引导，提供App内提示替代方案 |
| AI话题获取失败 | 中 | 中 | 使用预设热门话题兜底，延迟重试 |
| 多个Tab页同时监听通知 | 低 | 中 | 确保只在App.js创建一次监听器 |
| Android后台杀死任务 | 中 | 低 | 使用精确闹钟 + 启动时补偿检查 |
