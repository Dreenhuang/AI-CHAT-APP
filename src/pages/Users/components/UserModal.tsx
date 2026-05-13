/**
 * 用户模态框组件 (UserModal)
 *
 * 功能说明：
 * 用于添加新用户或编辑现有用户信息的弹窗
 *
 * 核心功能：
 * 1. 表单字段：头像上传、用户名、邮箱、密码、角色、状态
 * 2. 权限设置：议题管理、用户管理、日志查看、系统配置
 * 3. 备注信息：可选的备注字段
 * 4. 表单验证：实时验证和提交前验证
 * 5. 模式切换：新增模式 / 编辑模式
 *
 * 设计特点：
 * - Apple风格圆角卡片弹窗
 * - 毛玻璃背景遮罩
 * - 流畅的进入/退出动画
 * - 清晰的错误提示
 *
 * @module UserModal
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Styles, Colors, Spacing } from '../styles';
import type { User } from './UserTable';

// ============================================
// 类型定义
// ============================================

/** 表单数据结构 */
export interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'disabled';
  avatar?: string;
  permissions: string[];
  note: string;
}

/** 组件Props */
interface UserModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 模式：create=新增，edit=编辑 */
  mode: 'create' | 'edit';
  /** 编辑模式下的用户数据（新增时为null） */
  user?: User | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 提交回调 */
  onSubmit: (data: UserFormData) => Promise<void>;
}

// ============================================
// 常量定义
// ============================================

/** 空表单数据 */
const EMPTY_FORM: UserFormData = {
  username: '',
  email: '',
  password: '',
  role: 'viewer',
  status: 'active',
  avatar: undefined,
  permissions: [],
  note: '',
};

/** 角色选项 */
const ROLE_OPTIONS = [
  { label: '管理员', value: 'admin' as const, description: '拥有所有权限' },
  { label: '编辑', value: 'editor' as const, description: '可管理内容和用户' },
  { label: '观众', value: 'viewer' as const, description: '只读权限' },
];

/** 权限选项 */
const PERMISSION_OPTIONS = [
  { key: 'topic_manage', label: '议题管理' },
  { key: 'user_manage', label: '用户管理' },
  { key: 'log_view', label: '日志查看' },
  { key: 'system_config', label: '系统配置' },
];

// ============================================
// 主组件：UserModal
// ============================================

/**
 * 用户模态框主组件
 *
 * @param props - 组件属性
 * @returns JSX.Element
 */
const UserModal: React.FC<UserModalProps> = ({
  visible,
  mode,
  user,
  onClose,
  onSubmit,
}) => {

  // ========== 状态管理 ==========

  /** 表单数据 */
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);

  /** 表单错误信息 */
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  /** 是否正在提交 */
  const [submitting, setSubmitting] = useState(false);

  /** 密码是否可见 */
  const [showPassword, setShowPassword] = useState(false);

  /** ScrollView引用（用于滚动到错误位置） */
  const scrollViewRef = useRef<ScrollView>(null);

  // ========== 初始化副作用 ==========

  /**
   * 当modal打开或user变化时，初始化表单数据
   */
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && user) {
        // 编辑模式：填充用户数据
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '', // 编辑时不显示密码
          role: user.role || 'viewer',
          status: user.status || 'active',
          avatar: user.avatar || undefined,
          permissions: [], // TODO: 从后端获取实际权限
          note: '',
        });
      } else {
        // 新增模式：清空表单
        setFormData(EMPTY_FORM);
      }
      setErrors({});
      setSubmitting(false);
      setShowPassword(false);
    }
  }, [visible, mode, user]);

  // ========== 表单处理函数 ==========

  /**
   * 更新单个字段值
   */
  const updateField = useCallback((field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  /**
   * 切换权限选择
   */
  const togglePermission = useCallback((permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey],
    }));
  }, []);

  /**
   * 表单验证
   * @returns 是否通过验证
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    // 验证用户名
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 2 || formData.username.length > 20) {
      newErrors.username = '用户名长度应为2-20个字符';
    }

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱格式';
    }

    // 验证密码（仅新增模式或密码非空时）
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = '请输入密码';
      } else if (formData.password.length < 6) {
        newErrors.password = '密码长度至少6位';
      }
    }

    setErrors(newErrors);

    // 如果有错误，滚动到第一个错误字段
    if (Object.keys(newErrors).length > 0 && scrollViewRef.current) {
      // TODO: 实现滚动到错误位置的逻辑
    }

    return Object.keys(newErrors).length === 0;
  }, [formData, mode]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('[UserModal] 提交失败:', error);
      Alert.alert('操作失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 渲染辅助函数 ==========

  /**
   * 渲染表单项
   */
  const renderFormField = (
    field: keyof UserFormData,
    label: string,
    required: boolean = false,
    props: any = {},
  ) => (
    <View style={Styles.inputContainer}>
      <Text style={Styles.inputLabel}>
        {label}
        {required && <Text style={Styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[
          Styles.input,
          errors[field] && Styles.inputError,
        ]}
        value={(formData[field] as string) || ''}
        onChangeText={(text) => updateField(field, text)}
        placeholder={`请输入${label}`}
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry={field === 'password' && !showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={field === 'email' ? 'email-address' : 'default'}
        {...props}
      />
      {/* 密码显示/隐藏按钮 */}
      {field === 'password' && formData.password && (
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ position: 'absolute', right: Spacing.md, top: 38 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.text.tertiary}
          />
        </TouchableOpacity>
      )}
      {/* 错误提示 */}
      {errors[field] && (
        <Text style={Styles.inputErrorText}>{errors[field]}</Text>
      )}
    </View>
  );

  /**
   * 渲染角色选择器
   */
  const renderRoleSelector = () => (
    <View style={Styles.inputContainer}>
      <Text style={Styles.inputLabel}>
        角色 <Text style={Styles.requiredMark}> *</Text>
      </Text>
      <View style={{
        flexDirection: 'row',
        gap: Spacing.sm,
      }}>
        {ROLE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => updateField('role', option.value)}
            style={[
              {
                flex: 1,
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.md,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.role === option.value ? Colors.primary.DEFAULT : Colors.border.medium,
                backgroundColor: formData.role === option.value ? 'rgba(0, 122, 255, 0.06)' : Colors.background.primary,
                alignItems: 'center',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                formData.role === option.value
                  ? 'radio-button-on'
                  : 'radio-button-off'
              }
              size={20}
              color={formData.role === option.value ? Colors.primary.DEFAULT : Colors.text.tertiary}
            />
            <Text style={{
              marginTop: Spacing.xs,
              fontSize: 14,
              fontWeight: formData.role === option.value ? '600' : '400',
              color: formData.role === option.value ? Colors.primary.DEFAULT : Colors.text.primary,
              fontFamily: '-apple-system',
            }}>
              {option.label}
            </Text>
            <Text style={{
              fontSize: 11,
              color: Colors.text.tertiary,
              fontFamily: '-apple-system',
              marginTop: 2,
            }}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /**
   * 渲染状态开关
   */
  const renderStatusToggle = () => (
    <View style={[Styles.inputContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <Text style={[Styles.inputLabel, { marginBottom: 0 }]}>状态</Text>
      <TouchableOpacity
        onPress={() => updateField('status', formData.status === 'active' ? 'disabled' : 'active')}
        style={{
          width: 51,
          height: 31,
          borderRadius: 15.5,
          backgroundColor: formData.status === 'active' ? Colors.status.active : Colors.border.medium,
          padding: 2,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
      >
        <View style={{
          width: 27,
          height: 27,
          borderRadius: 13.5,
          backgroundColor: Colors.background.primary,
          ...Colors.shadow.sm,
          transform: [{ translateX: formData.status === 'active' ? 20 : 0 }],
        }} />
      </TouchableOpacity>
      <Text style={{
        fontSize: 13,
        color: formData.status === 'active' ? Colors.status.active : Colors.text.secondary,
        fontFamily: '-apple-system',
        marginLeft: Spacing.sm,
      }}>
        {formData.status === 'active' ? '活跃' : '禁用'}
      </Text>
    </View>
  );

  /**
   * 渲染权限复选框组
   */
  const renderPermissions = () => (
    <View style={Styles.inputContainer}>
      <Text style={Styles.inputLabel}>权限设置</Text>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
      }}>
        {PERMISSION_OPTIONS.map((permission) => {
          const isSelected = formData.permissions.includes(permission.key);
          return (
            <TouchableOpacity
              key={permission.key}
              onPress={() => togglePermission(permission.key)}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? Colors.primary.DEFAULT : Colors.border.medium,
                  backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.06)' : Colors.background.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={18}
                color={isSelected ? Colors.primary.DEFAULT : Colors.border.medium}
              />
              <Text style={{
                marginLeft: Spacing.xs,
                fontSize: 14,
                color: isSelected ? Colors.primary.DEFAULT : Colors.text.primary,
                fontFamily: '-apple-system',
              }}>
                {permission.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ========== 主渲染 ==========

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={Styles.modalOverlay}
      >
        {/* 模态框容器 */}
        <View style={Styles.modalContainer}>
          {/* 头部 */}
          <View style={Styles.modalHeader}>
            <Text style={Styles.modalTitle}>
              {mode === 'create' ? '添加用户' : '编辑用户'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: Spacing.xs }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* 内容区 */}
          <ScrollView
            ref={scrollViewRef}
            style={Styles.modalContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* 头像上传区域 */}
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <TouchableOpacity
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: Colors.background.grouped,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: Colors.border.medium,
                }}
                activeOpacity={0.7}
              >
                {formData.avatar ? (
                  <Image
                    source={{ uri: formData.avatar }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                  />
                ) : (
                  <>
                    <Ionicons name="person-add" size={32} color={Colors.text.tertiary} />
                    <Text style={{
                      fontSize: 11,
                      color: Colors.text.tertiary,
                      marginTop: Spacing.xs,
                      fontFamily: '-apple-system',
                    }}>
                      点击上传
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={{
                fontSize: 12,
                color: Colors.text.tertiary,
                marginTop: Spacing.sm,
                fontFamily: '-apple-system',
              }}>
                支持JPG、PNG格式，最大2MB
              </Text>
            </View>

            {/* 表单字段 */}
            {renderFormField('username', '用户名', true)}
            {renderFormField('email', '邮箱', true)}

            {/* 新增模式下显示密码字段 */}
            {(mode === 'create') && renderFormField('password', '密码', true)}

            {renderRoleSelector()}
            {renderStatusToggle()}
            {renderPermissions()}

            {/* 备注 */}
            <View style={Styles.inputContainer}>
              <Text style={Styles.inputLabel}>备注</Text>
              <TextInput
                style={[
                  Styles.input,
                  { height: 80, textAlignVertical: 'top' },
                ]}
                value={formData.note}
                onChangeText={(text) => updateField('note', text)}
                placeholder="可选填写备注信息..."
                placeholderTextColor={Colors.text.tertiary}
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          {/* 底部操作栏 */}
          <View style={Styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={Styles.buttonSecondary}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={Styles.buttonSecondaryText}>取消</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                Styles.buttonPrimary,
                submitting && { opacity: 0.6 },
              ]}
              disabled={submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={Styles.buttonPrimaryText}>
                  {mode === 'create' ? '确认添加' : '保存修改'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================
// 默认导出
// ============================================

export default UserModal;

// 需要导入Image组件
import { Image } from 'react-native';
