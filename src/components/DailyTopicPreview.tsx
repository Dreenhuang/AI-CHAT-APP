import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import NotificationService from '../services/notificationService';
import AITopicService from '../services/aitopicService';

interface Props {
  onPress?: () => void;
}

const DailyTopicPreview: React.FC<Props> = ({ onPress }) => {
  const [topicPreview, setTopicPreview] = useState<{
    title: string;
    category: string;
    heat: number;
  } | null>(null);
  const [timeUntilPush, setTimeUntilPush] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const notificationService = NotificationService.getInstance();
  const settings = notificationService.getSettings();

  useEffect(() => {
    loadPreview();

    const timer = setInterval(updateCountdown, 60000);
    updateCountdown();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(timer);
  }, []);

  const loadPreview = async () => {
    try {
      const aiService = AITopicService.getInstance();
      const topics = await aiService.getHotTopics(false);
      if (topics && topics.length > 0) {
        const top = topics.sort((a, b) => b.heat - a.heat)[0];
        setTopicPreview({
          title: top.title,
          category: top.category,
          heat: top.heat,
        });
      }
    } catch {
      // 静默失败，不显示预览
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      settings.hour,
      settings.minute,
      0
    );

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    setTimeUntilPush(`${hours}小时${minutes}分钟`);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  if (!topicPreview) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.headerTitle}>今日精选话题</Text>
          </View>
          <View style={styles.countdownBadge}>
            <Ionicons name="time-outline" size={12} color="#FF6B35" />
            <Text style={styles.countdownText}>{timeUntilPush}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={[styles.categoryTag, getCategoryStyle(topicPreview.category)]}>
              <Text style={styles.categoryText}>{topicPreview.category}</Text>
            </View>
            <View style={styles.heatIndicator}>
              <Ionicons name="trending-up" size={12} color="#FF6B35" />
              <Text style={styles.heatText}>{topicPreview.heat}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {topicPreview.title}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Ionicons name="notifications" size={14} color={Colors.primary} />
          <Text style={styles.actionText}>
            {settings.enabled ? '推送已开启，到时自动提醒' : '推送已关闭，点击开启'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getCategoryStyle = (category: string) => {
  const styleMap: Record<string, { backgroundColor: string }> = {
    '科技': { backgroundColor: '#E3F2FD' },
    '社会': { backgroundColor: '#FFF3E0' },
    '经济': { backgroundColor: '#ECEFF1' },
    '教育': { backgroundColor: '#E8F5E9' },
    '文化': { backgroundColor: '#F1F8E9' },
    '生活': { backgroundColor: '#F3E5F5' },
    '娱乐': { backgroundColor: '#FCE4EC' },
    '环境': { backgroundColor: '#E0F2F1' },
  };
  return styleMap[category] || { backgroundColor: '#F5F5F5' };
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  countdownText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  heatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
});

export default DailyTopicPreview;
