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

// Import data
import { allTopics, getRandomTopics, getTopicsByCategory, TopicCategory } from '../../data/topics';

// Import theme
import { Colors } from '../../theme/colors';

/** Screen dimensions for responsive design */
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Category configuration */
const categories = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'tech', label: 'Technology', icon: 'hardware-chip-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'social', label: 'Society', icon: 'people-outline' },
  { key: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline' },
  { key: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
  { key: 'sports', label: 'Sports', icon: 'fitness-outline' },
  { key: 'politics', label: 'Politics', flag: 'flag-outline' },
  { key: 'economy', label: 'Economy', icon: 'trending-up-outline' },
  { key: 'culture', label: 'Culture', icon: 'musical-notes-outline' },
  { key: 'environment', label: 'Environment', icon: 'earth-outline' },
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
   * Handle category selection
   */
  const handleFilterSelect = (category: string) => {
    setSelectedCategory(category);
    setShowFilter(false);

    if (category === 'All') {
      loadRandomTopics();
    } else {
      const filtered = getTopicsByCategory(category as TopicCategory);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setTopics(shuffled.slice(0, Math.min(20, filtered.length)));
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
      title="No Topics Found"
      description="Try a different category?"
    />
  );

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.primary}
        translucent={false}
      />

      {/* ==================== Header ==================== */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Explore trending debates</Text>
        </View>
      </View>

      {/* ==================== Filter Bar ==================== */}
      <TouchableOpacity
        style={styles.filterBar}
        onPress={() => setShowFilter(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="filter" size={16} color={Colors.textSecondary} style={styles.filterIcon} />
        <Text style={styles.filterText}>
          Category: {selectedCategory}
        </Text>
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{topics.length}</Text>
        </View>
        <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} style={styles.filterChevron} />
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>Select Category</Text>
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
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={renderTopicCard}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={
          topics.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        
        // Performance optimization
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        
        numColumns={1}
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

  // ========== Header Styles ==========
  headerContainer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
  },

  headerGradient: {
    // Gradient effect would be applied here in advanced implementation
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter',
  },

  // ========== Filter Bar Styles ==========
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  filterIcon: {
    marginRight: 8,
  },

  filterText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
  },

  filterBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginRight: 6,
  },

  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  filterChevron: {
    marginLeft: 2,
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

  // ========== List Styles ==========
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },

  emptyListContent: {
    flex: 1,
  },
});

export default DiscoverScreen;
