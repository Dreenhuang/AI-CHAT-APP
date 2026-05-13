/**
 * 日志详情模态框组件
 * 
 * Apple Design Style - 毛玻璃效果 + 流畅动画
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AuditLogEntry, ACTION_TYPE_CONFIG, TARGET_TYPE_CONFIG } from './types';
import { formatFullTime } from './api';

// ============ 类型定义 ============

interface LogDetailModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 日志数据 */
  log: AuditLogEntry | null;
  /** 关闭回调 */
  onClose: () => void;
}

// ============ 组件 ============

const LogDetailModal: React.FC<LogDetailModalProps> = ({
  visible,
  log,
  onClose,
}) => {
  if (!log) return null;

  const actionConfig = ACTION_TYPE_CONFIG[log.actionType];
  const targetConfig = TARGET_TYPE_CONFIG[log.targetType];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* 背景遮罩 */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          {/* 停止点击冒泡 */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {/* 模态框内容 */}
            <View style={styles.modalContent}>
              {/* 头部 */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerTitle}>日志详情</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
              >
                {/* 结果状态卡片 */}
                <View style={[styles.resultCard, {
                  backgroundColor: log.result === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                  borderColor: log.result === 'success' ? '#34C759' : '#FF3B30',
                }]}>
                  <View style={styles.resultIconWrapper}>
                    <Text style={styles.resultIcon}>{log.result === 'success' ? '✓' : '✗'}</Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultText, {
                      color: log.result === 'success' ? '#34C759' : '#FF3B30',
                    }]}>
                      {log.result === 'success' ? '操作成功' : '操作失败'}
                    </Text>
                    {log.duration && (
                      <Text style={styles.durationText}>耗时 {log.duration}ms</Text>
                    )}
                  </View>
                </View>

                {/* 基本信息 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>基本信息</Text>
                  <View style={styles.infoGrid}>
                    <InfoItem label="操作ID" value={log.id} mono />
                    <InfoItem label="时间" value={formatFullTime(log.timestamp)} />
                    <InfoItem label="操作人" value={`${log.operator.displayName} (${log.operator.username})`} />
                    <InfoItem label="角色" value={log.operator.role} />
                    <InfoItem label="IP地址" value={log.ipAddress} mono />
                    <InfoItem label="请求ID" value={log.requestId} mono />
                  </View>
                </View>

                {/* 操作内容 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>操作内容</Text>
                  <View style={styles.infoGrid}>
                    <InfoItem
                      label="操作类型"
                      value={`${actionConfig.icon} ${actionConfig.label}`}
                    />
                    <InfoItem
                      label="目标对象"
                      value={`${targetConfig.icon} ${targetConfig.label}`}
                    />
                    <InfoItem label="目标名称" value={log.targetName} />
                    <InfoItem label="操作描述" value={log.actionDescription} />
                  </View>
                </View>

                {/* 客户端信息 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>客户端信息</Text>
                  <View style={styles.userAgentBox}>
                    <Text style={styles.userAgentText} numberOfLines={2}>
                      {log.userAgent}
                    </Text>
                  </View>
                </View>

                {/* 错误信息 */}
                {log.errorMessage && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>错误信息</Text>
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{log.errorMessage}</Text>
                    </View>
                  </View>
                )}

                {/* 数据变更 */}
                {log.changes && log.changes.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>数据变更</Text>
                    <View style={styles.changesContainer}>
                      {log.changes.map((change, index) => (
                        <View key={index} style={styles.changeItem}>
                          <Text style={styles.changeField}>{change.field}</Text>
                          <View style={styles.changeValues}>
                            <View style={styles.oldValueBox}>
                              <Text style={styles.oldValueLabel}>旧值</Text>
                              <Text style={styles.oldValueText} numberOfLines={1}>
                                {JSON.stringify(change.oldValue)}
                              </Text>
                            </View>
                            <Text style={styles.changeArrow}>→</Text>
                            <View style={styles.newValueBox}>
                              <Text style={styles.newValueLabel}>新值</Text>
                              <Text style={styles.newValueText} numberOfLines={1}>
                                {JSON.stringify(change.newValue)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* 底部按钮 */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.footerButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerButtonText}>关闭</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============ 子组件 ============

interface InfoItemProps {
  label: string;
  value: string;
  mono?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, mono }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[styles.infoValue, mono && styles.monoText]}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

// ============ 样式 ============

const styles = StyleSheet.create({
  // 遮罩层
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // 模态框容器
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
  },

  // 模态框内容
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },

  // 头部
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#8E8E93',
    lineHeight: 22,
  },

  // 滚动区域
  scrollContent: {
    maxHeight: '70%',
  },
  scrollContentContainer: {
    padding: 20,
  },

  // 结果卡片
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resultIcon: {
    fontSize: 22,
    fontWeight: '700',
  },
  resultInfo: {
    flex: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // 区块
  section: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: -0.2,
  },

  // 信息网格
  infoGrid: {
    gap: 4,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  infoLabel: {
    width: 80,
    fontSize: 13,
    color: '#8E8E93',
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 19,
  },
  monoText: {
    fontFamily: '"SF Mono", "Menlo", "Monaco", "Consolas", monospace',
    fontSize: 12,
  },

  // UserAgent
  userAgentBox: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 14,
  },
  userAgentText: {
    fontFamily: '"SF Mono", "Menlo", monospace',
    fontSize: 11,
    color: '#636366',
    lineHeight: 15,
  },

  // 错误信息
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 19,
  },

  // 数据变更
  changesContainer: {
    gap: 12,
  },
  changeItem: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 14,
  },
  changeField: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oldValueBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 8,
    padding: 10,
  },
  oldValueLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF3B30',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  oldValueText: {
    fontFamily: '"SF Mono", "Menlo", monospace',
    fontSize: 11,
    color: '#C7C7CC',
  },
  changeArrow: {
    fontSize: 18,
    color: '#8E8E93',
  },
  newValueBox: {
    flex: 1,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderRadius: 8,
    padding: 10,
  },
  newValueLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34C759',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  newValueText: {
    fontFamily: '"SF Mono", "Menlo", monospace',
    fontSize: 11,
    color: '#1C1C1E',
  },

  // 底部
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  footerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LogDetailModal;
