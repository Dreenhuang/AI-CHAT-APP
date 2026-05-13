/**
 * 系统配置管理页面
 * 
 * Apple Design Style - 管理后台系统配置
 * 
 * 设计特点：
 * - Tab式分类导航，清晰的信息架构
 * - 表单状态独立管理，未保存提示
 * - 流畅的切换动画和交互反馈
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  SystemConfig,
  ConfigCategory,
  CONFIG_TABS,
  DEFAULT_CONFIG,
  BasicConfig,
  EmailConfig,
  SecurityConfig,
  NotificationConfig,
  IntegrationConfig,
} from './types';
import configApi from './api';

// ============ 常量 ============

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 768;

// ============ 主组件 ============

const ConfigPage: React.FC = () => {
  // ============ 状态管理 ============
  
  /** 当前激活的Tab */
  const [activeTab, setActiveTab] = useState<ConfigCategory>('basic');
  
  /** 配置数据 */
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  
  /** 原始配置（用于检测变更） */
  const [originalConfig, setOriginalConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  
  /** 加载状态 */
  const [loading, setLoading] = useState(true);
  
  /** 保存中状态 */
  const [saving, setSaving] = useState(false);
  
  /** 各Tab是否有未保存更改 */
  const [dirtyFlags, setDirtyFlags] = useState<Record<ConfigCategory, boolean>>({
    basic: false,
    email: false,
    security: false,
    notification: false,
    integration: false,
  });
  
  /** Toast消息 */
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ============ 数据加载 ============

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await configApi.getAll();
      setConfig(data);
      setOriginalConfig(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error('Failed to load config:', error);
      showToast('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  // ============ 工具方法 ============

  /**
   * 显示Toast消息
   */
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * 更新配置值并标记为已修改
   */
  const updateConfigValue = useCallback(<K extends keyof SystemConfig>(
    category: K,
    field: keyof SystemConfig[K],
    value: any
  ) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    
    // 标记该Tab有修改
    setDirtyFlags(prev => ({ ...prev, [category]: true }));
  }, []);

  /**
   * 检查指定分类是否有修改
   */
  const isCategoryDirty = (category: ConfigCategory): boolean => {
    return JSON.stringify(config[category]) !== JSON.stringify(originalConfig[category]);
  };

  /**
   * 重置当前Tab到原始值
   */
  const resetCurrentTab = () => {
    setConfig(prev => ({
      ...prev,
      [activeTab]: JSON.parse(JSON.stringify(originalConfig[activeTab])),
    }));
    setDirtyFlags(prev => ({ ...prev, [activeTab]: false }));
    showToast('已重置为上次保存的值');
  };

  /**
   * 保存当前Tab配置
   */
  const saveCurrentTab = async () => {
    setSaving(true);
    
    try {
      const result = await configApi.batchUpdate({
        [activeTab]: config[activeTab],
      });
      
      if (result.success) {
        setOriginalConfig(prev => ({
          ...prev,
          [activeTab]: JSON.parse(JSON.stringify(config[activeTab])),
        }));
        setDirtyFlags(prev => ({ ...prev, [activeTab]: false }));
        showToast('保存成功！');
      }
    } catch (error) {
      showToast('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 切换Tab（如果有未保存更改则提示）
   */
  const handleTabChange = (tab: ConfigCategory) => {
    if (tab === activeTab) return;
    
    if (isCategoryDirty(activeTab)) {
      Alert.alert(
        '未保存的更改',
        `当前页面有未保存的更改，是否继续切换？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '放弃更改',
            style: 'destructive',
            onPress: () => {
              setActiveTab(tab);
            },
          },
          { text: '先保存', onPress: async () => {
            await saveCurrentTab();
            setActiveTab(tab);
          }},
        ]
      );
    } else {
      setActiveTab(tab);
    }
  };

  // ============ 渲染当前Tab内容 ============

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicSettingsSection 
          config={config.basic} 
          onChange={(field, value) => updateConfigValue('basic', field, value)}
        />;
      case 'email':
        return <EmailSettingsSection 
          config={config.email}
          onChange={(field, value) => updateConfigValue('email', field, value)}
          onTestEmail={() => testEmail()}
        />;
      case 'security':
        return <SecuritySettingsSection 
          config={config.security}
          onChange={(field, value) => updateConfigValue('security', field, value)}
        />;
      case 'notification':
        return <NotificationSettingsSection 
          config={config.notification}
          onChange={(field, value) => updateConfigValue('notification', field, value)}
        />;
      case 'integration':
        return <IntegrationSettingsSection 
          config={config.integration}
          onChange={(field, value) => updateConfigValue('integration', field, value)}
        />;
      default:
        return null;
    }
  };

  /**
   * 测试邮件发送
   */
  const testEmail = async () => {
    const result = await configApi.testEmail();
    Alert.alert(
      result.success ? '测试成功' : '测试失败',
      result.message
    );
  };

  // ============ 主渲染 ============

  return (
    <View style={styles.container}>
      {/* 页面头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>系统配置</Text>
        {isCategoryDirty(activeTab) && (
          <View style={styles.unsavedBadge}>
            <Text style={styles.unsavedBadgeText}>有未保存的更改</Text>
          </View>
        )}
      </View>

      {/* Tab 导航栏 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {CONFIG_TABS.map(tab => {
          const isActive = tab.id === activeTab;
          const hasChanges = dirtyFlags[tab.id];
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isActive && styles.tabItemActive,
              ]}
              onPress={() => handleTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
              {hasChanges && !isActive && (
                <View style={styles.dirtyDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 内容区域 */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>加载配置中...</Text>
          </View>
        ) : (
          <>
            {/* 当前Tab标题 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>
                {CONFIG_TABS.find(t => t.id === activeTab)?.icon}
              </Text>
              <Text style={styles.sectionTitle}>
                {CONFIG_TABS.find(t => t.id === activeTab)?.label}
              </Text>
            </View>

            {/* 表单内容 */}
            <View style={styles.formCard}>
              {renderTabContent()}
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[styles.resetButton, !isCategoryDirty(activeTab) && styles.buttonDisabled]}
                onPress={resetCurrentTab}
                disabled={!isCategoryDirty(activeTab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.resetButtonText,
                  !isCategoryDirty(activeTab) && styles.buttonDisabledText
                ]}>
                  重置
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!isCategoryDirty(activeTab) || saving) && styles.saveButtonDisabled
                ]}
                onPress={saveCurrentTab}
                disabled={!isCategoryDirty(activeTab) || saving}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.saveButtonText,
                  (!isCategoryDirty(activeTab) || saving) && styles.saveButtonTextDisabled
                ]}>
                  {saving ? '保存中...' : '保存更改'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Toast 消息 */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
};

// ============ 子组件：基本设置 ============

interface SectionProps<T> {
  config: T;
  onChange: (field: keyof T, value: any) => void;
}

const BasicSettingsSection: React.FC<SectionProps<BasicConfig>> = ({ config, onChange }) => (
  <View style={styles.section}>
    <FormField
      label="系统名称"
      value={config.systemName}
      onChangeText={(v) => onChange('systemName', v)}
      placeholder="输入系统名称"
    />
    <FormField
      label="系统描述"
      value={config.systemDescription}
      onChangeText={(v) => onChange('systemDescription', v)}
      placeholder="输入系统描述"
      multiline
    />
    <SelectField
      label="默认语言"
      value={config.defaultLanguage}
      options={[
        { label: '简体中文', value: 'zh-CN' },
        { label: '繁體中文', value: 'zh-TW' },
        { label: 'English', value: 'en-US' },
        { label: '日本語', value: 'ja-JP' },
      ]}
      onChange={(v) => onChange('defaultLanguage', v)}
    />
    <SelectField
      label="时区设置"
      value={config.timezone}
      options={[
        { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
        { label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
        { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
        { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
        { label: 'UTC (UTC+0)', value: 'UTC' },
      ]}
      onChange={(v) => onChange('timezone', v)}
    />
    <SelectField
      label="每页显示条数"
      value={String(config.itemsPerPage)}
      options={[
        { label: '10 条/页', value: '10' },
        { label: '20 条/页', value: '20' },
        { label: '50 条/页', value: '50' },
        { label: '100 条/页', value: '100' },
      ]}
      onChange={(v) => onChange('itemsPerPage', Number(v))}
    />
    <FormField
      label="版权信息"
      value={config.copyrightInfo}
      onChangeText={(v) => onChange('copyrightInfo', v)}
      placeholder="© 2024 Your Company. All rights reserved."
    />
    <ToggleField
      label="维护模式"
      description="开启后，普通用户将无法访问系统"
      value={config.maintenanceMode}
      onChange={(v) => onChange('maintenanceMode', v)}
    />
  </View>
);

// ============ 子组件：邮件设置 ============

interface EmailSectionProps extends SectionProps<EmailConfig> {
  onTestEmail: () => void;
}

const EmailSettingsSection: React.FC<EmailSectionProps> = ({ config, onChange, onTestEmail }) => (
  <View style={styles.section}>
    <FormField
      label="SMTP 服务器地址"
      value={config.smtpHost}
      onChangeText={(v) => onChange('smtpHost', v)}
      placeholder="smtp.example.com"
    />
    <FormField
      label="SMTP 端口"
      value={String(config.smtpPort)}
      onChangeText={(v) => onChange('smtpPort', Number(v) || 587)}
      placeholder="587"
      keyboardType="numeric"
    />
    <SelectField
      label="加密方式"
      value={config.encryption}
      options={[
        { label: '无加密', value: 'none' },
        { label: 'SSL/TLS', value: 'ssl' },
        { label: 'STARTTLS', value: 'tls' },
      ]}
      onChange={(v) => onChange('encryption', v as any)}
    />
    <FormField
      label="发件人邮箱"
      value={config.senderEmail}
      onChangeText={(v) => onChange('senderEmail', v)}
      placeholder="noreply@example.com"
      keyboardType="email-address"
    />
    <PasswordField
      label="发件人密码 / 应用专用密码"
      value={config.senderPassword}
      onChangeText={(v) => onChange('senderPassword', v)}
      placeholder="••••••••"
    />
    <FormField
      label="发件人名称"
      value={config.senderName}
      onChangeText={(v) => onChange('senderName', v)}
      placeholder="PRD辩论系统"
    />

    {/* 测试邮件按钮 */}
    <View style={styles.testEmailRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>测试邮件</Text>
        <Text style={styles.fieldHint}>发送一封测试邮件验证配置</Text>
      </View>
      <TouchableOpacity
        style={styles.testButton}
        onPress={onTestEmail}
        activeOpacity={0.7}
      >
        <Text style={styles.testButtonText}>发送测试</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ============ 子组件：安全设置 ============

const SecuritySettingsSection: React.FC<SectionProps<SecurityConfig>> = ({ config, onChange }) => (
  <View style={styles.section}>
    <Text style={styles.subsectionTitle}>密码策略</Text>
    
    <FormField
      label="最小密码长度"
      value={String(config.passwordMinLength)}
      onChangeText={(v) => onChange('passwordMinLength', Number(v) || 8)}
      placeholder="8"
      keyboardType="numeric"
    />
    <ToggleField
      label="要求大写字母"
      value={config.requireUppercase}
      onChange={(v) => onChange('requireUppercase', v)}
    />
    <ToggleField
      label="要求小写字母"
      value={config.requireLowercase}
      onChange={(v) => onChange('requireLowercase', v)}
    />
    <ToggleField
      label="要求数字"
      value={config.requireNumber}
      onChange={(v) => onChange('requireNumber', v)}
    />
    <ToggleField
      label="要求特殊字符"
      value={config.requireSpecialChar}
      onChange={(v) => onChange('requireSpecialChar', v)}
    />

    <View style={styles.divider} />

    <Text style={styles.subsectionTitle">登录保护</Text>
    
    <FormField
      label="最大登录失败次数"
      value={String(config.maxLoginAttempts)}
      onChangeText={(v) => onChange('maxLoginAttempts', Number(v) || 5)}
      placeholder="5"
      keyboardType="numeric"
    />
    <FormField
      label="锁定时长（分钟）"
      value={String(config.lockoutDuration)}
      onChangeText={(v) => onChange('lockoutDuration', Number(v) || 30)}
      placeholder="30"
      keyboardType="numeric"
    />
    <FormField
      label="会话超时时间（分钟）"
      value={String(config.sessionTimeout)}
      onChangeText={(v) => onChange('sessionTimeout', Number(v) || 120)}
      placeholder="120"
      keyboardType="numeric"
    />
    <ToggleField
      label="启用双因素认证 (2FA)"
      description="要求用户在登录时提供额外的身份验证"
      value={config.enableTwoFactor}
      onChange={(v) => onChange('enableTwoFactor', v)}
    />

    <View style={styles.divider} />

    <Text style={styles.subsectionTitle">IP 访问控制</Text>
    
    <FormField
      label="IP 白名单"
      value={config.ipWhitelist}
      onChangeText={(v) => onChange('ipWhitelist', v)}
      placeholder="每行一个IP，留空表示不限制"
      multiline
    />
    <FormField
      label="IP 黑名单"
      value={config.ipBlacklist}
      onChangeText={(v) => onChange('ipBlacklist', v)}
      placeholder="每行一个IP"
      multiline
    />
  </View>
);

// ============ 子组件：通知设置 ============

const NotificationSettingsSection: React.FC<SectionProps<NotificationConfig>> = ({ config, onChange }) => (
  <View style={styles.section}>
    <Text style={styles.subsectionTitle}>通知渠道</Text>
    
    <ToggleField
      label="邮件通知"
      description="通过电子邮件发送系统通知"
      value={config.emailNotification}
      onChange={(v) => onChange('emailNotification', v)}
    />
    <ToggleField
      label="站内消息通知"
      description="在系统内部显示通知消息"
      value={config.inAppNotification}
      onChange={(v) => onChange('inAppNotification', v)}
    />

    <View style={styles.divider} />

    <Text style={styles.subsectionTitle">触发事件</Text>
    
    <ToggleField
      label="新用户注册时通知"
      value={config.notifyOnUserCreate}
      onChange={(v) => onChange('notifyOnUserCreate', v)}
    />
    <ToggleField
      label="新议题创建时通知"
      value={config.notifyOnTopicCreate}
      onChange={(v) => onChange('notifyOnTopicCreate', v)}
    />
    <ToggleField
      label="新评论发布时通知"
      value={config.notifyOnComment}
      onChange={(v) => onChange('notifyOnComment', v)}
    />
    <ToggleField
      label="系统错误时通知"
      value={config.notifyOnError}
      onChange={(v) => onChange('notifyOnError', v)}
    />
    <ToggleField
      label="异常登录时通知"
      value={config.notifyOnLogin}
      onChange={(v) => onChange('notifyOnLogin', v)}
    />
  </View>
);

// ============ 子组件：第三方集成 ============

const IntegrationSettingsSection: React.FC<SectionProps<IntegrationConfig>> = ({ config, onChange }) => (
  <View style={styles.section}>
    {/* 微信集成 */}
    <Text style={styles.subsectionTitle}>微信接入</Text>
    <ToggleField
      label="启用微信登录"
      value={config.enableWechat}
      onChange={(v) => onChange('enableWechat', v)}
    />
    {config.enableWechat && (
      <>
        <PasswordField
          label="App ID"
          value={config.wechatAppId}
          onChangeText={(v) => onChange('wechatAppId', v)}
          placeholder="wx..."
        />
        <PasswordField
          label="App Secret"
          value={config.wechatAppSecret}
          onChangeText={(v) => onChange('wechatAppSecret', v)}
          placeholder="••••••••"
        />
      </>
    )}

    <View style={styles.divider} />

    {/* 钉钉集成 */}
    <Text style={styles.subsectionTitle}>钉钉接入</Text>
    <ToggleField
      label="启用钉钉登录"
      value={config.enableDingTalk}
      onChange={(v) => onChange('enableDingTalk', v)}
    />
    {config.enableDingTalk && (
      <>
        <PasswordField
          label="App Key"
          value={config.dingTalkAppKey}
          onChangeText={(v) => onChange('dingTalkAppKey', v)}
          placeholder="ding..."
        />
        <PasswordField
          label="App Secret"
          value={config.dingTalkAppSecret}
          onChangeText={(v) => onChange('dingTalkAppSecret', v)}
          placeholder="••••••••"
        />
      </>
    )}

    <View style={styles.divider} />

    {/* 对象存储 */}
    <Text style={styles.subsectionTitle">对象存储 (OSS/S3)</Text>
    <ToggleField
      label="启用对象存储"
      value={config.enableOSS}
      onChange={(v) => onChange('enableOSS', v)}
    />
    {config.enableOSS && (
      <>
        <SelectField
          label="服务商"
          value={config.ossProvider}
          options={[
            { label: '阿里云 OSS', value: 'aliyun' },
            { label: 'AWS S3', value: 'aws' },
            { label: '腾讯云 COS', value: 'tencent' },
          ]}
          onChange={(v) => onChange('ossProvider', v as any)}
        />
        <FormField
          label="Endpoint"
          value={config.ossEndpoint}
          onChangeText={(v) => onChange('ossEndpoint', v)}
          placeholder="oss-cn-hangzhou.aliyuncs.com"
        />
        <FormField
          label="Bucket 名称"
          value={config.ossBucket}
          onChangeText={(v) => onChange('ossBucket', v)}
          placeholder="my-bucket"
        />
        <PasswordField
          label="Access Key ID"
          value={config.ossAccessKey}
          onChangeText={(v) => onChange('ossAccessKey', v)}
          placeholder="LTAI..."
        />
        <PasswordField
          label="Access Key Secret"
          value={config.ossSecretKey}
          onChangeText={(v) => onChange('ossSecretKey', v)}
          placeholder="••••••••"
        />
      </>
    )}

    <View style={styles.divider" />}

    {/* CDN */}
    <Text style={styles.subsectionTitle">CDN 配置</Text>
    <ToggleField
      label="启用 CDN"
      value={config.enableCDN}
      onChange={(v) => onChange('enableCDN', v)}
    />
    {config.enableCDN && (
      <FormField
        label="CDN 域名"
        value={config.cdnDomain}
        onChangeText={(v) => onChange('cdnDomain', v)}
        placeholder="cdn.example.com"
      />
    )}
  </View>
);

// ============ 通用表单组件 ============

/** 文本输入框 */
interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}) => (
  <View style={styles.formField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity
      style={[styles.textInput, multiline && styles.textInputMultiline]}
      activeOpacity={1}
    >
      <TextInputInner
        value={value}
        placeholder={placeholder || ''}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </TouchableOpacity>
  </View>
);

// RN TextInput 包装
const TextInputInner: React.FC<{
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}> = ({ value, placeholder, onChangeText, multiline }) => (
  <Text
    style={value ? styles.inputValue : styles.inputPlaceholder}
    onPress={() => {
      // 在实际应用中这里会弹出键盘
      const newValue = prompt ? prompt(`请输入${placeholder}`, value) : value;
      if (newValue !== null) onChangeText(newValue);
    }}
  >
    {value || placeholder}
  </Text>
);

/** 密码输入框 */
interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TouchableOpacity
          style={styles.textInput}
          activeOpacity={1}
        >
          <Text style={value ? (showPassword ? styles.inputValue : styles.passwordMasked) : styles.inputPlaceholder}>
            {value ? (showPassword ? value : '•'.repeat(Math.min(value.length, 20))) : (placeholder || '')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toggleVisibility}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.6}
        >
          <Text style={styles.toggleVisibilityText}>
            {showPassword ? '隐藏' : '显示'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/** 下拉选择框 */
interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const selectedOption = options.find(o => o.value === value);
  
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.selectWrapper}>
        <TouchableOpacity
          style={styles.selectTrigger}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={selectedOption ? styles.selectedValue : styles.inputPlaceholder}>
            {selectedOption?.label || '请选择'}
          </Text>
          <Text style={styles.selectArrow}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.selectDropdown}>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectOption,
                  option.value === value && styles.selectOptionSelected,
                ]}
                onPress={() => {
                  onChange(option.value);
                  setExpanded(false);
                }}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.selectOptionText,
                  option.value === value && styles.selectOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

/** 开关字段 */
interface ToggleFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleField: React.FC<ToggleFieldProps> = ({
  label,
  description,
  value,
  onChange,
}) => (
  <TouchableOpacity
    style={styles.toggleField}
    onPress={() => onChange(!value)}
    activeOpacity={0.7}
  >
    <View style={styles.toggleInfo}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {description && (
        <Text style={styles.toggleDescription}>{description}</Text>
      )}
    </View>
    <View style={[styles.switchTrack, value && styles.switchTrackActive]}>
      <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
    </View>
  </TouchableOpacity>
);

// ============ Apple 风格样式 ============

const styles = StyleSheet.create({
  // 容器
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // 头部
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IS_TABLET ? 28 : 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerTitle: {
    fontSize: IS_TABLET ? 26 : 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },

  // 未保存徽章
  unsavedBadge: {
    backgroundColor: '#FF950020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  unsavedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CC7700',
  },

  // Tab栏
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  tabBarContent: {
    paddingHorizontal: IS_TABLET ? 28 : 16,
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 15,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dirtyDot: {
    position: 'absolute',
    top: 10,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF9500',
  },

  // 内容区域
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: IS_TABLET ? 28 : 16,
    paddingTop: 22,
  },

  // 区块头部
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },

  // 表单卡片
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // 区块容器
  section: {
    padding: 20,
  },

  // 子标题
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    marginTop: 4,
    letterSpacing: -0.2,
  },

  // 分割线
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 18,
  },

  // 表单字段
  formField: {
    marginBottom: 18,
  },
  formField:lastChild: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  fieldHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 3,
  },

  // 文本输入
  textInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  textInputMultiline: {
    minHeight: 80,
    paddingVertical: 12,
  },
  inputValue: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  inputPlaceholder: {
    fontSize: 15,
    color: '#C7C7CC',
  },

  // 密码输入
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passwordMasked: {
    fontSize: 15,
    color: '#1C1C1E',
    letterSpacing: 2,
  },
  toggleVisibility: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  toggleVisibilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },

  // 选择框
  selectWrapper: {
    position: 'relative',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  selectedValue: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  selectArrow: {
    fontSize: 11,
    color: '#8E8E93',
  },
  selectDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
    maxHeight: 200,
    overflow: 'hidden',
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectOptionSelected: {
    backgroundColor: '#007AFF12',
  },
  selectOptionText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  selectOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // 开关字段
  toggleField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 14,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 17,
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#34C759',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },

  // 测试邮件行
  testEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    marginTop: 4,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 操作按钮区
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  resetButton: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonDisabledText: {
    color: '#C7C7CC',
  },

  // 加载状态
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3.5,
    borderColor: '#E5E5EA',
    borderTopColor: '#007AFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8E8E93',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

// ============ 导出 ============

export default ConfigPage;
