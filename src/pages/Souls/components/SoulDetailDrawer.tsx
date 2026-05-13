/**
 * SoulDetailDrawer - 角色详情抽屉
 * 
 * Apple设计风格的侧边抽屉，展示完整的角色信息
 * 包含基本信息、使用统计、AI参数可视化、示例对话演示等
 */

import React, { useState } from 'react';
import { Soul, SoulTypeLabels, SoulTypeColors, PersonalityTagLabels, LanguageStyleLabels, SoulStatusLabels } from '../types';

interface SoulDetailDrawerProps {
  soul: Soul | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (soul: Soul) => void;
  onTestDialogue: (soul: Soul) => void;
}

type DetailTab = 'info' | 'stats' | 'prompt' | 'test';

const SoulDetailDrawer: React.FC<SoulDetailDrawerProps> = ({
  soul,
  isOpen,
  onClose,
  onEdit,
  onTestDialogue,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  if (!soul || !isOpen) return null;

  const typeColor = SoulTypeColors[soul.type];

  /** 渲染星星评分 */
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < Math.floor(rating) ? 'filled' : i < rating ? 'half' : 'empty'}`}>
        ★
      </span>
    ));
  };

  /** 格式化日期 */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /** 格式化数字 */
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* 抽屉头部 */}
        <div className="drawer-header">
          <div className="header-info">
            <div className="avatar-large" style={{ boxShadow: `0 4px 24px ${typeColor}50` }}>
              <img src={soul.avatar} alt={soul.name} />
              <div className={`status-badge ${soul.status}`}>
                {SoulStatusLabels[soul.status]}
              </div>
            </div>
            <div className="header-text">
              <h2>{soul.name}</h2>
              <p className="name-en">{soul.nameEn}</p>
              <div 
                className="type-badge"
                style={{ 
                  backgroundColor: `${typeColor}15`,
                  color: typeColor,
                  border: `1px solid ${typeColor}30`
                }}
              >
                {SoulTypeLabels[soul.type]}
              </div>
            </div>
          </div>

          {soul.isABTest && (
            <div className="ab-test-indicator">
              🧪 A/B测试中
            </div>
          )}

          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab导航 */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 基本信息
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 使用统计
          </button>
          <button
            className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            🤖 Prompt配置
          </button>
          <button
            className={`tab-btn ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            💬 对话测试
          </button>
        </div>

        {/* 内容区域 */}
        <div className="drawer-body">
          {/* ===== 基本信息 Tab ===== */}
          {activeTab === 'info' && (
            <div className="tab-content info-tab">
              <section className="info-section">
                <h3>📝 角色简介</h3>
                <p className="description">{soul.description}</p>
              </section>

              <section className="info-section">
                <h3>🎭 性格特点</h3>
                <div className="tags-list">
                  {soul.personalityTags.map(tag => (
                    <span
                      key={tag}
                      className="personality-tag"
                      style={{
                        background: `${typeColor}12`,
                        color: typeColor,
                        borderColor: `${typeColor}25`
                      }}
                    >
                      {PersonalityTagLabels[tag]}
                    </span>
                  ))}
                  {soul.customTags?.map(tag => (
                    <span
                      key={tag}
                      className="personality-tag custom"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              <section className="info-section">
                <h3>💬 语言风格</h3>
                <div className="style-info">
                  <span className="style-value">{LanguageStyleLabels[soul.languageStyle]}</span>
                </div>
              </section>

              <section className="info-section">
                <h3>🧠 AI行为参数</h3>
                <div className="params-visual">
                  <div className="param-bar">
                    <label>🎨 创造力</label>
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${soul.aiParams.creativity * 10}%`,
                          background: `linear-gradient(90deg, #FF6B6B, #FFD93D)`
                        }}
                      />
                      <span className="bar-value">{soul.aiParams.creativity}/10</span>
                    </div>
                  </div>
                  
                  <div className="param-bar">
                    <label>📐 严谨度</label>
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${soul.aiParams.rigor * 10}%`,
                          background: `linear-gradient(90deg, #4ECDC4, #44A08D)`
                        }}
                      />
                      <span className="bar-value">{soul.aiParams.rigor}/10</span>
                    </div>
                  </div>
                  
                  <div className="param-bar">
                    <label>🤝 互动性</label>
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${soul.aiParams.interaction * 10}%`,
                          background: `linear-gradient(90deg, #A8E6CF, #56CCF2)`
                        }}
                      />
                      <span className="bar-value">{soul.aiParams.interaction}/10</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="info-section meta">
                <h3>ℹ️ 元信息</h3>
                <div className="meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">创建时间</span>
                    <span className="meta-value">{formatDate(soul.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">最后更新</span>
                    <span className="meta-value">{formatDate(soul.updatedAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">版本号</span>
                    <span className="meta-value">v{soul.version}.0</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">创建者</span>
                    <span className="meta-value">{soul.creator || '系统'}</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===== 使用统计 Tab ===== */}
          {activeTab === 'stats' && (
            <div className="tab-content stats-tab">
              {/* 核心指标卡片 */}
              <div className="stats-cards">
                <div className="stat-card primary">
                  <div className="stat-icon">📞</div>
                  <div className="stat-number">{formatNumber(soul.usageStats.totalCalls)}</div>
                  <div className="stat-label">总调用次数</div>
                </div>
                
                <div className="stat-card success">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-number">{soul.usageStats.avgRating.toFixed(1)}</div>
                  <div className="stat-label">平均评分</div>
                  <div className="rating-display">
                    {renderStars(soul.usageStats.avgRating)}
                  </div>
                </div>
                
                <div className="stat-card warning">
                  <div className="stat-icon">👍</div>
                  <div className="stat-number">{soul.usageStats.approvalRate}%</div>
                  <div className="stat-label">好评率</div>
                </div>
                
                <div className="stat-card info">
                  <div className="stat-icon">💬</div>
                  <div className="stat-number">{soul.usageStats.avgDialogueRounds.toFixed(1)}</div>
                  <div className="stat-label">平均对话轮数</div>
                </div>
              </div>

              {/* 详细统计图表（模拟） */}
              <section className="chart-section">
                <h3>📈 调用趋势（近30天）</h3>
                <div className="mock-chart">
                  <div className="chart-bars">
                    {[65, 78, 82, 75, 88, 92, 85, 95, 89, 98, 94, 102, 108, 115, 110, 120, 118, 125, 130, 128, 135, 140, 138, 145, 150, 148, 155, 160, 158, 165].map((value, index) => (
                      <div
                        key={index}
                        className="chart-bar"
                        style={{
                          height: `${(value / 180) * 100}%`,
                          background: `linear-gradient(to top, ${typeColor}40, ${typeColor})`
                        }}
                        title={`${value}次调用`}
                      />
                    ))}
                  </div>
                  <div className="chart-labels">
                    <span>30天前</span>
                    <span>今天</span>
                  </div>
                </div>
              </section>

              {/* 性能指标 */}
              <section className="performance-section">
                <h3>⚡ 性能指标</h3>
                <div className="perf-items">
                  <div className="perf-item">
                    <span className="perf-label">响应速度</span>
                    <div className="perf-bar">
                      <div className="perf-fill excellent" style={{ width: '92%' }} />
                    </div>
                    <span className="perf-value">优秀</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">用户满意度</span>
                    <div className="perf-bar">
                      <div className="perf-fill good" style={{ width: `${soul.usageStats.approvalRate}%` }} />
                    </div>
                    <span className="perf-value">{soul.usageStats.approvalRate}%</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">对话质量分</span>
                    <div className="perf-bar">
                      <div className="perf-fill good" style={{ width: `${(soul.usageStats.avgRating / 5) * 100}%` }} />
                    </div>
                    <span className="perf-value">{soul.usageStats.avgRating}/5.0</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===== Prompt配置 Tab ===== */}
          {activeTab === 'prompt' && (
            <div className="tab-content prompt-tab">
              <section className="prompt-section">
                <h3>📋 System Prompt</h3>
                <div className="prompt-content">
                  <pre>{soul.systemPrompt || '(未配置)'}</pre>
                </div>
              </section>

              {soul.exampleDialogues.length > 0 && (
                <section className="examples-section">
                  <h3>💭 示例对话 ({soul.exampleDialogues.length}组)</h3>
                  <div className="examples-list">
                    {soul.exampleDialogues.map((dialogue, index) => (
                      <div key={dialogue.id} className="example-card">
                        <div className="example-header">
                          <span className="example-num">示例 #{index + 1}</span>
                        </div>
                        
                        <div className="example-q">
                          <span className="q-label">Q:</span>
                          <p>{dialogue.question}</p>
                        </div>
                        
                        <div className="example-a">
                          <span className="a-label">A:</span>
                          <p>{dialogue.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ===== 对话测试 Tab ===== */}
          {activeTab === 'test' && (
            <div className="tab-content test-tab">
              <div className="test-intro">
                <h3>💬 与 {soul.name} 对话测试</h3>
                <p>模拟与该角色的对话，验证其回复效果和性格表现</p>
              </div>

              <div className="test-area">
                <div className="chat-messages">
                  <div className="message system">
                    <span className="msg-avatar">🤖</span>
                    <div className="msg-content">
                      你好！我是{soul.name}。你可以向我提问来测试我的回答效果。
                    </div>
                  </div>
                </div>

                <div className="test-input-area">
                  <textarea
                    placeholder="输入测试消息..."
                    rows={3}
                    disabled
                  />
                  <div className="test-actions">
                    <button className="btn-secondary" disabled>
                      发送消息
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => onTestDialogue(soul)}
                    >
                      🚀 启动完整测试
                    </button>
                  </div>
                </div>

                <div className="test-note">
                  ⚠️ 注意：完整测试功能需要连接AI服务后端
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="drawer-footer">
          <button className="action-btn secondary" onClick={() => onEdit(soul)}>
            ✏️ 编辑角色
          </button>
          
          <button className="action-btn primary" onClick={() => onTestDialogue(soul)}>
            💬 测试对话
          </button>
          
          <button className="action-btn ghost" onClick={() => {
            // 复制角色配置
            alert('复制功能：将基于此角色创建新副本');
          }}>
            📋 复制角色
          </button>
        </div>

        <style jsx>{`
          .drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            z-index: 999;
            animation: fadeIn 0.25s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .drawer-container {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 600px;
            max-width: 90vw;
            background: white;
            box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            animation: slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }

          /* 头部 */
          .drawer-header {
            padding: 28px 28px 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            position: relative;
            background: linear-gradient(to bottom, #FAFAFA, #FFFFFF);
          }

          .header-info {
            display: flex;
            gap: 20px;
            align-items: center;
          }

          .avatar-large {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid white;
            position: relative;
            flex-shrink: 0;
          }

          .avatar-large img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .status-badge {
            position: absolute;
            bottom: 4px;
            right: 4px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 12px;
            color: white;
          }

          .status-badge.active {
            background: #34C759;
          }

          .status-badge.inactive {
            background: #8E8E93;
          }

          .header-text h2 {
            margin: 0 0 4px 0;
            font-size: 26px;
            font-weight: 700;
            color: #1D1D1F;
            letter-spacing: -0.5px;
          }

          .name-en {
            margin: 0 0 10px 0;
            font-size: 15px;
            color: #86868B;
            font-weight: 500;
          }

          .type-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
          }

          .ab-test-indicator {
            margin-top: 12px;
            padding: 8px 14px;
            background: linear-gradient(135deg, #FF950015, #FF950008);
            border: 1px solid #FF950030;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #CC7700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            transform: rotate(90deg);
          }

          /* Tab导航 */
          .tab-nav {
            display: flex;
            gap: 4px;
            padding: 16px 28px;
            background: #F5F5F7;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            overflow-x: auto;
          }

          .tab-btn {
            padding: 10px 18px;
            border: none;
            background: transparent;
            color: #86868B;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border-radius: 8px;
            white-space: nowrap;
            transition: all 0.2s;
          }

          .tab-btn:hover {
            background: rgba(0, 0, 0, 0.04);
            color: #1D1D1F;
          }

          .tab-btn.active {
            background: white;
            color: #007AFF;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }

          /* 内容区域 */
          .drawer-body {
            flex: 1;
            overflow-y: auto;
            padding: 28px;
          }

          .tab-content {
            animation: tabFadeIn 0.3s ease-out;
          }

          @keyframes tabFadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* 信息Tab */
          .info-section {
            margin-bottom: 28px;
          }

          .info-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 14px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .description {
            font-size: 15px;
            line-height: 1.7;
            color: #3C3C43;
            margin: 0;
          }

          .tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .personality-tag {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            border-width: 1px;
            border-style: solid;
          }

          .personality-tag.custom {
            background: #F5F5F7;
            color: #1D1D1F;
            border-color: #E5E5EA;
          }

          .style-info {
            padding: 14px 18px;
            background: #F5F5F7;
            border-radius: 10px;
          }

          .style-value {
            font-size: 16px;
            font-weight: 600;
            color: #1D1D1F;
          }

          /* 参数可视化 */
          .params-visual {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .param-bar label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #1D1D1F;
            margin-bottom: 8px;
          }

          .bar-wrapper {
            position: relative;
            height: 24px;
            background: rgba(0, 0, 0, 0.06);
            border-radius: 12px;
            overflow: hidden;
          }

          .bar-fill {
            height: 100%;
            border-radius: 12px;
            transition: width 0.5s ease;
          }

          .bar-value {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 13px;
            font-weight: 600;
            color: #1D1D1F;
          }

          /* 元信息 */
          .meta.grid {
            background: #F5F5F7;
            padding: 18px;
            border-radius: 12px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .meta-label {
            font-size: 12px;
            color: #86868B;
            font-weight: 500;
          }

          .meta-value {
            font-size: 14px;
            color: #1D1D1F;
            font-weight: 500;
          }

          /* 统计Tab */
          .stats-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin-bottom: 28px;
          }

          .stat-card {
            padding: 20px;
            border-radius: 14px;
            text-align: center;
          }

          .stat-card.primary {
            background: linear-gradient(135deg, #007AFF10, #007AFF05);
            border: 1px solid #007AFF20;
          }

          .stat-card.success {
            background: linear-gradient(135deg, #34C75910, #34C75905);
            border: 1px solid #34C75920;
          }

          .stat-card.warning {
            background: linear-gradient(135deg, #FF950010, #FF950005);
            border: 1px solid #FF950020;
          }

          .stat-card.info {
            background: linear-gradient(135deg, #5856D610, #5856D605);
            border: 1px solid #5856D620;
          }

          .stat-icon {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .stat-number {
            font-size: 28px;
            font-weight: 700;
            color: #1D1D1F;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 13px;
            color: #86868B;
            font-weight: 500;
          }

          .rating-display {
            display: flex;
            gap: 2px;
            justify-content: center;
            margin-top: 6px;
          }

          .star {
            font-size: 14px;
          }

          .star.filled {
            color: #FF9500;
          }

          .star.half {
            color: #FF9500;
            opacity: 0.6;
          }

          .star.empty {
            color: #E5E5EA;
          }

          /* 图表区域 */
          .chart-section {
            margin-bottom: 28px;
          }

          .chart-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 16px 0;
          }

          .mock-chart {
            background: #FAFAFA;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(0, 0, 0, 0.06);
          }

          .chart-bars {
            display: flex;
            align-items: flex-end;
            gap: 3px;
            height: 160px;
          }

          .chart-bar {
            flex: 1;
            min-height: 4px;
            border-radius: 2px;
            transition: all 0.2s;
            cursor: pointer;
          }

          .chart-bar:hover {
            opacity: 0.8;
            transform: scaleY(1.05);
          }

          .chart-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 12px;
            color: #86868B;
          }

          /* 性能指标 */
          .performance-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 16px 0;
          }

          .perf-items {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .perf-item {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .perf-label {
            font-size: 14px;
            color: #1D1D1F;
            min-width: 90px;
          }

          .perf-bar {
            flex: 1;
            height: 8px;
            background: rgba(0, 0, 0, 0.06);
            border-radius: 4px;
            overflow: hidden;
          }

          .perf-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease;
          }

          .perf-fill.excellent {
            background: #34C759;
          }

          .perf-fill.good {
            background: #007AFF;
          }

          .perf-value {
            font-size: 13px;
            font-weight: 600;
            color: #1D1D1F;
            min-width: 50px;
            text-align: right;
          }

          /* Prompt Tab */
          .prompt-section h3,
          .examples-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 14px 0;
          }

          .prompt-content {
            background: #1D1D1F;
            border-radius: 12px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
          }

          .prompt-content pre {
            margin: 0;
            font-family: 'SF Mono', Monaco, Consolas, monospace;
            font-size: 13px;
            line-height: 1.7;
            color: #E5E5EA;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .examples-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .example-card {
            background: #F5F5F7;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(0, 0, 0, 0.06);
          }

          .example-header {
            margin-bottom: 12px;
          }

          .example-num {
            font-size: 13px;
            font-weight: 600;
            color: #007AFF;
          }

          .example-q,
          .example-a {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }

          .example-q:last-child,
          .example-a:last-child {
            margin-bottom: 0;
          }

          .q-label,
          .a-label {
            font-weight: 700;
            font-size: 14px;
            color: #007AFF;
          }

          .a-label {
            color: #34C759;
          }

          .example-q p,
          .example-a p {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: #3C3C43;
          }

          /* 测试Tab */
          .test-intro h3 {
            font-size: 17px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 6px 0;
          }

          .test-intro p {
            font-size: 14px;
            color: #86868B;
            margin: 0 0 20px 0;
          }

          .test-area {
            background: #F5F5F7;
            border-radius: 14px;
            padding: 20px;
            border: 1px solid rgba(0, 0, 0, 0.06);
          }

          .chat-messages {
            background: white;
            border-radius: 10px;
            padding: 16px;
            min-height: 200px;
            margin-bottom: 16px;
          }

          .message {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }

          .msg-avatar {
            font-size: 28px;
            flex-shrink: 0;
          }

          .msg-content {
            padding: 12px 16px;
            background: #F5F5F7;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.6;
            color: #3C3C43;
          }

          .test-input-area textarea {
            width: 100%;
            padding: 14px;
            border: 1.5px solid rgba(0, 0, 0, 0.12);
            border-radius: 10px;
            font-size: 14px;
            resize: vertical;
            outline: none;
            font-family: inherit;
            margin-bottom: 12px;
          }

          .test-input-area textarea:focus {
            border-color: #007AFF;
          }

          .test-input-area textarea:disabled {
            background: #FAFAFA;
            color: #86868B;
          }

          .test-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }

          .test-note {
            margin-top: 14px;
            padding: 10px 14px;
            background: rgba(255, 149, 0, 0.08);
            border: 1px solid rgba(255, 149, 0, 0.2);
            border-radius: 8px;
            font-size: 13px;
            color: #CC7700;
          }

          /* 底部操作栏 */
          .drawer-footer {
            padding: 20px 28px;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            display: flex;
            gap: 10px;
            background: #FAFAFA;
          }

          .action-btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          }

          .action-btn.primary {
            background: #007AFF;
            color: white;
          }

          .action-btn.primary:hover {
            background: #0066DD;
          }

          .action-btn.secondary {
            background: rgba(0, 0, 0, 0.05);
            color: #1D1D1F;
          }

          .action-btn.secondary:hover {
            background: rgba(0, 0, 0, 0.1);
          }

          .action-btn.ghost {
            background: transparent;
            color: #86868B;
            border: 1px solid rgba(0, 0, 0, 0.1);
          }

          .action-btn.ghost:hover {
            background: rgba(0, 0, 0, 0.04);
            color: #1D1D1F;
          }

          /* 响应式适配 */
          @media (max-width: 768px) {
            .drawer-container {
              width: 100vw;
              max-width: 100vw;
            }

            .drawer-header {
              padding: 20px;
            }

            .avatar-large {
              width: 72px;
              height: 72px;
            }

            .header-text h2 {
              font-size: 22px;
            }

            .tab-nav {
              padding: 12px 20px;
            }

            .tab-btn {
              padding: 8px 14px;
              font-size: 13px;
            }

            .drawer-body {
              padding: 20px;
            }

            .stats-cards {
              grid-template-columns: 1fr;
            }

            .meta-grid {
              grid-template-columns: 1fr;
            }

            .drawer-footer {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SoulDetailDrawer;
