/**
 * Tab3: Discover Screen v2.0 (Tech Premium)
 *
 * Enhanced with:
 * - Modern gradient header
 * - Category filter with smooth modal animation
 * - Card-style topic cards with hover effects
 * - Professional typography and spacing
 * - Pull-to-refresh with custom styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import TopicCard from '../../components/TopicCard';
import EmptyState from '../../components/EmptyState';

// 导入数据
import { allTopics, getRandomTopics, getFreshRandomTopics, getTopicsByCategory, TopicCategory, Topic } from '../../data/topics';

// 导入AI热门话题服务
import AITopicService, { AITopic as AIHotTopic } from '../../services/aitopicService';

// Import theme
import { Colors } from '../../theme/colors';

/** Screen dimensions for responsive design */
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Category configuration - 中英双语 */
const categories = [
  { key: 'all', label: '全部', icon: 'grid-outline' },
  { key: 'tech', label: '科技', icon: 'hardware-chip-outline' },
  { key: 'education', label: '教育', icon: 'school-outline' },
  { key: 'social', label: '社会', icon: 'people-outline' },
  { key: 'lifestyle', label: '生活', icon: 'leaf-outline' },
  { key: 'entertainment', label: '娱乐', icon: 'film-outline' },
  { key: 'sports', label: '体育', icon: 'fitness-outline' },
  { key: 'politics', label: '政治', flag: 'flag-outline' },
  { key: 'economy', label: '经济', icon: 'trending-up-outline' },
  { key: 'culture', label: '文化', icon: 'musical-notes-outline' },
  { key: 'environment', label: '环境', icon: 'earth-outline' },
];

const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation();

  // 本地状态
  const [topics, setTopics] = useState<Topic[]>([]);
  const [displayedTopics, setDisplayedTopics] = useState<Topic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // AI热门话题状态
  const [aiHotTopics, setAiHotTopics] = useState<AIHotTopic[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLastUpdate, setAiLastUpdate] = useState<string | null>(null);

  // 分批加载数量配置
  const BATCH_SIZE = 20; // 每批加载20个
  const MAX_DISPLAY = 100; // 最大显示数量（避免内存问题）

  /**
   * 初始化：加载首批30个议题 + AI热门话题
   */
  useEffect(() => {
    loadInitialTopics();
    loadAIHotTopics();
    
    // 启动AI话题自动更新（每24小时）
    const aiService = AITopicService.getInstance();
    aiService.startAutoUpdate(24 * 60 * 60 * 1000);  // 24小时

    return () => {
      aiService.stopAutoUpdate();  // 组件卸载时停止更新
    };
  }, []);

  /**
   * 加载AI热门话题
   */
  const loadAIHotTopics = async (forceRefresh = false) => {
    try {
      setAiLoading(true);
      setAiError(null);

      const aiService = AITopicService.getInstance();
      const topics = await aiService.getHotTopics(forceRefresh);

      if (topics && topics.length > 0) {
        setAiHotTopics(topics);
        setAiLastUpdate(new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }));
      } else {
        setAiError('暂无AI热点数据');
      }
    } catch (error: any) {
      console.error('加载AI热门话题失败:', error);
      setAiError(error.message || '加载失败');
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * 加载初始话题（30个）
   */
  const loadInitialTopics = () => {
    let initialTopics: Topic[];

    if (selectedCategory === '全部') {
      initialTopics = getRandomTopics(30); // 首次加载30个（原为20）
    } else {
      const filtered = getTopicsByCategory(selectedCategory as TopicCategory);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      initialTopics = shuffled.slice(0, Math.min(30, filtered.length));
    }

    setTopics(initialTopics);
    setDisplayedTopics(initialTopics);
    setHasMore(initialTopics.length >= BATCH_SIZE && topics.length < MAX_DISPLAY);
  };

  /**
   * 加载随机议题（用于刷新）
   */
  const loadRandomTopics = () => {
    if (selectedCategory === '全部') {
      return getRandomTopics(BATCH_SIZE);
    } else {
      const filtered = getTopicsByCategory(selectedCategory as TopicCategory);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(BATCH_SIZE, filtered.length));
    }
  };

  /**
   * 下拉刷新处理
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // 同时刷新普通议题和AI热门话题
    await Promise.all([
      (async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        const newTopics = loadRandomTopics();
        setTopics(newTopics);
        setDisplayedTopics(newTopics);
        setHasMore(true);
      })(),
      loadAIHotTopics(true),  // 强制刷新AI话题
    ]);

    setRefreshing(false);
  }, [selectedCategory]);

  /**
   * 加载更多话题（滚动到底部触发）
   */
  const loadMoreTopics = useCallback(async () => {
    // 防止重复加载或已无更多数据
    if (loadingMore || !hasMore || displayedTopics.length >= MAX_DISPLAY) {
      return;
    }

    setLoadingMore(true);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      let moreTopics: Topic[];

      if (selectedCategory === '全部') {
        // 从全部200个中随机获取新的BATCH_SIZE个（避免重复）
        const existingIds = new Set(displayedTopics.map(t => t.id));
        const availableTopics = allTopics.filter(t => !existingIds.has(t.id));
        const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
        moreTopics = shuffled.slice(0, BATCH_SIZE);
      } else {
        // 按分类筛选后获取更多
        const filtered = getTopicsByCategory(selectedCategory as TopicCategory);
        const existingIds = new Set(displayedTopics.map(t => t.id));
        const availableTopics = filtered.filter(t => !existingIds.has(t.id));
        const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
        moreTopics = shuffled.slice(0, BATCH_SIZE);
      }

      if (moreTopics.length > 0) {
        // 追加到现有列表
        const updatedTopics = [...displayedTopics, ...moreTopics];
        setDisplayedTopics(updatedTopics);
        setTopics(updatedTopics);

        // 检查是否还有更多可加载
        setHasMore(moreTopics.length >= BATCH_SIZE && updatedTopics.length < MAX_DISPLAY);
      } else {
        // 没有更多数据了
        setHasMore(false);
      }
    } catch (error) {
      console.error('[Discover] 加载更多失败:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, displayedTopics, selectedCategory]);

  /**
   * 渲染底部加载指示器
   */
  const renderFooter = () => {
    if (!hasMore && displayedTopics.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>— 已经到底啦 —</Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.loadingText}>正在加载更多...</Text>
        </View>
      );
    }

    return null;
  };

  /**
   * 处理分类选择
   */
  const handleFilterSelect = (category: string) => {
    setSelectedCategory(category);
    setShowFilter(false);

    // 重置加载状态并重新加载
    setHasMore(true);
    setLoadingMore(false);

    if (category === '全部') {
      const newTopics = getRandomTopics(30);
      setTopics(newTopics);
      setDisplayedTopics(newTopics);
    } else {
      // 按分类筛选后随机取30个
      const filtered = getTopicsByCategory(category as TopicCategory);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const newTopics = shuffled.slice(0, Math.min(30, filtered.length));
      setTopics(newTopics);
      setDisplayedTopics(newTopics);
    }
  };

  /**
   * Handle topic click - Start debate
   */
  const handleStartDebate = (topic: any) => {
    console.log('Start debate:', topic.title);
    (navigation as any).navigate('ChatDetail', {
      id: `new_topic_${topic.id}`,
      topicId: topic.id,
    });
  };

  /**
   * Render topic card
   */
  const renderTopicCard = ({ item }: { item: any }) => (
    <TopicCard
      topic={item}
      onPress={handleStartDebate}
      variant="default"
    />
  );

  /**
   * Render AI Hot Topics Section - 渲染AI智能热点区域
   */
  const renderAIHotTopicsSection = () => {
    if (aiLoading && aiHotTopics.length === 0) {
      return (
        <View style={styles.aiSectionContainer}>
          <View style={styles.aiHeader}>
            <View style={styles.aiHeaderLeft}>
              <Ionicons name="flash" size={20} color="#FF6B35" />
              <Text style={styles.aiTitle}>AI 智能热点</Text>
              <View style={[styles.aiBadge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.aiBadgeText, { color: '#1976D2' }]}>加载中...</Text>
              </View>
            </View>
          </View>
          <View style={styles.aiLoadingContainer}>
            <View style={styles.aiSkeleton} />
            <View style={styles.aiSkeleton} />
            <View style={styles.aiSkeleton} />
          </View>
        </View>
      );
    }

    if (aiError && aiHotTopics.length === 0) {
      return (
        <View style={styles.aiSectionContainer}>
          <View style={styles.aiHeader}>
            <View style={styles.aiHeaderLeft}>
              <Ionicons name="flash" size={20} color="#FF6B35" />
              <Text style={styles.aiTitle}>AI 智能热点</Text>
              <TouchableOpacity onPress={() => loadAIHotTopics(true)}>
                <Text style={styles.aiRetryText}>重试</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.aiErrorContainer}>
            <Ionicons name="warning-outline" size={24} color="#FF9800" />
            <Text style={styles.aiErrorText}>{aiError}</Text>
          </View>
        </View>
      );
    }

    if (aiHotTopics.length === 0) return null;

    return (
      <View style={styles.aiSectionContainer}>
        {/* Header */}
        <View style={styles.aiHeader}>
          <View style={styles.aiHeaderLeft}>
            <Ionicons name="flash" size={20} color="#FF6B35" />
            <Text style={styles.aiTitle}>AI 智能热点</Text>
            <View style={[styles.aiBadge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.aiBadgeText, { color: '#F57C00' }]}>今日更新</Text>
            </View>
          </View>
          {aiLastUpdate && (
            <Text style={styles.aiUpdateTime}>更新于 {aiLastUpdate}</Text>
          )}
        </View>

        {/* Topics List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.aiTopicsScroll}
        >
          {aiHotTopics.map((topic, index) => (
            <TouchableOpacity
              key={topic.id || index}
              style={styles.aiTopicCard}
              onPress={() => handleStartAIDebate(topic)}
              activeOpacity={0.7}
            >
              {/* Heat indicator */}
              <View style={[
                styles.heatIndicator,
                { backgroundColor: topic.heat >= 95 ? '#FF1744' : topic.heat >= 90 ? '#FF6D00' : '#FFAB00' }
              ]}>
                <Text style={styles.heatText}>{topic.heat}</Text>
              </View>

              {/* Category tag */}
              <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(topic.category) + '20' }]}>
                <Text style={[styles.categoryText, { color: getCategoryColor(topic.category) }]}>
                  {topic.category}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.aiTopicTitle} numberOfLines={2}>
                {topic.title}
              </Text>

              {/* Keywords */}
              <View style={styles.keywordsContainer}>
                {topic.keywords.slice(0, 3).map((keyword, idx) => (
                  <View key={idx} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>

              {/* Description preview */}
              <Text style={styles.aiTopicDesc} numberOfLines={2}>
                {topic.description}
              </Text>

              {/* Action hint */}
              <View style={styles.actionHint}>
                <Ionicons name="chatbubbles" size={14} color={Colors.primary} />
                <Text style={styles.actionHintText}>点击讨论</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  /**
   * Handle start AI debate - 处理AI话题点击
   */
  const handleStartAIDebate = (topic: AIHotTopic) => {
    console.log('Start AI debate:', topic.title);
    
    const convertedTopic = {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      category: topic.category as TopicCategory,
      heat: topic.heat,
    };

    (navigation as any).navigate('ChatDetail', {
      id: `new_ai_${topic.id}`,
      topicId: topic.id,
      aiTopic: convertedTopic,
    });
  };

  /**
   * Get category color - 获取分类颜色
   */
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      '科技': '#2196F3',
      '教育': '#4CAF50',
      '社会': '#FF9800',
      '生活': '#9C27B0',
      '娱乐': '#E91E63',
      '体育': '#00BCD4',
      '政治': '#795548',
      '经济': '#607D8B',
      '文化': '#8BC34A',
      '环境': '#009688',
    };
    return colors[category] || '#9E9E9E';
  };

  /**
   * Render empty component
   */
  const renderEmptyComponent = () => (
    <EmptyState
      icon="search"
      title="暂无议题"
      description="尝试切换其他分类？"
    />
  );

  return (
    <View style={styles.container}>
      {/* Status bar - 浅蓝色适配 */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />

      {/* ==================== Header - 浅蓝色统一风格（无副标题） ==================== */}
      <View style={[styles.headerContainer, { backgroundColor: Colors.primary }]}>
        {/* 标题 */}
        <Text style={styles.headerTitle}>发现</Text>
      </View>

      {/* ==================== Filter Bar - 专业布局设计 ==================== */}
      <View style={styles.filterContainer}>
        {/* 左侧：分类选择器 */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={18} color={Colors.primary} style={styles.filterIcon} />
          <Text style={styles.filterLabel}>分类</Text>
          <Text style={styles.filterValue}>{selectedCategory}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* 右侧：计数徽章 */}
        <View style={styles.countContainer}>
          <Text style={styles.countLabel}>共</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{topics.length}</Text>
          </View>
          <Text style={styles.countLabel}>个议题</Text>
        </View>
      </View>

      {/* ==================== AI Hot Topics Section - 智能热点区域 ==================== */}
      {renderAIHotTopicsSection()}

      {/* ==================== Category Selection Modal ==================== */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <View style={styles.modalContent}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择分类</Text>
              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Category grid/list */}
            <FlatList
              data={categories}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory === item.label && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleFilterSelect(item.label)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryLeft}>
                    <Ionicons
                      name={(item.icon || item.flag || 'ellipse') as any}
                      size={18}
                      color={selectedCategory === item.label ? Colors.primary : Colors.textSecondary}
                      style={styles.categoryIcon}
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === item.label && styles.categoryTextSelected,
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  {selectedCategory === item.label && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.categoryListContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ==================== Topic Cards List ==================== */}
      <FlatList
        data={displayedTopics}
        keyExtractor={(item) => item.id}
        renderItem={renderTopicCard}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={
          displayedTopics.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}

        // ========== 加载更多配置 ==========
        onEndReached={loadMoreTopics}
        onEndReachedThreshold={0.3} // 距离底部30%时触发加载
        initialNumToRender={15} // 首次渲染数量（优化性能）
        maxToRenderPerBatch={10} // 每批渲染最大数量
        windowSize={21} // 视窗大小（影响渲染范围）
        removeClippedSubviews={true} // 移除屏幕外子视图
        updateCellsBatchingPeriod={50} // 批量更新间隔(ms)
      />
    </View>
  );
};

// ==================== Styles Definition ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ========== Header Styles - 统一浅蓝色风格（无副标题） ==========
  headerContainer: {
    height: 44,                              // 统一高度
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  headerTitle: {
    fontSize: 17,                            // 统一标题字号
    fontWeight: '700' as const,               // Bold
    color: '#FFFFFF',                        // 白色文字
    fontFamily: 'Inter',
    letterSpacing: -0.5,                      // 紧凑字距
  },

  // ========== Filter Bar Styles - 专业布局设计 ==========
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  /** 分类选择按钮 */
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  filterIcon: {
    marginRight: 6,
  },

  filterLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 4,
  },

  filterValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginRight: 4,
  },

  /** 计数容器 */
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },

  countNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },

  // ========== Modal Styles ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    maxHeight: SCREEN_WIDTH * 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
    letterSpacing: -0.3,
  },

  closeButton: {
    padding: 4,
  },

  categoryListContent: {
    paddingBottom: 8,
  },

  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  categoryItemSelected: {
    backgroundColor: `${Colors.primary}08`,
  },

  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  categoryIcon: {
    width: 28,
    marginRight: 12,
  },

  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
  },

  categoryTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========== List Styles ==========// 列表样式
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyListContent: {
    flex: 1,
  },

  // 底部加载样式
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.primary,
  },

  // ========== AI Hot Topics Styles - AI智能热点样式 ==========
  aiSectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  aiTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginLeft: 8,
    fontFamily: 'Inter',
  },

  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },

  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  aiUpdateTime: {
    fontSize: 12,
    color: '#9E9E9E',
    fontFamily: 'Inter',
  },

  aiRetryText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },

  aiLoadingContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  aiSkeleton: {
    width: (SCREEN_WIDTH - 80) / 3,
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },

  aiErrorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiErrorText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },

  aiTopicsScroll: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },

  aiTopicCard: {
    width: 160,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginRight: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  heatIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  heatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },

  aiTopicTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: 'Inter',
  },

  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },

  keywordTag: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },

  keywordText: {
    fontSize: 10,
    color: '#3F51B5',
  },

  aiTopicDesc: {
    fontSize: 12,
    color: '#616161',
    lineHeight: 16,
    marginBottom: 8,
  },

  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  actionHintText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default DiscoverScreen;
