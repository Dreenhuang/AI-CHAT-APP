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

  useEffect(() => {
    if (!state.isInitialized) return;

    notificationListenerRef.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        if (data?.topicId) {
          console.log('[useDailyNotification] 收到通知:', data.topicId);
        }
      });

    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.topicId && data?.screen === 'ChatDetail') {
          const topicId = data.topicId;
          const topicTitle = data.title || '';

          notificationService.markAsClicked(topicId);

          setState((prev) => ({
            ...prev,
            stats: notificationService.getPushStats(),
            lastPushedTopic: { id: topicId, title: topicTitle },
          }));

          navigation.navigate('ChatDetail' as never, {
            id: `push_topic_${topicId}`,
            topicId,
          } as never);

          console.log('[useDailyNotification] 通知点击跳转:', topicId);
        }
      });

    if (Platform.OS === 'web') {
      setupWebNotificationHandler();
    }

    return () => {
      cleanup();
    };
  }, [state.isInitialized, navigation]);

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

  const cleanup = () => {
    if (notificationListenerRef.current) {
      Notifications.removeNotificationSubscription(notificationListenerRef.current);
    }
    if (responseListenerRef.current) {
      Notifications.removeNotificationSubscription(responseListenerRef.current);
    }
  };

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
