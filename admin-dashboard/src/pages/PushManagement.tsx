/**
 * PushManagement - 推送管理页面
 *
 * 功能：
 * 1. 推送活动列表（分页、搜索、状态筛选）
 * 2. 创建/编辑推送活动（标题、内容、发送时间、分类）
 * 3. 推送频率限制设置（日/周/月上限）
 * 4. 删除推送活动
 * 5. 操作状态预览
 */

import React, { useState, useEffect, useCallback } from 'react';
import pushApi, { PushCampaign, PushLimits, PaginationInfo } from '../services/pushService';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  scheduled: { label: '已调度', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  sent: { label: '已发送', color: 'bg-green-100 text-green-700 border-green-300' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 border-red-300' },
};

const CATEGORY_OPTIONS = ['科技', '社会', '经济', '教育', '文化', '生活', '娱乐', '环境', '全部'];

const defaultForm = { title: '', content: '', sendAt: '', status: 'draft', category: '' };
const defaultLimits: PushLimits = { daily: 3, weekly: 15, monthly: 60 };

const PushManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showLimits, setShowLimits] = useState(false);
  const [limits, setLimits] = useState<PushLimits>(defaultLimits);
  const [limitsDirty, setLimitsDirty] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await pushApi.list({ page, pageSize: 20, status: statusFilter, search });
      if (result.success && result.data) {
        setCampaigns(result.data.items);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || '获取推送列表失败');
      }
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCampaigns(1);
  }, [fetchCampaigns]);

  useEffect(() => {
    if (showLimits) {
      pushApi.getLimits().then(result => {
        if (result.success && result.data) setLimits(result.data);
      });
    }
  }, [showLimits]);

  const handleSave = async () => {
    if (!form.title.trim()) { alert('请输入推送标题'); return; }
    if (!form.sendAt) { alert('请选择发送时间'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await pushApi.update(editingId, form as Partial<PushCampaign>);
      } else {
        await pushApi.create(form);
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditingId(null);
      fetchCampaigns(pagination.page);
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: PushCampaign) => {
    setForm({
      title: c.title,
      content: c.content || '',
      sendAt: c.sendAt ? c.sendAt.slice(0, 16) : '',
      status: c.status as 'draft' | 'scheduled' | 'sent' | 'cancelled',
      category: c.category || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await pushApi.delete(id);
      setDeleteConfirm(null);
      fetchCampaigns(pagination.page);
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleSaveLimits = async () => {
    try {
      const result = await pushApi.updateLimits(limits);
      if (result.success) {
        setLimitsDirty(false);
        setShowLimits(false);
        alert('推送限额已更新');
      } else {
        alert(result.error || '保存失败');
      }
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">推送管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理每日精选话题推送活动</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLimits(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            推送限额设置
          </button>
          <button
            onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + 新建推送
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="搜索推送标题..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="scheduled">已调度</option>
          <option value="sent">已发送</option>
          <option value="cancelled">已取消</option>
        </select>
        <span className="text-sm text-gray-500">共 {pagination.total} 条</span>
      </div>

      {/* 错误提示 */}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* 推送列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>暂无推送活动</p>
            <button onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }} className="mt-3 text-blue-600 hover:underline text-sm">创建第一条推送</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发送时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(c => {
                const st = STATUS_MAP[c.status] || STATUS_MAP.draft;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{c.title}</p>
                      {c.content && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{c.content}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(c.sendAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">编辑</button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="text-red-500 hover:text-red-700 text-sm">删除</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">第 {pagination.page}/{pagination.totalPages} 页</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchCampaigns(pagination.page - 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                上一页
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCampaigns(pagination.page + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====== 新建/编辑推送 Modal ====== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? '编辑推送' : '新建推送'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">推送标题 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入推送标题（如：今日精选话题）"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">推送内容</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入推送正文内容"
                  rows={3}
                  maxLength={500}
                />
                <span className="text-xs text-gray-400">{form.content.length}/500</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">发送时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.sendAt}
                    onChange={e => setForm(p => ({ ...p, sendAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">话题分类</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">全部</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="draft">草稿（暂不推送）</option>
                  <option value="scheduled">已调度（到时自动推送）</option>
                </select>
              </div>

              {/* 状态预览 */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">通知预览</p>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{form.title || '今日精选话题'}</p>
                  {form.content && <p className="text-xs text-gray-500 mt-1">{form.content}</p>}
                  {form.sendAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      发送时间: {new Date(form.sendAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : (editingId ? '保存修改' : '创建推送')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== 推送限额设置 Modal ====== */}
      {showLimits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowLimits(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">推送频率限制</h2>
              <button onClick={() => setShowLimits(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-500">设置推送频率上限，防止过度推送影响用户体验</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">每日上限</label>
                <input
                  type="number"
                  value={limits.daily}
                  min={1}
                  onChange={e => { setLimits(p => ({ ...p, daily: parseInt(e.target.value) || 1 })); setLimitsDirty(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">每天最多推送 {limits.daily} 条</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">每周上限</label>
                <input
                  type="number"
                  value={limits.weekly}
                  min={1}
                  onChange={e => { setLimits(p => ({ ...p, weekly: parseInt(e.target.value) || 1 })); setLimitsDirty(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">每周最多推送 {limits.weekly} 条</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">每月上限</label>
                <input
                  type="number"
                  value={limits.monthly}
                  min={1}
                  onChange={e => { setLimits(p => ({ ...p, monthly: parseInt(e.target.value) || 1 })); setLimitsDirty(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">每月最多推送 {limits.monthly} 条</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowLimits(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button
                onClick={handleSaveLimits}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                保存限额
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== 删除确认 Modal ====== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm text-gray-500 mb-4">删除后无法恢复，确定要删除此推送活动吗？</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">确认删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PushManagement;
