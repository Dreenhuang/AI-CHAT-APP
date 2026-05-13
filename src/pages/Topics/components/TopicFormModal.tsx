/**
 * 议题管理 - 新建/编辑模态框组件
 *
 * Apple Design Style Modal
 * 支持表单验证、图片上传预览、标签多选
 * 包含完整的错误提示和加载状态
 */

import React, { useState, useEffect, useRef } from 'react';
import { TopicFormData, TopicItem, TopicType, TopicStatus } from '../types';
import {
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  TAG_OPTIONS,
  VALIDATION_RULES,
  SPACING,
  RADIUS,
  SHADOWS,
  ANIMATION,
} from '../constants';

// ============ 类型定义 ============

interface TopicFormModalProps {
  /** 模式：新建或编辑 */
  mode: 'create' | 'edit';
  /** 编辑时的原始数据 */
  editingItem?: TopicItem | null;
  /** 是否可见 */
  visible: boolean;
  /** 保存回调 */
  onSave: (data: TopicFormData) => Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
}

// ============ 类型定义 ============

interface FormErrors {
  title?: string;
  description?: string;
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center',
    zIndex: 1000,
    padding: SPACING.md,
    animation: 'fadeIn 0.2s ease',
  },
  
  // 模态框
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.modal,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: 'hidden',
  },
  
  // 头部
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: `${SPACING.lg}px ${SPACING.xl}px`,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
  },
  closeButton: {
    width: 28,
    height: 28,
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
  
  // 内容区
  body: {
    padding: `${SPACING.xl}px`,
    overflowY: 'auto' as const,
    flex: 1,
  },
  
  // 表单组
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    display: 'block' as const,
    fontSize: 13,
    fontWeight: 600,
    color: '#1d1d1f',
    marginBottom: SPACING.sm,
  },
  requiredMark: {
    color: '#ff3b30',
    marginLeft: 2,
  },
  
  // 输入框
  input: {
    width: '100%',
    height: 42,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
    border: '1px solid #d2d2d7',
    borderRadius: RADIUS.md,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  textarea: {
    minHeight: 100,
    paddingTop: SPACING.md,
    resize: 'vertical' as const,
    lineHeight: 1.5,
  },
  
  // 错误提示
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
    marginLeft: 2,
  },
  
  // 下拉选择
  select: {
    width: '100%',
    height: 42,
    paddingLeft: SPACING.md,
    paddingRight: 32,
    border: '1px solid #d2d2d7',
    borderRadius: RADIUS.md,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 14px center',
  },
  
  // 标签选择
  tagsContainer: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: SPACING.xs,
  },
  tagButton: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid #d2d2d7',
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tagButtonActive: {
    backgroundColor: '#0071e3',
    borderColor: '#0071e3',
    color: '#ffffff',
  },
  addTagInput: {
    height: 34,
    padding: `0 ${SPACING.sm}px`,
    border: '1px dashed #d2d2d7',
    borderRadius: 20,
    fontSize: 13,
    color: '#1d1d1f',
    backgroundColor: '#fafafa',
    outline: 'none',
    minWidth: 80,
  },
  
  // 图片上传
  uploadArea: {
    border: '2px dashed #d2d2d7',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  uploadAreaHover: {
    borderColor: '#0071e3',
    backgroundColor: 'rgba(0, 113, 227, 0.03)',
  },
  uploadIcon: {
    width: 48,
    height: 48,
    margin: `0 auto ${SPACING.sm}px`,
    color: '#c7c7cc',
  },
  uploadText: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#aeaeb2',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: 200,
    borderRadius: RADIUS.md,
    objectFit: 'cover' as const,
  },
  removeImageBtn: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // 底部按钮
  footer: {
    display: 'flex' as const,
    justifyContent: 'flex-end' as const,
    gap: SPACING.sm,
    padding: `${SPACING.md}px ${SPACING.xl}px`,
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: '#fafafa',
  },
  button: {
    height: 40,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  saveButton: {
    backgroundColor: '#0071e3',
    color: '#ffffff',
  },
  saveButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as const,
  },
};

// ============ 主组件 ============

/**
 * 新建/编辑模态框
 */
const TopicFormModal: React.FC<TopicFormModalProps> = ({
  mode,
  editingItem,
  visible,
  onSave,
  onCancel,
}) => {
  // ========== 状态 ==========
  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    description: '',
    type: 'debate',
    status: 'pending',
    tags: [],
    coverImage: undefined,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== 初始化表单数据 ==========
  useEffect(() => {
    if (visible && mode === 'edit' && editingItem) {
      setFormData({
        title: editingItem.title || '',
        description: editingItem.description || '',
        type: editingItem.type || 'debate',
        status: editingItem.status || 'pending',
        tags: editingItem.tags || [],
        coverImage: editingItem.coverImage,
      });
    } else if (visible && mode === 'create') {
      setFormData({
        title: '',
        description: '',
        type: 'debate',
        status: 'active',
        tags: [],
        coverImage: undefined,
      });
    }
    setErrors({});
    setNewTag('');
  }, [visible, mode, editingItem]);

  // ========== 验证逻辑 ==========
  
  /**
   * 验证表单
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    // 标题验证
    if (!formData.title.trim()) {
      newErrors.title = VALIDATION_RULES.title.message.required;
    } else if (formData.title.length < VALIDATION_RULES.title.minLength) {
      newErrors.title = VALIDATION_RULES.title.message.minLength;
    } else if (formData.title.length > VALIDATION_RULES.title.maxLength) {
      newErrors.title = VALIDATION_RULES.title.message.maxLength;
    }

    // 描述验证
    if (formData.description && formData.description.length > VALIDATION_RULES.description.maxLength) {
      newErrors.description = VALIDATION_RULES.description.message.maxLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== 处理函数 ==========
  
  /** 更新表单字段 */
  const updateField = <K extends keyof TopicFormData>(
    field: K,
    value: TopicFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /** 切换标签选中状态 */
  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  /** 添加自定义标签 */
  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmed],
      }));
    }
    setNewTag('');
  };

  /** 图片处理 */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('coverImage', file);
    }
  };

  /** 移除图片 */
  const removeImage = () => {
    updateField('coverImage', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /** 获取图片预览 URL */
  const getImagePreviewUrl = (): string | null => {
    if (!formData.coverImage) return null;
    if (typeof formData.coverImage === 'string') return formData.coverImage;
    return URL.createObjectURL(formData.coverImage);
  };

  /** 提交保存 */
  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('[TopicFormModal] Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // ========== 渲染 ==========
  
  if (!visible) return null;

  const isEdit = mode === 'edit';
  const imageUrl = getImagePreviewUrl();
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div style={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) onCancel();
    }}>
      <div style={styles.modal}>
        {/* 头部 */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isEdit ? '编辑议题' : '新建议题'}
          </h2>
          <button
            onClick={onCancel}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单内容 */}
        <div style={styles.body}>
          {/* 标题 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              标题
              <span style={styles.requiredMark}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="请输入议题标题"
              style={{
                ...styles.input,
                ...(errors.title ? styles.inputError : {}),
              }}
              autoFocus
            />
            {errors.title && <div style={styles.errorText}>{errors.title}</div>}
          </div>

          {/* 描述 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="请输入详细描述..."
              style={{ ...styles.input, ...styles.textarea }}
              maxLength={500}
            />
            {formData.description && (
              <div style={{ ...styles.errorText, color: '#86868b' }}>
                {formData.description.length}/500
              </div>
            )}
            {errors.description && <div style={styles.errorText}>{errors.description}</div>}
          </div>

          {/* 类型和状态 - 并排 */}
          <div style={{ display: 'flex', gap: SPACING.lg }}>
            {/* 类型 */}
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>
                类型
                <span style={styles.requiredMark}>*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value as TopicType)}
                style={styles.select}
              >
                {TYPE_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 状态 */}
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>状态</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as TopicStatus)}
                style={styles.select}
              >
                {STATUS_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 标签 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>标签（可多选）</label>
            <div style={styles.tagsContainer}>
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    ...styles.tagButton,
                    ...(formData.tags.includes(tag) ? styles.tagButtonActive : {}),
                  }}
                >
                  {tag}
                </button>
              ))}
              
              {/* 自定义标签输入 */}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="+ 自定义"
                style={styles.addTagInput}
              />
            </div>
          </div>

          {/* 封面图片 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>封面图片</label>
            
            {imageUrl ? (
              <div style={{ ...styles.uploadArea, padding: 0, borderStyle: 'solid', borderColor: '#e5e5ea' }}>
                <img src={imageUrl} alt="预览" style={styles.imagePreview} />
                <button
                  onClick={removeImage}
                  style={styles.removeImageBtn}
                >
                  x
                </button>
              </div>
            ) : (
              <div
                style={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0071e3';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 113, 227, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d2d2d7';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg style={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div style={styles.uploadText}>点击上传图片或拖拽到此处</div>
                <div style={styles.uploadHint}>支持 JPG、PNG 格式，建议尺寸 1200x600</div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={styles.footer}>
          <button
            onClick={onCancel}
            style={{ ...styles.button, ...styles.cancelButton }}
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || hasErrors}
            style={{
              ...styles.button,
              ...styles.saveButton,
              ...(saving || hasErrors ? styles.saveButtonDisabled : {}),
            }}
          >
            {saving ? (
              <>
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                保存中...
              </>
            ) : isEdit ? '保存修改' : '创建议题'}
          </button>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.98); 
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1); 
          }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TopicFormModal;
