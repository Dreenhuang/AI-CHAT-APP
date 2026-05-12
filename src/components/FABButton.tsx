/**
 * 悬浮按钮组件 - FAB (Floating Action Button)
 * 
 * 用于创建新辩论、发起讨论等主要操作
 * 支持展开/收起动画（可选）
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../theme/colors';

interface FABButtonProps {
  /** 按钮文字 */
  label?: string;
  /** 图标（使用文字或emoji） */
  icon?: string;
  /** 点击回调 */
  onPress: () => void;
  /** 是否显示扩展菜单（可选） */
  showMenu?: boolean;
  /** 扩展菜单项（可选） */
  menuItems?: Array<{
    id: string;
    label: string;
    icon: string;
    onPress: () => void;
  }>;
  /** 自定义样式 */
  style?: object;
}

const FABButton: React.FC<FABButtonProps> = ({
  label,
  icon = '+',
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
        {icon && !label ? (
          <Text style={styles.fabIcon}>{icon}</Text>
        ) : (
          <View style={styles.fabContent}>
            {icon && <Text style={[styles.fabIcon, styles.fabIconSmall]}>{icon}</Text>}
            {label && <Text style={styles.fabLabel}>{label}</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // 渲染带菜单的FAB（简化版，实际可添加动画）
  return (
    <View style={[styles.menuContainer, style]}>
      {/* 菜单项 */}
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemBubble}>
            <Text style={styles.menuItemIcon}>{item.icon}</Text>
          </View>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      {/* 主按钮 */}
      <TouchableOpacity
        style={[styles.fab, styles.fabMain]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
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
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  fabIconSmall: {
    fontSize: 18,
    marginRight: 4,
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
  menuItem: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  fabMain: {
    backgroundColor: Colors.primary,
  },
});

export default FABButton;
