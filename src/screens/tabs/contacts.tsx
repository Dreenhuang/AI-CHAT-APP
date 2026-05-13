/**
 * Tab2: 通讯录页 v2.5
 *
 * 核心功能升级：
 * 1. 类别筛选 - 按角色类型筛选（哲学家/科学家/企业家...）
 * 2. 时代筛选 - 按历史时期筛选（古代/近代/现代/当代）
 * 3. 入场动画 - 联系人列表交错出现动画
 * 4. FAB悬浮按钮动画
 *
 * 功能：
 * - SectionList 分段显示：群聊在前，好友在后
 * - 点击显示/隐藏搜索框
 * - 联系人项：头像+名称+右箭头
 * - FAB悬浮按钮：新建群组/添加好友
 */

import React, { useState, useMemo, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';

// 导入组件
import ContactItem from '../../components/ContactItem';
import FABButton from '../../components/FABButton';

// 导入Store和数据
import { useContactStore } from '../../stores/useContactStore';
import { Soul, SoulPersonality } from '../../types';

// 导入预设数据
import { DISCUSSION_MODES, getAllModes, getModeCategories } from '../../data/discussionModes';
import { realPersonPresets, getAllRealPersons } from '../../data/realPersonPresets';
import { memoAvatarUrls, getMemoAvatarUrl } from '../../data/memoAvatars';

// 导入主题
import { Colors } from '../../theme/colors';
import { useCurrentColors } from '../../stores/useThemeStore';

/** 分段数据类型 */
interface SectionData {
  title: string;
  data: Array<{ id: string; type: 'group' | 'soul'; item: any }>;
}

/** 类别筛选选项 */
const categoryFilters = [
  { id: 'all', label: '全部', icon: 'apps-outline' },
  { id: 'philosopher', label: '哲学家', icon: 'book-outline' },
  { id: 'scientist', label: '科学家', icon: 'flask-outline' },
  { id: 'entrepreneur', label: '企业家', icon: 'briefcase-outline' },
  { id: 'leader', label: '政治家', icon: 'ribbon-outline' },
  { id: 'literature', label: '文学家', icon: 'create-outline' },
  { id: 'military', label: '军事家', icon: 'shield-outline' },
];

/** 时代筛选选项 */
const eraFilters = [
  { id: 'all', label: '全部时代' },
  { id: 'ancient', label: '古代', desc: '公元前' },
  { id: 'medieval', label: '近代', desc: '1500-1900' },
  { id: 'modern', label: '现代', desc: '1900-1950' },
  { id: 'contemporary', label: '当代', desc: '1950至今' },
];

/** 头像选项 */
const avatarOptions = memoAvatarUrls.map((url, index) => ({
  seed: `memo_${index + 1}`,
  label: `头像${index + 1}`,
  style: 'memo',
  url: url,
}));

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
  const colors = useCurrentColors();
  const { groups, souls, addSoul, setGroups } = useContactStore();

  // 搜索和筛选状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showFABMenu, setShowFABMenu] = useState(false);

  // Modal状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPersonality, setFormPersonality] = useState<SoulPersonality>('moderate');
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);

  // 创建群组Modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // 判断人物类别
  const isPersonCategory = useCallback((person: any, category: string): boolean => {
    if (category === 'all') return true;
    
    const categoryMap: Record<string, string[]> = {
      philosopher: ['哲学家', '哲学', '思想家', '批判哲学', '存在主义', '现象学'],
      scientist: ['科学家', '物理学家', '化学家', '生物学家', '数学家', '天文学家', '发明家'],
      entrepreneur: ['企业家', '商业', '创业', '字节跳动', '特斯拉', '苹果', '微软', '亚马逊'],
      leader: ['政治家', '总统', '总理', '主席', '首相', '皇帝', '领袖'],
      literature: ['文学家', '作家', '诗人', '小说家', '剧作家'],
      military: ['军事家', '将军', '元帅', '战略家'],
    };
    
    const keywords = categoryMap[category] || [];
    const searchText = `${person.name} ${person.description || ''} ${person.category || ''} ${person.era || ''}`.toLowerCase();
    
    return keywords.some(k => searchText.includes(k.toLowerCase()));
  }, []);

  // 判断时代
  const isPersonEra = useCallback((person: any, era: string): boolean => {
    if (era === 'all') return true;
    
    const eraMap: Record<string, string[]> = {
      ancient: ['公元前', 'BC', '古代'],
      medieval: ['1500', '1600', '1700', '1800', '1900', '近代'],
      modern: ['1900', '1910', '1920', '1930', '1940', '1950', '现代'],
      contemporary: ['1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020', '当代', '至今'],
    };
    
    const keywords = eraMap[era] || [];
    const searchText = `${person.name} ${person.era || ''}`.toLowerCase();
    
    return keywords.some(k => searchText.includes(k.toLowerCase()));
  }, []);

  // 构建分段数据
  const sections: SectionData[] = useMemo(() => {
    // 讨论模式
    const allModes = getAllModes();
    const filteredModes = allModes.filter(mode =>
      mode.name.toLowerCase().includes(searchText.toLowerCase()) ||
      mode.description.toLowerCase().includes(searchText.toLowerCase()) ||
      mode.category.toLowerCase().includes(searchText.toLowerCase())
    ).map((mode, modeIndex) => ({
      id: mode.id,
      type: 'group' as const,
      item: {
        ...mode,
        name: mode.name,
        description: mode.description,
        memberCount: mode.minRoles + '-' + mode.maxRoles,
        category: mode.category,
        icon: mode.icon || '💬',
        avatar: memoAvatarUrls[modeIndex % 35],
      },
    }));

    // 历史人物筛选
    const allRealPersons = getAllRealPersons();
    const filteredSouls = allRealPersons.filter(person => {
      // 文本搜索
      const matchesSearch = searchText === '' ||
        person.name.toLowerCase().includes(searchText.toLowerCase()) ||
        person.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        person.category?.toLowerCase().includes(searchText.toLowerCase()) ||
        person.englishName?.toLowerCase().includes(searchText.toLowerCase());
      
      // 类别筛选
      const matchesCategory = selectedCategory === 'all' || 
        isPersonCategory(person, selectedCategory);
      
      // 时代筛选
      const matchesEra = selectedEra === 'all' || 
        isPersonEra(person, selectedEra);
      
      return matchesSearch && matchesCategory && matchesEra;
    }).map((person, index) => ({
      id: person.id,
      type: 'soul' as const,
      item: {
        ...person,
        name: person.name,
        description: person.description || `${person.category} | ${person.era}`,
        personality: person.character?.personality?.join('、') || '',
        strengths: [person.category, person.era?.split(' ')[0] || ''],
        suitableFor: (person.works || person.companies || []).slice(0, 3),
        avatar: memoAvatarUrls[index % 35],
      },
    }));

    const result: SectionData[] = [];
    result.push({ title: '群聊', data: filteredModes });
    result.push({ title: '好友', data: filteredSouls });

    return result;
  }, [searchText, selectedCategory, selectedEra, isPersonCategory, isPersonEra]);

  // 处理点击
  const handlePressGroup = (group: any) => {
    (navigation as any).navigate('ChatDetail', { id: group.id });
  };

  const handlePressSoul = (soul: any) => {
    (navigation as any).navigate('ChatDetail', { id: soul.id });
  };

  const handleContactPress = (contact: { type: 'group' | 'soul'; item: any }) => {
    if (contact.type === 'group') {
      handlePressGroup(contact.item);
    } else {
      handlePressSoul(contact.item);
    }
  };

  // FAB菜单
  const fabMenuItems = [
    {
      id: 'create_group',
      label: '建立讨论群组',
      icon: 'people-outline' as const,
      onPress: () => {
        setShowFABMenu(false);
        setGroupName('');
        setGroupDescription('');
        setShowCreateGroupModal(true);
      },
    },
    {
      id: 'add_friend',
      label: '添加好友',
      icon: 'person-add-outline' as const,
      onPress: () => {
        setShowFABMenu(false);
        resetForm();
        setShowAddModal(true);
      },
    },
  ];

  const resetForm = () => {
    setFormName('');
    setFormSpecialty('');
    setFormDescription('');
    setFormPersonality('moderate');
    setSelectedAvatarIndex(0);
  };

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

  const handleSaveSoul = () => {
    if (!validateForm()) return;

    const newId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selectedAvatar = avatarOptions[selectedAvatarIndex];

    const newSoul: Soul = {
      id: newId,
      name: formName.trim(),
      avatar: selectedAvatar?.url || memoAvatarUrls[0],
      personality: formPersonality,
      description: formDescription.trim() || `这是一个自定义的AI辩论角色：${formName.trim()}`,
      specialty: formSpecialty.trim(),
      winRate: Math.floor(50 + Math.random() * 30),
      debateCount: 0,
      isOnline: true,
      addedAt: new Date().toISOString(),
    };

    addSoul(newSoul);
    setShowAddModal(false);
    resetForm();

    Alert.alert(
      '成功',
      `已成功添加新角色「${newSoul.name}」！`,
      [{ text: '知道了', onPress: () => console.log('[Contacts] New soul added:', newSoul.id) }]
    );
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;

    const newGroupId = `custom_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const avatarIndex = Math.floor(Math.random() * 35);
    const newGroup = {
      id: newGroupId,
      name: groupName.trim(),
      avatar: memoAvatarUrls[avatarIndex],
      description: groupDescription.trim() || `欢迎加入讨论群`,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };

    const updatedGroups = [newGroup, ...groups];
    setGroups(updatedGroups);

    setShowCreateGroupModal(false);
    setGroupName('');
    setGroupDescription('');

    Alert.alert('成功', `已创建讨论群组「${newGroup.name}」！`);
  };

  // 渲染分段标题
  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <Animated.View entering={FadeInDown.springify().damping(14)}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    </Animated.View>
  );

  // 渲染联系人项 - 带动画
  const renderItem = ({ item, index }: { item: { id: string; type: 'group' | 'soul'; item: any }; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 30, 200)).springify().damping(14)}
      layout={Layout.springify()}
    >
      <ContactItem
        contact={item.item}
        type={item.type}
        onPress={() => handleContactPress(item)}
      />
    </Animated.View>
  );

  // 渲染空状态
  const renderEmptyComponent = () => (
    <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
      <Ionicons 
        name={showSearch || selectedCategory !== 'all' || selectedEra !== 'all' ? "search-outline" : "people-outline"} 
        size={48} 
        color={Colors.textSecondary} 
        style={{ marginBottom: 12 }} 
      />
      <Text style={styles.emptyTitle}>
        {showSearch || selectedCategory !== 'all' || selectedEra !== 'all' ? '未找到匹配结果' : '暂无联系人'}
      </Text>
      <Text style={styles.emptyDesc}>
        {showSearch || selectedCategory !== 'all' || selectedEra !== 'all' 
          ? '尝试调整筛选条件' 
          : '去发现页面认识有趣的辩论伙伴吧！'}
      </Text>
      
      {(selectedCategory !== 'all' || selectedEra !== 'all') && (
        <TouchableOpacity 
          style={styles.clearFilterButton}
          onPress={() => {
            setSelectedCategory('all');
            setSelectedEra('all');
          }}
        >
          <Text style={styles.clearFilterText}>清除筛选</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* 导航栏 */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>通讯录</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.headerButton, showFilters && styles.headerButtonActive]}
          >
            <Ionicons name="filter" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.headerButton, showSearch && styles.headerButtonActive]}
          >
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索框 */}
      {showSearch && (
        <Animated.View entering={SlideInRight.springify().damping(15)} style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索联系人..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={showSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchText('')}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* 筛选区域 */}
      {showFilters && (
        <Animated.View entering={FadeInDown.springify().damping(12)} style={styles.filterContainer}>
          {/* 类别筛选 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>类别</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {categoryFilters.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    selectedCategory === filter.id && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedCategory(filter.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={filter.icon as any} 
                    size={14} 
                    color={selectedCategory === filter.id ? '#FFFFFF' : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    selectedCategory === filter.id && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 时代筛选 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>时代</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {eraFilters.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    selectedEra === filter.id && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedEra(filter.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedEra === filter.id && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                  {filter.desc && (
                    <Text style={[
                      styles.filterChipDesc,
                      selectedEra === filter.id && styles.filterChipTextActive
                    ]}>
                      {filter.desc}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {/* 活跃筛选标签 */}
      {(selectedCategory !== 'all' || selectedEra !== 'all') && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.activeFiltersBar}>
          <Ionicons name="funnel-outline" size={14} color={Colors.primary} />
          <Text style={styles.activeFiltersText}>
            {selectedCategory !== 'all' && categoryFilters.find(f => f.id === selectedCategory)?.label}
            {selectedCategory !== 'all' && selectedEra !== 'all' && ' | '}
            {selectedEra !== 'all' && eraFilters.find(f => f.id === selectedEra)?.label}
          </Text>
          <TouchableOpacity onPress={() => { setSelectedCategory('all'); setSelectedEra('all'); }}>
            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
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
        icon="add"
        showMenu={showFABMenu}
        menuItems={fabMenuItems}
        onPress={() => setShowFABMenu(!showFABMenu)}
        style={{ right: 16, left: 'auto' }}
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
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>添加新角色</Text>
              <TouchableOpacity onPress={handleCancelAdd} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addFormScrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>角色名称 <Text style={styles.requiredMark}>*</Text></Text>
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>专业领域 <Text style={styles.requiredMark}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  value={formSpecialty}
                  onChangeText={setFormSpecialty}
                  placeholder="例如：人工智能、心理学、经济学..."
                  placeholderTextColor="#999999"
                  maxLength={50}
                />
              </View>

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
                  <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>选择头像</Text>
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((avatar, index) => (
                    <TouchableOpacity
                      key={avatar.seed}
                      style={[styles.avatarOption, selectedAvatarIndex === index && styles.avatarOptionSelected]}
                      onPress={() => setSelectedAvatarIndex(index)}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: avatar.url }} style={styles.avatarPreview} />
                      <Text style={[styles.avatarLabel, selectedAvatarIndex === index && styles.avatarLabelSelected]}>
                        {avatar.label}
                      </Text>
                      {selectedAvatarIndex === index && (
                        <View style={styles.avatarCheckMark}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>角色预览</Text>
                <View style={styles.previewContent}>
                  <Image source={{ uri: avatarOptions[selectedAvatarIndex]?.url }} style={styles.previewAvatar} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName} numberOfLines={1}>{formName || '未命名角色'}</Text>
                    <Text style={styles.previewSpecialty} numberOfLines={1}>{formSpecialty || '未填写专业领域'}</Text>
                    <Text style={styles.previewPersonality} numberOfLines={1}>
                      性格：{personalityOptions.find(p => p.value === formPersonality)?.label}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.addModalFooter}>
              <TouchableOpacity style={[styles.cancelButton]} onPress={handleCancelAdd} activeOpacity={0.7}>
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

      {/* 性格选择Modal */}
      <Modal
        visible={showPersonalityPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPersonalityPicker(false)}
      >
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPersonalityPicker(false)}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>选择性格类型</Text>
              <TouchableOpacity onPress={() => setShowPersonalityPicker(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {personalityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.pickerItem, formPersonality === option.value && styles.pickerItemSelected]}
                onPress={() => { setFormPersonality(option.value); setShowPersonalityPicker(false); }}
                activeOpacity={0.7}
              >
                <View style={styles.pickerItemLeft}>
                  <Text style={[styles.pickerItemLabel, formPersonality === option.value && styles.pickerItemSelectedText]}>
                    {option.label}
                  </Text>
                  <Text style={styles.pickerItemDesc}>{option.desc}</Text>
                </View>
                {formPersonality === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 创建群组Modal */}
      <Modal visible={showCreateGroupModal} transparent animationType="fade" onRequestClose={() => setShowCreateGroupModal(false)}>
        <TouchableOpacity style={styles.createGroupOverlay} activeOpacity={1} onPress={() => setShowCreateGroupModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.createGroupContent}>
            <View style={styles.createGroupHeader}>
              <Text style={styles.createGroupTitle}>建立讨论群组</Text>
              <TouchableOpacity onPress={() => setShowCreateGroupModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createGroupForm}>
              <View style={styles.createGroupField}>
                <Text style={styles.createGroupLabel}>群组名称<Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={styles.createGroupInput}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="请输入群组名称"
                  placeholderTextColor="#999999"
                  maxLength={20}
                />
              </View>
              <View style={styles.createGroupField}>
                <Text style={styles.createGroupLabel}>群组描述</Text>
                <TextInput
                  style={[styles.createGroupInput, styles.createGroupTextArea]}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  placeholder="简单介绍一下这个群组的话题方向..."
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={3}
                  maxLength={100}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.createGroupFooter}>
              <TouchableOpacity
                style={[styles.createGroupButton, !groupName.trim() && styles.createGroupButtonDisabled]}
                onPress={handleCreateGroup}
                disabled={!groupName.trim()}
              >
                <Text style={styles.createGroupButtonText}>创建群组</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerButtonActive: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1, height: 44, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14,
    fontSize: 15, color: Colors.textPrimary, borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  clearSearchButton: { marginLeft: 10, padding: 4 },

  filterContainer: {
    backgroundColor: '#FFFFFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  filterSection: { marginBottom: 8 },
  filterLabel: {
    fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginLeft: 16, marginBottom: 8,
  },
  filterScroll: { flexGrow: 0 },
  filterScrollContent: { paddingHorizontal: 12, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#F5F5F5', borderRadius: 16, gap: 4,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 13, color: Colors.textSecondary },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '500' },
  filterChipDesc: { fontSize: 11, color: Colors.textSecondary, marginLeft: 2 },

  activeFiltersBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: `${Colors.primary}10`, gap: 6,
  },
  activeFiltersText: { flex: 1, fontSize: 12, color: Colors.primary },

  sectionHeader: {
    backgroundColor: Colors.background, paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  sectionCount: { fontSize: 12, color: Colors.textSecondary, backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  clearFilterButton: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: `${Colors.primary}15`, borderRadius: 16 },
  clearFilterText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  emptyListContent: { flex: 1 },

  addModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  addModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  addModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  addModalTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },

  addFormScrollView: { paddingHorizontal: 20, paddingVertical: 16 },
  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 8 },
  requiredMark: { color: '#FA5151' },
  formInput: { height: 44, backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: '#E5E5E5' },
  textArea: { height: 80, paddingTop: 12 },
  charCount: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },

  personalitySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E5E5' },
  personalityValue: { fontSize: 15, color: Colors.textPrimary },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarOption: {
    width: (Dimensions.get('window').width - 60) / 3 - 8, aspectRatio: 1, borderRadius: 10,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 2, borderColor: 'transparent',
  },
  avatarOptionSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}10` },
  avatarPreview: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  avatarLabel: { fontSize: 11, color: Colors.textSecondary },
  avatarLabelSelected: { color: Colors.primary, fontWeight: '600' },
  avatarCheckMark: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  previewCard: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 14, marginTop: 4 },
  previewTitle: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 10 },
  previewContent: { flexDirection: 'row', alignItems: 'center' },
  previewAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  previewSpecialty: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  previewPersonality: { fontSize: 12, color: Colors.textSecondary },

  addModalFooter: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  cancelButton: { flex: 1, height: 46, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  saveButton: { flex: 1, height: 46, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-start', paddingTop: 100 },
  pickerContent: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  pickerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  pickerItemSelected: { backgroundColor: `${Colors.primary}15` },
  pickerItemLeft: { flex: 1 },
  pickerItemLabel: { fontSize: 16, color: Colors.textPrimary },
  pickerItemSelectedText: { color: Colors.primary, fontWeight: '600' },
  pickerItemDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  createGroupOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  createGroupContent: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, maxHeight: '70%' },
  createGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  createGroupTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  createGroupForm: { maxHeight: 300 },
  createGroupField: { marginBottom: 16 },
  createGroupLabel: { fontSize: 14, color: Colors.textPrimary, marginBottom: 8, fontWeight: '500' },
  requiredStar: { color: '#FF3B30' },
  createGroupInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, backgroundColor: '#FAFAFA' },
  createGroupTextArea: { height: 80, textAlignVertical: 'top' },
  createGroupFooter: { marginTop: 16 },
  createGroupButton: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  createGroupButtonDisabled: { backgroundColor: Colors.textSecondary, opacity: 0.5 },
  createGroupButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default ContactsScreen;