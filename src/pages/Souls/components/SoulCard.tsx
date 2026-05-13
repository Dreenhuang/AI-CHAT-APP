/**
 * SoulCard - 角色卡片组件
 * 
 * 采用Apple设计风格的玻璃拟态(Glassmorphism)卡片
 * 包含角色头像、基本信息、状态指示和操作按钮
 */

import React, { useState } from 'react';
import { Soul, SoulTypeColors, SoulTypeLabels, SoulStatusLabels, PersonalityTagLabels } from '../types';

interface SoulCardProps {
  soul: Soul;
  onEdit: (soul: Soul) => void;
  onToggleStatus: (id: string, status: 'active' | 'inactive') => void;
  onViewDetail: (soul: Soul) => void;
  onDuplicate: (soul: Soul) => void;
  onDelete?: (soul: Soul) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const SoulCard: React.FC<SoulCardProps> = ({
  soul,
  onEdit,
  onToggleStatus,
  onViewDetail,
  onDuplicate,
  onDelete,
  isSelected = false,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  /** 获取类型主题色 */
  const typeColor = SoulTypeColors[soul.type];
  
  /** 渲染星星评分 */
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star filled">★</span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="star half">★</span>
        );
      } else {
        stars.push(
          <span key={i} className="star empty">☆</span>
        );
      }
    }
    
    return stars;
  };

  return (
    <div
      className={`soul-card ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* 选择框（批量操作模式） */}
      {onSelect && (
        <div className="card-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(soul.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {/* A/B测试标记 */}
      {soul.isABTest && (
        <div className="ab-test-badge">
          <span>A/B</span>
        </div>
      )}

      {/* 卡片头部 - 头像区域 */}
      <div className="card-header" style={{ background: `linear-gradient(135deg, ${typeColor}15, ${typeColor}08)` }}>
        <div className="avatar-container" style={{ boxShadow: `0 4px 20px ${typeColor}40` }}>
          <img
            src={soul.avatar}
            alt={`${soul.name} avatar`}
            className="avatar"
          />
          {/* 状态指示器 */}
          <div className={`status-indicator ${soul.status}`}>
            <span className="pulse" />
          </div>
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="card-body">
        {/* 角色名称 */}
        <h3 className="soul-name">{soul.name}</h3>
        <p className="soul-name-en">{soul.nameEn}</p>

        {/* 类型标签 */}
        <div className="type-badge" style={{ 
          backgroundColor: `${typeColor}18`,
          color: typeColor,
          border: `1px solid ${typeColor}30`
        }}>
          <span className="badge-icon">🎭</span>
          <span>{SoulTypeLabels[soul.type]}</span>
        </div>

        {/* 简介截断显示 */}
        <p className="soul-description">{soul.description}</p>

        {/* 统计信息 */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{(soul.usageStats.totalCalls / 1000).toFixed(1)}k</span>
            <span className="stat-label">使用</span>
          </div>
          
          <div className="stat-item">
            <div className="rating-stars">
              {renderStars(soul.usageStats.avgRating)}
            </div>
            <span className="stat-value">{soul.usageStats.avgRating.toFixed(1)}</span>
          </div>
          
          <div className="stat-item">
            <span className={`status-dot ${soul.status}`} />
            <span className="stat-label">{SoulStatusLabels[soul.status]}</span>
          </div>
        </div>
      </div>

      {/* 卡片操作区 */}
      <div className="card-actions">
        <button
          className="action-btn primary"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(soul);
          }}
          title="查看详情"
        >
          <span>👁️</span>
          <span>详情</span>
        </button>
        
        <button
          className="action-btn secondary"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(soul);
          }}
          title="编辑角色"
        >
          <span>✏️</span>
          <span>编辑</span>
        </button>
        
        <button
          className={`action-btn ${soul.status === 'active' ? 'warning' : 'success'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(soul.id, soul.status === 'active' ? 'inactive' : 'active');
          }}
          title={soul.status === 'active' ? '停用角色' : '启用角色'}
        >
          <span>{soul.status === 'active' ? '⏸️' : '▶️'}</span>
          <span>{soul.status === 'active' ? '禁用' : '启用'}</span>
        </button>
        
        <button
          className="action-btn ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(soul);
          }}
          title="复制角色"
        >
          <span>📋</span>
        </button>
        
        {onDelete && (
          <button
            className="action-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`确定要删除角色"${soul.name}"吗？此操作不可恢复。`)) {
                onDelete(soul);
              }
            }}
            title="删除角色"
          >
            <span>🗑️</span>
          </button>
        )}
      </div>

      {/* 悬停时的发光效果 */}
      {isHovered && soul.status === 'active' && (
        <div className="hover-glow" style={{ background: `radial-gradient(circle at center, ${typeColor}10, transparent 70%)` }} />
      )}

      <style jsx>{`
        .soul-card {
          position: relative;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.04),
            0 8px 24px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }

        .soul-card:hover {
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.08),
            0 12px 40px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .soul-card.selected {
          border-color: #007AFF;
          box-shadow: 
            0 0 0 2px #007AFF30,
            0 4px 16px rgba(0, 122, 255, 0.2);
        }

        /* 选择框 */
        .card-checkbox {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 10;
        }

        .card-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #007AFF;
        }

        /* A/B测试标记 */
        .ab-test-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
        }

        .ab-test-badge span {
          display: inline-block;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 600;
          color: #FF9500;
          background: linear-gradient(135deg, #FF950020, #FF950010);
          border: 1px solid #FF950040;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        /* 卡片头部 */
        .card-header {
          text-align: center;
          margin-bottom: 20px;
          padding: 20px;
          border-radius: 12px;
          margin: -24px -24px 20px -24px;
        }

        /* 头像容器 */
        .avatar-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid rgba(255, 255, 255, 0.9);
          transition: transform 0.3s ease;
        }

        .soul-card:hover .avatar-container {
          transform: scale(1.05);
        }

        .avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* 状态指示器 */
        .status-indicator {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-indicator.active {
          background: #34C759;
        }

        .status-indicator.inactive {
          background: #8E8E93;
        }

        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* 卡片内容 */
        .card-body {
          margin-bottom: 16px;
        }

        .soul-name {
          font-size: 20px;
          font-weight: 700;
          color: #1D1D1F;
          margin: 0 0 4px 0;
          text-align: center;
          letter-spacing: -0.3px;
        }

        .soul-name-en {
          font-size: 13px;
          color: #86868B;
          margin: 0 0 12px 0;
          text-align: center;
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        /* 类型标签 */
        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 12px;
          width: 100%;
          justify-content: center;
        }

        .badge-icon {
          font-size: 14px;
        }

        /* 简介 */
        .soul-description {
          font-size: 14px;
          line-height: 1.5;
          color: #6E6E73;
          margin: 0 0 16px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 统计网格 */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #1D1D1F;
        }

        .stat-label {
          font-size: 11px;
          color: #86868B;
          font-weight: 500;
        }

        /* 星级评分 */
        .rating-stars {
          display: flex;
          gap: 2px;
          margin-bottom: 2px;
        }

        .star {
          font-size: 14px;
          line-height: 1;
        }

        .star.filled {
          color: #FF9500;
        }

        .star.half {
          color: #FF9500;
          opacity: 0.7;
        }

        .star.empty {
          color: #E5E5EA;
        }

        /* 状态点 */
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-bottom: 2px;
        }

        .status-dot.active {
          background: #34C759;
          box-shadow: 0 0 6px #34C75980;
        }

        .status-dot.inactive {
          background: #8E8E93;
        }

        /* 操作按钮组 */
        .card-actions {
          display: flex;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(0, 0, 0, 0.03);
          color: #1D1D1F;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .action-btn.primary {
          background: #007AFF;
          color: white;
        }

        .action-btn.primary:hover {
          background: #0066DD;
        }

        .action-btn.secondary {
          background: rgba(0, 122, 255, 0.1);
          color: #007AFF;
        }

        .action-btn.secondary:hover {
          background: rgba(0, 122, 255, 0.15);
        }

        .action-btn.warning {
          background: rgba(255, 149, 0, 0.1);
          color: #FF9500;
        }

        .action-btn.warning:hover {
          background: rgba(255, 149, 0, 0.15);
        }

        .action-btn.success {
          background: rgba(52, 199, 89, 0.1);
          color: #34C759;
        }

        .action-btn.success:hover {
          background: rgba(52, 199, 89, 0.15);
        }

        .action-btn.danger {
          background: rgba(255, 59, 48, 0.08);
          color: #FF3B30;
        }

        .action-btn.danger:hover {
          background: rgba(255, 59, 48, 0.15);
        }

        .action-btn.ghost {
          flex: 0;
          padding: 8px 10px;
        }

        .action-btn.ghost:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        /* 悬停发光效果 */
        .hover-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          opacity: 0.5;
          z-index: 0;
          border-radius: 16px;
        }

        /* 响应式适配 */
        @media (max-width: 1200px) {
          .soul-card {
            padding: 20px;
          }
          
          .avatar-container {
            width: 80px;
            height: 80px;
          }
          
          .soul-name {
            font-size: 18px;
          }
          
          .card-actions {
            flex-wrap: wrap;
          }
          
          .action-btn span:last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SoulCard;
