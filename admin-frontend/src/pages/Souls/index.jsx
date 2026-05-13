/**
 * ============================================
 * Soul角色管理页面 - Souls/index.jsx
 * ============================================
 */

import React from 'react'
import { Plus, Search, Sparkles, Edit, Trash2, Copy } from 'lucide-react'

export default function Souls() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Soul 角色管理</h1>
          <p className="text-sm text-text-secondary mt-1">管理AI辩论角色的配置和参数</p>
        </div>
        <button className="btn btn-primary"><Plus className="w-4 h-4" /> 创建角色</button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: '总角色数', value: '24', color: 'from-primary to-secondary' },
          { label: '活跃角色', value: '18', color: 'from-success to-success-light' },
          { label: '使用次数', value: '12.5K', color: 'from-warning to-warning-dark' },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
            <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
          </div>
        ))}
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input type="text" placeholder="搜索角色名称、描述..." className="input pl-12" />
        </div>
      </div>

      {/* 角色卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { name: '哲学家', desc: '擅长逻辑推理和深度思考，以苏格拉底式提问引导讨论', tags: ['逻辑', '批判性思维'], color: 'from-blue-500 to-indigo-600' },
          { name: '科学家', desc: '基于证据和数据分析，注重事实和可验证性', tags: ['数据驱动', '实证主义'], color: 'from-emerald-500 to-teal-600' },
          { name: '艺术家', desc: '从美学和情感角度切入，强调创造力和直觉', tags: ['创意', '感性'], color: 'from-pink-500 to-rose-600' },
          { name: '经济学家', desc: '从成本效益和资源配置角度分析问题', tags: ['效率', '理性选择'], color: 'from-amber-500 to-orange-600' },
          { name: '法学家', desc: '关注规则、权利和义务的平衡', tags: ['正义', '程序'], color: 'from-violet-500 to-purple-600' },
          { name: '环保主义者', desc: '从可持续发展和生态保护角度思考问题', tags: ['绿色', '长期主义'], color: 'from-green-500 to-lime-600' },
        ].map((soul, i) => (
          <div key={i} className="card p-0 overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
            {/* 头部渐变背景 */}
            <div className={`h-24 bg-gradient-to-br ${soul.color} relative`}>
              <div className="absolute inset-0 bg-black/10" />
              <Sparkles className="absolute top-4 right-4 w-8 h-8 text-white/80" />
              <div className="absolute bottom-4 left-5">
                <h3 className="text-xl font-bold text-white">{soul.name}</h3>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-secondary line-clamp-2">{soul.desc}</p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2">
                {soul.tags.map((tag) => (
                  <span key={tag} className="badge badge-primary">{tag}</span>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2 border-t border-border-light">
                <button className="flex-1 btn btn-ghost btn-sm" title="编辑">
                  <Edit className="w-3.5 h-3.5" /> 编辑
                </button>
                <button className="flex-1 btn btn-ghost btn-sm" title="复制">
                  <Copy className="w-3.5 h-3.5" /> 复制
                </button>
                <button className="flex-1 btn btn-ghost btn-sm text-danger hover:bg-danger-bg" title="删除">
                  <Trash2 className="w-3.5 h-3.5" /> 删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
