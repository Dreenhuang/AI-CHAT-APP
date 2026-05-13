/**
 * 搜索栏组件 (SearchBar)
 *
 * 功能说明：
 * 提供用户列表的搜索和筛选功能
 *
 * 核心功能：
 * 1. 实时搜索（用户名/邮箱，支持防抖）
 * 2. 角色筛选：全部/管理员/编辑/观众
 * 3. 状态筛选：全部/活跃/禁用
 * 4. 高级筛选面板（展开/收起）
 * 5. 已选筛选条件显示为Tag
 *
 * 设计特点：
 * - Apple风格圆角输入框
 * - 流畅的展开/收起动画
 * - 清晰的视觉层次
 *
 * @module SearchBar
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Styles, Colors, Spacing } from '../styles';

// ============================================
// 启用Android LayoutAnimation
// ============================================

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================
// 类型定义
// ============================================

/** 筛选条件 */
export interface FilterParams {
  search: string;
  role: 'all' | 'admin' | 'editor' | 'viewer';
  status: 'all' | 'active' | 'disabled';
}

/** 组件Props */
interface SearchBarProps {
  /** 当前筛选条件 */
  value: FilterParams;
  /** 筛选变化回调 */
  onChange: (filters: FilterParams) => void;
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
}

// ============================================
// 常量定义
// ============================================

/** 默认防抖时间 */
const DEFAULT_DEBOUNCE_MS = 500;

/** 角色选项 */
const ROLE_OPTIONS = [
  { label: '全部', value: 'all' as const },
  { label: '管理员', value: 'admin' as const },
  { label: '编辑', value: 'editor' as const },
  { label: '观众', value: 'viewer' as const },
];

/** 状态选项 */
const STATUS_OPTIONS = [
  { label: '全部', value: 'all' as const },
  { label: '活跃', value: 'active' as const },
  { label: '禁用', value: 'disabled' as const },
];

// ============================================
// 子组件：筛选标签 (FilterTag)
// ============================================

/**
 * 筛选标签组件
 *
 * 显示已选择的筛选条件，可点击移除
 */
const FilterTag: React.FC<{
  label: string;
  onRemove: () => void;
}> = ({ label, onRemove }) => (
  <View style={Styles.filterTag}>
    <Text style={Styles.filterTagText}>{label}</Text>
    <TouchableOpacity onPress={onRemove} activeOpacity={0.7}>
      <Ionicons name="close-circle" size={14} color={Colors.text.secondary} />
    </TouchableOpacity>
  </View>
);

// ============================================
// 主组件：SearchBar
// ============================================

/**
 * 搜索栏主组件
 *
 * @param props - 组件属性
 * @returns JSX.Element
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}) => {

  // ========== 状态管理 ==========

  /** 输入框本地值（用于防抖） */
  const [localSearch, setLocalSearch] = useState(value.search);

  /** 高级筛选面板是否展开 */
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  /** 防抖定时器引用 */
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ========== 防抖处理 ==========

  /**
   * 防抖搜索函数
   * 当用户停止输入500ms后才触发搜索
   */
  const debouncedSearch = useCallback((text: string) => {
    // 清除之前的定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // 设置新的定时器
    debounceTimer.current = setTimeout(() => {
      onChange({ ...value, search: text });
    }, debounceMs);

  }, [value, onChange, debounceMs]);

  // ========== 事件处理函数 ==========

  /**
   * 处理搜索文本变化
   */
  const handleSearchChange = useCallback((text: string) => {
    setLocalSearch(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  /**
   * 处理角色筛选变化
   */
  const handleRoleChange = useCallback((role: FilterParams['role']) => {
    onChange({ ...value, role });
  }, [value, onChange]);

  /**
   * 处理状态筛选变化
   */
  const handleStatusChange = useCallback((status: FilterParams['status']) => {
    onChange({ ...value, status });
  }, [value, onChange]);

  /**
   * 切换高级筛选面板
   */
  const toggleAdvanced = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdvancedOpen(prev => !prev);
  }, []);

  /**
   * 清除所有筛选条件
   */
  const handleClearAll = useCallback(() => {
    setLocalSearch('');
    onChange({
      search: '',
      role: 'all',
      status: 'all',
    });
  }, [onChange]);

  /**
   * 移除单个筛选标签
   */
  const handleRemoveTag = useCallback((type: 'search' | 'role' | 'status') => {
    if (type === 'search') {
      setLocalSearch('');
      onChange({ ...value, search: '' });
    } else if (type === 'role') {
      onChange({ ...value, role: 'all' });
    } else if (type === 'status') {
      onChange({ ...value, status: 'all' });
    }
  }, [value, onChange]);

  // ========== 计算属性 ==========

  /** 是否有激活的筛选条件 */
  const hasActiveFilters = useMemo(() => {
    return value.search || value.role !== 'all' || value.status !== 'all';
  }, [value]);

  /** 已选筛选标签列表 */
  const activeFilterTags = useMemo(() => {
    const tags: Array<{ key: string; label: string }> = [];

    if (value.search) {
      tags.push({
        key: 'search',
        label: `搜索: ${value.search}`,
      });
    }

    if (value.role !== 'all') {
      const roleLabel = ROLE_OPTIONS.find(r => r.value === value.role)?.label || value.role;
      tags.push({
        key: 'role',
        label: `角色: ${roleLabel}`,
      });
    }

    if (value.status !== 'all') {
      const statusLabel = STATUS_OPTIONS.find(s => s.value === value.status)?.label || value.status;
      tags.push({
        key: 'status',
        label: `状态: ${statusLabel}`,
      });
    }

    return tags;
  }, [value]);

  // ========== 清理副作用 ==========

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ========== 渲染函数 ==========

  /**
   * 渲染下拉选择器
   */
  const renderDropdown = (
    label: string,
    options: Array<{ label: string; value: string }>,
    currentValue: string,
    onSelect: (value: any) => void,
  ) => (
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: 12,
        color: Colors.text.secondary,
        fontFamily: '-apple-system',
        marginBottom: 4,
      }}>
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: Spacing.xs,
        }}
      >
        {options.map((option) => {
          const isSelected = option.value === currentValue;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelect(option.value as any)}
              style={[
                {
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isSelected ? Colors.primary.DEFAULT : Colors.border.medium,
                  backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.08)' : Colors.background.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 13,
                color: isSelected ? Colors.primary.DEFAULT : Colors.text.secondary,
                fontWeight: isSelected ? '600' : '400',
                fontFamily: '-apple-system',
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ========== 主渲染 ==========

  return (
    <View style={Styles.searchBarContainer}>
      {/* 搜索输入框 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.tertiary,
        borderRadius: 10,
        paddingHorizontal: Spacing.md,
        height: 44,
      }}>
        <Ionicons name="search" size={18} color={Colors.text.tertiary} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: Spacing.sm,
            fontSize: 15,
            color: Colors.text.primary,
            fontFamily: '-apple-system',
          }}
          placeholder="搜索用户名或邮箱..."
          placeholderTextColor={Colors.text.tertiary}
          value={localSearch}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {/* 高级筛选按钮 */}
        <TouchableOpacity
          onPress={toggleAdvanced}
          style={{ padding: Spacing.xs }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isAdvancedOpen ? 'options-outline' : 'options'}
            size={22}
            color={isAdvancedOpen ? Colors.primary.DEFAULT : Colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* 快速筛选（角色+状态） */}
      <View style={{
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.sm,
      }}>
        {renderDropdown('角色', ROLE_OPTIONS, value.role, handleRoleChange)}
        {renderDropdown('状态', STATUS_OPTIONS, value.status, handleStatusChange)}
      </View>

      {/* 高级筛选面板 */}
      {isAdvancedOpen && (
        <View style={{
          marginTop: Spacing.md,
          padding: Spacing.md,
          backgroundColor: Colors.background.grouped,
          borderRadius: 10,
          borderLeftWidth: 3,
          borderLeftColor: Colors.primary.DEFAULT,
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: Colors.text.primary,
            marginBottom: Spacing.md,
            fontFamily: '-apple-system',
          }}>
            高级筛选选项
          </Text>

          {/* TODO: 可扩展更多高级筛选项，例如：
              - 注册日期范围
              - 最后登录时间范围
              - 用户来源
              - 是否验证邮箱
          */}

          <Text style={{
            fontSize: 12,
            color: Colors.text.tertiary,
            fontStyle: 'italic',
            fontFamily: '-apple-system',
          }}>
            更多高级筛选功能开发中...
          </Text>
        </View>
      )}

      {/* 已选筛选标签 */}
      {hasActiveFilters && (
        <View style={[Styles.filterTagsContainer, { borderBottomWidth: 1, borderBottomColor: Colors.border.light }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.sm }}
          >
            {activeFilterTags.map((tag) => (
              <FilterTag
                key={tag.key}
                label={tag.label}
                onRemove={() => handleRemoveTag(tag.key as any)}
              />
            ))}

            {/* 清除全部按钮 */}
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                Styles.filterTag,
                { backgroundColor: 'rgba(255, 59, 48, 0.08)' },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={14} color={Colors.semantic.error} />
              <Text style={[Styles.filterTagText, { color: Colors.semantic.error }]}>
                清除全部
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ============================================
// 默认导出
// ============================================

export default SearchBar;
