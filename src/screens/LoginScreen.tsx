/**
 * 登录/注册页面 v2.0
 *
 * 重构说明：
 * 1. 移除所有验证码UI和逻辑
 * 2. 采用"手机号+密码"登录方式
 * 3. 支持注册/登录切换
 * 4. 集成密码强度实时提示
 *
 * 功能：
 * - 手机号 + 密码登录
 * - 手机号 + 密码 + 昵称 注册
 * - 游客模式（免登录使用）
 * - 表单验证和错误提示
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 导入主题
import { Colors } from '../theme/colors';

// 导入Store
import { useUserStore } from '../stores/useUserStore';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // Store
  const { loginAsGuest, login } = useUserStore();

  // UI状态
  const [isLoginMode, setIsLoginMode] = useState(true); // true=登录模式, false=注册模式
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 表单数据
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  // 错误提示
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  /**
   * 手机号格式验证
   */
  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) {
      setPhoneError('请输入手机号');
      return false;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setPhoneError('请输入正确的11位手机号');
      return false;
    }

    setPhoneError('');
    return true;
  };

  /**
   * 密码强度校验
   */
  const validatePassword = (pwd: string): boolean => {
    if (!pwd) {
      setPasswordError('请输入密码');
      return false;
    }

    if (pwd.length < 6) {
      setPasswordError('密码长度不能少于6位');
      return false;
    }

    if (pwd.length > 20) {
      setPasswordError('密码长度不能超过20位');
      return false;
    }

    if (!/[a-zA-Z]/.test(pwd)) {
      setPasswordError('密码必须包含至少一个字母');
      return false;
    }

    if (!/\d/.test(pwd)) {
      setPasswordError('密码必须包含至少一个数字');
      return false;
    }

    setPasswordError('');
    return true;
  };

  /**
   * 获取密码强度提示文字
   */
  const getPasswordStrengthText = (pwd: string): string => {
    if (!pwd) return '';
    
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;

    switch (strength) {
      case 0:
      case 1:
        return '弱';
      case 2:
        return '中';
      case 3:
        return '强';
      default:
        return '很强';
    }
  };

  /**
   * 获取密码强度颜色
   */
  const getPasswordStrengthColor = (pwd: string): string => {
    if (!pwd || pwd.length < 6) return '#EF4444'; // 红色-弱
    
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;

    switch (strength) {
      case 1:
        return '#EF4444'; // 红色-弱
      case 2:
        return '#F59E0B'; // 黄色-中
      case 3:
        return '#10B981'; // 绿色-强
      default:
        return '#059669'; // 深绿-很强
    }
  };

  /**
   * 处理登录
   */
  const handleLogin = useCallback(async () => {
    // 验证表单
    if (!validatePhone(phoneNumber) || !validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 调用实际API /api/auth/login
      // const response = await fetch('http://localhost:9461/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: phoneNumber, password })
      // });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('[Login] 登录成功:', { phone: phoneNumber });

      // 模拟用户数据
      const mockUser = {
        id: `user_${Date.now()}`,
        nickname: `用户${phoneNumber.slice(-4)}`,
        avatar: null,
        bio: '热爱思考的辩论者',
        level: 5,
        experience: 1200,
        totalDebates: 23,
        winRate: 65,
        createdAt: new Date().toISOString(),
      };

      // 更新Store并导航
      login(mockUser, `token_${mockUser.id}_${Date.now()}`);

      Alert.alert(
        '登录成功',
        '欢迎回来！',
        [{ text: '开始使用', onPress: () => navigation.replace('MainTabs') }]
      );
    } catch (error) {
      console.error('[Login] 登录失败:', error);
      Alert.alert('错误', '登录失败，请检查网络或联系客服');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, password, login, navigation]);

  /**
   * 处理注册
   */
  const handleRegister = useCallback(async () => {
    // 验证表单
    if (!validatePhone(phoneNumber)) {
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    if (!nickname.trim() && !isLoginMode) {
      Alert.alert('提示', '请输入昵称');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 调用实际API /api/auth/register
      // const response = await fetch('http://localhost:9461/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     phone: phoneNumber, 
      //     password,
      //     nickname: nickname.trim() || `用户${phoneNumber.slice(-4)}`
      //   })
      // });

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('[Login] 注册成功:', { phone: phoneNumber, nickname });

      Alert.alert(
        '注册成功',
        '账号已创建，请登录',
        [
          { text: '去登录', onPress: () => setIsLoginMode(true) }
        ]
      );
    } catch (error) {
      console.error('[Login] 注册失败:', error);
      Alert.alert('错误', '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, password, nickname, isLoginMode]);

  /**
   * 处理游客模式（免登录）
   */
  const handleGuestMode = useCallback(() => {
    console.log('[Login] 游客模式按钮点击 - 直接进入...');
    loginAsGuest();
    navigation.replace('MainTabs');
  }, [loginAsGuest, navigation]);

  /**
   * 切换登录/注册模式
   */
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // 清除错误提示
    setPhoneError('');
    setPasswordError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ========== 头部Logo区域 ========== */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>AI</Text>
            </View>
            <Text style={styles.appName}>AI Chat</Text>
            <Text style={styles.slogan}>智能对话，让每一次交流都有价值</Text>
          </View>

          {/* ========== 登录/注册表单区域 ========== */}
          <View style={styles.formSection}>
            {/* 模式切换 */}
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                style={[styles.modeTab, isLoginMode && styles.modeTabActive]}
                onPress={() => setIsLoginMode(true)}
              >
                <Text style={[styles.modeTabText, isLoginMode && styles.modeTabTextActive]}>
                  登录
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, !isLoginMode && styles.modeTabActive]}
                onPress={() => setIsLoginMode(false)}
              >
                <Text style={[styles.modeTabText, !isLoginMode && styles.modeTabTextActive]}>
                  注册
                </Text>
              </TouchableOpacity>
            </View>

            {/* 手机号输入框 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>手机号</Text>
              <TextInput
                style={[styles.textInput, phoneError && styles.textInputError]}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (phoneError) validatePhone(text);
                }}
                placeholder="请输入11位手机号"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                maxLength={11}
                autoCapitalize="none"
                autoComplete="tel"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            {/* 密码输入框 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>密码</Text>
              <View style={styles.passwordInputRow}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput, passwordError && styles.textInputError]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  placeholder={isLoginMode ? "请输入登录密码" : "设置6-20位密码（含字母+数字）"}
                  placeholderTextColor="#999999"
                  secureTextShow={!showPassword}
                  maxLength={20}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="oneTimeCode"
                />
                <TouchableOpacity
                  style={styles.togglePasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.togglePasswordText}>
                    {showPassword ? '隐藏' : '显示'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* 密码强度指示器（仅注册模式显示） */}
              {!isLoginMode && password.length > 0 && (
                <View style={styles.passwordStrengthBar}>
                  <View
                    style={[
                      styles.strengthSegment,
                      { backgroundColor: getPasswordStrengthColor(password) },
                      password.length >= 6 && { flex: 1 },
                      password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password) && { flex: 2 },
                    ]}
                  />
                  <Text style={[styles.strengthText, { color: getPasswordStrengthColor(password) }]}>
                    强度：{getPasswordStrengthText(password)}
                  </Text>
                </View>
              )}
              
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* 昵称输入框（仅注册模式显示） */}
            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>昵称（选填）</Text>
                <TextInput
                  style={styles.textInput}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="设置一个昵称让朋友认识你"
                  placeholderTextColor="#999999"
                  maxLength={20}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* 提交按钮 */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                ((!phoneNumber || !password || isLoading) || (!!passwordError || !!phoneError)) && styles.submitButtonDisabled,
              ]}
              onPress={isLoginMode ? handleLogin : handleRegister}
              disabled={!phoneNumber || !password || isLoading || !!passwordError || !!phoneError}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLoginMode ? '登 录' : '注 册'}
                </Text>
              )}
            </TouchableOpacity>

            {/* 协议文本 */}
            <Text style={styles.agreementText}>
              {isLoginMode ? '登录' : '注册'}即表示同意{' '}
              <Text style={styles.agreementLink}>《用户协议》</Text>
              {' '}和{' '}
              <Text style={styles.agreementLink}>《隐私政策》</Text>
            </Text>
          </View>

          {/* ========== 底部游客模式入口 ========== */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestMode}
              activeOpacity={0.7}
            >
              <Text style={styles.guestButtonText}>以游客身份体验</Text>
            </TouchableOpacity>

            <Text style={styles.hintText}>
              游客模式无需注册，但数据不会保存到云端
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // ========== 头部样式 ==========
  headerSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },

  // ========== 模式切换器 ==========
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // ========== 表单样式 ==========
  formSection: {
    // 移除paddingHorizontal，由scrollContent统一管理
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  textInput: {
    height: 50,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textInputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },

  // 密码输入行
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: 12,
  },
  togglePasswordButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  togglePasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },

  // 密码强度条
  passwordStrengthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthSegment: {
    height: 4,
    flex: 3,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // 提交按钮
  submitButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 协议文本
  agreementText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  agreementLink: {
    color: Colors.primary,
    fontWeight: '500',
  },

  // ========== 底部样式 ==========
  bottomSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
  },
  guestButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: Colors.metallicSilver,
    borderRadius: 25,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  hintText: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 12,
  },
});

export default LoginScreen;
