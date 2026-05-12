/**
 * Tab1: Chat List Screen - Discussions v2.0 (Tech Premium)
 *
 * Enhanced with:
 * - Modern gradient header with glass effect
 * - Smooth search animation
 * - Card-style conversation items with hover effects
 * - Professional typography (Inter font)
 * - Micro-interactions and transitions
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
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import components
import ConversationItem from '../../components/ConversationItem';
import EmptyState from '../../components/EmptyState';
import FABButton from '../../components/FABButton';
import LoadingAnimation from '../../components/LoadingAnimation';

// Import Store and types
import { useChatStore } from '../../stores/useChatStore';
import { Conversation } from '../../types';

// Import theme
import { Colors } from '../../theme/colors';

type NavigationProps = StackNavigationProp<any>;

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();

  // State management - get conversation list from store
  const {
    conversations,
    isLoading,
    setActiveConversation,
    clearUnreadCount,
  } = useChatStore();

  // Local state
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Animation value for search bar
  const searchAnimValue = React.useRef(new Animated.Value(0)).current;

  /**
   * Toggle search with smooth animation
   */
  const toggleSearch = useCallback(() => {
    if (!showSearch) {
      // Opening search
      setShowSearch(true);
      Animated.spring(searchAnimValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      // Closing search
      Animated.timing(searchAnimValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowSearch(false);
        setSearchText('');
      });
    }
  }, [showSearch, searchAnimValue]);

  /**
   * Filter conversation list based on search text
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
   * Handle conversation click event
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
   * Render single conversation item
   */
  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={handleConversationPress} />
  );

  /**
   * Render empty state component
   */
  const renderEmpty = () => {
    if (searchText.trim()) {
      return (
        <EmptyState
          icon="search"
          title="No Results Found"
          description={`No discussions matching "${searchText}"`}
          actionLabel="Clear Search"
          onActionPress={() => setSearchText('')}
        />
      );
    }

    return (
      <EmptyState
        icon="chatbubbles-outline"
          title="No Discussions Yet"
          description="Choose an interesting topic to start your first debate!"
          actionLabel="Browse Topics"
          onActionPress={() => (navigation as any).navigate('Discover')}
        />
      );
  };

  /**
   * Handle FAB button press
   */
  const handleFABPress = () => {
    (navigation as any).navigate('Discover');
  };

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.primary}
        translucent={false}
      />

      {/* ==================== Header Area ==================== */}
      <View style={styles.headerContainer}>
        {/* Gradient background for header */}
        <View style={styles.headerGradient}>
          {/* Header content */}
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Discussions</Text>
              {!showSearch && conversations.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{conversations.length}</Text>
                </View>
              )}
            </View>

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

        {/* ==================== Search Bar (Animated) ==================== */}
        {showSearch && (
          <Animated.View
            style={[
              styles.searchBarContainer,
              {
                opacity: searchAnimValue,
                transform: [{
                  translateY: searchAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={16}
                color={Colors.textSecondary}
                style={styles.searchInputIcon}
              />
              <RNTextInput
                style={styles.searchInput}
                placeholder="Search discussions..."
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
          </Animated.View>
        )}
      </View>

      {/* ==================== Content Area ==================== */}
      {isLoading ? (
        /* Loading state */
        <LoadingAnimation type="skeleton" text="Loading..." />
      ) : (
        /* Conversation list */
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filteredConversations.length === 0 
              ? styles.emptyList 
              : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}

          // Pull-to-refresh functionality
          onRefresh={() => console.log('Pull to refresh')}
          refreshing={false}

          // Performance optimization config
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          
          // Content inset for FAB button
          contentInset={{ bottom: 80 }}
        />
      )}

      {/* ==================== Floating Action Button (FAB) ==================== */}
      <FABButton
        icon="add"
        onPress={handleFABPress}
        style={styles.fab}
      />
    </View>
  );
};

// ==================== Styles Definition ====================
// Following the new tech design system

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ========== Header Styles ==========
  headerContainer: {
    zIndex: 10,
  },

  headerGradient: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
    borderBottomWidth: 0,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.5,
  },

  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========== Search Bar Styles ==========
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },

  searchInputIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: 'Inter',
    padding: 0,
  },

  resultBadge: {
    backgroundColor: Colors.primary,
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
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  // ========== List Styles ==========
  listContent: {
    paddingBottom: 80,
  },

  emptyList: {
    flex: 1,
  },

  // ========== FAB Button Style ==========
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
});

export default ChatListScreen;
