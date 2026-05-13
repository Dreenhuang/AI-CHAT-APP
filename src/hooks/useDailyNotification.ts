import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNavigation, NavigationContainerRef } from '@react-navigation/native';
import NotificationService, { NotificationSettings, PushStats } from '../services/notificationService';

export interface NotificationState {
  isInitialized: boolean;
  permissionGranted: boolean;
  settings: NotificationSettings;
  stats: PushStats;
  lastPushedTopic: { id: string; title: string } | null;
}

export function useDailyNotification() {
  const navigation = useNavigation<NavigationContainerRef<any>>();
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
    if (!state.isInitialized || !navigation) return;

    try {
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

            try {
              navigation.navigate('ChatDetail', {
                id: `push_topic_${topicId}`,
                topicId,
              });
              console.log('[useDailyNotification] 通知点击跳转:', topicId);
            } catch (navError) {
              console.warn('[useDailyNotification] 导航失败:', navError);
            }
          }
        });

      if (Platform.OS === 'web') {
        setupWebNotificationHandler();
      }
    } catch (error) {
      console.warn('[useDailyNotification] 通知监听器设置失败:', error);
    }

    return () => {
      cleanup();
    };
  }, [state.isInitialized, navigation]);

  const setupWebNotificationHandler = () => {
    if ('serviceWorker' in navigator && navigation) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click' && event.data?.topicId) {
          try {
            navigation.navigate('ChatDetail', {
              id: `push_topic_${event.data.topicId}`,
              topicId: event.data.topicId,
            });
          } catch (navError) {
            console.warn('[useDailyNotification] Web通知导航失败:', navError);
          }
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
