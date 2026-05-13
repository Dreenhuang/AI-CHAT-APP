/**
 * AI Chat - 主入口文件 v2.0
 *
 * 视觉升级要点：
 * 1. TabBar采用金属质感设计（毛玻璃效果+微妙阴影）
 * 2. 选中态使用科技蓝渐变高亮
 * 3. 未选中态使用金属灰色，保持低调
 * 4. 整体风格：现代简约、专业高级、无emoji
 *
 * 技术实现：
 * - 使用React Navigation的tabBarStyle自定义样式
 * - 通过LinearGradient实现渐变效果
 * - 使用平台检测确保iOS/Android/Web一致性
 * - 登录流程: 支持游客模式和正式登录
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 导入Tab页面组件
import ChatListScreen from './screens/tabs/index';
import ContactsScreen from './screens/tabs/contacts';
import DiscoverScreen from './screens/tabs/discover';
import ProfileScreen from './screens/tabs/me';

// 导入其他页面组件
import ChatDetailScreen from './screens/chat/[id]';
import LoginScreen from './screens/LoginScreen';

// 导入Soul角色管理页面
import { SoulsManagement } from './pages/Souls';

// 导入主题配置 - 使用新的深空科技主题
import { Colors } from './theme/colors';
import { FontFamily } from './theme/typography';

// 导入用户状态管理
import { useUserStore } from './stores/useUserStore';

// 导入连接监控
import { startConnectionMonitor } from './services/connectionMonitor';

// 导入通知服务
import NotificationService from './services/notificationService';
import { useDailyNotification } from './hooks/useDailyNotification';

// ============ 导航器创建 ============

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============ 通知监听组件（必须在 NavigationContainer 内部） ============

const DailyNotificationWatcher: React.FC = () => {
  useDailyNotification();
  return null;
};

// ============ 设计常量 ============

/** Tab图标映射 - 使用outline/filled区分状态 */
const getTabIcon = (routeName: string, focused: boolean) => {
  const iconMap: Record<string, { active: string; inactive: string }> = {
    ChatList: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
    Contacts: { active: 'people', inactive: 'people-outline' },
    Discover: { active: 'compass', inactive: 'compass-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };

  const config = iconMap[routeName] || { active: 'ellipse', inactive: 'ellipse-outline' };
  return focused ? config.active : config.inactive;
};

/** Tab栏标签 */
const getTabLabel = (routeName: string): string => {
  const labelMap: Record<string, string> = {
    ChatList: '讨论',
    Contacts: '通讯录',
    Discover: '发现',
    Profile: '我',
  };
  return labelMap[routeName] || routeName;
};

// ============ 自定义TabBar图标组件 ============

interface TabIconProps {
  routeName: string;
  focused: boolean;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ routeName, focused, color, size }) => {
  const iconName = getTabIcon(routeName, focused);

  return (
    <Ionicons
      name={iconName as any}
      size={size}
      color={color}
      style={{
        transform: [{ scale: focused ? 1.05 : 1 }],
      }}
    />
  );
};

// ============ Tab导航配置 ============

const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,

      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(148, 163, 184, 0.2)',
        height: Platform.OS === 'ios' ? 83 : 56,
        paddingBottom: Platform.OS === 'ios' ? 8 : 8,
        paddingTop: 8,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
      },

      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.metallicSilver,

      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500' as const,
        marginTop: 3,
        fontFamily: FontFamily.primary.split(',')[0].trim(),
        letterSpacing: 0.1,
      },

      tabBarIcon: ({ focused, color }) => (
        <TabIcon
          routeName={route.name}
          focused={focused}
          color={color}
          size={24}
        />
      ),

      tabBarItemStyle: {
        paddingVertical: 4,
      },
    })}
  >
    <Tab.Screen name="ChatList" component={ChatListScreen} options={{ tabBarLabel: getTabLabel('ChatList') }} />
    <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarLabel: getTabLabel('Contacts') }} />
    <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarLabel: getTabLabel('Discover') }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: getTabLabel('Profile') }} />
  </Tab.Navigator>
);

// ============ 主应用组件 ============

export default function App() {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  console.log('[App] 渲染App组件, isLoggedIn:', isLoggedIn);

  useEffect(() => {
    try {
      startConnectionMonitor();
    } catch (error) {
      console.warn('[App] 连接监控启动失败:', error);
    }
  }, []);

  useEffect(() => {
    const initNotification = async () => {
      try {
        const service = NotificationService.getInstance();
        const granted = await service.initialize();
        if (granted) {
          const userPrefs = useUserStore.getState();
          if (userPrefs.notificationsEnabled) {
            await service.scheduleDailyTopic();
          }
        }
      } catch (error) {
        console.warn('[App] 初始化推送服务失败:', error);
      }
    };
    initNotification();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            {isLoggedIn ? (
              <>
                <Stack.Screen name="MainTabs" component={TabNavigator} options={{ gestureEnabled: false }} />
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ presentation: 'card', gestureEnabled: true }} />
                <Stack.Screen name="SoulsManagement" component={SoulsManagement} options={{ presentation: 'modal', gestureEnabled: true }} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ gestureEnabled: false }} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ presentation: 'card', gestureEnabled: true }} />
              </>
            )}
          </Stack.Navigator>
          <DailyNotificationWatcher />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const appStyles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  indicatorOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 8, right: 60, zIndex: 9999, elevation: 9999 },
});
