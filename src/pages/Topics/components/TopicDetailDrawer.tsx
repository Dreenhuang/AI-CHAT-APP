/**
 * 议题管理 - 详情抽屉组件
 *
 * Apple Design Style Drawer
 * 侧边滑出展示议题完整信息
 * 支持快速编辑关键字段
 */

import React from 'react';
import { TopicItem } from '../types';
import {
  STATUS_COLORS,
  TYPE_COLORS,
  SPACING,
  RADIUS,
} from '../constants';

// ============ 类型定义 ============

interface TopicDetailDrawerProps {
  /** 议题数据 */
  item: TopicItem | null;
  /** 是否可见 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 编辑回调 */
  onEdit: (item: TopicItem) => void;
}

// ============ 样式常量 ============

const styles = {
  // 遮罩层
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  
  // 抽屉容器
  drawerWrapper: {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: 1001,
  },
  
  // 头部
  header: {
    padding: `${SPACING.xl}px ${SPACING.lg}px`,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    position: 'relative' as const,
  },
  headerTop: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#86868b',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'all 0.15s ease',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
    lineHeight: 1.3,
    paddingRight: SPACING.xl,
  },
  
  // 状态标签行
  statusRow: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    flexWrap: 'wrap' as const,
  },
  badge: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    padding: '5px 12px',
    borderRadius: RADIUS.sm,
    fontSize: 13,
    fontWeight: 500,
  },
  
  // 内容区
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: `${SPACING.lg}px`,
  },
  
  // 信息区块
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#86868b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  
  // 信息行
  infoRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    padding: `${SPACING.sm}px 0`,
    borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#86868b',
    flexShrink: 0,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#1d1d1f',
    textAlign: 'right' as const,
    wordBreak: 'break-word' as const,
  },
  
  // 描述文本
  descriptionText: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#424245',
    backgroundColor: '#fafafa',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  
  // 标签列表
  tagsList: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: SPACING.xs,
  },
  tag: {
    padding: '4px 10px',
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
    color: '#0071e3',
    borderRadius: RADIUS.sm,
    fontSize: 12,
    fontWeight: 500,
  },
  
  // 封面图
  coverImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'cover' as const,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
  },
  
  // 统计卡片
  statsGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: SPACING.sm,
  },
  statCard: {
    backgroundColor: '#fafafa',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0071e3',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#86868b',
  },
  
  // 底部操作
  footer: {
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: '#fafafa',
    display: 'flex' as const,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    transition: 'all 0.2s ease',
  },
  primaryButton: {
    backgroundColor: '#0071e3',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
};

// ============ 子组件 ============

/** 格式化时间 */
const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

// ============ 主组件 ============

/**
 * 详情抽屉组件
 */
const TopicDetailDrawer: React.FC<TopicDetailDrawerProps> = ({
  item,
  visible,
  onClose,
  onEdit,
}) => {
  if (!visible || !item) return null;

  const statusConfig = STATUS_COLORS[item.status];
  const typeConfig = TYPE_COLORS[item.type];

  return (
    <>
      {/* 遮罩 */}
      <div style={styles.overlay} onClick={onClose} />
      
      {/* 抽屉 */}
      <div style={styles.drawerWrapper}>
        {/* 头部 */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <span style={{ fontSize: 13, color: '#86868b' }}>议题详情</span>
            <button
              onClick={onClose}
              style={styles.closeButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = '#1d1d1f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#86868b';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h2 style={styles.title}>{item.title}</h2>

          <div style={styles.statusRow}>
            <span style={{
              ...styles.badge,
              backgroundColor: statusConfig.bg,
              color: statusConfig.text,
            }}>
              {statusConfig.label}
            </span>
            <span style={{
              ...styles.badge,
              backgroundColor: typeConfig.bg,
              color: typeConfig.text,
            }}>
              {typeConfig.icon} {typeConfig.label}
            </span>
            <span style={{ ...styles.badge, backgroundColor: '#f5f5f7', color: '#86868b' }}>
              #{item.displayId}
            </span>
          </div>
        </div>

        {/* 内容区 */}
        <div style={styles.body}>
          {/* 封面图片 */}
          {item.coverImage && (
            <div style={styles.section}>
              <img src={item.coverImage} alt={item.title} style={styles.coverImage} />
            </div>
          )}

          {/* 描述 */}
          {item.description && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>描述</div>
              <div style={styles.descriptionText}>{item.description}</div>
            </div>
          )}

          {/* 统计信息 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>数据统计</div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{item.participantCount ?? 0}</div>
                <div style={styles.statLabel}>参与人数</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{item.debateCount ?? 0}</div>
                <div style={styles.statLabel}>辩论回合</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{item.hotness}</div>
                <div style={styles.statLabel}>热度值</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: statusConfig.text }}>{item.tags.length}</div>
                <div style={styles.statLabel}>标签数</div>
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>基本信息</div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>创建时间</span>
              <span style={styles.infoValue}>{formatDateTime(item.createdAt)}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>更新时间</span>
              <span style={styles.infoValue}>{formatDateTime(item.updatedAt)}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>唯一 ID</span>
              <span style={{ ...styles.infoValue, fontFamily: 'monospace', fontSize: 12 }}>
                {item.id}
              </span>
            </div>
          </div>

          {/* 标签 */}
          {item.tags && item.tags.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>标签</div>
              <div style={styles.tagsList}>
                {item.tags.map(tag => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div style={styles.footer}>
          <button
            onClick={() => onEdit(item)}
            style={{ ...styles.actionButton, ...styles.primaryButton }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0077ed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0071e3';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            编辑议题
          </button>
          
          <button
            onClick={onClose}
            style={{ ...styles.actionButton, ...styles.secondaryButton }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            关闭
          </button>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { 
            transform: translateX(100%); 
          }
          to { 
            transform: translateX(0); 
          }
        }
      `}</style>
    </>
  );
};

export default TopicDetailDrawer;
