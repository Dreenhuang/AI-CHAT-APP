/**
 * SoulsManagement - Soul角色管理主页面
 * 
 * Apple设计风格的企业级AI辩论角色管理系统
 * 完整的CRUD功能 + 双视图模式 + 高级筛选 + 批量操作
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Soul, SoulFormData, ViewMode, SoulFilterParams } from './types';
import { mockSouls } from './data';
import SoulCard from './components/SoulCard';
import SearchBar from './components/SearchBar';
import CreateEditModal from './components/CreateEditModal';
import SoulDetailDrawer from './components/SoulDetailDrawer';

const SoulsManagement: React.FC = () => {
  /** 角色数据 */
  const [souls, setSouls] = useState<Soul[]>(mockSouls);
  
  /** UI状态 */
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSoul, setEditingSoul] = useState<Soul | null>(null);
  const [detailSoul, setDetailSoul] = useState<Soul | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  /** 筛选状态 */
  const [filter, setFilter] = useState<SoulFilterParams>({
    keyword: '',
    type: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 12,
  });

  /** 加载状态 */
  const [isLoading, setIsLoading] = useState(false);

  /** 筛选和排序后的角色列表 */
  const filteredSouls = useMemo(() => {
    let result = [...souls];

    // 关键词搜索
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      result = result.filter(soul =>
        soul.name.toLowerCase().includes(keyword) ||
        soul.nameEn.toLowerCase().includes(keyword) ||
        soul.description.toLowerCase().includes(keyword)
      );
    }

    // 类型筛选
    if (filter.type && filter.type !== 'all') {
      result = result.filter(soul => soul.type === filter.type);
    }

    // 状态筛选
    if (filter.status && filter.status !== 'all') {
      result = result.filter(soul => soul.status === filter.status);
    }

    // 排序
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filter.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'usage':
          comparison = a.usageStats.totalCalls - b.usageStats.totalCalls;
          break;
        case 'rating':
          comparison = a.usageStats.avgRating - b.usageStats.avgRating;
          break;
        default:
          comparison = 0;
      }
      
      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [souls, filter]);

  /** 分页后的数据 */
  const paginatedSouls = useMemo(() => {
    const start = (filter.page - 1) * filter.pageSize;
    const end = start + filter.pageSize;
    return filteredSouls.slice(start, end);
  }, [filteredSouls, filter.page, filter.pageSize]);

  /** 总页数 */
  const totalPages = Math.ceil(filteredSouls.length / filter.pageSize);

  /** ===== 操作处理函数 ===== */

  /** 打开创建模态框 */
  const handleOpenCreate = () => {
    setEditingSoul(null);
    setIsCreateModalOpen(true);
  };

  /** 打开编辑模态框 */
  const handleEdit = (soul: Soul) => {
    setEditingSoul(soul);
    setIsCreateModalOpen(true);
  };

  /** 提交表单（创建/编辑） */
  const handleSubmitForm = (formData: SoulFormData) => {
    if (editingSoul) {
      // 编辑现有角色
      setSouls(prev => prev.map(s =>
        s.id === editingSoul.id
          ? {
              ...s,
              ...formData,
              avatar: typeof formData.avatar === 'string' ? formData.avatar : s.avatar,
              updatedAt: new Date().toISOString(),
              version: s.version + 1,
            }
          : s
      ));
    } else {
      // 创建新角色
      const newSoul: Soul = {
        id: `soul_${Date.now()}`,
        ...formData,
        avatar: typeof formData.avatar === 'string' 
          ? formData.avatar 
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.name}`,
        usageStats: {
          totalCalls: 0,
          avgRating: 0,
          approvalRate: 0,
          avgDialogueRounds: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      setSouls(prev => [newSoul, ...prev]);
    }
    
    setIsCreateModalOpen(false);
    setEditingSoul(null);
  };

  /** 切换角色状态 */
  const handleToggleStatus = (id: string, status: 'active' | 'inactive') => {
    setSouls(prev => prev.map(s =>
      s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s
    ));
  };

  /** 查看详情 */
  const handleViewDetail = (soul: Soul) => {
    setDetailSoul(soul);
  };

  /** 复制角色 */
  const handleDuplicate = (soul: Soul) => {
    const duplicated: Soul = {
      ...soul,
      id: `soul_${Date.now()}`,
      name: `${soul.name} (副本)`,
      nameEn: `${soul.nameEn} (Copy)`,
      status: 'inactive' as const,
      isABTest: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      usageStats: {
        totalCalls: 0,
        avgRating: 0,
        approvalRate: 0,
        avgDialogueRounds: 0,
      },
    };
    setSouls(prev => [duplicated, ...prev]);
  };

  /** 删除角色 */
  const handleDelete = (soul: Soul) => {
    if (window.confirm(`确定要删除角色"${soul.name}"吗？此操作不可恢复。`)) {
      setSouls(prev => prev.filter(s => s.id !== soul.id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(soul.id);
        return newSet;
      });
    }
  };

  /** 选择/取消选择角色 */
  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  /** 全选/取消全选 */
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedSouls.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSouls.map(s => s.id)));
    }
  };

  /** 批量操作 */
  const handleBatchAction = (action: 'enable' | 'disable' | 'export' | 'delete') => {
    switch (action) {
      case 'enable':
        setSouls(prev => prev.map(s =>
          selectedIds.has(s.id) ? { ...s, status: 'active' as const } : s
        ));
        alert(`已启用 ${selectedIds.size} 个角色`);
        break;
        
      case 'disable':
        setSouls(prev => prev.map(s =>
          selectedIds.has(s.id) ? { ...s, status: 'inactive' as const } : s
        ));
        alert(`已停用 ${selectedIds.size} 个角色`);
        break;
        
      case 'export': {
        const exportData = souls.filter(s => selectedIds.has(s.id));
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `souls_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert(`已导出 ${exportData.length} 个角色配置`);
        break;
      }
        
      case 'delete':
        if (window.confirm(`确定要删除选中的 ${selectedIds.size} 个角色吗？`)) {
          setSouls(prev => prev.filter(s => !selectedIds.has(s.id)));
          setSelectedIds(new Set());
        }
        break;
    }
  };

  /** 测试对话 */
  const handleTestDialogue = (soul: Soul) => {
    alert(`启动与 "${soul.name}" 的对话测试...\n\n注意：完整测试功能需要连接AI后端服务`);
  };

  /** 页面变化 */
  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  /** 渲染卡片视图 */
  const renderCardView = () => (
    <div className="cards-grid">
      {/* 创建新角色卡片 */}
      <div className="add-card" onClick={handleOpenCreate}>
        <div className="add-icon">➕</div>
        <h3>创建新角色</h3>
        <p>点击添加新的AI辩论角色</p>
      </div>

      {paginatedSouls.map(soul => (
        <SoulCard
          key={soul.id}
          soul={soul}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onViewDetail={handleViewDetail}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          isSelected={selectedIds.has(soul.id)}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );

  /** 渲染列表视图 */
  const renderListView = () => (
    <div className="table-container">
      <table className="souls-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={selectedIds.size === paginatedSouls.length && paginatedSouls.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            <th>角色</th>
            <th>类型</th>
            <th>状态</th>
            <th>使用次数</th>
            <th>评分</th>
            <th>好评率</th>
            <th>A/B测试</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSouls.map(soul => (
            <tr key={soul.id} className={selectedIds.has(soul.id) ? 'selected' : ''}>
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedIds.has(soul.id)}
                  onChange={(e) => handleSelect(soul.id, e.target.checked)}
                />
              </td>
              <td>
                <div className="table-soul-info">
                  <img src={soul.avatar} alt={soul.name} className="table-avatar" />
                  <div>
                    <strong>{soul.name}</strong>
                    <small>{soul.nameEn}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className={`type-badge-table ${soul.type}`}>
                  {soul.type === 'debate' && '⚔️ 辩论型'}
                  {soul.type === 'analysis' && '🔬 分析型'}
                  {soul.type === 'speculation' && '🎓 思辨型'}
                  {soul.type === 'creative' && '🎨 创意型'}
                  {soul.type === 'business' && '💼 商业型'}
                  {soul.type === 'academic' && '📚 学术型'}
                  {soul.type === 'other' && '✨ 其他'}
                </span>
              </td>
              <td>
                <span className={`status-badge-table ${soul.status}`}>
                  {soul.status === 'active' ? '✅ 启用' : '⏸ 停用'}
                </span>
              </td>
              <td>{(soul.usageStats.totalCalls / 1000).toFixed(1)}k</td>
              <td>
                <span className="rating-value">⭐ {soul.usageStats.avgRating.toFixed(1)}</span>
              </td>
              <td>{soul.usageStats.approvalRate}%</td>
              <td>{soul.isABTest ? '🧪 是' : '-'}</td>
              <td>{new Date(soul.updatedAt).toLocaleDateString('zh-CN')}</td>
              <td>
                <div className="table-actions">
                  <button onClick={() => handleViewDetail(soul)} title="查看详情">👁️</button>
                  <button onClick={() => handleEdit(soul)} title="编辑">✏️</button>
                  <button onClick={() => handleToggleStatus(soul.id, soul.status === 'active' ? 'inactive' : 'active')} title="切换状态">
                    {soul.status === 'active' ? '⏸' : '▶️'}
                  </button>
                  <button onClick={() => handleDuplicate(soul)} title="复制">📋</button>
                  <button onClick={() => handleDelete(soul)} title="删除" className="danger">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="souls-management-page">
      {/* 页面头部 */}
      <header className="page-header">
        <div className="header-left">
          <h1>Soul角色管理</h1>
          <p className="header-desc">
            管理和配置AI辩论角色 · 共 {souls.length} 个角色 · {souls.filter(s => s.status === 'active').length} 个已启用
          </p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={handleOpenCreate}>
            <span>+ 创建角色</span>
          </button>
        </div>
      </header>

      {/* 搜索筛选栏 */}
      <SearchBar
        filter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalResults={filteredSouls.length}
        selectedCount={selectedIds.size}
        onBatchAction={handleBatchAction}
      />

      {/* 主内容区域 */}
      <main className="page-content">
        {filteredSouls.length > 0 ? (
          <>
            {viewMode === 'card' ? renderCardView() : renderListView()}
            
            {/* 分页器 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={filter.page <= 1}
                  onClick={() => handlePageChange(filter.page - 1)}
                >
                  ← 上一页
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-num ${filter.page === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  className="page-btn"
                  disabled={filter.page >= totalPages}
                  onClick={() => handlePageChange(filter.page + 1)}
                >
                  下一页 →
                </button>
                
                <span className="page-info">
                  第 {filter.page}/{totalPages} 页，共 {filteredSouls.length} 条
                </span>
              </div>
            )}
          </>
        ) : (
          /* 空状态 */
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>没有找到匹配的角色</h3>
            <p>尝试调整搜索关键词或筛选条件</p>
            <button className="btn-secondary" onClick={() => setFilter({
              keyword: '',
              type: 'all',
              status: 'all',
              sortBy: 'createdAt',
              sortOrder: 'desc',
              page: 1,
              pageSize: 12,
            })}>
              清除所有筛选
            </button>
          </div>
        )}
      </main>

      {/* 创建/编辑模态框 */}
      <CreateEditModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingSoul(null);
        }}
        onSubmit={handleSubmitForm}
        editData={editingSoul}
      />

      {/* 详情抽屉 */}
      <SoulDetailDrawer
        soul={detailSoul}
        isOpen={!!detailSoul}
        onClose={() => setDetailSoul(null)}
        onEdit={handleEdit}
        onTestDialogue={handleTestDialogue}
      />

      <style jsx global>{`
        .souls-management-page {
          min-height: 100vh;
          background: linear-gradient(to bottom, #F5F5F7, #FFFFFF);
          padding: 32px;
          max-width: 1440px;
          margin: 0 auto;
        }

        /* 页面头部 */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }

        .header-left h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1D1D1F;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .header-desc {
          font-size: 15px;
          color: #86868B;
          margin: 0;
        }

        .btn-primary {
          padding: 12px 24px;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }

        .btn-primary:hover {
          background: #0066DD;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
        }

        .btn-secondary {
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.05);
          color: #1D1D1F;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        /* 主内容区 */
        .page-content {
          animation: contentFadeIn 0.3s ease-out;
        }

        @keyframes contentFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 卡片网格 */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        /* 添加新角色卡片 */
        .add-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border: 2px dashed rgba(0, 122, 255, 0.25);
          border-radius: 16px;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 400px;
        }

        .add-card:hover {
          border-color: #007AFF;
          background: rgba(0, 122, 255, 0.04);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.15);
        }

        .add-icon {
          font-size: 48px;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #007AFF15, #007AFF08);
          border-radius: 50%;
        }

        .add-card h3 {
          font-size: 18px;
          font-weight: 600;
          color: #007AFF;
          margin: 0;
        }

        .add-card p {
          font-size: 14px;
          color: #86868B;
          margin: 0;
        }

        /* 表格视图 */
        .table-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .souls-table {
          width: 100%;
          border-collapse: collapse;
        }

        .souls-table thead {
          background: linear-gradient(to bottom, #FAFAFA, #F5F5F7);
          border-bottom: 2px solid rgba(0, 0, 0, 0.08);
        }

        .souls-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #86868B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .souls-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          font-size: 14px;
          color: #1D1D1F;
        }

        .souls-table tbody tr {
          transition: background 0.15s;
        }

        .souls-table tbody tr:hover {
          background: rgba(0, 122, 255, 0.03);
        }

        .souls-table tbody tr.selected {
          background: rgba(0, 122, 255, 0.08);
        }

        .checkbox-col {
          width: 40px;
          text-align: center;
        }

        .checkbox-col input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #007AFF;
        }

        .table-soul-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .table-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .table-soul-info strong {
          display: block;
          font-size: 14px;
          color: #1D1D1F;
        }

        .table-soul-info small {
          font-size: 12px;
          color: #86868B;
        }

        .type-badge-table {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .type-badge-table.debate { background: #FF6B6B15; color: #E55555; }
        .type-badge-table.analysis { background: #4ECDC415; color: #3BA99C; }
        .type-badge-table.speculation { background: #95E1D315; color: #6DB89E; }
        .type-badge-table.creative { background: #DDA0DD15; color: #B87BB8; }
        .type-badge-table.business { background: #F7DC6F30; color: #9A7D0A; }
        .type-badge-table.academic { background: #85C1E915; color: #5499C7; }
        .type-badge-table.other { background: #D5DBDB30; color: #839192; }

        .status-badge-table {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge-table.active {
          background: #34C75915;
          color: #248A3D;
        }

        .status-badge-table.inactive {
          background: #86868B15;
          color: #636366;
        }

        .rating-value {
          font-weight: 600;
        }

        .table-actions {
          display: flex;
          gap: 4px;
        }

        .table-actions button {
          padding: 6px 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          font-size: 16px;
          transition: all 0.15s;
        }

        .table-actions button:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .table-actions button.danger:hover {
          background: rgba(255, 59, 48, 0.1);
        }

        /* 分页器 */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 32px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .page-btn {
          padding: 10px 18px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          border-color: #007AFF;
          color: #007AFF;
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 6px;
        }

        .page-num {
          width: 38px;
          height: 38px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #1D1D1F;
        }

        .page-num:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .page-num.active {
          background: #007AFF;
          color: white;
        }

        .page-info {
          font-size: 13px;
          color: #86868B;
          margin-left: 16px;
        }

        /* 空状态 */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 22px;
          font-weight: 600;
          color: #1D1D1F;
          margin: 0 0 10px 0;
        }

        .empty-state p {
          font-size: 15px;
          color: #86868B;
          margin: 0 0 24px 0;
        }

        /* 响应式适配 */
        @media (max-width: 1200px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
          
          .souls-management-page {
            padding: 24px;
          }
        }

        @media (max-width: 1024px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          }
          
          .page-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .table-container {
            overflow-x: auto;
          }
          
          .souls-table {
            min-width: 900px;
          }
        }

        @media (max-width: 768px) {
          .souls-management-page {
            padding: 16px;
          }
          
          .header-left h1 {
            font-size: 26px;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .pagination {
            flex-wrap: wrap;
          }
          
          .page-info {
            width: 100%;
            text-align: center;
            margin-left: 0;
            margin-top: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SoulsManagement;
