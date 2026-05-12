/**
 * 聊天详情页 - ChatDetail
 *
 * 显示单个会话的完整聊天记录，支持实时对话
 * 功能：
 * 1. 顶部导航栏：返回按钮 + 会话标题 + 菜单按钮
 * 2. 消息列表：
 *    - AI消息：左侧显示，白色气泡#FFFFFF，带头像和角色名
 *    - 用户消息：右侧显示，浅绿气泡#95EC69
 * 3. 消息状态：
 *    - 连通时："正在输入中..."
 *    - 断开时："用户离线"
 * 4. 输入区域：
 *    - 角色选择下拉（群组辩论模式）
 *    - 文本输入框 + 发送按钮
 *
 * 设计规范：
 * - AI气泡 #FFFFFF（白色）
 * - 用户气泡 #95EC69（浅绿色）
 * - 头像 40x40px（聊天内）
 * - 气泡内边距 10px，最大宽度70%屏幕
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

// 导入组件
import ChatBubble from '../../components/ChatBubble';
import EmptyState from '../../components/EmptyState';
import LoadingAnimation from '../../components/LoadingAnimation';
import Toast from '../../components/Toast';

// 导入Store和类型
import { useChatStore } from '../../stores/useChatStore';
import { Message, Soul } from '../../types';

// 导入主题
import { Colors } from '../../theme/colors';

// 导入工具函数
import { generateId } from '../../utils';

// 导入Mock数据（用于Demo模式）
import { mockSouls, getSoulById } from '../../data/souls';

// ============ 类型定义 ============

type ChatRouteProp = RouteProp<
  { ChatDetail: { id: string; soulId?: string; topicId?: string } },
  'ChatDetail'
>;

// ============ 角色选项类型 ============

interface RoleOption {
  id: string;
  name: string;
  avatar?: string;
}

// ============ 主组件 ============

const ChatDetailScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation();

  // 获取路由参数
  const { id: conversationId, soulId, topicId } = route.params;

  // 状态管理 - 从Store获取数据
  const {
    conversations,
    addMessage,
    getMessages,
    userPosition,
    isLoading,
  } = useChatStore();

  // 本地状态
  const [inputText, setInputText] = useState('');                    // 输入文本
  const [selectedRole, setSelectedRole] = useState<string>('');      // 选中的角色ID
  const [showRolePicker, setShowRolePicker] = useState(false);       // 是否显示角色选择器
  const [isTyping, setIsTyping] = useState(false);                   // AI是否正在输入
  const [isConnected, setIsConnected] = useState(true);              // 连接状态（Demo默认true）

  // Toast状态
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // ==================== 数据获取 ====================

  /**
   * 获取当前会话信息
   */
  const currentConversation = conversations.find((conv) => conv.id === conversationId);

  /**
   * 获取当前会话的消息列表
   */
  const chatMessages = getMessages(conversationId) || [];

  /**
   * 获取可用的角色列表（群组模式下的参与者）
   */
  const availableRoles: RoleOption[] = React.useMemo(() => {
    if (!currentConversation) return [];

    // 从会话参与者中提取可选角色
    return currentConversation.participants
      .filter((p) => p.role === 'ai' || p.role === 'soul')
      .map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
      }));
  }, [currentConversation]);

  /**
   * 获取当前选中角色的信息
   */
  const selectedRoleInfo: RoleOption | undefined = React.useMemo(() => {
    if (!selectedRole) return undefined;
    return availableRoles.find((r) => r.id === selectedRole);
  }, [selectedRole, availableRoles]);

  // ==================== Toast工具方法 ====================

  /**
   * 显示Toast提示
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // ==================== 消息发送逻辑 ====================

  /**
   * 发送消息
   *
   * 流程：
   * 1. 验证输入内容
   * 2. 创建用户消息对象并添加到Store
   * 3. 清空输入框
   * 4. 滚动到最新消息
   * 5. 模拟AI回复（Demo模式）
   */
  const handleSend = useCallback(() => {
    if (!inputText.trim()) {
      showToast('请输入消息内容', 'warning');
      return;
    }

    // 创建用户消息
    const userMessage: Message = {
      id: generateId('msg'),
      conversationId,
      sender: 'user',
      content: inputText.trim(),
      type: 'text',
      status: 'sending',
      timestamp: new Date().toISOString(),
    };

    // 添加到Store
    addMessage(userMessage);

    // 清空输入框
    setInputText('');

    // 延迟滚动到最新消息（等待渲染完成）
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // ========== Demo模式：模拟AI回复 ==========
    // 在实际项目中，这里应该通过WebSocket发送到后端AI服务
    simulateAIResponse(inputText.trim());
  }, [inputText, conversationId, addMessage]);

  /**
   * 模拟AI回复（用于Demo演示）
   *
   * 实际项目中应替换为：
   * 1. 通过WebSocket发送消息到服务端
   * 2. 服务端调用AI模型生成回复
   * 3. 通过WebSocket推送回复给客户端
   */
  const simulateAIResponse = (userMessageContent: string) => {
    // 显示"正在输入中..."状态
    setIsTyping(true);

    // 随机延迟1.5-2.5秒模拟AI思考时间
    const delay = 1500 + Math.random() * 1000;

    setTimeout(() => {
      // 预设的AI回复模板（实际项目使用真实AI生成）
      const responses = [
        '这是一个很有趣的观点！让我从另一个角度来分析...',
        '我理解你的想法，不过是否考虑过以下可能性？',
        '这个论点很有说服力，但我认为还有值得商榷的地方。',
        '感谢你的分享！这让我想到了一个相关的议题...',
        '你的观点很有创意！我们可以进一步探讨...',
        '从逻辑角度来看，这个观点存在一些值得思考的地方...',
        '我同意你的部分看法，但也有一些不同的见解...',
        '这是一个值得深入讨论的问题！让我们从多个角度分析...',
      ];

      // 随机选择一个回复
      const aiContent = responses[Math.floor(Math.random() * responses.length)];

      // 获取当前会话的AI/Soul参与者信息
      const aiParticipant = currentConversation?.participants.find(
        (p) => p.role === 'ai' || p.role === 'soul'
      );

      // 创建AI消息
      const aiMessage: Message = {
        id: generateId('msg'),
        conversationId,
        sender: aiParticipant?.role === 'soul' ? 'soul' : 'ai',
        content: aiContent,
        type: 'text',
        status: 'delivered',
        timestamp: new Date().toISOString(),
        soulId: aiParticipant?.id, // 记录来源Soul ID（如果有）
      };

      // 添加AI消息到Store
      addMessage(aiMessage);

      // 隐藏"正在输入中..."状态
      setIsTyping(false);

      // 滚动到最新消息
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, delay);
  };

  // ==================== 渲染方法 ====================

  /**
   * 渲染消息项
   *
   * 扩展ChatBubble组件，添加AI头像和角色名显示
   */
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender === 'user';

    // 如果是AI/Soul消息，查找对应的参与者信息获取头像
    const participant =
      !isCurrentUser && item.soulId
        ? getSoulById(item.soulId)
        : currentConversation?.participants.find(
            (p) =>
              (item.sender === 'ai' && p.role === 'ai') ||
              (item.sender === 'soul' && p.id === item.soulId)
          );

    return (
      <View style={isCurrentUser ? styles.userMessageContainer : styles.aiMessageContainer}>
        {/* AI/Soul消息：显示头像 */}
        {!isCurrentUser && (
          <Image
            source={{
              uri:
                participant?.avatar ||
                'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
            }}
            style={styles.avatar}
          />
        )}

        {/* 消息气泡 */}
        <ChatBubble message={item} isCurrentUser={isCurrentUser} />

        {/* AI/Soul消息：显示角色名 */}
        {!isCurrentUser && participant && (
          <Text style={styles.senderName}>{participant.name}</Text>
        )}
      </View>
    );
  };

  /**
   * 渲染空状态
   */
  const renderEmpty = () => (
    <EmptyState
      icon="✉️"
      title="还没有消息"
      description="发送第一条消息开始讨论吧！"
    />
  );

  /**
   * 渲染列表底部状态指示器
   */
  const renderFooter = () => {
    if (isTyping) {
      // 正在输入中...
      return (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingDot}>●</Text>
          <Text style={[styles.typingDot, styles.typingDotDelay1]}>●</Text>
          <Text style={[styles.typingDot, styles.typingDotDelay2]}>●</Text>
          <Text style={styles.typingText}>正在输入中...</Text>
        </View>
      );
    }

    if (!isConnected) {
      // 用户离线
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineIcon}>⚠️</Text>
          <Text style={styles.offlineText}>用户离线</Text>
        </View>
      );
    }

    return null;
  };

  /**
   * 渲染角色选择器（群组模式下显示）
   */
  const renderRoleSelector = () => {
    // 仅在群组会话且有可用角色时显示
    if (currentConversation?.participants.length <= 2 || availableRoles.length === 0) {
      return null;
    }

    return (
      <>
        {/* 角色选择按钮 */}
        <TouchableOpacity
          style={styles.roleSelector}
          onPress={() => setShowRolePicker(!showRolePicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.roleSelectorText}>
            {selectedRoleInfo?.name || '选择角色'} ▼
          </Text>
        </TouchableOpacity>

        {/* 角色选择下拉面板 */}
        {showRolePicker && (
          <View style={styles.rolePickerPanel}>
            {availableRoles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleOption,
                  selectedRole === role.id && styles.roleOptionSelected,
                ]}
                onPress={() => {
                  setSelectedRole(role.id);
                  setShowRolePicker(false);
                }}
                activeOpacity={0.7}
              >
                {role.avatar && (
                  <Image source={{ uri: role.avatar }} style={styles.roleAvatar} />
                )}
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === role.id && styles.roleOptionTextSelected,
                  ]}
                >
                  {role.name}
                </Text>
                {selectedRole === role.id && (
                  <Text style={styles.roleCheckMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </>
    );
  };

  // ==================== 主渲染 ====================

  return (
    <View style={styles.container}>
      {/* 状态栏 */}
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ==================== 自定义导航栏 ==================== */}
      <View style={styles.header}>
        {/* 左侧：返回按钮 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        {/* 中间：标题区域 */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {/* 优先显示议题标题，否则显示Soul名称，最后显示默认标题 */}
            {currentConversation?.topicTitle ||
              (soulId ? getSoulById(soulId)?.name : null) ||
              `讨论 ${conversationId.slice(-6)}`}
          </Text>

          {/* 显示用户立场标签（如果有） */}
          {userPosition && (
            <Text style={styles.positionLabel}>
              你的立场: {userPosition === 'pro' ? '正方' : '反方'}
            </Text>
          )}
        </View>

        {/* 右侧：菜单按钮 */}
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* ==================== 议题信息条（可选） ==================== */}
      {topicId && (
        <View style={styles.topicBar}>
          <Text style={styles.topicIcon}>📋</Text>
          <Text style={styles.topicText} numberOfLines={1}>
            正在讨论：{topicId}
          </Text>
        </View>
      )}

      {/* ==================== 消息列表 ==================== */}
      {isLoading ? (
        <LoadingAnimation text="加载消息..." />
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            chatMessages.length === 0 ? styles.emptyList : styles.messageList
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}

          // 自动滚动到最新消息
          onContentSizeChange={() => {
            if (chatMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}

          // 性能优化配置
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* ==================== 输入区域 ==================== */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* 角色选择器（群组模式） */}
        {renderRoleSelector()}

        {/* 输入框和发送按钮 */}
        <View style={styles.inputContainer}>
          <RNTextInput
            style={styles.textInput}
            placeholder="输入你的观点..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            enablesReturnKeyAutomatically={true}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>发送</Text>
          </TouchableOpacity>
        </View>

        {/* 功能扩展按钮栏（可选） */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>🎤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>➕</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ==================== Toast提示 ==================== */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
};

// ==================== 样式定义 ====================
// 严格遵循设计规范

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F5F5F5 浅灰背景
  },

  // ========== 导航栏样式 ==========
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary, // #AFDD22 主题色
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF', // 白色
    marginTop: -4,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,           // 17sp（标准导航栏字号）
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  positionLabel: {
    fontSize: 11,           // 11sp小字
    color: 'rgba(255, 255, 255, 0.85)', // 半透明白色
    textAlign: 'center',
    marginTop: 2,
  },
  moreButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },

  // ========== 议题信息条 ==========
  topicBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDE7', // 浅黄色背景
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FFE082',
  },
  topicIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  topicText: {
    flex: 1,
    fontSize: 12,
    color: '#F57C00', // 橙色文字
  },

  // ========== 消息容器样式 ==========
  aiMessageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start', // 左对齐
  },
  userMessageContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    maxWidth: '80%',
    alignSelf: 'flex-end', // 右对齐
  },

  // ========== 头像样式（AI/Soul） ==========
  avatar: {
    width: 40,               // 40x40px（聊天内头像尺寸）
    height: 40,
    borderRadius: 20,        // 圆形头像
    marginRight: 8,
    backgroundColor: '#F0F0F5',
  },

  // ========== 发送者名称 ==========
  senderName: {
    fontSize: 12,
    color: Colors.textSecondary, // #888888 灰色
    marginTop: 4,
    marginLeft: 48,             // 与头像对齐
    marginBottom: 4,
  },

  // ========== 消息列表 ==========
  messageList: {
    paddingVertical: 12,
  },
  emptyList: {
    flex: 1,
  },

  // ========== 正在输入指示器 ==========
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  typingDot: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginRight: 3,
    opacity: 0.4,
  },
  typingDotDelay1: {
    animationDelay: '0.2s', // CSS动画延迟（RN中需用Animated API实现）
  },
  typingDotDelay2: {
    animationDelay: '0.4s',
  },
  typingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontStyle: 'italic',
  },

  // ========== 离线指示器 ==========
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF3E0', // 浅橙色背景
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FFE0B2',
  },
  offlineIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  offlineText: {
    fontSize: 13,
    color: '#E65100', // 深橙色
  },

  // ========== 角色选择器 ==========
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  roleSelectorText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // ========== 角色选择下拉面板 ==========
  rolePickerPanel: {
    position: 'absolute',
    bottom: '100%', // 显示在按钮上方
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
    zIndex: 100,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  roleOptionSelected: {
    backgroundColor: 'rgba(175, 221, 34, 0.1)', // 主题色浅背景
  },
  roleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  roleOptionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  roleOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  roleCheckMark: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ========== 输入区域 ==========
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,         // 最大高度限制4行
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: Colors.primary, // #AFDD22 主题色
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,           // 禁用状态半透明
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ========== 功能工具栏 ==========
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  toolButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 22,
  },
});

export default ChatDetailScreen;
