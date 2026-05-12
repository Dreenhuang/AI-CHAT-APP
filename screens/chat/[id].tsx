/**
 * 聊天详情页 - ChatDetail (辩论版)
 * 
 * 功能说明：
 * 1. 支持普通聊天和辩论模式
 * 2. 集成19种辩论模式和35个Soul角色
 * 3. 显示辩论阶段指示器
 * 4. 支持流式AI输出
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
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';

// 导入组件
import ChatBubble from '../../components/ChatBubble';
import EmptyState from '../../components/EmptyState';
import LoadingAnimation from '../../components/LoadingAnimation';
import Toast from '../../components/Toast';

// 导入Store和类型
import { useChatStore } from '../../stores/useChatStore';
import { Message } from '../../types';

// 导入主题
import { Colors } from '../../theme/colors';

// 导入工具
import { generateId } from '../../utils';

// 导入辩论引擎和数据
import { DebateEngine, DebateState, DebateMessage, DebateConfig } from '../../services/debateEngine';
import { DISCUSSION_MODES, getModeById, getAllModes, getModeCategories } from '../../data/discussionModes';
import { soulPresets, getSoulById, getRandomSoul, getAllSouls } from '../../data/soulPresets';

type NavigationProps = StackNavigationProp<any>;
type ChatRouteProp = RouteProp<{ ChatDetail: { id: string; soulId?: string; topicId?: string; modeId?: string } }, 'ChatDetail'>;

const ChatDetailScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<NavigationProps>();
  
  // 获取路由参数
  const { id: conversationId, soulId, topicId, modeId } = route.params;
  
  // 状态管理
  const { 
    messages, 
    addMessage,
    getMessages,
    userPosition,
    isLoading,
  } = useChatStore();
  
  // 本地状态 - 普通聊天
  const [inputText, setInputText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // 本地状态 - 辩论模式
  const [isDebateMode, setIsDebateMode] = useState(!!modeId);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [debateEngine, setDebateEngine] = useState<DebateEngine | null>(null);
  const [debateState, setDebateState] = useState<DebateState | null>(null);
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [selectedMode, setSelectedMode] = useState(modeId ? getModeById(modeId) : null);
  const [selectedRoles, setSelectedRoles] = useState<any[]>([]);
  const [debateTopic, setDebateTopic] = useState(topicId || '');
  
  // Refs
  const flatListRef = useRef<FlatList>(null);

  // 获取当前会话的消息
  const conversationMessages = getMessages(conversationId) || [];

  /**
   * 显示Toast提示
   */
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  /**
   * 初始化辩论引擎
   */
  const initDebateEngine = useCallback(() => {
    if (!selectedMode || selectedRoles.length === 0 || !debateTopic) {
      showToast('请完整配置辩论模式、角色和议题', 'warning');
      return;
    }

    try {
      const config: DebateConfig = {
        modeId: selectedMode.id,
        topic: debateTopic,
        roles: selectedRoles,
        outputDepth: 'normal',
      };

      const engine = new DebateEngine(
        config,
        (state) => {
          setDebateState(state);
        },
        (message) => {
          setDebateMessages(prev => [...prev, message]);
          // 自动滚动到底部
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      setDebateEngine(engine);
      setIsDebateMode(true);
      setShowModeSelector(false);
      setShowRoleSelector(false);
      
      // 启动辩论
      engine.start();
      showToast('辩论已开始！', 'success');
    } catch (error) {
      showToast(`初始化失败: ${error}`, 'error');
    }
  }, [selectedMode, selectedRoles, debateTopic]);

  /**
   * 选择辩论模式
   */
  const selectMode = (modeId: string) => {
    const mode = getModeById(modeId);
    if (mode) {
      setSelectedMode(mode);
      setShowModeSelector(false);
      setShowRoleSelector(true);
      
      // 自动设置默认角色
      const defaultRoles = mode.defaultRoles.map((roleDef, index) => ({
        id: `role-${index}`,
        name: roleDef.label,
        roleType: roleDef.roleType,
        soulPresetId: null,
        soul: '',
      }));
      setSelectedRoles(defaultRoles);
    }
  };

  /**
   * 选择Soul角色
   */
  const selectSoulForRole = (roleIndex: number, soulId: string) => {
    const soul = getSoulById(soulId);
    if (soul) {
      const updatedRoles = [...selectedRoles];
      updatedRoles[roleIndex] = {
        ...updatedRoles[roleIndex],
        soulPresetId: soul.id,
        soul: soul.soul,
      };
      setSelectedRoles(updatedRoles);
    }
  };

  /**
   * 发送消息（普通模式）
   */
  const handleSend = useCallback(() => {
    if (!inputText.trim()) {
      showToast('请输入消息内容', 'warning');
      return;
    }

    // 创建新消息
    const newMessage: Message = {
      id: generateId('msg'),
      conversationId,
      sender: 'user',
      content: inputText.trim(),
      type: 'text',
      status: 'sending',
      timestamp: new Date().toISOString(),
    };

    // 添加到Store
    addMessage(newMessage);
    
    // 清空输入框
    setInputText('');
    
    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // 模拟AI回复（Demo模式）
    setTimeout(() => {
      simulateAIResponse(newMessage.content);
    }, 1500 + Math.random() * 1000);
  }, [inputText, conversationId, addMessage]);

  /**
   * 发送消息（辩论模式）
   */
  const handleDebateSend = useCallback(() => {
    if (!inputText.trim()) {
      showToast('请输入消息内容', 'warning');
      return;
    }

    if (debateEngine && debateState?.status === 'running') {
      try {
        debateEngine.submitUserMessage(inputText.trim());
        setInputText('');
      } catch (error) {
        showToast(`${error}`, 'error');
      }
    }
  }, [inputText, debateEngine, debateState]);

  /**
   * 模拟AI回复（Demo用）
   */
  const simulateAIResponse = (userMessage: string) => {
    const responses = [
      '这是一个很有趣的观点！让我从另一个角度来分析...',
      '我理解你的想法，不过是否考虑过以下可能性？',
      '这个论点很有说服力，但我认为还有值得商榷的地方。',
      '感谢你的分享！这让我想到了一个相关的议题...',
      '你的观点很有创意！我们可以进一步探讨...',
    ];

    const aiMessage: Message = {
      id: generateId('msg'),
      conversationId,
      sender: 'ai',
      content: responses[Math.floor(Math.random() * responses.length)],
      type: 'text',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };

    addMessage(aiMessage);

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  /**
   * 渲染普通消息气泡
   */
  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item}
      isCurrentUser={item.sender === 'user'}
    />
  );

  /**
   * 渲染辩论消息
   */
  const renderDebateMessage = ({ item }: { item: DebateMessage }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageTitle}>{item.title}</Text>
            <Text style={styles.systemMessageDesc}>{item.description}</Text>
          </View>
        </View>
      );
    }

    const isUser = item.type === 'user';
    return (
      <View style={[
        styles.debateMessageWrapper,
        isUser ? styles.debateMessageUser : styles.debateMessageAI,
      ]}>
        {!isUser && (
          <Text style={styles.roleName}>{item.roleName}</Text>
        )}
        <View style={[
          styles.debateBubble,
          isUser ? styles.debateBubbleUser : styles.debateBubbleAI,
        ]}>
          <Text style={[
            styles.debateBubbleText,
            isUser ? styles.debateBubbleTextUser : styles.debateBubbleTextAI,
          ]}>
            {item.content}
          </Text>
          {item.isStreaming && (
            <View style={styles.streamingIndicator}>
              <Text style={styles.streamingText}>AI正在思考...</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * 渲染空状态
   */
  const renderEmpty = () => (
    <EmptyState
      icon="✉️"
      title={isDebateMode ? "准备开始辩论" : "还没有消息"}
      description={isDebateMode ? "选择辩论模式和角色开始" : "发送第一条消息开始讨论吧！"}
    />
  );

  /**
   * 渲染辩论阶段指示器
   */
  const renderPhaseIndicator = () => {
    if (!debateState || !isDebateMode) return null;

    const currentPhase = debateState.phases[debateState.currentStep];
    const progress = ((debateState.currentStep + 1) / debateState.totalSteps) * 100;

    return (
      <View style={styles.phaseIndicator}>
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseLabel}>
            步骤 {debateState.currentStep + 1}/{debateState.totalSteps}
          </Text>
          <Text style={styles.phaseStatus}>
            {debateState.status === 'running' ? '🔄 进行中' : 
             debateState.status === 'paused' ? '⏸️ 已暂停' :
             debateState.status === 'completed' ? '✅ 已完成' : '⏸️ 待开始'}
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {currentPhase && (
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>{currentPhase.label}</Text>
            <Text style={styles.phaseDesc}>{currentPhase.description}</Text>
          </View>
        )}

        {/* 控制按钮 */}
        <View style={styles.phaseControls}>
          {debateState.status === 'running' && (
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => debateEngine?.pause()}
            >
              <Text style={styles.controlButtonText}>暂停</Text>
            </TouchableOpacity>
          )}
          {debateState.status === 'paused' && (
            <TouchableOpacity 
              style={[styles.controlButton, styles.controlButtonPrimary]}
              onPress={() => debateEngine?.resume()}
            >
              <Text style={styles.controlButtonText}>继续</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 状态栏 */}
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* 自定义导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isDebateMode ? (selectedMode?.name || '辩论模式') : 
             topicId ? `辩论话题 #${topicId.slice(-4)}` : `讨论 ${conversationId.slice(-6)}`}
          </Text>
          {userPosition && !isDebateMode && (
            <Text style={styles.positionLabel}>
              你的立场: {userPosition === 'pro' ? '正方' : '反方'}
            </Text>
          )}
          {isDebateMode && debateState && (
            <Text style={styles.positionLabel}>
              回合 {debateState.currentRound}/{debateState.totalRounds}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowModeSelector(true)}
        >
          <Text style={styles.moreButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 辩论阶段指示器 */}
      {renderPhaseIndicator()}

      {/* 议题信息条（如果有） */}
      {(topicId || debateTopic) && (
        <View style={styles.topicBar}>
          <Text style={styles.topicIcon}>📋</Text>
          <Text style={styles.topicText} numberOfLines={1}>
            正在讨论：{debateTopic || topicId}
          </Text>
        </View>
      )}

      {/* 消息列表 */}
      {isLoading ? (
        <LoadingAnimation text="加载消息..." />
      ) : (
        <FlatList
          ref={flatListRef}
          data={isDebateMode ? debateMessages : conversationMessages}
          renderItem={isDebateMode ? renderDebateMessage : renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            (isDebateMode ? debateMessages.length : conversationMessages.length) === 0 
              ? styles.emptyList : styles.messageList
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() => {
            const msgLength = isDebateMode ? debateMessages.length : conversationMessages.length;
            if (msgLength > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {/* 输入区域 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          {/* 输入框 */}
          <RNTextInput
            style={styles.textInput}
            placeholder={isDebateMode ? "输入你的观点..." : "输入你的观点..."}
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => isDebateMode ? handleDebateSend() : handleSend()}
          />

          {/* 发送按钮 */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={isDebateMode ? handleDebateSend : handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>发送</Text>
          </TouchableOpacity>
        </View>

        {/* 功能按钮栏 */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>🎤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => setShowModeSelector(true)}
          >
            <Text style={styles.toolIcon}>🎭</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 辩论模式选择器 Modal */}
      <Modal
        visible={showModeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModeSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择辩论模式</Text>
            <TouchableOpacity onPress={() => setShowModeSelector(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {Object.entries(getModeCategories()).map(([category, modes]) => (
              <View key={category} style={styles.modeCategory}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {modes.map((mode: any) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.modeItem,
                      selectedMode?.id === mode.id && styles.modeItemSelected,
                    ]}
                    onPress={() => selectMode(mode.id)}
                  >
                    <Text style={styles.modeIcon}>{mode.icon}</Text>
                    <View style={styles.modeInfo}>
                      <Text style={styles.modeName}>{mode.name}</Text>
                      <Text style={styles.modeDesc}>{mode.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 角色选择器 Modal */}
      <Modal
        visible={showRoleSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>配置辩论角色</Text>
            <TouchableOpacity onPress={() => setShowRoleSelector(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 议题输入 */}
            <View style={styles.topicInputContainer}>
              <Text style={styles.inputLabel}>辩论议题</Text>
              <RNTextInput
                style={styles.topicInput}
                placeholder="输入要讨论的议题..."
                value={debateTopic}
                onChangeText={setDebateTopic}
                multiline
              />
            </View>

            {/* 角色列表 */}
            {selectedRoles.map((role, index) => (
              <View key={role.id} style={styles.roleCard}>
                <Text style={styles.roleCardTitle}>{role.name} ({role.roleType})</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {getAllSouls()
                    .filter(soul => soul.roleType === role.roleType || role.roleType === 'member')
                    .map((soul) => (
                      <TouchableOpacity
                        key={soul.id}
                        style={[
                          styles.soulChip,
                          role.soulPresetId === soul.id && styles.soulChipSelected,
                        ]}
                        onPress={() => selectSoulForRole(index, soul.id)}
                      >
                        <Text style={[
                          styles.soulChipText,
                          role.soulPresetId === soul.id && styles.soulChipTextSelected,
                        ]}>
                          {soul.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  }
                </ScrollView>

                {!role.soul && (
                  <TouchableOpacity
                    style={styles.randomSoulButton}
                    onPress={() => {
                      const randomSoul = getRandomSoul(role.roleType);
                      if (randomSoul) {
                        selectSoulForRole(index, randomSoul.id);
                      }
                    }}
                  >
                    <Text style={styles.randomSoulButtonText}>随机选择</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* 开始辩论按钮 */}
            <TouchableOpacity
              style={[
                styles.startDebateButton,
                (!debateTopic || selectedRoles.some(r => !r.soul)) && styles.startDebateButtonDisabled,
              ]}
              onPress={initDebateEngine}
              disabled={!debateTopic || selectedRoles.some(r => !r.soul)}
            >
              <Text style={styles.startDebateButtonText}>开始辩论</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Toast提示 */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
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
    color: '#FFFFFF',
    marginTop: -4,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  positionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
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
    fontSize: 18,
  },

  // 辩论阶段指示器
  phaseIndicator: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  phaseStatus: {
    fontSize: 12,
    color: Colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  phaseInfo: {
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  phaseDesc: {
    fontSize: 12,
    color: '#666',
  },
  phaseControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
  },
  controlButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },

  // 议题信息
  topicBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDE7',
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
    color: '#F57C00',
  },

  // 消息列表
  messageList: {
    paddingVertical: 12,
  },
  emptyList: {
    flex: 1,
  },

  // 辩论消息样式
  systemMessageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  systemMessage: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  systemMessageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 2,
  },
  systemMessageDesc: {
    fontSize: 12,
    color: '#1976D2',
  },
  debateMessageWrapper: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  debateMessageUser: {
    alignItems: 'flex-end',
  },
  debateMessageAI: {
    alignItems: 'flex-start',
  },
  roleName: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    marginLeft: 4,
  },
  debateBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  debateBubbleUser: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  debateBubbleAI: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopLeftRadius: 4,
  },
  debateBubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  debateBubbleTextUser: {
    color: '#FFFFFF',
  },
  debateBubbleTextAI: {
    color: '#333',
  },
  streamingIndicator: {
    marginTop: 6,
  },
  streamingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // 输入区域
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
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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

  // Modal 样式
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // 模式选择样式
  modeCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#E3F2FD',
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  modeDesc: {
    fontSize: 12,
    color: '#666',
  },

  // 角色选择样式
  topicInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  topicInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  roleCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  soulChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    marginBottom: 8,
  },
  soulChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  soulChipText: {
    fontSize: 13,
    color: '#666',
  },
  soulChipTextSelected: {
    color: '#FFFFFF',
  },
  randomSoulButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  randomSoulButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  startDebateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  startDebateButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  startDebateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChatDetailScreen;
