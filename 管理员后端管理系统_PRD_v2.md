# PRD辩论APP - 管理员后端管理系统 PRD v2.0（优化版）

**文档版本**: v2.0 (优化重构版)  
**创建日期**: 2026-05-13  
**更新日期**: 2026-05-13  
**项目名称**: PRD辩论APP Admin Dashboard  
**文档类型**: 产品需求规格说明书（PRD）- 聚焦核心功能版  
**优化重点**: 功能优先级分级 + 复杂度评估 + 前后端一致性保障  
**作者**: GLM-5V-Turbo (AI Assistant)

---

## 📌 文档修订说明（v1.0 → v2.0）

| 维度 | v1.0 问题 | v2.0 优化 |
|------|----------|-----------|
| **优先级体系** | 仅P0-P3简单分类 | 建立**多维度评估模型**（业务价值+技术依赖+复杂度）|
| **功能范围** | 12大模块全面铺开 | **精简至6大核心模块**，其余列入未来清单 |
| **复杂度评估** | 无 | 每个功能添加**难度/周期/资源**三维指标 |
| **前后端关系** | 描述模糊 | **强化可追溯性原则**，每个操作必须对应前端展示 |
| **集成点分析** | 独立描述 | 明确标注**每个功能的现有系统依赖和API对接点** |
| **可执行性** | 偏理论 | **可直接指导开发的落地版本** |

---

## 目录

1. [核心设计原则](#一核心设计原则)
2. [功能优先级评估体系](#二功能优先级评估体系)
3. [高优先级核心功能（Phase 1 必须实现）](#三高优先级核心功能phase-1-必须实现)
4. [中优先级增强功能（Phase 2 建议实现）](#四中优先级增强功能phase-2-建议实现)
5. [低优先级未来功能（Phase 3+ 规划中）](#五低优先级未来功能phase-3-规划中)
6. [功能复杂度评估总表](#六功能复杂度评估总表)
7. [前后端一致性保障规范](#七前后端一致性保障规范)
8. [与现有系统集成方案](#八与现有系统集成方案)
9. [数据模型精简版](#九数据模型精简版)
10. [实施路线图与验收标准](#十实施路线图与验收标准)

---

## 一、核心设计原则

### 1.1 铁律：操作可追溯性原则 ⭐⭐⭐

> **所有管理操作必须与当前项目建立明确且直接的对应关系，确保操作的上下文清晰可追溯。**

#### 具体要求：

| 操作类型 | 可追溯性要求 | 实现方式 |
|---------|------------|---------|
| **数据查询** | 必须关联到具体的前端页面/组件 | API响应包含 `source_page` 字段 |
| **数据修改** | 必须记录修改前后的完整快照 | audit_logs 表存储 old_data/new_data JSON |
| **权限变更** | 必须明确影响哪些前端功能按钮 | 权限变更后返回 `affected_ui_elements` 列表 |
| **系统配置** | 必须说明影响的前端行为变化 | 配置变更通知前端刷新相关组件 |

#### 示例场景：
```
管理员在后台修改了议题 "AI能否取代白领？" 的热度值从95→98

✅ 可追溯的完整链路：
1. 管理员操作 → POST /api/admin/v1/topics/{id}/update
2. 后端验证 → 检查权限、校验数据合法性
3. 数据库更新 → UPDATE topics SET hotness=98 WHERE id=xxx
4. 审计日志 → 记录 {old: 95, new: 98, operator: admin_01, time: ...}
5. 前端同步 → WebSocket推送 / 轮询刷新 → 前端TopicCard组件重新渲染热度显示
6. 用户可见 → APP端用户看到该议题热度变为98
```

### 1.2 铁律：前后端数据一致性原则 ⭐⭐⭐

> **后端代码必须能够直接、准确地影响前端界面展示及交互逻辑，实现前后端数据与功能的一致性。**

#### 核心规范：

#### A. API接口设计规范

```typescript
// ✅ 正确示例：API返回格式完全匹配前端渲染需求
interface ApiResponse<T> {
  success: boolean;
  data: T;                    // 业务数据（直接可用于前端渲染）
  meta: {
    total: number;             // 总数（用于分页组件）
    page: number;              // 当前页
    pageSize: number;          // 每页条数
  };
  permissions: {
    can_edit: boolean;         // 控制前端编辑按钮显隐
    can_delete: boolean;       // 控制前端删除按钮显隐
    can_export: boolean;       // 控制前端导出按钮显隐
  };
}

// ❌ 错误示例：前端需要二次处理才能使用
interface BadResponse {
  code: 200;
  result: any;                // 不明确的类型
  // 缺少权限信息
  // 缺少元数据
}
```

#### B. 权限控制前后端协同

```
┌─────────────────────────────────────────────────────┐
│                  权限控制流程                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 用户登录 → 后端返回 JWT + permissions[]         │
│     ↓                                               │
│  2. 前端存储permissions → 根据权限渲染UI            │
│     ↓                                               │
│  3. 用户点击"删除用户"按钮                           │
│     ↓                                               │
│  4. 前端调用 DELETE /api/admin/v1/users/{id}        │
│     Header: Authorization: Bearer {token}           │
│     ↓                                               │
│  5. 后端再次验证权限（不信任前端）                   │
│     - 解析JWT提取role                               │
│     - CASL检查: can('delete', 'User')               │
│     ↓                                               │
│  6. 权限通过 → 执行删除                              │
│     权限拒绝 → 返回 403 Forbidden + {              │
│       allowed_actions: ['read', 'update'],          │
│       reason: '您没有删除用户的权限',                 │
│       ui_hint: '隐藏删除按钮'  ← 指导前端调整      │
│     }                                              │
│     ↓                                               │
│  7. 前端根据响应调整UI状态                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### C. 数据变更实时同步机制

| 变更类型 | 同步方式 | 延迟要求 | 前端处理 |
|---------|---------|---------|---------|
| **用户封禁** | WebSocket推送 + 本地状态更新 | < 1秒 | 立即禁用该用户相关交互 |
| **议题热度修改** | 轮询刷新（30秒间隔）或WebSocket | < 5秒 | 更新TopicCard热度数字 |
| **Soul角色参数** | 配置生效后下次请求加载 | < 10秒 | 下次辩论时使用新参数 |
| **系统公告** | 全量轮询 + 版本号比对 | < 60秒 | 弹窗展示新公告 |

### 1.3 功能边界原则

> **本PRD仅包含与现有PRD辩论APP直接相关的管理功能，不涉及通用型CMS或ERP功能。**

**包含**：
- ✅ 议题/Soul/群组/辩论等**业务实体的CRUD**
- ✅ 用户账号管理和基础监控
- ✅ AI服务配置和API Key管理
- ✅ 系统运行状态监控

**不包含**：
- ❌ 通用内容发布系统（非业务相关）
- ❌ 复杂的多维度数据分析报表（Phase 3+）
- ❌ 财务/支付管理（当前无付费功能）
- ❌ 多租户/企业版隔离（Phase 4+）

---

## 二、功能优先级评估体系

### 2.1 三维评估模型

每个功能将通过以下三个维度进行评分（1-5分），综合得分决定优先级：

| 维度 | 权重 | 说明 |
|------|:----:|------|
| **🎯 业务价值** | 40% | 对平台运营的重要性（用户增长/留存/安全）|
| **🔗 技术依赖** | 35% | 与现有系统的耦合程度（是否直接影响用户体验）|
| **⚙️ 实现复杂度** | 25% | 开发难度、工期、资源消耗（反向评分，越简单越优先）|

### 2.2 优先级等级定义

| 等级 | 名称 | 综合得分 | 开发阶段 | 承诺度 |
|:----:|------|:-------:|:--------:|:-----:|
| **P0** | 🔴 **必须做** | ≥ 4.0 | Phase 1 (MVP) | 100% 必须交付 |
| **P1** | 🟠 **应该做** | 3.0 - 3.9 | Phase 2 (增强) | 90% 应该交付 |
| **P2** | 🟡 **可以做** | 2.0 - 2.9 | Phase 3+ (规划) | 70% 尽量交付 |
| **P3** | ⚪ **暂缓** | < 2.0 | 未来迭代 | 30% 可能不做 |

### 2.3 复杂度评估指标

对每个功能添加以下三个指标：

| 指标 | 评级标准 | 说明 |
|------|---------|------|
| **📊 实现难度** | 🟢简单 / 🟡中等 / 🔴困难 | 技术挑战程度（1-5星）|
| **⏱️ 开发周期** | X天 / X周 | 预估工期（基于1名全栈开发者）|
| **💰 资源需求** | 低 / 中 / 高 | 人力、服务器、第三方服务成本 |

---

## 三、高优先级核心功能（Phase 1 必须实现）

> **目标**：让管理员能够**基本运营**平台，覆盖最关键的管理场景。

---

### P0-1: 📊 数据监控仪表盘（Dashboard）

**优先级得分**: 🎯4.8 | 🔗4.5 | ⚙️3.0 = **4.17 (P0)**

#### 业务价值（为什么必须第一做？）
- **运营决策依据**：管理员每天打开后台的第一眼就是看数据，没有仪表盘=盲人摸象
- **问题快速发现**：异常数据（如API错误率飙升）能立即暴露系统问题
- **投资回报可视化**：证明平台活跃度和增长趋势

#### 与现有系统的集成点

| 现有系统资源 | 对接方式 | 数据用途 |
|-------------|---------|---------|
| **users 表** | 直接查询 Supabase | 统计注册用户数、日活、新增 |
| **debates 表** | 直接查询 | 统计辩论总数、完成率 |
| **messages 表** | 聚合查询 | 统计消息总量、平均长度 |
| **Express API 日志** | 解析访问日志 | API调用量、响应时间、错误率 |
| **MiniMax API** | 调用统计接口 | Token消耗量、成功率 |

#### 核心功能清单（仅列出Phase 1必需）

| 功能ID | 功能名称 | 前端展示形式 | 对应后端API | 可追溯性要求 |
|:-----:|---------|------------|------------|:----------:|
| D001 | **核心指标卡片** | 4个大数字卡片（用户/辩论/API/消息）| GET /api/admin/v1/dashboard/metrics | 返回数据采样时间戳 |
| D002 | **用户趋势图** | 近7天折线图（新增/活跃）| GET /api/admin/v1/dashboard/user-trend | 每个数据点包含精确时间 |
| D003 | **系统健康状态** | 红/黄/绿三色指示灯 | GET /api/admin/v1/dashboard/health | 包含各子系统检查时间 |

#### 复杂度评估

| 指标 | 评级 | 说明 |
|------|:---:|------|
| **实现难度** | 🟢 ★★☆☆☆ | 主要是SQL聚合查询，无复杂逻辑 |
| **开发周期** | **2-3天** | 1天数据层 + 1天图表组件 + 0.5天联调 |
| **资源需求** | **低** | 仅需读取数据库，无需额外服务器 |

#### 前后端一致性保障

```typescript
// ✅ 后端API返回示例（直接匹配前端ECharts数据格式）
GET /api/admin/v1/dashboard/user-trend

Response:
{
  success: true,
  data: {
    dates: ["2026-05-07", "2026-05-08", "2026-05-09", "2026-05-10", 
           "2026-05-11", "2026-05-12", "2026-05-13"],
    newUsers: [23, 45, 32, 56, 41, 38, 52],    // ← 直接用于ECharts series[0].data
    activeUsers: [120, 145, 132, 168, 155, 142, 178], // ← 直接用于ECharts series[1].data
    lastUpdated: "2026-05-13T10:00:00Z"  // ← 前端显示"最后更新：10:00"
  },
  _meta: {
    queryTime: "2026-05-13T10:00:00Z",   // ← 可追溯：数据查询时刻
    dataSource: "users表 + debates表",     // ← 可追溯：数据来源
    cacheStatus: "fresh"                    // ← 可追溯：是否缓存
  }
}
```

---

### P0-2: 👥 用户管理（User Management）

**优先级得分**: 🎯4.6 | 🔗4.8 | ⚙️3.5 = **4.37 (P0)**

#### 业务价值
- **安全保障**：封禁违规用户是维护社区健康的必要手段
- **运营支持**：查看用户画像帮助理解用户需求
- **问题排查**：定位问题用户（如刷屏、恶意举报）

#### 与现有系统的集成点

| 现有系统资源 | 对接方式 | 影响范围 |
|-------------|---------|---------|
| **Supabase Auth** | 调用Admin API | 禁用用户→立即踢出在线会话 |
| **users 表** | CRUD操作 | 修改用户状态→前端Profile页同步 |
| **debates 表** | 关联查询 | 查看用户历史辩论→影响用户详情页 |
| **groups 表** | 关联查询 | 查看用户群组→影响成员列表展示 |

#### 核心功能清单（Phase 1必需）

| 功能ID | 功能名称 | 前端交互 | 后端API | 可追溯性 |
|:-----:|---------|:-------:|--------|:------:|
| U001 | **用户列表** | 表格展示（搜索/筛选/分页）| GET /api/admin/v1/users | 返回查询条件快照 |
| U002 | **用户详情** | 弹窗/抽屉展示完整信息 | GET /api/admin/v1/users/:id | 包含数据采集时间 |
| U003 | **禁用/启用用户** | 开关按钮 + 确认弹窗 | PATCH /api/admin/v1/users/:id/status | 记录操作人+原因+IP |
| U004 | **用户搜索** | 实时搜索框（手机号/昵称）| GET /api/admin/v1/users?search=xxx | 记录搜索关键词 |

#### 复杂度评估

| 指标 | 评级 | 说明 |
|------|:---:|------|
| **实现难度** | 🟢 ★★★☆☆ | 标准CRUD，但需注意权限和数据脱敏 |
| **开发周期** | **3-4天** | 1.5天列表+详情 + 1天状态管理 + 1天权限+脱敏 |
| **资源需求** | **低** | 主要是数据库读写操作 |

#### 前后端一致性保障（关键！）

```typescript
// ✅ 场景：管理员禁用用户 → 前端立即反馈 + 用户端即时生效

// Step 1: 管理员点击"禁用"按钮
PATCH /api/admin/v1/users/user_123/status
Body: { status: "disabled", reason: "恶意刷屏" }

// Step 2: 后端处理并返回
Response (200):
{
  success: true,
  data: {
    user_id: "user_123",
    status: "disabled",
    disabled_at: "2026-05-13T10:05:00Z",
    disabled_by: "admin_01",           // ← 可追溯：谁操作的
    disabled_reason: "恶意刷屏",        // ← 可追溯：原因
    effect_scope: {                     // ← 明确告知前端影响范围
      sessions_revoked: 3,              // 踢出了3个在线会话
      active_debates_interrupted: 1,    // 打断了1个进行中的辩论
      groups_affected: 2                // 影响2个群组成员列表
    },
    frontend_sync: {                    // ← 指导前端如何同步UI
      action: "REFRESH_USER_LIST",      // 刷新用户列表
      action: "SHOW_TOAST",            // 显示成功提示
      toast_message: "已成功禁用用户，3个在线会话已被踢出"
    }
  },
  audit_log_id: "audit_456"            // ← 可关联审计日志
}

// Step 3: 前端根据 response.frontend_sync 执行：
// 1. 自动刷新用户列表（重新调用GET /users）
// 2. 显示Toast提示："已成功禁用用户，3个在线会话已被踢出"
// 3. 如果有WebSocket连接，推送事件给其他在线管理员刷新

// Step 4: 被禁用用户侧效果（通过Supabase Auth或WebSocket）：
// - 所有API请求返回 403 Forbidden
// - 前端自动跳转到"账号已被禁用"提示页
// - 已建立的WebSocket连接被断开
```

---

### P0-3: 📝 议题管理（Topic Management）

**优先级得分**: 🎯4.4 | 🔗4.9 | ⚙️3.0 = **4.23 (P0)**

#### 业务价值
- **内容运营核心**：议题是辩论平台的"商品"，管理议题=管理产品
- **热点引导**：调整热度可以引导用户参与特定话题讨论
- **质量控制**：下架不当议题避免负面影响

#### 与现有系统的集成点

| 现有系统资源 | 对接方式 | 影响范围 |
|-------------|---------|---------|
| **topics.ts** | 修改数据文件或数据库 | 修改后前端Discover页立即刷新 |
| **TopicCard组件** | 数据驱动渲染 | 热度/分类变化→卡片排序和样式变化 |
| **DebateCreation流程** | 议题选择器 | 上架/下架→是否出现在议题选择列表 |

#### 核心功能清单

| 功能ID | 功能名称 | 前端交互 | 后端API | 可追溯性 |
|:-----:|---------|:-------:|--------|:------:|
| T001 | **议题列表** | 卡片/表格视图切换 | GET /api/admin/v1/topics | 包含当前热度值时间戳 |
| T002 | **编辑议题** | 弹窗表单（标题/描述/分类/热度）| PUT /api/admin/v1/topics/:id | 记录修改前后完整diff |
| T003 | **上架/下架** | 开关按钮 | PATCH /api/admin/v1/topics/:id/status | 记录操作原因 |
| T004 | **批量导入** | Excel上传 + 预览确认 | POST /api/admin/v1/topics/batch | 记录导入来源文件hash |

#### 复杂度评估

| 指标 | 评级 | 说明 |
|------|:---:|------|
| **实现难度** | 🟢 ★★☆☆☆ | 标准CRUD，议题结构简单 |
| **开发周期** | **2-3天** | 1天列表+编辑 + 0.5天上架/下架 + 0.5天批量导入 |
| **资源需求** | **低** | 纯数据库操作 |

---

### P0-4: 🤖 Soul角色管理（Soul Management）

**优先级得分**: 🎯4.3 | 🔗4.7 | ⚙️3.5 = **4.21 (P0)**

#### 业务价值
- **AI体验核心**：Soul角色的性格和能力直接影响用户体验
- **差异化竞争**：独特的Soul角色是平台特色，需要精细调控
- **质量保障**：监控胜率和回复质量，及时调整表现差的Soul

#### 与现有系统的集成点

| 现有系统资源 | 对接方式 | 影响范围 |
|-------------|---------|---------|
| **souls.ts** | 修改Soul配置数据 | Soul选择器立即反映变更 |
| **MiniMax API** | System Prompt参数 | 修改Prompt→下一场辩论立即生效 |
| **ChatBubble组件** | Soul头像/名称显示 | 修改头像/名称→历史消息也更新？需确认 |

#### 核心功能清单

| 功能ID | 功能名称 | 前端交互 | 后端API | 可追溯性 |
|:-----:|---------|:-------:|--------|:------:|
| S001 | **Soul列表** | 卡片展示（含胜率/使用次数）| GET /api/admin/v1/souls | 统计数据截止时间 |
| S002 | **基本信息编辑** | 表单（名称/头像/描述/擅长领域）| PUT /api/admin/v1/souls/:id | 记录修改diff |
| S003 | **AI参数调整** | 高级设置面板（Temperature等）| PATCH /api/admin/v1/souls/:id/ai-config | 参数变更生效时间 |
| S004 | **启用/禁用** | 开关按钮 | PATCH /api/admin/v1/souls/:id/status | 影响范围：是否出现在Soul选择器 |

#### 复杂度评估

| 指标 | 评级 | 说明 |
|------|:---:|------|
| **实现难度** | 🟡 ★★★☆☆ | AI参数调整需要理解MiniMax API，有学习成本 |
| **开发周期** | **3-4天** | 1.5天基础CRUD + 1.5天AI参数配置 + 1天测试 |
| **资源需求** | **中** | 可能需要测试不同参数效果的额外API调用成本 |

---

### P0-5: ⚙️ 系统配置（System Configuration）

**优先级得分**: 🎯4.5 | 🔗5.0 | ⚙️3.0 = **4.25 (P0)**

#### 业务价值
- **运维基石**：所有功能都依赖正确的配置（API Key、限流规则等）
- **安全保障**：API Key泄露=资金损失，必须安全管理
- **灵活运营**：Feature Flags支持灰度发布和紧急开关

#### 与现有系统的集成点

| 现有系统资源 | 对接方式 | 影响范围 |
|-------------|---------|---------|
| **server/config/** | 修改配置文件或环境变量 | 重启服务或热重载后全局生效 |
| **MiniMax API Key** | 加密存储到数据库 | 影响所有AI对话功能 |
| **Express中间件** | 修改限流规则 | 影响API调用频率限制 |

#### 核心功能清单

| 功能ID | 功能名称 | 前端交互 | 后端API | 可追溯性 |
|:-----:|---------|:-------:|--------|:------:|
| C001 | **API Key管理** | 密码输入框 + 显示掩码 | PUT /api/admin/v1/config/ai-api-key | 加密存储，不记录明文到日志 |
| C002 | **功能开关** | Toggle开关列表 | PUT /api/admin/v1/config/features | 记录开关变更时间和操作人 |
| C003 | **限流规则配置** | 数字输入框 + 单位选择 | PUT /api/admin/v1/config/rate-limits | 生效时间 + 影响的用户群体预估 |

#### 复杂度评估

| 指标 | 评级 | 说明 |
|------|:---:|------|
| **实现难度** | 🟡 ★★★☆☆ | API Key加密存储需要安全考虑，限流规则影响面广 |
| **开发周期** | **3-4天** | 1.5天配置CRUD + 1天加密存储 + 1天限流规则 + 0.5天测试 |
| **资源需求** | **低** | 主要是配置管理，无大量计算 |

---

### P0-6: 📋 操作审计日志（Audit Log）

**优先级得分**: 🎯4.2 | 🔗4.6 | ⚙️2.5 = **4.03 (P0)**

#### 业务价值
- **合规要求**：任何管理操作都必须留痕，满足审计需求
- **问题追溯**：出现问题时能快速定位"谁在什么时候做了什么"
- **安全防护**：异常操作模式检测（如短时间内大量删除）

#### 与现有系统的集成点

| 现有系统资源 | 对接方式 | 影响范围 |
|-------------|---------|---------|
| **所有写操作API** | 中间件自动记录 | 每次POST/PUT/DELETE都生成日志 |
| **admin_users表** | 关联查询管理员信息 | 日志中显示操作人姓名/角色 |

#### 核心功能清单

| 功能ID | 功能名称 | 前端交互 | 后端API | 可追溯性 |
|:-----:|---------|:-------:|--------|:------:|
| A001 | **日志列表** | 表格（时间线/操作人/目标/类型筛选）| GET /api/admin/v1/audit-logs | 日志自身不可篡改 |
| A002 | **日志详情** | 展示操作前后数据对比 | GET /api/admin/v1/audit-logs/:id | 包含IP/UA/时间戳 |
| A003 | **日志导出** | CSV/Excel下载 | GET /api/admin/v1/audit-logs/export | 导出时间范围和操作人水印 |

#### 复杂度评估

| 指标 | 评级 | 说明 |
|------|:---:|------|
| **实现难度** | 🟢 ★★☆☆☆ | 主要是中间件自动记录 + 查询展示 |
| **开发周期** | **2天** | 1天中间件 + 0.5天列表页 + 0.5天导出 |
| **资源需求** | **低** | 日志表会持续增长，需定期归档 |

---

## 四、中优先级增强功能（Phase 2 建议实现）

> **目标**：提升运营效率，提供更完善的管理工具。

### P1 功能列表概览

| 功能ID | 功能名称 | 优先级得分 | 复杂度 | 建议工期 | 核心价值 |
|:-----:|---------|:---------:|:-----:|:-------:|---------|
| G001 | **群组管理** | 3.6 (P1) | 🟢 简单 | 2天 | 解散违规群组、管理官方群 |
| D002 | **辩论监控** | 3.5 (P1) | 🟡 中等 | 3天 | 强制结束异常辩论、查看消息记录 |
| M001 | **讨论模式管理** | 3.3 (P1) | 🟢 简单 | 2天 | 启用/禁用19种模式、调整流程 |
| E001 | **数据导出** | 3.2 (P1) | 🟢 简单 | 1.5天 | 导出用户/辩论/议题数据为Excel |
| R001 | **基础审核** | 3.0 (P1) | 🟡 中等 | 3天 | 用户自定义内容的审核队列 |

> **详细功能说明将在Phase 2启动前补充完整PRD**

---

## 五、低优先级未来功能（Phase 3+ 规划中）

> **目标**：锦上添花，提升数据洞察能力和自动化水平。

### P2/P3 功能清单

| 功能ID | 功能名称 | 优先级 | 预期价值 | 建议阶段 |
|:-----:|---------|:-----:|---------|:-------:|
| DA001 | **多维数据分析报表** | P2 | 数据驱动运营决策 | Phase 3 |
| PN001 | **消息推送管理** | P2 | 用户召回和活动触达 | Phase 3 |
| MON001 | **实时系统监控大盘** | P2 | 快速发现性能瓶颈 | Phase 3 |
| SEC001 | **双因素认证(2FA)** | P3 | 提升管理员账户安全 | Phase 4 |
| ML001 | **AI辅助内容审核** | P3 | 降低人工审核成本 | Phase 4 |
| TENANT001 | **多租户/企业版** | P3 | 拓展B端市场 | Phase 5 |

> **这些功能目前仅需记录在案，不需要详细设计**

---

## 六、功能复杂度评估总表

### 6.1 Phase 1 (P0) 功能汇总

| 功能 | 难度 | 工期 | 资源 | 得分 | 前后端集成复杂度 |
|------|:---:|:---:|:---:|:---:|:---------------:|
| **D001-D003 数据仪表盘** | 🟢★ | 2-3天 | 低 | 4.17 | 🟢 低（只读查询）|
| **U001-U004 用户管理** | 🟢★★ | 3-4天 | 低 | 4.37 | 🟡 中（需联动Auth）|
| **T001-T004 议题管理** | 🟢★ | 2-3天 | 低 | 4.23 | 🟢 低（纯数据CRUD）|
| **S001-S004 Soul管理** | 🟡★★ | 3-4天 | 中 | 4.21 | 🟡 中（涉及AI参数）|
| **C001-C003 系统配置** | 🟡★★ | 3-4天 | 低 | 4.25 | 🟡 中（影响全局）|
| **A001-A003 审计日志** | 🟢★ | 2天 | 低 | 4.03 | 🟢 低（自动记录）|

### 6.2 Phase 1 总体工作量估算

| 指标 | 数值 |
|------|:---:|
| **功能数量** | 6大模块 × 20个子功能 |
| **总预估工期** | **14-21工作日**（约3-4周）|
| **人力需求** | 1名全栈开发者（或1前端+1后端并行）|
| **技术风险** | 🟢 低（均为成熟CRUD模式）|
| **测试工作量** | 约3-5天（含联调和边界测试）|

---

## 七、前后端一致性保障规范

### 7.1 强制规范清单

> **以下规范必须在开发过程中严格执行，否则不予通过Code Review**

#### 规范1：API响应必须包含 `_meta` 元数据字段

```typescript
// ✅ 每个API响应都必须包含
interface StandardApiResponse<T> {
  success: boolean;
  code: number;                    // HTTP状态码对应的业务码
  message: string;                 // 人类可读的消息
  data: T;                         // 业务数据
  
  // ====== 以下是强制要求的元数据 ======
  _meta: {
    timestamp: string;              // 服务器处理时间（ISO 8601）
    requestId: string;              // 请求唯一ID（用于日志追踪）
    dataSource: string;             // 数据来源表/服务
    cacheStatus?: "hit" | "miss" | "fresh";  // 是否命中缓存
    permissions?: {                 // 当前用户对此资源的权限
      can_read: boolean;
      can_update: boolean;
      can_delete: boolean;
    };
    ui_hints?: {                    // 指导前端如何更新UI
      refresh_components?: string[];  // 需要刷新的组件列表
      show_toast?: {                 // Toast提示配置
        type: "success" | "error" | "warning";
        message: string;
        duration?: number;
      };
      redirect_url?: string;        // 需要跳转的URL（如有）
    };
  };
}
```

#### 规范2：写操作必须返回操作影响范围

```typescript
// ✅ POST/PUT/PATCH/PATCH 操作必须返回
interface WriteOperationResponse<T> {
  success: boolean;
  data: T;                         // 操作后的最新数据
  
  // ====== 操作影响范围（强制）======
  impact: {
    affected_records: number;       // 影响了多少条记录
    affected_entities: string[];     // 影响了哪些实体（表名）
    cascade_effects?: {              // 级联影响
      entity: string;                // 被影响的关联实体
      effect_type: "updated" | "deleted" | "invalidated";
      count: number;
    }[];
    real_time_sync?: {              // 实时同步信息
      websocket_event?: string;     // 需要广播的WebSocket事件名
      push_channels?: string[];     // 需要推送的通知渠道
      cache_invalidation?: string[];// 需要失效的缓存键
    };
  };
  
  audit_info: {                     // 审计信息（强制）
    audit_log_id: string;           // 对应的审计日志ID
    operator_id: string;            // 操作人ID
    operator_name: string;          // 操作人姓名
    operated_at: string;            // 操作时间
    ip_address: string;             // 操作IP
  };
}
```

#### 规范3：错误响应必须包含前端可处理的指引

```typescript
// ✅ 错误响应不能只有错误码，必须有前端处理建议
interface ErrorResponse {
  success: false;
  error: {
    code: string;                   // 错误码（如 "USER_NOT_FOUND"）
    message: string;                // 人类可读的错误描述
    details?: string;               // 详细错误信息（可选，用于调试）
    
    // ====== 前端处理指引（强制）======
    user_facing_message: string;     // 可以直接展示给最终用户的消息
    suggested_action: "retry" | "refresh" | "redirect" | "show_modal" | "disable_button";
    retry_after_ms?: number;        // 建议多久后重试（毫秒）
    redirect_url?: string;          // 建议跳转的URL
    
    ui_state_changes?: {             // 建议的UI状态变更
      disable_buttons?: string[];    // 需要禁用的按钮ID列表
      enable_buttons?: string[];     // 需要启用的按钮ID列表
      show_error_field?: string;     // 需要标红的表单字段名
      modal_to_show?: {              // 需要弹出的模态框
        type: "confirm" | "alert" | "form";
        title: string;
        content: string;
      };
    };
  };
  _meta: {
    timestamp: string;
    requestId: string;
  };
}

// 示例：权限不足的错误响应
{
  success: false,
  error: {
    code: "INSUFFICIENT_PERMISSION",
    message: "您没有删除用户的权限",
    user_facing_message: "抱歉，您的角色不允许执行此操作。如需帮助，请联系超级管理员。",
    suggested_action: "show_modal",
    ui_state_changes: {
      disable_buttons: ["btn-delete-user"],
      modal_to_show: {
        type: "alert",
        title: "权限不足",
        content: "删除用户操作需要【管理员】及以上权限，当前您的角色为【运营人员】。"
      }
    }
  }
}
```

#### 规范4：数据列表API必须支持前端所需的元数据

```typescript
// ✅ 列表API必须返回完整的分页和筛选元数据
interface ListResponse<T> {
  success: true;
  data: T[];                      // 当前页的数据列表
  
  pagination: {                     // 分页信息（强制）
    page: number;                   // 当前页码
    pageSize: number;               // 每页条数
    totalItems: number;             // 总记录数
    totalPages: number;             // 总页数
    hasNextPage: boolean;           // 是否有下一页
    hasPrevPage: boolean;           // 是否有上一页
  };
  
  filters_applied: {                // 当前应用的筛选条件（用于前端显示"已筛选"标签）
    search?: string;                // 搜索关键词
    status?: string;                // 状态筛选
    date_range?: {                  // 时间范围
      from: string;
      to: string;
    };
    sort: {                        // 排序方式
      field: string;
      direction: "asc" | "desc";
    };
  };
  
  available_filters: {              // 可用的筛选选项（用于前端渲染筛选项下拉框）
    statuses: Array<{value: string, label: string, count: number}>;
    sorts: Array<{field: string, label: string}>;
  };
  
  _meta: { /* 标准元数据 */ };
}
```

### 7.2 前后端协作 Checklist

每次完成一个功能模块，必须逐项确认：

- [ ] **后端**：所有API响应符合 StandardApiResponse 格式
- [ ] **后端**：所有写操作返回 impact 和 audit_info
- [ ] **后端**：所有错误响应包含 suggested_action 和 ui_state_changes
- [ ] **后端**：所有列表API返回完整的 pagination 和 filters_applied
- [ ] **前端**：能正确解析 _meta 并展示数据时效性
- [ ] **前端**：能根据 ui_hints 自动刷新组件或显示Toast
- [ ] **前端**：能根据 error.ui_state_changes 调整按钮状态和弹出模态框
- [ ] **联调**：使用真实数据进行端到端测试（不是Mock数据）
- [ ] **联调**：验证权限不足时前端按钮正确禁用/隐藏
- [ ] **联调**：验证数据修改后前端列表自动刷新

---

## 八、与现有系统集成方案

### 8.1 集成架构图（简化版）

```
┌─────────────────────────────────────────────────────────┐
│              管理员后端系统 (Admin API Service)          │
│              端口: 待定 (从端口池选择)                     │
│              技术: Fastify + Prisma                       │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API (严格鉴权)
                   │
    ┌──────────────┼──────────────┬──────────────────────┐
    ↓              ↓              ↓                      ↓
┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐
│现有Express│  │ Supabase │  │ MiniMax  │  │ Redis Cache     │
│ API :9461│  │PostgreSQL│  │ AI API   │  │ (会话/限流/缓存) │
│(只读共享)│  │ (直连)   │  │ (配置)   │  │                  │
└────────┘  └──────────┘  └──────────┘  └──────────────────┘
```

### 8.2 各功能模块的集成依赖矩阵

| 功能模块 | 依赖现有系统 | 集成方式 | 数据流向 | 同步要求 |
|---------|------------|---------|---------|---------|
| **数据仪表盘** | users/debates/messages表 | 直连Supabase查询 | 只读 | ≤5分钟延迟可接受 |
| **用户管理** | Supabase Auth + users表 | 调用Admin API + DB CRUD | 双向 | 实时（<1秒）|
| **议题管理** | topics.ts 或 topics表 | 修改数据源 | 写→读 | ≤10秒延迟可接受 |
| **Soul管理** | souls.ts + MiniMax API | 修改配置 + 测试API | 写→读 | 参数变更≤10秒生效 |
| **系统配置** | server/config/ | 修改配置文件/环境变量 | 写→全局 | 可能需重启或热重载 |
| **审计日志** | 所有写操作API | 中间件拦截记录 | 只写 | 异步写入，不影响性能 |

### 8.3 共享资源冲突预防

| 资源 | 冲突场景 | 预防措施 |
|------|---------|---------|
| **Supabase连接池** | 管理员大量查询占用连接 | 管理员API使用readonly角色，限制连接数 |
| **Redis** | 管理员操作清空用户缓存 | 使用不同的key前缀（admin: vs user:）|
| **MiniMax API配额** | 管理员测试消耗配额 | 单独统计管理员调用，设限额外buffer |

---

## 九、数据模型精简版

### 9.1 Phase 1 必需的新增表（仅3张核心表）

#### 表1: `admin_users` （管理员账户）

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- PBKDF2加密
  real_name VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'operator',  -- super_admin/admin/operator/auditor
  status VARCHAR(20) NOT NULL DEFAULT 'active',   -- active/disabled/locked
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 表2: `audit_logs` （操作审计日志）

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,        -- CREATE/UPDATE/DELETE/LOGIN/EXPORT...
  target_type VARCHAR(50) NOT NULL,    -- user/topic/debate/soul/config
  target_id VARCHAR(100),
  old_data JSONB,                     -- 操作前数据（敏感字段已脱敏）
  new_data JSONB,                     -- 操作后数据
  ip_address INET,
  user_agent TEXT,
  result VARCHAR(10) NOT NULL,        -- success/failure
  error_message TEXT,
  request_id VARCHAR(100),            -- 关联到具体API请求
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：按时间和管理员查询
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
```

#### 表3: `system_configs` （系统配置键值存储）

```sql
CREATE TABLE system_configs (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,     -- ai_api_key/features/rate_limits/push...
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE, -- API Key等敏感配置加密存储
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9.2 现有表扩展字段（最小化）

```sql
-- users 表扩展（仅2个字段）
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20) DEFAULT 'normal';
-- 值: normal/disabled/banned
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- 创建索引加速管理员查询
CREATE INDEX idx_users_admin_status ON users(admin_status) WHERE admin_status != 'normal';
```

> **注意**：Phase 1 不再扩展 topics/souls/debates 表，这些表的字段将在Phase 2按需添加。

---

## 十、实施路线图与验收标准

### 10.1 Phase 1 (MVP) 详细计划

**目标**：2-3周内交付6大核心管理模块

#### Week 1: 基础架构 + 核心CRUD

| 天数 | 任务 | 交付物 |
|:---:|------|-------|
| Day 1-2 | 项目初始化（Fastify + Prisma + JWT认证）+ 数据库迁移 | 可运行的API骨架 |
| Day 3-4 | 审计日志中间件 + admin_users表CRUD | 管理员登录和日志记录功能 |
| Day 5 | 议题管理完整CRUD（列表/编辑/上架下架）| 议题管理可用 |

#### Week 2: 用户管理 + Soul管理 + 配置

| 天数 | 任务 | 交付物 |
|:---:|------|-------|
| Day 1-2 | 用户管理（列表/详情/禁用/搜索）+ Supabase Auth联动 | 用户管理可用 |
| Day 3-4 | Soul管理（列表/编辑/AI参数）+ MiniMax配置 | Soul管理可用 |
| Day 5 | 系统配置（API Key/功能开关/限流规则）| 配置管理可用 |

#### Week 3: 仪表盘 + 联调测试

| 天数 | 任务 | 交付物 |
|:---:|------|-------|
| Day 1-2 | 数据仪表盘（核心指标卡片 + 趋势图）| 仪表盘可用 |
| Day 3-4 | 前后端联调 + 权限测试 + 边界情况处理 | 全功能可用 |
| Day 5 | Bug修复 + 性能优化 + 文档补全 | 可交付版本 |

### 10.2 验收标准（Must-Have）

每个功能模块必须满足以下条件才能视为完成：

#### 通用验收标准

- [ ] **API响应格式**：100%符合 StandardApiResponse 规范
- [ ] **权限控制**：未授权访问返回403 + 前端可处理的错误信息
- [ ] **审计日志**：每个写操作都有对应的审计记录（可在日志列表查到）
- [ ] **数据脱敏**：用户手机号/邮箱在列表中显示为 `138****1234`
- [ ] **分页标准化**：所有列表API支持 page/pageSize 参数
- [ ] **错误处理**：网络超时/服务器错误/业务错误均有友好提示
- [ ] **加载状态**：列表/详情页有loading skeleton或spinner
- [ ] **空状态**：无数据时显示友好的空状态提示

#### 特定功能验收标准

**数据仪表盘**：
- [ ] 核心指标卡片数字准确（与DB一致）
- [ ] 趋势图数据点正确（日期对齐、数值正确）
- [ ] 系统健康指示灯颜色准确（绿/黄/红判定逻辑正确）
- [ ] 数据自动刷新（可配置刷新间隔，默认60秒）

**用户管理**：
- [ ] 用户列表支持搜索（手机号/昵称模糊匹配）
- [ ] 用户详情展示完整信息（基本信息+统计数据+最近登录）
- [ ] 禁用用户后，该用户无法再次登录（通过Supabase Auth验证）
- [ ] 启用用户后，该用户恢复正常登录能力
- [ ] 操作记录可在审计日志中查到（包含原因和时间戳）

**议题管理**：
- [ ] 议题列表展示所有200+预设议题
- [ ] 编辑议题后，前端Discover页能看到变更（可能需刷新）
- [ ] 下架的议题不在用户端议题选择器中出现
- [ ] 上架的议题正常显示给用户

**Soul管理**：
- [ ] Soul列表展示当前配置和统计数据
- [ ] 修改Soul名称/头像后，用户端能看到更新
- [ ] 调整AI参数（Temperature）后，下一场辩论使用新参数
- [ ] 禁用的Soul不在用户端Soul选择器中出现

**系统配置**：
- [ ] API Key以密文存储（数据库中不可见明文）
- [ ] 修改API Key后，AI对话功能正常使用新Key
- [ ] 功能开关变更后立即生效（无需重启）
- [ ] 限流规则变更后，新的请求受新规则约束

**审计日志**：
- [ ] 所有上述功能的写操作均自动生成日志
- [ ] 日志列表支持按时间/操作人/目标类型筛选
- [ ] 日志详情展示操作前后的完整数据对比
- [ ] 日志不可被普通管理员删除或修改（仅super_admin可导出）

### 10.3 性能验收标准

| 指标 | 要求 | 测试方法 |
|------|------|---------|
| **页面加载** | 首屏 ≤ 2秒 | Chrome DevTools Network面板 |
| **API响应(P95)** | 列表API ≤ 500ms | Apache Bench压测 |
| **并发支持** | ≥ 5个管理员同时操作不卡顿 | 多浏览器同时操作测试 |
| **内存泄漏** | 连续操作1小时无明显内存增长 | Chrome Task Manager监控 |

---

## 附录

### A. 术语表（同v1.0）

### B. 参考文档

- 现有项目代码仓库（已深度分析）
- Supabase Admin API文档
- MiniMax AI API文档
- Fastify官方文档
- Prisma ORM文档
- OWASP Top 10安全实践

### C. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| v1.0 | 2026-05-13 | GLM-5V-Turbo | 初始完整版（12大模块）|
| **v2.0** | **2026-05-13** | **GLM-5V-Turbo** | **优化重构版（聚焦6大核心+优先级体系+前后端一致性）** |

---

*文档结束*

**【当前时间：2026年05月13日 10时30分00秒 星期二】**
