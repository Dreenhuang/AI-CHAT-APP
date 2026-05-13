/**
 * 聊天详情页 - ChatDetail
 *
 * 显示单个会话的完整聊天记录，支持实时对话
 * 功能：
 * 1. 顶部导航栏：返回按钮 + 会话标题 + 菜单按钮
 * 2. 消息列表：
 *    - AI消息：左侧显示，白色气泡#FFFFFF，带头像和角色名
 *    - 用户消息：右侧显示，浅绿气泡#95EC69
 * 3. 多AI角色轮流讨论（进入话题时自动启动）
 *    - 根据讨论模式配置自动生成多角色发言
 *    - 按flow流程控制发言顺序和轮次
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 导入组件
import ChatBubble from '../../components/ChatBubble';
import EmptyState from '../../components/EmptyState';
import LoadingAnimation from '../../components/LoadingAnimation';
import Toast from '../../components/Toast';

// 导入Store和类型
import { useChatStore } from '../../stores/useChatStore';
import { useConnectionStore } from '../../stores/useConnectionStore';
import { useAIModelStore } from '../../stores/useAIModelStore';
import { Message, Soul } from '../../types';

// 导入主题
import { Colors } from '../../theme/colors';

/**
 * 清理AI回复内容 - 移除思考过程标签和多余空白
 * 过滤 <think->...</think->、```...``` 等非输出内容
 */
const cleanAIContent = (rawContent: string): string => {
  if (!rawContent) return '';
  let content = rawContent;
  // 移除 <think->...</think-> 标签及其内容（DeepSeek/MiniMax思维链）
  content = content.replace(/<think->[\s\S]*?<\/think->/gi, '').trim();
  // 移除 ```...``` 代码块标记（如果误包含）
  content = content.replace(/```[\s]*\n?/g, '').trim();
  // 移除多余的空行（超过2个连续换行合并为2个）
  content = content.replace(/\n{3,}/g, '\n\n').trim();
  return content;
};

// 导入工具函数
import { generateId } from '../../utils';

// 导入Mock数据（用于Demo模式）
import { mockSouls, getSoulById } from '../../data/souls';

// ============ 多角色讨论引擎导入 ============
import DebateEngine, {
  DebateRole,
  DebateConfig,
  DebateMessage as EngineMessage,
  DebateState,
} from '../../services/debateEngine';
import { DISCUSSION_MODES, MODE_DEFAULT_SOULS } from '../../data/discussionModes';
import { soulPresets } from '../../data/soulPresets';
import { allTopics } from '../../data/topics';

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

  // 连接状态 - 从全局Store获取
  const isConnected = useConnectionStore((s) => s.status) === 'connected';
  const isReconnecting = useConnectionStore((s) => s.status) === 'reconnecting';

  // Toast状态
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // ============ 多角色讨论引擎状态 ============
  const [isDebateMode, setIsDebateMode] = useState(false);       // 是否为多角色讨论模式
  const [debateStatus, setDebateStatus] = useState<string>('');  // 讨论状态
  const debateEngineRef = useRef<DebateEngine | null>(null);     // 引擎实例引用
  const debateStartedRef = useRef(false);                        // 防止重复启动

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const thinkingMessagesRef = useRef<Set<string>>(new Set());    // 跟踪"思考中"消息

  // ============ 辅助函数：从soulPresets查找角色灵魂 ============
  const findSoulPreset = useCallback((roleType: string, modeId: string): { name: string; soul: string; avatar?: string } | null => {
    const defaultSouls = (MODE_DEFAULT_SOULS as any)[modeId];
    if (defaultSouls) {
      const soulId = defaultSouls[roleType];
      if (soulId) {
        for (const category of Object.values(soulPresets) as any[]) {
          const found = category.find((s: any) => s.id === soulId);
          if (found) return { name: found.name, soul: found.soul, avatar: found.avatar };
        }
      }
    }
    return null;
  }, []);

  // ============ 辅助函数：根据模式创建辩论角色 ============
  const createDebateRoles = useCallback((modeId: string): DebateRole[] => {
    const mode = (DISCUSSION_MODES as any)[modeId];
    if (!mode || !mode.defaultRoles) return [];

    return mode.defaultRoles.map((role: any, index: number) => {
      const preset = findSoulPreset(role.roleType, modeId);
      const roleIndex = index + 1;
      return {
        id: `${modeId}-${role.roleType}-${roleIndex}`,
        name: preset?.name || role.label || `${role.roleType}${roleIndex}`,
        roleType: role.roleType,
        soulPresetId: preset ? `${role.roleType}-${roleIndex}` : undefined,
        soul: preset?.soul || `你是一位${role.label || role.roleType}，请积极参与讨论。`,
      };
    });
  }, [findSoulPreset]);

  // ============ 辅助函数：将引擎消息添加到聊天Store ============
  const addEngineMessageToChat = useCallback((engineMsg: EngineMessage) => {
    if (engineMsg.type === 'system') {
      const systemMsg: Message = {
        id: engineMsg.id,
        conversationId,
        sender: 'ai',
        content: engineMsg.title || engineMsg.content,
        type: 'text',
        status: 'delivered',
        timestamp: engineMsg.timestamp,
      };
      addMessage(systemMsg);
      return;
    }

    if (engineMsg.isStreaming) {
      thinkingMessagesRef.current.add(engineMsg.id);
      setIsTyping(true);
      return;
    }

    thinkingMessagesRef.current.delete(engineMsg.id);
    if (thinkingMessagesRef.current.size === 0) {
      setIsTyping(false);
    }

    const msg: Message = {
      id: engineMsg.id,
      conversationId,
      sender: 'ai',
      content: `【${engineMsg.roleName || engineMsg.role}】\n${engineMsg.content}`,
      type: 'text',
      status: 'delivered',
      timestamp: engineMsg.timestamp,
    };
    addMessage(msg);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationId, addMessage]);

  // ============ 自动启动多角色讨论（当topicId存在时） ============
  useEffect(() => {
    if (!topicId || debateStartedRef.current) return;
    debateStartedRef.current = true;

    const initDebate = async () => {
      try {
        const topic = allTopics.find(t => t.id === topicId);
        const topicTitle = topic?.title || '热门议题讨论';

        const modeId = 'standard-debate';
        const mode = (DISCUSSION_MODES as any)[modeId];
        if (!mode) return;

        const roles = createDebateRoles(modeId);
        if (roles.length === 0) {
          showToast('无法创建讨论角色', 'error');
          return;
        }

        const config: DebateConfig = {
          modeId,
          topic: topicTitle,
          roles,
          outputDepth: 'normal',
        };

        const engine = new DebateEngine(
          config,
          (state: DebateState) => {
            setDebateStatus(state.status);
            if (state.status === 'running') setIsDebateMode(true);
            if (state.status === 'completed') {
              showToast('讨论已结束', 'info');
              setIsTyping(false);
            }
          },
          (msg: EngineMessage) => {
            addEngineMessageToChat(msg);
          }
        );

        debateEngineRef.current = engine;

        const welcomeMsg: Message = {
          id: `welcome-${Date.now()}`,
          conversationId,
          sender: 'ai',
          content: `🤖 **多角色讨论已启动！**\n\n📌 主题：**${topicTitle}**\n📋 模式：**${mode.name}**\n👥 参与角色：${roles.map(r => `【${r.name}】`).join(' ')}\n\n系统正在依次生成各角色的观点，请稍候...`,
          type: 'text',
          status: 'delivered',
          timestamp: new Date().toISOString(),
        };
        addMessage(welcomeMsg);

        setTimeout(() => {
          engine.start();
        }, 500);
      } catch (error) {
        console.error('[Chat] 初始化讨论引擎失败:', error);
        showToast('初始化讨论失败，尝试手动发送消息', 'error');
      }
    };

    initDebate();

    return () => {
      debateEngineRef.current = null;
      debateStartedRef.current = false;
    };
  }, [topicId, conversationId, createDebateRoles, addEngineMessageToChat, addMessage]);

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
   * 3. 如果是讨论模式，将消息提交给DebateEngine推动下一步
   * 4. 否则调用单次AI API
   */
  const handleSend = useCallback(async () => {
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
    const messageContent = inputText.trim();
    setInputText('');

    // 延迟滚动到最新消息（等待渲染完成）
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // ========== 讨论模式：使用DebateEngine推动流程 ==========
    if (isDebateMode && debateEngineRef.current) {
      try {
        debateEngineRef.current.submitUserMessage(messageContent);
      } catch (error) {
        console.error('[Chat] 讨论引擎处理用户消息失败:', error);
        showToast('引擎处理失败', 'error');
      }
      return;
    }

    // ========== 普通模式：调用AI API生成真实回复 ==========
    await callAIAPI(messageContent);
  }, [inputText, conversationId, addMessage, isDebateMode]);

  /**
   * 调用AI服务生成真实回复
   *
   * 实现方式：
   * 1. 通过HTTP POST调用后端 /api/ai/generate 接口
   * 2. 后端对接MiniMax API生成智能回复
   * 3. 如果API失败，降级为模拟回复
   */
  const callAIAPI = async (userMessageContent: string) => {
    setIsTyping(true);

    try {
      const selectedSoul = selectedRole ? getSoulById(selectedRole) : null;
      
      const aiRequestBody = {
        message: userMessageContent,
        role: selectedSoul?.id || 'default',
        personality: selectedSoul?.description || '你是一个理性的辩论助手',
        style: selectedSoul?.personality || '专业、有逻辑、友好',
        conversationId,
        topicId: topicId || null,
      };

      console.log('[Chat] 正在调用AI API...', aiRequestBody);

      try {
        const response = await fetch('http://localhost:9461/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiRequestBody),
        });

        const data = await response.json();

        if (response.ok && data.success && data.content) {
        console.log('[Chat] 后端AI回复成功:', cleanAIContent(data.content).slice(0, 50) + '...');
        createAIMessage(cleanAIContent(data.content), selectedSoul?.id);
        return;
      }
      } catch (backendError) {
        console.warn('[Chat] 后端API不可用，切换到直接调用DeepSeek API:', backendError);
      }

      const config = useAIModelStore.getState().currentConfig;
      console.log(`[Chat] 直接调用 ${config.model} at ${config.baseUrl}`);

      const systemPrompt = `你是PRD辩论APP中的AI辩论角色。
- 角色ID: ${selectedSoul?.id || 'default'}
- 性格特点: ${selectedSoul?.description || '你是一个理性的辩论助手'}
- 对话风格: ${selectedSoul?.personality || '专业、有逻辑、友好'}

【回应要求】
1. 保持角色性格的一致性
2. 回应有理有据，可以举例或引用数据
3. 语言生动有趣，避免过于生硬
4. 回复长度控制在100-300字之间
5. 不要说"我是AI"或"作为语言模型"之类的话`;

      const directResponse = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageContent },
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!directResponse.ok) {
        const errData = await directResponse.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `DeepSeek API错误 (${directResponse.status})`);
      }

      const directData = await directResponse.json();
      const content = cleanAIContent(directData.choices?.[0]?.message?.content);

      if (!content) {
        throw new Error('AI返回内容为空');
      }

      console.log('[Chat] DeepSeek直接调用成功:', content.slice(0, 50) + '...');
      createAIMessage(content, selectedSoul?.id);

    } catch (error) {
      console.error('[Chat] 所有AI API调用失败:', error);
      useFallbackResponse(userMessageContent);
    }
  };

  /**
   * 创建AI消息并添加到聊天列表
   */
  const createAIMessage = (content: string, soulId?: string) => {
    // 清理AI回复内容（移除思考标签等）
    const cleanedContent = cleanAIContent(content);
    
    // 获取当前会话的AI/Soul参与者信息
    const aiParticipant = currentConversation?.participants.find(
      (p) => p.role === 'ai' || p.role === 'soul'
    );

    // 创建AI消息
    const aiMessage: Message = {
      id: generateId('msg'),
      conversationId,
      sender: soulId ? 'soul' : 'ai',
      content: cleanedContent,
      type: 'text',
      status: 'delivered',
      timestamp: new Date().toISOString(),
      soulId: soulId || aiParticipant?.id,
    };

    // 添加AI消息到Store
    addMessage(aiMessage);

    // 隐藏"正在输入中..."状态
    setIsTyping(false);

    // 滚动到最新消息
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  /**
   * 降级回复（当AI API不可用时）
   * 使用预设模板生成模拟回复
   */
  const useFallbackResponse = (userMessageContent: string) => {
    // 模拟思考延迟
    const delay = 800 + Math.random() * 700;

    setTimeout(() => {
      // 根据用户消息长度选择不同回复策略
      let fallbackContent: string;

      if (userMessageContent.length > 50) {
        // 长消息：给出详细回应
        fallbackContent = `这是一个很有深度的观点！你提到的"${userMessageContent.slice(0, 20)}..."让我从多个角度来分析。首先，这个问题的核心在于...其次...你觉得呢？`;
      } else if (userMessageContent.includes('?')) {
        // 问题：给出回答
        fallbackContent = `好问题！关于"${userMessageContent}"，我认为需要综合考虑几个方面。第一...第二...第三...你还有其他想法吗？`;
      } else {
        // 短陈述：引导继续讨论
        const responses = [
          '我理解你的意思了。不过从另一个角度来看呢？',
          '这个观点很有意思！我们可以进一步探讨一下。',
          '你说得有一定道理，但我也有一些不同的看法想分享。',
          '感谢你的分享！这让我想到了一个相关的议题...',
          '让我们深入分析一下这个观点的利弊得失。',
        ];
        fallbackContent = responses[Math.floor(Math.random() * responses.length)];
      }

      // 标记为降级回复（友好提示）
      fallbackContent += '\n\n（AI服务暂时繁忙，请稍后重试）';

      // 创建消息
      createAIMessage(fallbackContent);
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
      icon="mail"
      title="还没有消息"
      description="发送第一条消息开始讨论吧！"
    />
  );

  /**
   * 渲染列表底部状态指示器
   */
  const renderFooter = () => {
    if (isDebateMode && debateStatus === 'running') {
      // 多角色讨论正在进行中
      return (
        <View style={styles.debateStatusBar}>
          <Ionicons name="chatbubbles" size={16} color="#7B1FA2" style={styles.debateStatusIcon} />
          <Text style={styles.debateStatusText}>多角色讨论进行中...</Text>
        </View>
      );
    }

    if (isDebateMode && debateStatus === 'completed') {
      return (
        <View style={[styles.debateStatusBar, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle" size={16} color="#2E7D32" style={styles.debateStatusIcon} />
          <Text style={[styles.debateStatusText, { color: '#2E7D32' }]}>讨论已结束</Text>
        </View>
      );
    }

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

    if (isReconnecting) {
      return (
        <View style={[styles.offlineIndicator, { borderColor: '#F57C00' }]}>
          <Ionicons name="sync" size={16} color="#D97706" style={styles.offlineIcon} />
          <Text style={[styles.offlineText, { color: '#D97706' }]}>正在自动重连...</Text>
        </View>
      );
    }

    if (!isConnected) {
      return (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#DC2626" style={styles.offlineIcon} />
          <Text style={[styles.offlineText, { color: '#DC2626' }]}>服务未连接</Text>
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
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.roleCheckMark} />
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
      {/* 状态栏 - 浅蓝色适配 */}
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ==================== 自定义导航栏 - 浅蓝色统一风格 ==================== */}
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        {/* 左侧：返回按钮 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
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
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ==================== 议题信息条（可选） ==================== */}
      {topicId && (
        <View style={styles.topicBar}>
          <Ionicons name="chatbox-ellipses" size={16} color="#F57C00" style={styles.topicIcon} />
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
            <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="image-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="mic-outline" size={22} color={Colors.textSecondary} />
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

  // ========== 导航栏样式 - 统一浅蓝色风格 ==========
  header: {
    height: 44,                              // 统一高度
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 8,
    paddingTop: 8,
    maxWidth: '90%',
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    maxWidth: '90%',
    alignSelf: 'flex-end',
  },

  // ========== 头像样式（AI/Soul） ==========
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 6,
    backgroundColor: '#F0F0F5',
  },

  // ========== 发送者名称 ==========
  senderName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginLeft: 42,
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

  // ========== 多角色讨论状态栏 ==========
  debateStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F3E5F5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CE93D8',
  },
  debateStatusIcon: {
    marginRight: 6,
  },
  debateStatusText: {
    fontSize: 13,
    color: '#7B1FA2',
    fontWeight: '500',
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
    marginLeft: 8,
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
});

export default ChatDetailScreen;
