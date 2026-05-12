/**
 * 悬浮按钮组件 - FAB (Floating Action Button) v2.0 (Tech Premium)
 * 
 * 用于创建新辩论、发起讨论等主要操作
 * 支持展开/收起动画（可选）
 * 
 * 升级内容：
 * - 使用 Ionicons 替代文本图标符号
 * - 优化动画交互体验
 * - 统一按钮视觉风格
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface FABButtonProps {
  /** 按钮文字 */
  label?: string;
  /** 图标名称（Ionicons） */
  icon?: keyof typeof Ionicons.glyphMap;
  /** 点击回调 */
  onPress: () => void;
  /** 是否显示扩展菜单（可选） */
  showMenu?: boolean;
  /** 扩展菜单项（可选） */
  menuItems?: Array<{
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }>;
  /** 自定义样式 */
  style?: object;
}

const FABButton: React.FC<FABButtonProps> = ({
  label,
  icon = 'add',
  onPress,
  showMenu = false,
  menuItems = [],
  style,
}) => {
  // 如果没有显示菜单，渲染简单的FAB
  if (!showMenu || menuItems.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.fab, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {!label ? (
          <Ionicons name={icon} size={28} color="#FFFFFF" />
        ) : (
          <View style={styles.fabContent}>
            <Ionicons name={icon} size={18} color="#FFFFFF" style={styles.fabIconSpace} />
            <Text style={styles.fabLabel}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // 渲染带菜单的FAB
  return (
    <View style={[styles.menuContainer, style]}>
      {/* 菜单项 */}
      {menuItems.map((item, index) => (
        <View key={item.id} style={styles.menuItemRow}>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          <TouchableOpacity
            style={styles.menuItemBubble}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon} size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      ))}

      {/* 主按钮 */}
      <TouchableOpacity
        style={[styles.fab, styles.fabMain]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name={showMenu ? 'close' : icon} size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // 基础FAB样式
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIconSpace: {
    marginRight: 6,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // 菜单模式样式
  menuContainer: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'flex-end',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  fabMain: {
    backgroundColor: Colors.primary,
  },
});

export default FABButton;
