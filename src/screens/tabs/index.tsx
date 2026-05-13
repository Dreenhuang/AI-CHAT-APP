/**
 * Tab1: 会话列表页 - 讨论列表 v3.0 (Deep Tech Theme)
 *
 * 视觉升级要点：
 * 1. 导航栏采用深蓝渐变背景（#0A1929 -> #1E3A5F）
 * 2. 搜索框带动画过渡效果
 * 3. 会话列表卡片化展示
 * 4. 使用Inter字体 + 科技灰配色
 * 5. FAB按钮使用主色渐变
 * 6. 所有文本恢复中文显示
 *
 * 设计原则：
 * - 渐变导航栏营造沉浸式顶部区域
 * - 白色搜索框与导航栏形成对比
 * - 微交互增强操作反馈感
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 导入组件
import ConversationItem from '../../components/ConversationItem';
import EmptyState from '../../components/EmptyState';
import FABButton from '../../components/FABButton';
import LoadingAnimation from '../../components/LoadingAnimation';

// 导入Store和类型
import { useChatStore } from '../../stores/useChatStore';
import { Conversation } from '../../types';

// 导入主题配置
import { Colors } from '../../theme/colors';
import { FontFamily, Typography } from '../../theme/typography';

type NavigationProps = StackNavigationProp<any>;

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();

  // 状态管理 - 从Store获取会话列表
  const {
    conversations,
    isLoading,
    setActiveConversation,
    clearUnreadCount,
  } = useChatStore();

  // 本地状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  /**
   * 过滤会话列表
   * 根据搜索文本实时过滤，支持按标题和最后消息内容搜索
   */
  const filteredConversations = useMemo(() => {
    if (!searchText.trim()) {
      return conversations;
    }

    const searchLower = searchText.toLowerCase().trim();

    return conversations.filter((conv) => {
      const titleMatch = conv.topicTitle?.toLowerCase().includes(searchLower);
      const messageMatch = conv.lastMessage?.toLowerCase().includes(searchLower);
      const participantMatch = conv.participants.some((p) =>
        p.name.toLowerCase().includes(searchLower)
      );

      return titleMatch || messageMatch || participantMatch;
    });
  }, [conversations, searchText]);

  /**
   * 处理会话点击事件
   */
  const handleConversationPress = useCallback(
    (id: string) => {
      setActiveConversation(id);
      clearUnreadCount(id);
      navigation.navigate('ChatDetail', { id });
    },
    [navigation, setActiveConversation, clearUnreadCount]
  );

  /**
   * 渲染单个会话项
   */
  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={handleConversationPress} />
  );

  /**
   * 渲染空状态组件
   */
  const renderEmpty = () => {
    if (searchText.trim()) {
      return (
        <EmptyState
          icon="search-outline"
          title="未找到相关讨论"
          description={`没有找到包含"${searchText}"的讨论记录`}
          actionLabel="清除搜索"
          onActionPress={() => setSearchText('')}
        />
      );
    }

    return (
      <EmptyState
        icon="chatbubbles-outline"
        title="暂无讨论记录"
        description="选择一个感兴趣的议题，开始你的第一次辩论吧！"
        actionLabel="浏览议题"
        onActionPress={() => (navigation as any).navigate('Discover')}
      />
    );
  };

  /**
   * 处理FAB点击 - 跳转到发现页面创建新讨论
   */
  const handleFABPress = () => {
    // 跳转到发现页选择话题开始新讨论
    (navigation as any).navigate('Discover');
  };

  /**
   * 切换搜索框显示状态
   */
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchText('');
    }
  };

  return (
    <View style={styles.container}>
      {/* 状态栏 - 浅蓝色适配 */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />

      {/* ==================== 导航栏区域 - 浅蓝色统一风格 ==================== */}
      <View style={[styles.headerContainer, { backgroundColor: Colors.primary }]}>
        {/* 导航栏内容 */}
        <View style={styles.headerContent}>
          {/* 左侧：标题 + 计数徽章 */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>讨论</Text>
            {!showSearch && conversations.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {conversations.length}
                </Text>
              </View>
            )}
          </View>

          {/* 右侧：搜索按钮 */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={toggleSearch}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================== 搜索框（条件显示） ==================== */}
        {showSearch && (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={16}
                color={Colors.textSecondary}
                style={styles.searchInputIcon}
              />
              <RNTextInput
                style={styles.searchInput}
                placeholder="搜索讨论记录..."
                placeholderTextColor={Colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={showSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchText.trim() && (
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>
                    {filteredConversations.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ==================== 内容区域 ==================== */}
      {isLoading ? (
        /* 加载中状态 */
        <LoadingAnimation type="skeleton" text="加载中..." />
      ) : (
        /* 会话列表 */
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filteredConversations.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}

          // 下拉刷新功能
          onRefresh={() => console.log('下拉刷新')}
          refreshing={false}

          // 性能优化配置
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
        />
      )}

      {/* ==================== 悬浮创建按钮(FAB) ==================== */}
      <FABButton
        icon="add"
        onPress={handleFABPress}
        style={styles.fab}
      />
    </View>
  );
};

// ==================== 样式定义 ====================
// 基于深空科技主题的设计规范

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,           // #F8FAFC 极浅灰蓝背景
  },

  // ========== 导航栏样式 - 统一浅蓝色风格 ==========
  headerContainer: {
    zIndex: 10,
  },

  /** 导航栏内容布局 */
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,                              // 统一高度
    paddingHorizontal: 16,
  },

  /** 左侧标题区 */
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  /** 标题文字 */
  headerTitle: {
    fontSize: 22,                              // 大标题字号
    fontWeight: '700' as const,                 // Bold
    color: '#FFFFFF',                          // 白色文字
    fontFamily: FontFamily.primary.split(',')[0].trim(), // Inter字体
    letterSpacing: -0.5,                        // 紧凑字距
  },

  /** 计数徽章 */
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // 白色20%透明度
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,                           // 胶囊形状
  },

  countBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    fontFamily: FontFamily.mono.split(',')[0].trim(), // 等宽字体
  },

  /** 搜索按钮 */
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,                          // 圆形
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // 白色15%透明度
    justifyContent: 'center',
    alignItems: 'center',
  },

  /** 右侧图标容器 */
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // ========== 搜索框样式 ==========
  searchBarContainer: {
    backgroundColor: '#F8FAFC',                   // 极浅灰蓝背景
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',                  // 柔和边框
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',                   // 纯白背景
    borderRadius: 12,                             // 中等圆角
    paddingHorizontal: 14,
    height: 44,                                  // 标准高度
    borderWidth: 1.5,
    borderColor: '#E2E8F0',                      // 柔和边框
    shadowColor: '#0EA5E9',                      // 浅蓝色阴影（品牌色）
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  searchInputIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: FontFamily.primary.split(',')[0].trim(),
    padding: 0,
  },

  resultBadge: {
    backgroundColor: Colors.primary,            // 科技蓝
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },

  resultBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    fontFamily: FontFamily.mono.split(',')[0].trim(),
  },

  // ========== 列表样式 ==========
  listContent: {
    paddingBottom: 80,                           // 底部留白给FAB按钮
  },

  emptyList: {
    flex: 1,
  },

  // ========== FAB按钮样式 ==========
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,                                // TabBar上方
  },
});

export default ChatListScreen;
