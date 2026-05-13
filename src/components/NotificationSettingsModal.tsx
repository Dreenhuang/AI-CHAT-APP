import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentColors } from '../stores/useThemeStore';
import { useDailyNotification } from '../hooks/useDailyNotification';

const CATEGORY_OPTIONS = [
  { key: '科技', icon: 'hardware-chip-outline' as const, color: '#2196F3' },
  { key: '社会', icon: 'people-outline' as const, color: '#FF9800' },
  { key: '经济', icon: 'trending-up-outline' as const, color: '#607D8B' },
  { key: '教育', icon: 'school-outline' as const, color: '#4CAF50' },
  { key: '文化', icon: 'musical-notes-outline' as const, color: '#8BC34A' },
  { key: '生活', icon: 'leaf-outline' as const, color: '#9C27B0' },
  { key: '娱乐', icon: 'film-outline' as const, color: '#E91E63' },
  { key: '环境', icon: 'earth-outline' as const, color: '#009688' },
];

const TIME_OPTIONS = [
  { label: '早上 7:00', value: 7 },
  { label: '早上 8:00', value: 8 },
  { label: '早上 9:00', value: 9 },
  { label: '早上 10:00', value: 10 },
  { label: '中午 12:00', value: 12 },
  { label: '下午 18:00', value: 18 },
  { label: '晚上 20:00', value: 20 },
  { label: '晚上 22:00', value: 22 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<Props> = ({ visible, onClose }) => {
  const colors = useCurrentColors();
  const {
    settings,
    stats,
    permissionGranted,
    isInitialized,
    updateSettings,
    sendTestNotification,
    scheduleNow,
    refreshSettings,
  } = useDailyNotification();

  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      refreshSettings();
    }
  }, [visible, refreshSettings]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView
          style={[styles.modalContent, { backgroundColor: colors.card }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              通知设置
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!isInitialized && (
            <View style={[styles.statusBanner, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="sync" size={20} color="#F57C00" />
              <Text style={styles.statusBannerText}>正在初始化通知服务...</Text>
            </View>
          )}

          {isInitialized && !permissionGranted && (
            <View style={[styles.statusBanner, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="warning" size={20} color="#D32F2F" />
              <Text style={[styles.statusBannerText, { color: '#D32F2F' }]}>
                通知权限未开启，请前往系统设置中允许通知
              </Text>
            </View>
          )}

          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="notifications"
                  size={22}
                  color={settings.enabled ? colors.primary : colors.textSecondary}
                />
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    每日精选话题推送
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    每天早上推送一条AI精选热门话题
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{
                  false: colors.border,
                  true: colors.primaryLight,
                }}
                thumbColor={settings.enabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              推送时间
            </Text>

            {showTimePicker ? (
              <View style={styles.timePickerGrid}>
                {TIME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeOption,
                      settings.hour === option.value && {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      updateSettings({ hour: option.value, minute: 0 });
                      setShowTimePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color:
                            settings.hour === option.value
                              ? colors.primary
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {settings.hour === option.value && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                        style={styles.timeCheck}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.timeDisplay, { backgroundColor: colors.background }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.timeDisplayText, { color: colors.textPrimary }]}>
                  每天 {String(settings.hour).padStart(2, '0')}:{String(settings.minute).padStart(2, '0')}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="volume-medium"
                  size={22}
                  color={settings.soundEnabled ? colors.primary : colors.textSecondary}
                />
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    推送声音
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    接收通知时播放提示音
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{
                  false: colors.border,
                  true: colors.primaryLight,
                }}
                thumbColor={settings.soundEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              订阅分类（可选，留空则推送全部分类）
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => {
                const isSubscribed = settings.subscribedCategories.includes(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryTag,
                      isSubscribed && {
                        backgroundColor: cat.color + '20',
                        borderColor: cat.color,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      const newCategories = isSubscribed
                        ? settings.subscribedCategories.filter((c) => c !== cat.key)
                        : [...settings.subscribedCategories, cat.key];
                      updateSettings({ subscribedCategories: newCategories });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSubscribed ? cat.color : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: isSubscribed ? cat.color : colors.textSecondary,
                          fontWeight: isSubscribed ? '600' : '400',
                        },
                      ]}
                    >
                      {cat.key}
                    </Text>
                    {isSubscribed && (
                      <Ionicons name="checkmark-circle" size={14} color={cat.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={scheduleNow}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>立即获取今日精选</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.background, borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={sendTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="bug-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                发送测试通知
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.statsSection, { backgroundColor: colors.background }]}>
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>
              推送统计
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.totalPushes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  累计推送
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#059669' }]}>
                  {stats.todayPushes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  今日推送
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>
                  {stats.clickRate}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  点击率
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              推送内容由AI自动生成，基于当前热门话题
            </Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              设置仅保存在本地设备中
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  closeButton: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  statusBannerText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingTextGroup: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timeDisplayText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  timePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  timeCheck: {
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsSection: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default NotificationSettingsModal;
