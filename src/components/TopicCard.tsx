/**
 * 议题卡片组件 - TopicCard
 * 
 * 用于发现页和议题选择页展示单个议题
 * 包含标题、描述、分类标签、热度指示器
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Topic, TopicCategory } from '../types';
import { Colors } from '../theme/colors';

interface TopicCardProps {
  topic: Topic;
  /** 点击回调 */
  onPress: (topic: Topic) => void;
  /** 显示模式：default / compact */
  variant?: 'default' | 'compact';
}

/** 分类对应的颜色配置 */
const categoryColors: Record<TopicCategory, string> = {
  tech: '#2196F3',
  education: '#4CAF50',
  social: '#FF9800',
  lifestyle: '#E91E63',
  entertainment: '#9C27B0',
  sports: '#F44336',
  politics: '#795548',
  economy: '#607D8B',
  culture: '#00BCD4',
  environment: '#8BC34A',
};

/** 分类中文名 */
const categoryNames: Record<TopicCategory, string> = {
  tech: '科技',
  education: '教育',
  social: '社会',
  lifestyle: '生活',
  entertainment: '娱乐',
  sports: '体育',
  politics: '政治',
  economy: '经济',
  culture: '文化',
  environment: '环境',
};

const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  onPress,
  variant = 'default',
}) => {
  const color = categoryColors[topic.category];
  
  // 热度等级
  const getHotLevel = (): { label: string; emoji: string } => {
    if (topic.hot >= 90) return { label: '爆火', emoji: '🔥' };
    if (topic.hot >= 80) return { label: '热门', emoji: '🔶' };
    if (topic.hot >= 70) return { label: '推荐', emoji: '⭐' };
    return { label: '普通', emoji: '💬' };
  };

  const hotLevel = getHotLevel();

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { borderLeftColor: color }]}
        onPress={() => onPress(topic)}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {topic.title}
          </Text>
          <View style={styles.compactMeta}>
            <View style={[styles.categoryTag, { backgroundColor: color + '20' }]}>
              <Text style={[styles.categoryText, { color }]}>
                {categoryNames[topic.category]}
              </Text>
            </View>
            <Text style={styles.hotText}>
              {hotLevel.emoji} {topic.hot}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(topic)}
      activeOpacity={0.7}
    >
      {/* 顶部色条 */}
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      
      {/* 内容区 */}
      <View style={styles.content}>
        {/* 标题行 */}
        <Text style={styles.title} numberOfLines={2}>
          {topic.title}
        </Text>
        
        {/* 描述（默认模式显示） */}
        <Text style={styles.description} numberOfLines={2}>
          {topic.description}
        </Text>
        
        {/* 底部元信息 */}
        <View style={styles.metaRow}>
          <View style={styles.leftMeta}>
            <View style={[styles.categoryTag, { backgroundColor: color + '20' }]}>
              <Text style={[styles.categoryText, { color }]}>
                {categoryNames[topic.category]}
              </Text>
            </View>
            
            {/* 热度条 */}
            <View style={styles.hotContainer}>
              <View style={styles.hotBarBg}>
                <View 
                  style={[
                    styles.hotBarFill, 
                    { width: `${topic.hot}%`, backgroundColor: color }
                  ]} 
                />
              </View>
              <Text style={styles.hotLabel}>{hotLevel.label}</Text>
            </View>
          </View>
          
          <Text style={styles.emoji}>{hotLevel.emoji}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 默认模式样式
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  hotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hotBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginRight: 6,
    maxWidth: 80,
  },
  hotBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  hotLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emoji: {
    fontSize: 18,
  },

  // 紧凑模式样式
  compactContainer: {
    backgroundColor: Colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});

export default TopicCard;
