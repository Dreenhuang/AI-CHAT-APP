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
import { allTopics, getRandomTopics, getTopicsByCategory, TopicCategory, Topic } from '../../data/topics';

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

  // 分批加载数量配置
  const BATCH_SIZE = 20; // 每批加载20个
  const MAX_DISPLAY = 100; // 最大显示数量（避免内存问题）

  /**
   * 初始化：加载首批30个议题（比原来增加50%）
   */
  useEffect(() => {
    loadInitialTopics();
  }, []);

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

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 重新加载新数据（完全替换）
    const newTopics = loadRandomTopics();
    setTopics(newTopics);
    setDisplayedTopics(newTopics);
    setHasMore(true); // 刷新后可以继续加载更多

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
});

export default DiscoverScreen;
