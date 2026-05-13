/**
 * Tab4: 个人中心页 - 我
 *
 * 微信风格个人中心页面
 * 功能：
 * - 无导航栏，白色背景+大头像
 * - 用户信息区：头像+昵称+手机号+VIP标签
 * - 统计数据：对话记录/群组/好友数量
 * - 功能菜单：主题设置、大模型API设置、帮助与反馈、关于我们
 * - 退出登录按钮
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 导入Store
import { useUserStore } from '../../stores/useUserStore';
import { useChatStore } from '../../stores/useChatStore';
import { useContactStore } from '../../stores/useContactStore';
import { useThemeStore, useCurrentColors } from '../../stores/useThemeStore';
import { useAIModelStore, PRESET_MODELS } from '../../stores/useAIModelStore';
import { ThemeId, getAllThemes } from '../../theme/colors';

// 导入通知设置组件
import NotificationSettingsModal from '../../components/NotificationSettingsModal';

/** 菜单项配置 - 使用 Ionicons 图标 */
const menuItems = [
  {
    id: 'souls',
    icon: 'people-outline' as const,
    title: 'Soul角色管理',
    screen: 'SoulsManagement' as const,
  },
  {
    id: 'notification',
    icon: 'notifications-outline' as const,
    title: '通知设置',
    screen: 'NotificationSettings' as const,
  },
  {
    id: 'theme',
    icon: 'color-palette-outline' as const,
    title: '主题设置',
    screen: 'ThemeSettings' as const,
  },
  {
    id: 'ai-model',
    icon: 'hardware-chip-outline' as const,
    title: '大模型API设置',
    screen: 'AIModelSettings' as const,
  },
  {
    id: 'help',
    icon: 'help-circle-outline' as const,
    title: '帮助与反馈',
    screen: 'Help' as const,
  },
  {
    id: 'about',
    icon: 'information-circle-outline' as const,
    title: '关于我们',
    screen: 'About' as const,
  },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  // 获取各Store数据
  const { user, logout, isLoggedIn } = useUserStore();
  const { conversations } = useChatStore();
  const { groups, souls } = useContactStore();

  // 获取当前主题状态
  const { currentThemeId, setTheme } = useThemeStore();
  const colors = useCurrentColors();

  // 获取AI模型状态
  const {
    currentConfig: aiConfig,
    isCustomConfig,
    setPresetModel,
    setCustomConfig,
    testConnection,
  } = useAIModelStore();

  // Modal状态
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // 自定义配置表单状态
  const [customApiKey, setCustomApiKey] = useState(aiConfig.apiKey);
  const [customBaseUrl, setCustomBaseUrl] = useState(aiConfig.baseUrl);
  const [customModel, setCustomModel] = useState(aiConfig.model);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  /**
   * 手机号脱敏显示
   */
  const maskPhone = (phone?: string): string => {
    if (!phone) return '游客模式';
    if (phone.length === 11) {
      return phone.slice(0, 3) + '****' + phone.slice(7);
    }
    return phone;
  };

  /**
   * 处理菜单项点击
   */
  const handleMenuPress = useCallback((screen: string, itemId: string) => {
    console.log('跳转到:', screen);

    // 特殊处理
    if (itemId === 'theme') {
      setShowThemePicker(true);
      return;
    }

    if (itemId === 'notification') {
      setShowNotificationSettings(true);
      return;
    }

    if (itemId === 'ai-model') {
      setShowAISettings(true);
      // 重置表单为当前配置
      setCustomApiKey(aiConfig.apiKey);
      setCustomBaseUrl(aiConfig.baseUrl);
      setCustomModel(aiConfig.model);
      setTestResult(null);
      return;
    }

    // Soul角色管理页面导航
    if (itemId === 'souls') {
      navigation.navigate('SoulsManagement' as never);
      return;
    }

    // TODO: 实现其他页面跳转
  }, [navigation, aiConfig]);

  /**
   * 处理退出登录
   */
  const handleLogout = useCallback(() => {
    logout();
    console.log('已退出登录');
  }, [logout]);

  /**
   * 头像点击 - 编辑资料
   */
  const handleAvatarPress = () => {
    console.log('编辑资料');
  };

  /**
   * 处理主题切换
   */
  const handleThemeSelect = (themeId: ThemeId) => {
    setTheme(themeId);
    setShowThemePicker(false);
  };

  /**
   * 处理预设模型选择
   */
  const handlePresetModelSelect = (modelId: string) => {
    setPresetModel(modelId);
    const preset = PRESET_MODELS[modelId];
    if (preset) {
      setCustomApiKey(preset.apiKey);
      setCustomBaseUrl(preset.baseUrl);
      setCustomModel(preset.model);
    }
    setTestResult(null);
  };

  /**
   * 测试连接
   */
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    // 先保存当前输入的配置
    setCustomConfig({
      apiKey: customApiKey,
      baseUrl: customBaseUrl,
      model: customModel,
    });

    // 等待一下让配置生效
    await new Promise(resolve => setTimeout(resolve, 100));

    // 测试连接
    const result = await testConnection();
    setTestResult(result);
    setIsTestingConnection(false);
  };

  /**
   * 保存自定义配置
   */
  const handleSaveCustomConfig = () => {
    setCustomConfig({
      apiKey: customApiKey,
      baseUrl: customBaseUrl,
      model: customModel,
    });
    setShowAISettings(false);
    Alert.alert('成功', 'AI模型配置已保存');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 状态栏 */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ========== 头部用户信息区域 ========== */}
        <TouchableOpacity
          style={styles.headerSection}
          onPress={handleAvatarPress}
          activeOpacity={0.7}
        >
          {/* 大头像 */}
          <Image
            source={{
              uri: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
            }}
            style={styles.avatar}
          />

          {/* 用户信息 */}
          <View style={styles.userInfo}>
            {/* 昵称 */}
            <Text style={[styles.nickname, { color: colors.textPrimary }]}>
              {user?.nickname || (isLoggedIn ? 'AI Chat 新手' : '未登录')}
            </Text>

            {/* 手机号脱敏显示 */}
            <Text style={[styles.phone, { color: colors.textSecondary }]}>
              {maskPhone(user?.phone)}
            </Text>

            {/* VIP会员标签 */}
            {(user?.isVip || user?.level >= 5) && (
              <View style={[styles.vipBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.vipText}>VIP会员</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* ========== 统计信息区域 ========== */}
        <View style={[styles.statsSection, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          {/* 对话记录 */}
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{conversations.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>对话记录</Text>
          </View>

          {/* 分隔线 */}
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          {/* 我的群组 */}
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{groups.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>我的群组</Text>
          </View>

          {/* 分隔线 */}
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          {/* 我的好友 */}
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{souls.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>我的好友</Text>
          </View>
        </View>

        {/* ========== 功能菜单区域 ========== */}
        <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
                index !== menuItems.length - 1 && { borderBottomColor: colors.border },
              ]}
              onPress={() => handleMenuPress(item.screen, item.id)}
              activeOpacity={0.6}
            >
              {/* 图标 */}
              <Ionicons name={item.icon} size={20} color={colors.primary} style={styles.menuIcon} />

              {/* 标题 */}
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{item.title}</Text>

              {/* 右侧预览（主题和AI模型项） */}
              {item.id === 'theme' && (
                <View style={[
                  styles.themePreview,
                  { backgroundColor: colors.primary }
                ]} />
              )}

              {item.id === 'ai-model' && (
                <Text style={[styles.currentModelText, { color: colors.textSecondary }]}
                  numberOfLines={1}>
                  {isCustomConfig ? '自定义' : aiConfig.displayName}
                </Text>
              )}

              {/* 右箭头 */}
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ========== 退出登录按钮 ========== */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.card }]}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>退出登录</Text>
          </TouchableOpacity>
        )}

        {/* ========== 底部版本信息 ========== */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            AI Chat v1.0.0 | 当前主题：{getAllThemes().find(t => t.id === currentThemeId)?.name || '未知'}
          </Text>
        </View>
      </ScrollView>

      {/* ========== 主题选择Modal ========== */}
      <Modal
        visible={showThemePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* 标题 */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>选择主题</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} style={styles.modalClose} />
              </TouchableOpacity>
            </View>

            {/* 主题列表 */}
            {getAllThemes().map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeOption,
                  currentThemeId === theme.id && { backgroundColor: colors.primaryLight },
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => handleThemeSelect(theme.id)}
                activeOpacity={0.7}
              >
                {/* 主题图标和名称 */}
                <View style={styles.themeOptionLeft}>
                  <Ionicons name="color-palette-outline" size={24} color={colors.primary} style={styles.themeIcon} />
                  <View>
                    <Text style={[
                      styles.themeName,
                      { color: colors.textPrimary },
                      currentThemeId === theme.id && { color: colors.primaryDark }
                    ]}>
                      {theme.name}
                    </Text>
                    <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                      {theme.description}
                    </Text>
                  </View>
                </View>

                {/* 当前选中标记 */}
                {currentThemeId === theme.id && (
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={styles.checkMark} />
                  )}

                {/* 颜色预览条 */}
                <View style={styles.colorPreviewRow}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.primaryLight }]} />
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.userBubble }]} />
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.background }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ========== 通知设置Modal ========== */}
      <NotificationSettingsModal
        visible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* ========== AI模型设置Modal ========== */}
      <Modal
        visible={showAISettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAISettings(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.aiModalContent, { backgroundColor: colors.card }]}>
            {/* 标题 */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>大模型API设置</Text>
              <TouchableOpacity onPress={() => setShowAISettings(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} style={styles.modalClose} />
              </TouchableOpacity>
            </View>

            {/* 预设模型选择 */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>预设模型</Text>
              {Object.entries(PRESET_MODELS).map(([id, config]) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.presetOption,
                    aiConfig.model === config.model && !isCustomConfig &&
                    { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handlePresetModelSelect(id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetOptionLeft}>
                    <Text style={[styles.presetName, { color: colors.textPrimary }]}>
                      {config.displayName}
                    </Text>
                    <Text style={[styles.presetDesc, { color: colors.textSecondary }]}>
                      {config.description}
                    </Text>
                  </View>
                  {(aiConfig.model === config.model && !isCustomConfig) && (
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={styles.checkMark} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 自定义配置 */}
            <View style={[styles.sectionContainer, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>自定义配置（可选）</Text>

              {/* API Key */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>API Key</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }]}
                  value={customApiKey}
                  onChangeText={setCustomApiKey}
                  placeholder="sk-..."
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Base URL */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Base URL</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }]}
                  value={customBaseUrl}
                  onChangeText={setCustomBaseUrl}
                  placeholder="https://api.example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Model Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>模型名称</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }]}
                  value={customModel}
                  onChangeText={setCustomModel}
                  placeholder="gpt-4 / claude-3 等"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* 测试连接按钮 */}
              <TouchableOpacity
                style={[
                  styles.testButton,
                  isTestingConnection && { opacity: 0.6 },
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleTestConnection}
                disabled={isTestingConnection}
                activeOpacity={0.7}
              >
                <Text style={styles.testButtonText}>
                  {isTestingConnection ? '测试中...' : '测试连接'}
                </Text>
              </TouchableOpacity>

              {/* 测试结果 */}
              {testResult && (
                <View style={[
                  styles.testResultBox,
                  { backgroundColor: testResult.success ? '#E8F5E9' : '#FFEBEE' },
                ]}>
                  <Text style={[
                    styles.testResultText,
                    { color: testResult.success ? colors.success : colors.error },
                  ]}>
                    {testResult.message}
                  </Text>
                </View>
              )}
            </View>

            {/* 保存按钮 */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveCustomConfig}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>保存配置</Text>
            </TouchableOpacity>

            {/* 底部提示 */}
            <View style={styles.aiFooter}>
              <Text style={[styles.aiFooterText, { color: colors.textSecondary }]}>
                支持OpenAI兼容格式的API接口
              </Text>
              <Text style={[styles.aiFooterText, { color: colors.textSecondary }]}>
                配置仅保存在本地设备中
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ========== 头部用户信息样式 ==========
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    backgroundColor: '#F0F0F0',
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    marginBottom: 6,
  },
  vipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  vipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ========== 统计信息样式 ==========
  statsSection: {
    flexDirection: 'row',
    marginTop: 10,
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
  },

  // ========== 菜单样式 ==========
  menuSection: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
  },
  themePreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  currentModelText: {
    fontSize: 13,
    marginRight: 8,
    maxWidth: 120,
  },

  // ========== 退出登录样式 ==========
  logoutButton: {
    margin: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // ========== 底部版本信息 ==========
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 12,
  },

  // ========== Modal通用样式 ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
  },

  // ========== 主题选项样式 ==========
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeOptionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    width: 24,
    marginRight: 12,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  checkMark: {
    marginLeft: 12,
  },
  colorPreviewRow: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    bottom: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 4,
  },

  // ========== AI设置Modal样式 ==========
  aiModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  presetOptionLeft: {
    flex: 1,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '500',
  },
  presetDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  testButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  testResultBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  testResultText: {
    fontSize: 13,
    lineHeight: 18,
  },
  saveButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiFooter: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  aiFooterText: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default ProfileScreen;
