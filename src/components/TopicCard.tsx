/**
 * 议题卡片组件 - TopicCard v2.0
 *
 * 视觉升级要点：
 * 1. 卡片采用精致阴影系统（三层深度：低/中/高）
 * 2. 顶部色条改为3px，更细腻
 * 3. 圆角统一为12px，保持一致性
 * 4. 移除所有emoji热度指示器，改用纯文字+进度条
 * 5. 分类标签使用半透明背景 + 实色文字
 * 6. 悬停效果（Web端）：轻微上浮 + 阴影加深
 *
 * 设计原则：
 * - 信息层级清晰：标题 > 描述 > 元信息
 * - 色彩克制：仅色条使用彩色，其余保持中性
 * - 留白舒适：内边距14px确保呼吸感
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Topic, TopicCategory } from '../types';
import { Colors } from '../theme/colors';
import { FontFamily, Typography } from '../theme/typography';

interface TopicCardProps {
  topic: Topic;
  /** 点击回调 */
  onPress: (topic: Topic) => void;
  /** 显示模式：default / compact */
  variant?: 'default' | 'compact';
}

// ============ 分类配置 ============

/** 分类对应的颜色配置（用于色条和标签） */
const categoryColors: Record<TopicCategory, string> = {
  tech: '#0EA5E9',        // 科技蓝（与主色调协调）
  education: '#059669',   // 教育绿
  social: '#D97706',      // 社会橙
  lifestyle: '#DB2777',   // 生活粉
  entertainment: '#7C3AED', // 娱乐紫
  sports: '#DC2626',      // 体育红
  politics: '#78716C',    // 政治灰
  economy: '#0891B2',     // 经济青
  culture: '#C2410C',     // 文化棕
  environment: '#65A30D', // 环境绿
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

// ============ 组件实现 ============

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onPress,
  variant = 'default',
}) => {
  const color = categoryColors[topic.category];

  /**
   * 热度等级计算（纯文字，无emoji）
   * @returns { label: string; level: number } level用于样式映射
   */
  const getHotLevel = (): { label: string; level: 1 | 2 | 3 | 4 } => {
    if (topic.hot >= 90) return { label: 'Hot', level: 4 };
    if (topic.hot >= 80) return { label: 'Trending', level: 3 };
    if (topic.hot >= 70) return { label: 'Recommended', level: 2 };
    return { label: 'Normal', level: 1 };
  };

  const hotLevel = getHotLevel();

  // ========== 紧凑模式渲染 ==========
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
            {/* 分类标签 */}
            <View style={[styles.categoryTag, { backgroundColor: color + '18' }]}>
              <Text style={[styles.categoryText, { color }]}>
                {categoryNames[topic.category]}
              </Text>
            </View>

            {/* 热度显示 */}
            <Text style={styles.hotText}>
              {hotLevel.label} ({topic.hot})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ========== 默认模式渲染 ==========
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(topic)}
      activeOpacity={0.7}
    >
      {/* 顶部色条 - 3px细线 */}
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

        {/* 底部元信息行 */}
        <View style={styles.metaRow}>
          <View style={styles.leftMeta}>
            {/* 分类标签 */}
            <View style={[styles.categoryTag, { backgroundColor: color + '18' }]}>
              <Text style={[styles.categoryText, { color }]}>
                {categoryNames[topic.category]}
              </Text>
            </View>

            {/* 热度进度条 */}
            <View style={styles.hotContainer}>
              <View style={styles.hotBarBg}>
                <View
                  style={[
                    styles.hotBarFill,
                    { width: `${topic.hot}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={styles.hotLabel}>{hotLevel.label}</Text>
            </View>
          </View>

          {/* 热度数值 */}
          <Text style={[styles.hotValue, { color }]}>
            {topic.hot}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============ 样式定义 ============

const styles = StyleSheet.create({
  // ========== 默认模式样式 ==========
  /**
   * 卡片容器设计：
   * - 背景：白色
   * - 圆角：12px（与全局一致）
   * - 阴影：中层深度（shadowOpacity: 0.06）
   * - 边框：无实线边框，用阴影表达边界
   */
  container: {
    backgroundColor: Colors.card,                // #FFFFFF
    borderRadius: 12,                             // 统一圆角
    marginHorizontal: 16,
    marginBottom: 12,

    // 阴影系统 - 中层深度
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,

    // 隐藏溢出（配合圆角）
    overflow: 'hidden',

    // Web端悬停效果通过onPress模拟
  },

  /** 顶部色条 - 3px细线 */
  colorBar: {
    height: 3,                                    // 从4px减至3px，更细腻
    width: '100%',
  },

  /** 内容区域 */
  content: {
    padding: 14,                                  // 内边距14px
  },

  // ========== 文字样式 ==========
  title: {
    fontSize: Typography.bodySecondary.fontSize,  // 15sp
    fontWeight: '600' as const,                   // SemiBold
    color: Colors.textPrimary,
    lineHeight: Typography.bodySecondary.lineHeight,
    marginBottom: 6,
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  description: {
    fontSize: Typography.caption.fontSize,         // 12sp
    color: Colors.textSecondary,                  // 科技灰
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  // ========== 元信息行 ==========
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

  // ========== 分类标签 ==========
  categoryTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,                              // 小圆角
    marginRight: 10,
  },

  categoryText: {
    fontSize: Typography.small.fontSize,           // 11sp
    fontWeight: '500' as const,                    // Medium
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  // ========== 热度进度条 ==========
  hotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  hotBarBg: {
    flex: 1,
    height: 4,                                    // 4px高度
    backgroundColor: '#F1F5F9',                   // 极浅灰背景
    borderRadius: 2,
    marginRight: 6,
    maxWidth: 80,
  },

  hotBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  hotLabel: {
    fontSize: Typography.small.fontSize,
    color: Colors.textSecondary,
    fontFamily: FontFamily.mono.split(',')[0].trim(), // 等宽字体
  },

  /** 热度数值显示 */
  hotValue: {
    fontSize: Typography.overline.fontSize,        // 10sp
    fontWeight: '600' as const,
    fontFamily: FontFamily.mono.split(',')[0].trim(), // 等宽字体
  },

  // ========== 紧凑模式样式 ==========
  compactContainer: {
    backgroundColor: Colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,                               // 紧凑模式圆角略小
    borderLeftWidth: 3,                           // 左侧色条
    flexDirection: 'row',
    alignItems: 'center',

    // 浅阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  compactContent: {
    flex: 1,
  },

  compactTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: FontFamily.primary.split(',')[0].trim(),
  },

  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  hotText: {
    fontSize: Typography.small.fontSize,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontFamily: FontFamily.mono.split(',')[0].trim(),
  },
});

export default TopicCard;
