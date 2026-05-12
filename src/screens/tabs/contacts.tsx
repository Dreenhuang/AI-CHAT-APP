/**
 * Tab2: 通讯录页
 *
 * 显示Soul好友和群组列表（微信风格分段列表）
 * 功能：
 * - SectionList 分段显示：群聊在前，好友在后
 * - 点击显示/隐藏搜索框
 * - 联系人项：头像+名称+右箭头
 * - FAB悬浮按钮：新建群组/添加好友
 * - 添加新AI角色Modal（带表单验证）
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 导入组件
import ContactItem from '../../components/ContactItem';
import FABButton from '../../components/FABButton';

// 导入Store和数据
import { useContactStore } from '../../stores/useContactStore';
import { Soul, SoulPersonality } from '../../types';

// 导入主题
import { Colors } from '../../theme/colors';

/** 分段数据类型 */
interface SectionData {
  title: string;
  data: Array<{ id: string; type: 'group' | 'soul'; item: any }>;
}

/** 头像选项配置 */
const avatarOptions = [
  { seed: 'adventurer', label: '冒险者', style: 'adventurer' },
  { seed: 'bottts', label: '机器人', style: 'bottts' },
  { seed: 'pixel', label: '像素风', style: 'pixel-art' },
  { seed: 'lorelei', label: '精致', style: 'lorelei' },
  { seed: 'notionists', label: '简约', style: 'notionists' },
  { seed: 'fun-emoji', label: '活泼', style: 'fun-emoji' },
];

/** 性格选项 */
const personalityOptions: Array<{ value: SoulPersonality; label: string; desc: string }> = [
  { value: 'rational', label: '理性分析型', desc: '逻辑清晰，善于分析问题本质' },
  { value: 'emotional', label: '情感共鸣型', desc: '富有同理心，善于情感交流' },
  { value: 'aggressive', label: '激进挑战型', desc: '思维犀利，喜欢挑战观点' },
  { value: 'moderate', label: '温和折中型', desc: '态度平和，善于协调平衡' },
  { value: 'creative', label: '创意发散型', desc: '想象力丰富，思路独特' },
  { value: 'critical', label: '批判思维型', desc: '严谨求证，善于发现问题' },
];

const ContactsScreen: React.FC = () => {
  const navigation = useNavigation();

  // Store状态
  const { groups, souls, addSoul } = useContactStore();

  // 本地状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFABMenu, setShowFABMenu] = useState(false);

  // ========== 添加角色Modal相关状态 ==========
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPersonality, setFormPersonality] = useState<SoulPersonality>('moderate');
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);

  /**
   * 构建分段数据（群聊在前，好友在后）
   */
  const sections: SectionData[] = useMemo(() => {
    // 筛选群组
    const filteredGroups = groups.filter(group =>
      group.name.toLowerCase().includes(searchText.toLowerCase())
    ).map(group => ({
      id: group.id,
      type: 'group' as const,
      item: group,
    }));

    // 筛选好友
    const filteredSouls = souls.filter(soul =>
      soul.name.toLowerCase().includes(searchText.toLowerCase())
    ).map(soul => ({
      id: soul.id,
      type: 'soul' as const,
      item: soul,
    }));

    const result: SectionData[] = [];

    // 群聊段（如果有数据）
    if (filteredGroups.length > 0) {
      result.push({
        title: '群聊',
        data: filteredGroups,
      });
    }

    // 好友段（如果有数据）
    if (filteredSouls.length > 0) {
      result.push({
        title: '好友',
        data: filteredSouls,
      });
    }

    return result;
  }, [groups, souls, searchText]);

  /**
   * 处理群组点击 - 进入群组聊天
   */
  const handlePressGroup = (group: any) => {
    (navigation as any).navigate('ChatDetail', { id: group.id });
  };

  /**
   * 处理好友点击 - 进入私聊
   */
  const handlePressSoul = (soul: any) => {
    (navigation as any).navigate('ChatDetail', { id: soul.id });
  };

  /**
   * 处理联系人项点击
   */
  const handleContactPress = (contact: { type: 'group' | 'soul'; item: any }) => {
    if (contact.type === 'group') {
      handlePressGroup(contact.item);
    } else {
      handlePressSoul(contact.item);
    }
  };

  /**
   * FAB菜单项配置
   */
  const fabMenuItems = [
    {
      id: 'create_group',
      label: '新建群组',
      icon: '👥',
      onPress: () => {
        setShowFABMenu(false);
        console.log('新建群组');
        Alert.alert('提示', '群组功能开发中，敬请期待！');
      },
    },
    {
      id: 'add_friend',
      label: '添加好友',
      icon: '👤',
      onPress: () => {
        setShowFABMenu(false);
        // 打开添加角色Modal
        resetForm();
        setShowAddModal(true);
      },
    },
  ];

  /**
   * 重置表单数据
   */
  const resetForm = () => {
    setFormName('');
    setFormSpecialty('');
    setFormDescription('');
    setFormPersonality('moderate');
    setSelectedAvatarIndex(0);
  };

  /**
   * 验证表单数据
   */
  const validateForm = (): boolean => {
    if (!formName.trim()) {
      Alert.alert('提示', '请输入角色名称');
      return false;
    }
    if (formName.trim().length < 2) {
      Alert.alert('提示', '角色名称至少需要2个字符');
      return false;
    }
    if (formName.trim().length > 20) {
      Alert.alert('提示', '角色名称不能超过20个字符');
      return false;
    }
    if (!formSpecialty.trim()) {
      Alert.alert('提示', '请输入专业领域');
      return false;
    }
    return true;
  };

  /**
   * 处理保存新角色
   */
  const handleSaveSoul = () => {
    if (!validateForm()) return;

    // 生成唯一ID（使用时间戳+随机数）
    const newId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 获取选中的头像样式
    const selectedAvatar = avatarOptions[selectedAvatarIndex];

    // 创建新的Soul对象
    const newSoul: Soul = {
      id: newId,
      name: formName.trim(),
      avatar: `https://api.dicebear.com/7.x/${selectedAvatar.style}/svg?seed=${newId}&backgroundColor=transparent`,
      personality: formPersonality,
      description: formDescription.trim() || `这是一个自定义的AI辩论角色：${formName.trim()}`,
      specialty: formSpecialty.trim(),
      winRate: Math.floor(50 + Math.random() * 30), // 新角色胜率50-80%
      debateCount: 0, // 新角色暂无辩论记录
      isOnline: true,
      addedAt: new Date().toISOString(),
    };

    // 调用Store的addSoul方法保存
    addSoul(newSoul);

    // 关闭Modal并提示成功
    setShowAddModal(false);
    resetForm();

    Alert.alert(
      '成功',
      `已成功添加新角色「${newSoul.name}」！`,
      [{ text: '知道了', onPress: () => console.log('[Contacts] New soul added:', newSoul.id) }]
    );
  };

  /**
   * 处理取消添加
   */
  const handleCancelAdd = () => {
    setShowAddModal(false);
    resetForm();
  };

  /**
   * 渲染分段标题
   */
  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  /**
   * 渲染联系人项
   */
  const renderItem = ({ item }: { item: { id: string; type: 'group' | 'soul'; item: any } }) => (
    <ContactItem
      contact={item.item}
      type={item.type}
      onPress={() => handleContactPress(item)}
    />
  );

  /**
   * 渲染空列表组件
   */
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{showSearch ? '🔍' : '📋'}</Text>
      <Text style={styles.emptyTitle}>
        {showSearch ? '未找到联系人' : '暂无联系人'}
      </Text>
      <Text style={styles.emptyDesc}>
        {showSearch ? '尝试其他搜索关键词' : '去发现页面认识有趣的辩论伙伴吧！'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 状态栏 */}
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* 导航栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通讯录</Text>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索框（点击显示） */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索联系人..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={showSearch}
            returnKeyType="search"
          />
        </View>
      )}

      {/* 分段列表 */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={sections.length === 0 && styles.emptyListContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
      />

      {/* FAB悬浮按钮 */}
      <FABButton
        icon="+"
        showMenu={showFABMenu}
        menuItems={fabMenuItems}
        onPress={() => setShowFABMenu(!showFABMenu)}
      />

      {/* ========== 添加新角色Modal ========== */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelAdd}
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            {/* Modal标题栏 */}
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>添加新角色</Text>
              <TouchableOpacity
                onPress={handleCancelAdd}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.addModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 表单内容（可滚动） */}
            <ScrollView
              style={styles.addFormScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 角色名称输入框 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  角色名称 <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="请输入角色名称（2-20字符）"
                  placeholderTextColor="#999999"
                  maxLength={20}
                  autoCapitalize="words"
                />
                <Text style={styles.charCount}>{formName.length}/20</Text>
              </View>

              {/* 专业领域输入框 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  专业领域 <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={formSpecialty}
                  onChangeText={setFormSpecialty}
                  placeholder="例如：人工智能、心理学、经济学..."
                  placeholderTextColor="#999999"
                  maxLength={50}
                />
              </View>

              {/* 性格特点选择器 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>性格特点</Text>
                <TouchableOpacity
                  style={styles.personalitySelector}
                  onPress={() => setShowPersonalityPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.personalityValue}>
                    {personalityOptions.find(p => p.value === formPersonality)?.label || '选择性格'}
                  </Text>
                  <Text style={styles.personalityArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* 角色描述输入框（可选） */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>角色简介（可选）</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="简单介绍一下这个角色的特点和风格..."
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={3}
                  maxLength={100}
                  textAlignVertical="top"
                />
              </View>

              {/* 头像选择区域 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>选择头像</Text>
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((avatar, index) => (
                    <TouchableOpacity
                      key={avatar.seed}
                      style={[
                        styles.avatarOption,
                        selectedAvatarIndex === index && styles.avatarOptionSelected,
                      ]}
                      onPress={() => setSelectedAvatarIndex(index)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri: `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=preview_${index}&backgroundColor=transparent`
                        }}
                        style={styles.avatarPreview}
                      />
                      <Text style={[
                        styles.avatarLabel,
                        selectedAvatarIndex === index && styles.avatarLabelSelected,
                      ]}>
                        {avatar.label}
                      </Text>
                      {selectedAvatarIndex === index && (
                        <View style={styles.avatarCheckMark}>
                          <Text style={styles.avatarCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 预览卡片 */}
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>角色预览</Text>
                <View style={styles.previewContent}>
                  <Image
                    source={{
                      uri: `https://api.dicebear.com/7.x/${avatarOptions[selectedAvatarIndex].style}/svg?seed=preview&backgroundColor=transparent`
                    }}
                    style={styles.previewAvatar}
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName} numberOfLines={1}>
                      {formName || '未命名角色'}
                    </Text>
                    <Text style={styles.previewSpecialty} numberOfLines={1}>
                      {formSpecialty || '未填写专业领域'}
                    </Text>
                    <Text style={styles.previewPersonality} numberOfLines={1}>
                      性格：{personalityOptions.find(p => p.value === formPersonality)?.label}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* 底部按钮区域 */}
            <View style={styles.addModalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={handleCancelAdd}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !formName.trim() && styles.saveButtonDisabled]}
                onPress={handleSaveSoul}
                disabled={!formName.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>确认添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== 性格选择子Modal ========== */}
      <Modal
        visible={showPersonalityPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPersonalityPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowPersonalityPicker(false)}
        >
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>选择性格类型</Text>
              <TouchableOpacity onPress={() => setShowPersonalityPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {personalityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerItem,
                  formPersonality === option.value && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setFormPersonality(option.value);
                  setShowPersonalityPicker(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.pickerItemLeft}>
                  <Text style={[
                    styles.pickerItemLabel,
                    formPersonality === option.value && styles.pickerItemSelectedText,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.pickerItemDesc}>{option.desc}</Text>
                </View>
                {formPersonality === option.value && (
                  <Text style={styles.pickerCheckIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // 导航栏样式
  header: {
    height: 44,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 18,
  },

  // 搜索框样式
  searchContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // 分段标题样式
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // 空状态样式
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyListContent: {
    flex: 1,
  },

  // ========== 添加角色Modal样式 ==========
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addModalClose: {
    fontSize: 20,
    color: Colors.textSecondary,
    padding: 4,
  },

  // 表单样式
  addFormScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  requiredMark: {
    color: '#FA5151',
  },
  formInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // 性格选择器样式
  personalitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  personalityValue: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  personalityArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // 头像网格样式
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarOption: {
    width: (Dimensions.get('window').width - 60) / 3 - 8,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  avatarPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
  },
  avatarLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  avatarLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  avatarCheckMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // 预览卡片样式
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  previewSpecialty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  previewPersonality: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Modal底部按钮
  addModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 性格选择子Modal样式
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  pickerContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pickerClose: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pickerItemSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  pickerItemLeft: {
    flex: 1,
  },
  pickerItemLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  pickerItemSelectedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  pickerItemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pickerCheckIcon: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default ContactsScreen;
