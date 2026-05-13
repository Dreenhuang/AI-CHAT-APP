/**
 * CreateEditModal - 创建/编辑Soul角色模态框
 * 
 * Apple设计风格的大型模态框，包含完整的角色配置表单
 * 支持分Tab组织：基本信息 → 角色设定 → AI参数 → 高级配置
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Soul,
  SoulFormData,
  SoulType,
  SoulTypeLabels,
  LanguageStyle,
  LanguageStyleLabels,
  PersonalityTag,
  PersonalityTagLabels,
  ExampleDialogue,
} from '../types';

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SoulFormData) => void;
  editData?: Soul | null;
}

type FormStep = 'basic' | 'settings' | 'params' | 'advanced';

const CreateEditModal: React.FC<CreateEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
}) => {
  /** 表单数据状态 */
  const [formData, setFormData] = useState<SoulFormData>({
    name: '',
    nameEn: '',
    description: '',
    avatar: '',
    type: 'debate',
    personalityTags: [],
    customTags: [],
    languageStyle: 'academic',
    aiParams: {
      creativity: 7,
      rigor: 8,
      interaction: 4,
    },
    systemPrompt: '',
    exampleDialogues: [],
    status: 'active',
    isABTest: false,
  });

  /** 当前步骤 */
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  
  /** 自定义标签输入 */
  const [customTagInput, setCustomTagInput] = useState('');
  
  /** 文件上传ref */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 初始化表单数据 */
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        nameEn: editData.nameEn,
        description: editData.description,
        avatar: editData.avatar,
        type: editData.type,
        personalityTags: editData.personalityTags,
        customTags: editData.customTags || [],
        languageStyle: editData.languageStyle,
        aiParams: { ...editData.aiParams },
        systemPrompt: editData.systemPrompt,
        exampleDialogues: [...editData.exampleDialogues],
        status: editData.status,
        isABTest: editData.isABTest,
      });
    } else {
      // 重置为默认值
      setFormData({
        name: '',
        nameEn: '',
        description: '',
        avatar: '',
        type: 'debate',
        personalityTags: [],
        customTags: [],
        languageStyle: 'academic',
        aiParams: {
          creativity: 7,
          rigor: 8,
          interaction: 4,
        },
        systemPrompt: '',
        exampleDialogues: [],
        status: 'active',
        isABTest: false,
      });
    }
    setCurrentStep('basic');
  }, [editData, isOpen]);

  /** 更新表单字段 */
  const updateField = <K extends keyof SoulFormData>(field: K, value: SoulFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /** 更新AI参数 */
  const updateAIParam = (param: keyof typeof formData.aiParams, value: number) => {
    setFormData(prev => ({
      ...prev,
      aiParams: { ...prev.aiParams, [param]: value },
    }));
  };

  /** 切换性格标签 */
  const togglePersonalityTag = (tag: PersonalityTag) => {
    setFormData(prev => ({
      ...prev,
      personalityTags: prev.personalityTags.includes(tag)
        ? prev.personalityTags.filter(t => t !== tag)
        : [...prev.personalityTags, tag],
    }));
  };

  /** 添加自定义标签 */
  const addCustomTag = () => {
    if (customTagInput.trim() && !formData.customTags.includes(customTagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        customTags: [...prev.customTags, customTagInput.trim()],
      }));
      setCustomTagInput('');
    }
  };

  /** 移除自定义标签 */
  const removeCustomTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      customTags: prev.customTags.filter(t => t !== tag),
    }));
  };

  /** 添加示例对话 */
  const addExampleDialogue = () => {
    const newDialogue: ExampleDialogue = {
      id: `ex_${Date.now()}`,
      question: '',
      answer: '',
    };
    setFormData(prev => ({
      ...prev,
      exampleDialogues: [...prev.exampleDialogues, newDialogue],
    }));
  };

  /** 更新示例对话 */
  const updateExampleDialogue = (id: string, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      exampleDialogues: prev.exampleDialogues.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  /** 移除示例对话 */
  const removeExampleDialogue = (id: string) => {
    setFormData(prev => ({
      ...prev,
      exampleDialogues: prev.exampleDialogues.filter(d => d.id !== id),
    }));
  };

  /** 头像上传处理 */
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型和大小
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件（JPG/PNG）');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        return;
      }

      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /** 提交表单 */
  const handleSubmit = (isDraft: boolean = false) => {
    // 基本验证
    if (!formData.name.trim()) {
      alert('请输入角色名称');
      setCurrentStep('basic');
      return;
    }
    if (!formData.nameEn.trim()) {
      alert('请输入英文名称');
      setCurrentStep('basic');
      return;
    }
    if (!formData.description.trim()) {
      alert('请输入角色简介');
      setCurrentStep('basic');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  /** 步骤配置 */
  const steps: { key: FormStep; label: string; icon: string }[] = [
    { key: 'basic', label: '基本信息', icon: '📝' },
    { key: 'settings', label: '角色设定', icon: '🎭' },
    { key: 'params', label: 'AI参数', icon: '🧠' },
    { key: 'advanced', label: '高级配置', icon: '⚙️' },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="modal-header">
          <h2>{editData ? '编辑Soul角色' : '创建Soul角色'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 步骤导航 */}
        <div className="steps-nav">
          {steps.map((step, index) => (
            <button
              key={step.key}
              className={`step-btn ${currentStep === step.key ? 'active' : ''}`}
              onClick={() => setCurrentStep(step.key)}
            >
              <span className="step-icon">{step.icon}</span>
              <span className="step-label">{step.label}</span>
            </button>
          ))}
        </div>

        {/* 表单内容区域 */}
        <div className="modal-body">
          {/* ===== 第一步：基本信息 ===== */}
          {currentStep === 'basic' && (
            <div className="form-section">
              <h3 className="section-title">📷 角色形象</h3>
              
              <div 
                className="avatar-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.avatar ? (
                  <div className="avatar-preview">
                    <img src={formData.avatar as string} alt="Avatar preview" />
                    <div className="avatar-overlay">
                      <span>点击更换</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📤</span>
                    <span className="upload-text">上传头像或拖拽到此处</span>
                    <span className="upload-hint">支持 JPG/PNG，最大 2MB</span>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <h3 className="section-title" style={{ marginTop: '24px' }}>📝 基本信息</h3>
              
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>角色名称 *</label>
                  <input
                    type="text"
                    placeholder="例如：苏格拉底"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    maxLength={20}
                  />
                </div>
                
                <div className="form-group flex-1">
                  <label>英文名称 *</label>
                  <input
                    type="text"
                    placeholder="例如：Socrates"
                    value={formData.nameEn}
                    onChange={(e) => updateField('nameEn', e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>角色简介 *</label>
                <textarea
                  placeholder="请简要描述这个角色的特点、风格和适用场景..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  maxLength={200}
                />
                <div className="char-count">{formData.description.length}/200</div>
              </div>
            </div>
          )}

          {/* ===== 第二步：角色设定 ===== */}
          {currentStep === 'settings' && (
            <div className="form-section">
              <h3 className="section-title">🎭 角色类型</h3>
              
              <div className="type-grid">
                {(Object.entries(SoulTypeLabels) as [SoulType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    className={`type-option ${formData.type === key ? 'selected' : ''}`}
                    onClick={() => updateField('type', key)}
                  >
                    <span className="type-emoji">
                      {key === 'debate' && '⚔️'}
                      {key === 'analysis' && '🔬'}
                      {key === 'speculation' && '🎓'}
                      {key === 'creative' && '🎨'}
                      {key === 'business' && '💼'}
                      {key === 'academic' && '📚'}
                      {key === 'other' && '✨'}
                    </span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <h3 className="section-title" style={{ marginTop: '24px' }}>✨ 性格特点（可多选）</h3>
              
              <div className="tags-container">
                {(Object.entries(PersonalityTagLabels) as [PersonalityTag, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    className={`tag-chip ${formData.personalityTags.includes(key) ? 'selected' : ''}`}
                    onClick={() => togglePersonalityTag(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 自定义标签 */}
              <div className="custom-tags-section">
                <div className="add-tag-input">
                  <input
                    type="text"
                    placeholder="添加自定义标签..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                    maxLength={10}
                  />
                  <button onClick={addCustomTag}>+ 添加</button>
                </div>
                
                {formData.customTags.length > 0 && (
                  <div className="custom-tags-list">
                    {formData.customTags.map(tag => (
                      <span key={tag} className="custom-tag">
                        {tag}
                        <button onClick={() => removeCustomTag(tag)}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <h3 className="section-title" style={{ marginTop: '24px' }}>💬 语言风格</h3>
              
              <select
                value={formData.languageStyle}
                onChange={(e) => updateField('languageStyle', e.target.value as LanguageStyle)}
                className="form-select"
              >
                {(Object.entries(LanguageStyleLabels) as [LanguageStyle, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* ===== 第三步：AI行为参数 ===== */}
          {currentStep === 'params' && (
            <div className="form-section">
              <h3 className="section-title">🧠 AI行为参数调节</h3>
              <p className="section-desc">通过滑块调整角色的AI行为倾向，影响其回复的创造性、严谨度和互动性</p>

              <div className="params-grid">
                {/* 创造力等级 */}
                <div className="param-item">
                  <div className="param-header">
                    <label className="param-name">🎨 创造力等级</label>
                    <span className="param-value">{formData.aiParams.creativity}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={formData.aiParams.creativity}
                    onChange={(e) => updateAIParam('creativity', parseInt(e.target.value))}
                    className="param-slider"
                  />
                  <div className="param-labels">
                    <span>保守传统</span>
                    <span>极具创意</span>
                  </div>
                </div>

                {/* 严谨程度 */}
                <div className="param-item">
                  <div className="param-header">
                    <label className="param-name">📐 严谨程度</label>
                    <span className="param-value">{formData.aiParams.rigor}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={formData.aiParams.rigor}
                    onChange={(e) => updateAIParam('rigor', parseInt(e.target.value))}
                    className="param-slider"
                  />
                  <div className="param-labels">
                    <span>轻松随意</span>
                    <span>严谨学术</span>
                  </div>
                </div>

                {/* 互动倾向 */}
                <div className="param-item">
                  <div className="param-header">
                    <label className="param-name">🤝 互动倾向</label>
                    <span className="param-value">{formData.aiParams.interaction}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={formData.aiParams.interaction}
                    onChange={(e) => updateAIParam('interaction', parseInt(e.target.value))}
                    className="param-slider"
                  />
                  <div className="param-labels">
                    <span>被动回应</span>
                    <span>主动引导</span>
                  </div>
                </div>
              </div>

              {/* 参数预设 */}
              <div className="presets-section">
                <h4>快速预设</h4>
                <div className="presets-grid">
                  <button
                    className="preset-btn"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      aiParams: { creativity: 9, rigor: 5, interaction: 9 },
                    }))}
                  >
                    🌟 创意达人
                  </button>
                  <button
                    className="preset-btn"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      aiParams: { creativity: 4, rigor: 10, interaction: 3 },
                    }))}
                  >
                    🔬 学术专家
                  </button>
                  <button
                    className="preset-btn"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      aiParams: { creativity: 7, rigor: 7, interaction: 7 },
                    }))}
                  >
                    ⚖️ 平衡型
                  </button>
                  <button
                    className="preset-btn"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      aiParams: { creativity: 6, rigor: 8, interaction: 8 },
                    }))}
                  >
                    💡 辩论高手
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== 第四步：高级配置 ===== */}
          {currentStep === 'advanced' && (
            <div className="form-section">
              <h3 className="section-title">📋 System Prompt模板</h3>
              <p className="section-desc">定义角色的核心指令和行为规范，支持Markdown格式</p>
              
              <textarea
                className="prompt-editor"
                placeholder={`请输入System Prompt...

示例：
你是XXX，一位...
你的核心方法是...
性格特点：
1. ...
2. ...

辩论风格：
- ...
- ...`}
                value={formData.systemPrompt}
                onChange={(e) => updateField('systemPrompt', e.target.value)}
                rows={12}
              />

              <h3 className="section-title" style={{ marginTop: '24px' }}>💭 示例对话（可选）</h3>
              <p className="section-desc">添加Few-shot示例对话对，帮助AI更好地理解期望的回答风格</p>

              <div className="examples-list">
                {formData.exampleDialogues.map((dialogue, index) => (
                  <div key={dialogue.id} className="example-item">
                    <div className="example-header">
                      <span>示例 #{index + 1}</span>
                      <button
                        className="remove-example-btn"
                        onClick={() => removeExampleDialogue(dialogue.id)}
                      >
                        ✕ 删除
                      </button>
                    </div>
                    
                    <div className="example-field">
                      <label>Q: 用户问题</label>
                      <textarea
                        placeholder="用户可能会问的问题..."
                        value={dialogue.question}
                        onChange={(e) => updateExampleDialogue(dialogue.id, 'question', e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="example-field">
                      <label>A: 角色回答</label>
                      <textarea
                        placeholder="期望的角色回答..."
                        value={dialogue.answer}
                        onChange={(e) => updateExampleDialogue(dialogue.id, 'answer', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}

                <button className="add-example-btn" onClick={addExampleDialogue}>
                  + 添加示例对话对
                </button>
              </div>

              {/* 其他选项 */}
              <div className="options-section">
                <h3 className="section-title" style={{ marginTop: '24px' }}>⚙️ 其他选项</h3>
                
                <div className="option-item">
                  <label className="toggle-label">
                    <span>
                      <strong>初始状态</strong>
                      <small>创建后是否立即启用</small>
                    </span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.status === 'active'}
                        onChange={(e) => updateField('status', e.target.checked ? 'active' : 'inactive')}
                      />
                      <span className="toggle-slider" />
                    </div>
                  </label>
                </div>

                <div className="option-item">
                  <label className="toggle-label">
                    <span>
                      <strong>A/B测试标记</strong>
                      <small>将此角色用于A/B测试对比</small>
                    </span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.isABTest}
                        onChange={(e) => updateField('isABTest', e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 模态框底部操作栏 */}
        <div className="modal-footer">
          <div className="footer-left">
            {currentStep !== 'basic' && (
              <button
                className="btn-secondary"
                onClick={() => {
                  const stepIndex = steps.findIndex(s => s.key === currentStep);
                  if (stepIndex > 0) setCurrentStep(steps[stepIndex - 1].key);
                }}
              >
                ← 上一步
              </button>
            )}
          </div>

          <div className="footer-center">
            <button className="btn-ghost" onClick={onClose}>
              取消
            </button>
            {!editData && (
              <button
                className="btn-secondary"
                onClick={() => handleSubmit(true)}
              >
                保存草稿
              </button>
            )}
          </div>

          <div className="footer-right">
            {currentStep !== 'advanced' ? (
              <button
                className="btn-primary"
                onClick={() => {
                  const stepIndex = steps.findIndex(s => s.key === currentStep);
                  if (stepIndex < steps.length - 1) setCurrentStep(steps[stepIndex + 1].key);
                }}
              >
                下一步 →
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => handleSubmit(false)}
              >
                {editData ? '💾 保存修改' : '🚀 发布角色'}
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.25s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-container {
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            background: white;
            border-radius: 20px;
            box-shadow:
              0 24px 80px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          /* 头部 */
          .modal-header {
            padding: 24px 28px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(to bottom, #FAFAFA, #FFFFFF);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #1D1D1F;
            letter-spacing: -0.3px;
          }

          .close-btn {
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
            color: #86868B;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #1D1D1F;
          }

          /* 步骤导航 */
          .steps-nav {
            display: flex;
            gap: 8px;
            padding: 16px 28px;
            background: #F5F5F7;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          }

          .step-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #86868B;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border-radius: 10px;
            transition: all 0.2s;
          }

          .step-btn:hover {
            background: rgba(0, 0, 0, 0.04);
            color: #1D1D1F;
          }

          .step-btn.active {
            background: white;
            color: #007AFF;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .step-icon {
            font-size: 18px;
          }

          /* 内容区域 */
          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 28px;
          }

          .form-section {
            max-width: 100%;
          }

          .section-title {
            font-size: 17px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 16px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-desc {
            font-size: 14px;
            color: #86868B;
            margin: -12px 0 20px 0;
            line-height: 1.5;
          }

          /* 头像上传区域 */
          .avatar-upload-area {
            width: 160px;
            height: 160px;
            border: 2px dashed rgba(0, 0, 0, 0.15);
            border-radius: 16px;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.2s;
            position: relative;
          }

          .avatar-upload-area:hover {
            border-color: #007AFF;
            background: rgba(0, 122, 255, 0.03);
          }

          .avatar-preview {
            width: 100%;
            height: 100%;
            position: relative;
          }

          .avatar-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .avatar-upload-area:hover .avatar-overlay {
            opacity: 1;
          }

          .upload-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #86868B;
          }

          .upload-icon {
            font-size: 36px;
          }

          .upload-text {
            font-size: 14px;
            font-weight: 500;
          }

          .upload-hint {
            font-size: 12px;
            color: #AEAEB2;
          }

          /* 表单元素 */
          .form-row {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
          }

          .flex-1 {
            flex: 1;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #1D1D1F;
            margin-bottom: 8px;
          }

          .form-group input,
          .form-group textarea,
          .form-select {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 10px;
            font-size: 15px;
            color: #1D1D1F;
            background: white;
            transition: all 0.2s;
            outline: none;
            font-family: inherit;
          }

          .form-group input:focus,
          .form-group textarea:focus,
          .form-select:focus {
            border-color: #007AFF;
            box-shadow: 0 0 0 3px #007AFF15;
          }

          .form-group textarea {
            resize: vertical;
            line-height: 1.5;
          }

          .char-count {
            text-align: right;
            font-size: 12px;
            color: #86868B;
            margin-top: 6px;
          }

          /* 类型选择网格 */
          .type-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }

          .type-option {
            padding: 16px 12px;
            border: 2px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            background: white;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            font-size: 14px;
            font-weight: 500;
            color: #1D1D1F;
          }

          .type-option:hover {
            border-color: #007AFF40;
            background: rgba(0, 122, 255, 0.03);
          }

          .type-option.selected {
            border-color: #007AFF;
            background: rgba(0, 122, 255, 0.06);
            color: #007AFF;
          }

          .type-emoji {
            font-size: 24px;
          }

          /* 标签选择 */
          .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .tag-chip {
            padding: 8px 16px;
            border: 1.5px solid rgba(0, 0, 0, 0.12);
            border-radius: 20px;
            background: white;
            font-size: 14px;
            font-weight: 500;
            color: #1D1D1F;
            cursor: pointer;
            transition: all 0.2s;
          }

          .tag-chip:hover {
            border-color: #007AFF60;
          }

          .tag-chip.selected {
            border-color: #007AFF;
            background: #007AFF;
            color: white;
          }

          /* 自定义标签 */
          .custom-tags-section {
            margin-top: 16px;
          }

          .add-tag-input {
            display: flex;
            gap: 8px;
          }

          .add-tag-input input {
            flex: 1;
            padding: 10px 14px;
            border: 1.5px solid rgba(0, 0, 0, 0.12);
            border-radius: 8px;
            font-size: 14px;
            outline: none;
          }

          .add-tag-input input:focus {
            border-color: #007AFF;
          }

          .add-tag-input button {
            padding: 10px 18px;
            background: #007AFF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }

          .add-tag-input button:hover {
            background: #0066DD;
          }

          .custom-tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }

          .custom-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #FF950015, #FF950008);
            border: 1px solid #FF950030;
            border-radius: 6px;
            font-size: 13px;
            color: #CC7700;
          }

          .custom-tag button {
            background: none;
            border: none;
            color: #CC7700;
            cursor: pointer;
            font-size: 14px;
            padding: 0 2px;
          }

          /* 参数滑块 */
          .params-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .param-item {
            background: #F5F5F7;
            padding: 20px;
            border-radius: 12px;
          }

          .param-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .param-name {
            font-size: 15px;
            font-weight: 600;
            color: #1D1D1F;
          }

          .param-value {
            font-size: 20px;
            font-weight: 700;
            color: #007AFF;
          }

          .param-slider {
            width: 100%;
            height: 6px;
            -webkit-appearance: none;
            appearance: none;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          }

          .param-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 22px;
            height: 22px;
            background: #007AFF;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
            transition: transform 0.15s;
          }

          .param-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }

          .param-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 12px;
            color: #86868B;
          }

          /* 预设按钮 */
          .presets-section {
            margin-top: 24px;
          }

          .presets-section h4 {
            font-size: 15px;
            font-weight: 600;
            color: #1D1D1F;
            margin: 0 0 12px 0;
          }

          .presets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
          }

          .preset-btn {
            padding: 12px 16px;
            border: 1.5px solid rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            background: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .preset-btn:hover {
            border-color: #007AFF;
            background: rgba(0, 122, 255, 0.04);
          }

          /* Prompt编辑器 */
          .prompt-editor {
            width: 100%;
            padding: 16px;
            border: 1.5px solid rgba(0, 0, 0, 0.12);
            border-radius: 12px;
            font-size: 14px;
            font-family: 'SF Mono', Monaco, Consolas, monospace;
            line-height: 1.6;
            color: #1D1D1F;
            background: #FAFAFA;
            resize: vertical;
            outline: none;
          }

          .prompt-editor:focus {
            border-color: #007AFF;
            box-shadow: 0 0 0 3px #007AFF15;
          }

          /* 示例对话列表 */
          .examples-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .example-item {
            background: #F5F5F7;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.06);
          }

          .example-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #1D1D1F;
          }

          .remove-example-btn {
            background: none;
            border: none;
            color: #FF3B30;
            font-size: 13px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
          }

          .remove-example-btn:hover {
            background: rgba(255, 59, 48, 0.1);
          }

          .example-field {
            margin-bottom: 12px;
          }

          .example-field:last-child {
            margin-bottom: 0;
          }

          .example-field label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #1D1D1F;
            margin-bottom: 6px;
          }

          .example-field textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            font-size: 14px;
            resize: vertical;
            outline: none;
            font-family: inherit;
          }

          .example-field textarea:focus {
            border-color: #007AFF;
          }

          .add-example-btn {
            width: 100%;
            padding: 12px;
            border: 2px dashed rgba(0, 0, 0, 0.15);
            border-radius: 10px;
            background: transparent;
            color: #007AFF;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 12px;
          }

          .add-example-btn:hover {
            border-color: #007AFF;
            background: rgba(0, 122, 255, 0.04);
          }

          /* 选项开关 */
          .options-section {
            margin-top: 24px;
          }

          .option-item {
            padding: 16px;
            background: #F5F5F7;
            border-radius: 10px;
            margin-bottom: 12px;
          }

          .toggle-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
          }

          .toggle-label span {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .toggle-label strong {
            font-size: 15px;
            color: #1D1D1F;
          }

          .toggle-label small {
            font-size: 12px;
            color: #86868B;
          }

          .toggle-switch {
            position: relative;
            width: 50px;
            height: 28px;
          }

          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #E5E5EA;
            border-radius: 28px;
            transition: 0.3s;
          }

          .toggle-slider::before {
            content: '';
            position: absolute;
            width: 22px;
            height: 22px;
            left: 3px;
            bottom: 3px;
            background: white;
            border-radius: 50%;
            transition: 0.3s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          }

          .toggle-switch input:checked + .toggle-slider {
            background: #34C759;
          }

          .toggle-switch input:checked + .toggle-slider::before {
            transform: translateX(22px);
          }

          /* 底部操作栏 */
          .modal-footer {
            padding: 20px 28px;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #FAFAFA;
          }

          .footer-left,
          .footer-right {
            flex: 1;
          }

          .footer-left {
            display: flex;
            justify-content: flex-start;
          }

          .footer-right {
            display: flex;
            justify-content: flex-end;
          }

          .footer-center {
            display: flex;
            gap: 10px;
          }

          .btn-primary,
          .btn-secondary,
          .btn-ghost {
            padding: 11px 24px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary {
            background: #007AFF;
            color: white;
          }

          .btn-primary:hover {
            background: #0066DD;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
          }

          .btn-secondary {
            background: rgba(0, 0, 0, 0.05);
            color: #1D1D1F;
          }

          .btn-secondary:hover {
            background: rgba(0, 0, 0, 0.1);
          }

          .btn-ghost {
            background: transparent;
            color: #86868B;
            padding: 11px 20px;
          }

          .btn-ghost:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #1D1D1F;
          }

          /* 响应式适配 */
          @media (max-width: 768px) {
            .modal-container {
              max-height: 95vh;
              border-radius: 16px;
            }

            .modal-body {
              padding: 20px;
            }

            .steps-nav {
              overflow-x: auto;
              padding: 12px 20px;
            }

            .step-btn {
              padding: 10px 12px;
              font-size: 13px;
              white-space: nowrap;
            }

            .form-row {
              flex-direction: column;
              gap: 0;
            }

            .type-grid {
              grid-template-columns: repeat(3, 1fr);
            }

            .modal-footer {
              flex-direction: column;
              gap: 12px;
            }

            .footer-left,
            .footer-center,
            .footer-right {
              flex: none;
              width: 100%;
              justify-content: center;
            }

            .footer-center {
              order: -1;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CreateEditModal;
