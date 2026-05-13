import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AITopicService from './aitopicService';
import { useUserStore } from '../stores/useUserStore';

const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'daily-topics',
  CHANNEL_NAME: '每日精选话题',
  CHANNEL_DESCRIPTION: '每天早上推送一条精选辩论话题',
  DEFAULT_HOUR: 9,
  DEFAULT_MINUTE: 0,
  STORAGE_KEY: 'notification_settings',
};

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

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: NOTIFICATION_CONFIG.DEFAULT_HOUR,
  minute: NOTIFICATION_CONFIG.DEFAULT_MINUTE,
  soundEnabled: true,
  subscribedCategories: [],
  lastTopicId: null,
  lastPushDate: null,
};

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

  private async requestPermission(): Promise<boolean> {
    if (!Device.isDevice && Platform.OS === 'web') {
      if (!('Notification' in window)) {
        console.warn('[NotificationService] 浏览器不支持通知');
        return false;
      }
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

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

  async scheduleDailyTopic(): Promise<boolean> {
    try {
      const userPrefs = useUserStore.getState();
      if (!userPrefs.notificationsEnabled) {
        console.log('[NotificationService] 用户已关闭通知，跳过调度');
        return false;
      }

      const aiService = AITopicService.getInstance();
      const topics = await aiService.getHotTopics(true);

      if (!topics || topics.length === 0) {
        console.warn('[NotificationService] 无可推送的话题');
        return false;
      }

      const todayTopic = topics.sort((a, b) => b.heat - a.heat)[0];

      if (this.settings.lastTopicId === todayTopic.id) {
        const today = new Date().toDateString();
        if (this.settings.lastPushDate === today) {
          console.log('[NotificationService] 今日已推送，跳过');
          return true;
        }
      }

      await this.scheduleNotification(todayTopic);

      this.settings.lastTopicId = todayTopic.id;
      this.settings.lastPushDate = new Date().toDateString();
      this.saveSettings();

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

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '今日精选话题',
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

    if (Platform.OS === 'web') {
      this.setupWebCheckTimer(hour, minute, topic);
    }
  }

  private setupWebCheckTimer(
    hour: number,
    minute: number,
    topic: { id: string; title: string }
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

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('今日精选话题', {
          body: topic.title,
          tag: 'daily-topic',
          data: { topicId: topic.id, screen: 'ChatDetail' },
        });
      }
    }, delayMs);
  }

  async cancelScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[NotificationService] 已取消所有定时通知');
  }

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
        title: '测试通知',
        body: testTopic.title,
        data: { topicId: testTopic.id, type: 'test' },
      },
      trigger: null,
    });

    console.log('[NotificationService] 测试通知已发送');
  }
}

export default NotificationService;
