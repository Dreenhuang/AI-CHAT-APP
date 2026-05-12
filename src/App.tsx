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

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Platform } from 'react-native';
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

// 导入主题配置 - 使用新的深空科技主题
import { Colors } from './theme/colors';
import { FontFamily } from './theme/typography';

// 导入用户状态管理
import { useUserStore } from './stores/useUserStore';

// ============ 导航器创建 ============

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

/**
 * 自定义Tab图标
 * - 选中态：实心图标 + 科技蓝
 * - 未选中态：线框图标 + 金属灰
 */
const TabIcon: React.FC<TabIconProps> = ({ routeName, focused, color, size }) => {
  const iconName = getTabIcon(routeName, focused);

  return (
    <Ionicons
      name={iconName as any}
      size={size}
      color={color}
      // 添加微妙的缩放动画效果（选中时略大）
      style={{
        transform: [{ scale: focused ? 1.05 : 1 }],
      }}
    />
  );
};

// ============ Tab导航配置 ============

/**
 * Tab导航组件（包含4个Tab）
 *
 * 视觉设计规范：
 * - 背景：纯白 + 顶部微妙分割线
 * - 高度：50px（含安全区域适配）
 * - 选中色：Colors.primary（科技蓝 #0EA5E9）
 * - 未选中色：Colors.metallicSilver（金属银 #94A3B8）
 * - 字体：10sp Medium权重
 */
const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,

      // ========== TabBar样式 - 金属质感设计 ==========
      tabBarStyle: {
        // 背景与边框
        backgroundColor: '#FFFFFF',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(148, 163, 184, 0.2)', // 金属银半透明

        // 尺寸与定位
        height: Platform.OS === 'ios' ? 83 : 56, // iOS包含安全区域
        paddingBottom: Platform.OS === 'ios' ? 8 : 8,
        paddingTop: 8,
        paddingHorizontal: 8,

        // 阴影 - 微妙提升感
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
      },

      // ========== 颜色配置 ==========
      tabBarActiveTintColor: Colors.primary,           // 选中：科技蓝 #0EA5E9
      tabBarInactiveTintColor: Colors.metallicSilver,   // 未选中：金属银 #94A3B8

      // ========== 标签文字样式 ==========
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500' as const,
        marginTop: 3,
        fontFamily: FontFamily.primary.split(',')[0].trim(), // 使用Inter字体
        letterSpacing: 0.1,
      },

      // ========== 图标配置 ==========
      tabBarIcon: ({ focused, color }) => (
        <TabIcon
          routeName={route.name}
          focused={focused}
          color={color}
          size={24}
        />
      ),

      // ========== 动画配置 ==========
      tabBarItemStyle: {
        paddingVertical: 4,
      },
    })}
  >
    <Tab.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{ tabBarLabel: getTabLabel('ChatList') }}
    />

    <Tab.Screen
      name="Contacts"
      component={ContactsScreen}
      options={{ tabBarLabel: getTabLabel('Contacts') }}
    />

    <Tab.Screen
      name="Discover"
      component={DiscoverScreen}
      options={{ tabBarLabel: getTabLabel('Discover') }}
    />

    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarLabel: getTabLabel('Profile') }}
    />
  </Tab.Navigator>
);

// ============ 主应用组件 ============

/**
 * App主入口 - 根据登录状态动态渲染
 *
 * 逻辑说明：
 * 1. 检查useUserStore.isAuthenticated状态
 * 2. 已登录 → 直接显示MainTabs（主功能页面）
 * 3. 未登录 → 显示Login页面（登录/注册）
 * 4. 登录成功后自动跳转到MainTabs
 */
export default function App() {
  // 获取用户登录状态（注意：UserStore使用的是isLoggedIn字段）
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  console.log('[App] 渲染App组件, isLoggedIn:', isLoggedIn);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {isLoggedIn ? (
            <>
              {/* 已登录：直接显示主Tab导航 */}
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{ gestureEnabled: false }} // 禁止返回到登录页
              />

              {/* 聊天详情页（子页面） */}
              <Stack.Screen
                name="ChatDetail"
                component={ChatDetailScreen}
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
            </>
          ) : (
            <>
              {/* 未登录：显示登录页面 */}
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  gestureEnabled: false, // 隐藏返回按钮
                }}
              />

              {/* 登录后的主Tab导航 */}
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
              />

              {/* 聊天详情页（子页面） */}
              <Stack.Screen
                name="ChatDetail"
                component={ChatDetailScreen}
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
