# PRD辩论系统 - 管理员后台管理系统 PRD

**版本**: v1.0
**创建日期**: 2026-05-13
**作者**: AI Assistant (GLM-5V-Turbo)
**状态**: 初稿完成

---

## 📋 文档信息

| 项目 | 内容 |
|------|------|
| **文档类型** | 产品需求文档 (PRD) |
| **系统名称** | 真实历史人物角色管理后台 |
| **目标用户** | 系统管理员、运营人员、内容审核员 |
| **优先级** | P0 (核心功能) |

---

## 1. 项目背景与目标

### 1.1 背景
PRD辩论系统已完成**33位真实历史人物角色**的深度配置，每个角色包含：
- 5维深度性格设定（identity, character, soul, values, behavior）
- 基于真实传记、著作、言论的99%还原度soul
- 支持网络搜索增强和动态信息更新
- 完整的前后端集成模块

### 1.2 目标
构建一个功能完善的后台管理系统，实现对33位历史人物角色的：
- **全生命周期管理**（创建、编辑、审核、发布、归档）
- **质量控制**（数据完整性验证、Soul质量评分、合规性检查）
- **运营监控**（使用统计、效果分析、用户反馈收集）
- **权限控制**（多级管理员、操作审计、安全防护）

---

## 2. 系统架构概览

### 2.1 技术栈
```
前端: React + Ant Design Pro / Vue3 + Element Plus
后端: Node.js (Express/Koa) + TypeScript
数据库: MongoDB (角色数据) + Redis (缓存)
文件存储: OSS/MinIO (头像、附件)
认证: JWT + RBAC 权限模型
```

### 2.2 核心模块划分
```
┌─────────────────────────────────────────────┐
│              管理员后台系统                    │
├──────────┬──────────┬──────────┬─────────────┤
│ 角色管理 │ 用户管理 │ 数据统计 │ 系统设置    │
├──────────┼──────────┼──────────┼─────────────┤
│ • CRUD  │ • 权限   │ • 使用量  │ • 全局配置  │
│ • 审核   │ • 日志   │ • 效果    │ • 提示词模板│
│ • 版本   │ • 封禁   │ • 反馈    │ • 分类管理  │
│ • 导入导出│         │          │             │
└──────────┴──────────┴──────────┴─────────────┘
```

---

## 3. 功能详细规格

### 3.1 角色管理模块 (P0)

#### 3.1.1 角色列表页
**功能描述**: 展示所有33位历史人物的卡片式列表，支持多维筛选和快速操作

**页面元素**:
```
[+ 新增角色] [批量导入] [批量操作 ▾] [导出] [刷新]

[🔍 搜索框] [分类筛选 ▾] [时代筛选 ▾] [角色类型筛选 ▾] [状态筛选 ▾]

┌─────────────────────────────────────────────────────────────┐
│ [☐] ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│      │  头像     │  │  头像     │  │  头像     │           │
│      ├──────────┤  ├──────────┤  ├──────────┤           │
│      │ 亚里士多德  │  │ 孔子       │  │ 马斯克     │           │
│      │ Aristotle │  │ Confucius │  │ Elon Musk │           │
│      ├──────────┤  ├──────────┤  ├──────────┤           │
│      │哲学家|古希腊│  │哲学家|春秋│  │企业家|现代│           │
│      │ ✅已发布   │  │ ✅已发布   │  │ ⚠️待审核  │           │
│      ├──────────┤  ├──────────┤  ├──────────┤           │
│      │ [编辑][查看]│  │ [编辑][查看]│  │ [编辑][查看]│           │
│      └──────────┘  └──────────┘  └──────────┘           │
│                                                             │
│ 显示 1-10 of 33 | < 1 2 3 4 > | 每页显示: [20 ▾]        │
└─────────────────────────────────────────────────────────────┘
```

**交互规格**:
- **排序支持**: 按名称、时代、分类、创建时间、更新时间排序
- **筛选条件**:
  - 分类: 哲学家(6)、企业家(11)、科学家(6)、艺术家(3)、政治家(5)、经济学家(3)、文学家(3)
  - 时代: 古代、中世纪、近代、现代、当代
  - 角色 proposer/critic/host/reviewer/summarizer
  - 状态: 已发布/待审核/草稿/已归档
- **快捷操作**: 批量发布/归档/删除（需二次确认）
- **卡片展示内容**:
  - 头像（自动生成或上传）
  - 中文名 + 英文名（含类型标签）
  - 分类 + 时代标签
  - 状态标识（颜色区分）
  - Soul质量评分（星级显示）

#### 3.1.2 角色详情/编辑页
**功能描述**: 单个角色的完整信息编辑界面，采用Tab分页设计

**Tab结构**:
```
Tab 1: 基本信息          Tab 2: 性格特征        Tab 3: Soul设定
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 👤 头像上传      │  │ 🎭 性格特点      │  │ 🧠 核心灵魂      │
│ 📝 名称*        │  │ [+] 添加特点     │  │ [大型文本编辑器]  │
│ 📝 英文名*      │  │                  │  │                  │
│ 🏷️ 分类*       │  │ 特点1: 极其理性  │  │ 你是XXX，...     │
│ 📅 时代*        │  │ 特点2: 好奇心强  │  │                  │
│ 🎭 角色类型*    │  │ 特点3: ...      │  │ 你的思维特点：   │
│ 📖 简介*        │  │                  │  │ 1. XXXX         │
│                  │  │ 💬 语言风格      │  │ 2. XXXX         │
│ [下一步 →]      │  │ [+] 添加风格     │  │ 3. XXXX         │
│                  │  │                  │  │ ...              │
│                  │  │ 风格1: 三段论    │  │                  │
│                  │  │ 风格2: ...      │  │ 你在讨论中的表现:│
│                  │  │                  │  │ - 开场常...      │
│                  │  │ 💎 核心价值观    │  │ - 你喜欢说...    │
│                  │  │ [+] 添加价值     │  │ - 当...时...     │
│                  │  │ 价值1: 中庸之道  │  │                  │
│                  │  │ 价值2: ...      │  │ 标志性表达:      │
│                  │  │                  │  │ - "..."          │
│                  │  │                  │  │ - "..."          │
│                  │  │                  │  │                  │
│                  │  │                  │  │ 禁止行为:        │
│                  │  │                  │  │ ❌ 不...        │
│                  │  │                  │  │ ❌ 不...        │
└──────────────────┘  └──────────────────┘  └──────────────────┘

Tab 4: 著作与成就      Tab 5: 高级设置
┌──────────────────┐  ┌──────────────────┐
│ 📚 代表作品      │  │ ⚙️ 提示词参数     │
│ [+] 添加著作     │  │                  │
│ 著作1: 《形而上学》│  │ 还原度目标: [98%▾]│
│ 著作2: 《尼各马可》│  │ 网络搜索: [✅启用] │
│ ...              │  │ 动态更新: [✅启用] │
│                  │  │                  │
│ 🏆 主要成就      │  │ 🔐 权限设置      │
│ [+] 添加成就     │  │ 可见范围: [公开 ▾]│
│ 成就1: 逻辑学之父│  │ 编辑权限: [管理员]│
│ 成就2: ...      │  │ 使用限制: [无]    │
│                  │  │                  │
│ 💬 经典语录      │  │ 📊 数据统计      │
│ [+] 添加语录     │  │ 创建时间: ...     │
│ 语录1: "吾爱吾师"│  │ 更新时间: ...     │
│ 语录2: ...      │  │ 使用次数: ...     │
│                  │  │ 用户评分: ⭐4.8   │
└──────────────────┘  └──────────────────┘

[保存草稿] [预览效果] [提交审核] [发布上线]
```

**字段验证规则**:
```javascript
const validationRules = {
  name: { required: true, maxLength: 50, unique: true },
  englishName: { required: true, maxLength: 100 },
  category: { required: true, enum: ['哲学家','企业家',...] },
  era: { required: true, pattern: /^.*\(\d{3,4}.*$/ },
  soul: { 
    required: true, 
    minLength: 500,
    mustInclude: ['你是', '禁止行为', '你在讨论中的表现', '标志性表达']
  },
  character: {
    personality: { minItems: 3, maxItems: 10 },
    speakingStyle: { minItems: 3, maxItems: 10 },
    values: { minItems: 3, maxItems: 10 }
  }
};
```

#### 3.1.3 角色审核流程
**状态机设计**:
```
草稿(DRAFT) → 待审核(PENDING) → 已发布(PUBLISHED)
                    ↘ 已拒绝(REJECTED) → 草稿(DRAFT)
                                            ↓
                                      已归档(ARCHIVED)
```

**审核界面要素**:
- **审核表单**:
  - 审核人选择（下拉菜单）
  - 审核意见（必填文本域，>10字）
  - 审核结果：通过/拒绝/退回修改
  - 修改建议（可选，拒绝时建议填写）
  
- **质量检查项**（自动评分）:
  - [ ] Soul字数 > 500字 ✓
  - [ ] 包含"你是"身份声明 ✓
  - [ ] 包含"禁止行为"约束 ✓
  - [ ] 包含"标志性表达" ✓
  - [ ] identity字段完整 ✓
  - [ ] character字段完整 ✓
  - [ ] famousQuotes ≥ 3条 ✓
  - [ ] works/achievements ≥ 2项 ✓

- **审核历史记录**:
  - 时间线展示所有审核记录
  - 支持回滚到任意历史版本
  - 审核意见对比视图

### 3.2 用户管理模块 (P1)

#### 3.2.1 管理员账号管理
**功能列表**:
- **账号CRUD**: 创建/编辑/禁用/删除管理员账号
- **角色分配**: 超级管理员/内容管理员/审核员/只读观察者
- **权限矩阵**:
  ```
  | 操作        | 超管 | 内容管理员 | 审核员 | 观察者 |
  |-------------|------|-----------|--------|--------|
  | 创建角色    |  ✅   |    ✅     |   ❌   |   ❌   |
  | 编辑角色    |  ✅   |    ✅     |   ❌   |   ❌   |
  | 删除角色    |  ✅   |    ❌     |   ❌   |   ❌   |
  | 发布角色    |  ✅   |    ❌     |   ✅   |   ❌   |
  | 审核角色    |  ✅   |    ❌     |   ✅   |   ❌   |
  | 查看统计    |  ✅   |    ✅     |   ✅   |   ✅   |
  | 系统设置    |  ✅   |    ❌     |   ❌   |   ❌   |
  ```

#### 3.2.2 操作日志审计
**记录内容**:
- 操作人ID、姓名、角色
- 操作时间（精确到毫秒）
- 操作类型（CREATE/UPDATE/DELETE/PUBLISH/REJECT）
- 操作对象（角色ID、修改的字段列表）
- 操作前快照（关键字段旧值）
- 操作后快照（关键字段新值）
- IP地址、User-Agent

**查询与导出**:
- 按时间范围筛选
- 按操作人筛选
- 按操作类型筛选
- 导出CSV/Excel（支持100万条级）

### 3.3 数据统计模块 (P1)

#### 3.3.1 角色使用统计
**仪表板指标**:
```
┌─────────────────────────────────────────────────────┐
│              📊 角色使用数据仪表板               │
├──────────────┬──────────────┬───────────────────────┤
│ 总角色数     │ 今日调用次数   │ 本周活跃角色数       │
│    33       │    1,234     │        28           │
├──────────────┼──────────────┼───────────────────────┤
│ 最受欢迎TOP5 │ 调用趋势图    │ 分类使用占比         │
│              │              │                       │
│ 1. 马斯克   │  ▁▂▃█▅▆██  │  ████████░░ 企业家 35%│
│ 2. 孔子     │    ▄▃▅▆██  │  ██████░░░░ 哲学家 22%│
│ 3. 乔布斯   │  ▁▂▃█▅▆██  │  ████░░░░░░ 科学家 18%│
│ 4. 尼采     │    ▄▃▅▆██  │  ███░░░░░░░ 其他   25%│
│ 5. 爱因斯坦 │  ▁▂▃█▅▆    │                       │
└──────────────┴──────────────┴───────────────────────┘
```

**详细报表**:
- **单个角色详情页**:
  - 调用次数趋势图（日/周/月/年）
  - 平均对话轮次
  - 用户满意度评分
  - 常见搭配角色（经常一起使用的其他角色）
  - 典型话题分布（用户最喜欢和该角色讨论什么）
  
- **对比分析**:
  - 同类别角色对比（如：哲学家之间的使用率对比）
  - 不同时代角色对比（古代 vs 现代）
  - 角色质量 vs 使用率相关性分析

#### 3.3.2 用户反馈收集
**反馈渠道**:
- 应用内评分（1-5星 + 文字评价）
- 自动情感分析（正面/负面/中性）
- 常见问题聚类（NLP自动归类）

**反馈处理流程**:
```
用户反馈 → 自动分类 → 待处理队列 → 人工审核 → 
  ├→ 有效反馈 → 优化角色Soul → 更新发布
  └→ 无效/恶意 → 标记忽略 → 记入黑名单
```

### 3.4 系统设置模块 (P2)

#### 3.4.1 全局配置
**可配置项**:
```yaml
# 系统基础设置
system:
  name: "PRD辩论系统 - 真实历史人物版"
  version: "1.0.0"
  maintenance_mode: false  # 维护模式开关
  
# 角色默认参数
role_defaults:
  max_response_length: 800
  creativity_level: 0.7
  web_search_enabled: true
  historical_context_enabled: true
  
# 质量门槛
quality_thresholds:
  soul_min_length: 500
  min_famous_quotes: 3
  min_works: 2
  required_soul_sections:
    - "identity_declaration"
    - "forbidden_behavior"
    - "interaction_guide"
    - "signature_expressions"

# 安全设置
security:
  max_login_attempts: 5
  session_timeout: 3600  # 秒
  ip_whitelist: []  # 空表示不限制
  api_rate_limit:
    per_minute: 60
    per_hour: 1000
```

#### 3.4.2 提示词模板管理
**功能说明**: 管理所有角色的提示词生成模板

**模板类型**:
1. **基础模板** (`base_template`): 所有角色通用的框架结构
2. **分类模板** (`category_template`): 按哲学家/企业家等分类定制
3. **个人模板** (`custom_template`): 为特定角色定制的特殊模板

**模板编辑器**:
- 可视化拖拽组件
- 变量插入器（如 `{role.name}`, `{role.soul}`）
- 实时预览（输入示例角色ID即可看到生成的完整提示词）
- 版本管理（支持模板回滚）

#### 3.4.3 分类管理
**自定义分类**:
- 支持创建/编辑/删除分类
- 分类属性: 名称、图标、颜色、描述、排序权重
- 分类下的角色自动关联
- 支持多级分类（如: 哲学家 > 古希腊哲学家 > 伦理学家）

---

## 4. API接口规范

### 4.1 RESTful API 设计

#### 角色相关接口
```
GET    /api/v1/roles              # 获取角色列表（支持分页、筛选）
POST   /api/v1/roles              # 创建新角色
GET    /api/v1/roles/:id          # 获取角色详情
PUT    /api/v1/roles/:id          # 更新角色信息
DELETE /api/v1/roles/:id          # 删除角色（软删除）
POST   /api/v1/roles/:id/publish  # 发布角色
POST   /api/v1/roles/:id/archive  # 归档角色
POST   /api/v1/roles/:id/review   # 提交审核
POST   /api/v1/roles/:id/approve  # 审核通过
POST   /api/v1/roles/:id/reject   # 审核拒绝
GET    /api/v1/roles/:id/history  # 获取修改历史
POST   /api/v1/roles/import       # 批量导入（JSON/Excel）
GET    /api/v1/roles/export       # 批量导出
GET    /api/v1/roles/search       # 智能搜索
GET    /api/v1/roles/recommend    # 场景推荐
```

#### 统计相关接口
```
GET    /api/v1/stats/overview      # 总览数据
GET    /api/v1/stats/roles/:id     # 单角色统计
GET    /api/v1/stats/trending      # 热门角色排行
GET    /api/v1/stats/categories    # 分类统计
GET    /api/v1/stats/feedback      # 用户反馈统计
```

#### 系统管理接口
```
GET    /api/v1/admin/users         # 管理员列表
POST   /api/v1/admin/users         # 创建管理员
PUT    /api/v1/admin/users/:id     # 更新管理员
DELETE /api/v1/admin/users/:id     # 删除管理员
GET    /api/v1/admin/logs          # 操作日志
GET    /api/v1/admin/settings      # 系统设置
PUT    /api/v1/admin/settings      # 更新设置
POST   /api/v1/admin/templates     # 创建提示词模板
GET    /api/v1/admin/templates     # 模板列表
PUT    /api/v1/admin/templates/:id # 更新模板
```

### 4.2 WebSocket 接口（实时通知）
```
WS /ws/admin
  → role:updated          # 角色更新通知
  → role:review_requested  # 审核请求通知
  → system:alert          # 系统告警
  → stats:realtime_update # 实时数据更新
```

---

## 5. 数据库设计

### 5.1 核心集合（MongoDB Collection）

#### roles 集合
```javascript
{
  _id: ObjectId,
  
  // 基础信息
  id: String,              // 唯一标识符 'elon-musk'
  name: String,            // 中文名 '埃隆·马斯克'
  englishName: String,     // 英文名 'Elon Musk (愿景驱动型)'
  avatar: String,          // 头像URL
  category: String,        // 分类 '企业家'
  subCategory: String,     // 子分类 '科技创新'
  era: String,             // 时代 '美国 (1971-至今)'
  roleType: String,        // 角色类型 'proposer'
  description: String,     // 一句话简介
  
  // 详细设定
  identity: {
    profession: String,
    knownFor: String,
    influence: String
  },
  
  character: {
    personality: [String],    // 性格特点数组
    speakingStyle: [String],   // 语言风格数组
    values: [String]          // 核心价值观数组
  },
  
  soul: String,               // 完整灵魂设定（长文本）
  
  // 辅助信息
  famousQuotes: [String],     // 经典语录
  works: [String],            // 代表作/成就
  tags: [String],             // 标签（用于搜索）
  
  // 状态管理
  status: Enum,               // draft/pending/published/archived/rejected
  qualityScore: Number,        // 质量评分 0-100
  version: Number,             // 当前版本号
  
  // 元数据
  createdBy: ObjectId,         // 创建人
  updatedBy: ObjectId,         // 最后更新人
  reviewedBy: ObjectId,        // 审核人
  publishedAt: Date,           // 发布时间
  createdAt: Date,
  updatedAt: Date,
  
  // 统计数据
  stats: {
    usageCount: Number,        // 使用总次数
    avgRating: Number,         // 平均评分
    feedbackCount: Number,      // 反馈数量
    lastUsedAt: Date           // 最后使用时间
  },
  
  // 审核记录
  reviewHistory: [{
    reviewerId: ObjectId,
    action: Enum,              // approve/reject/request_changes
    comment: String,
    qualityCheck: {
      soulLength: Boolean,
      hasIdentity: Boolean,
      hasForbiddenBehavior: Boolean,
      hasInteractionGuide: Boolean,
      hasSignatureExpressions: Boolean,
      quotesCount: Number,
      worksCount: Number
    },
    createdAt: Date
  }],
  
  // 版本历史
  versions: [{
    version: Number,
    changes: [String],         // 修改的字段列表
    snapshot: Object,           // 完整快照
    operatedBy: ObjectId,
    operatedAt: Date,
    reason: String             // 修改原因
  }],
  
  isDeleted: Boolean,           // 软删除标记
  deletedAt: Date
}
```

#### admin_users 集合
```javascript
{
  _id: ObjectId,
  username: String,
  passwordHash: String,
  email: String,
  role: Enum,                 // super_admin/content_admin/reviewer/auditor
  permissions: [String],
  status: Enum,                // active/disabled/banned
  lastLoginAt: Date,
  loginIP: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### operation_logs 集合
```javascript
{
  _id: ObjectId,
  operatorId: ObjectId,
  operatorName: String,
  operatorRole: String,
  resourceType: Enum,          // role/user/system/template
  resourceId: String,
  action: Enum,                // create/update/delete/publish/reject...
  details: {
    before: Object,             // 操作前快照
    after: Object,              // 操作后快照
    changedFields: [String]
  },
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

---

## 6. 安全设计

### 6.1 认证与授权
- **JWT Token**: Access Token (15min) + Refresh Token (7d)
- **RBAC模型**: 基于角色的访问控制，细粒度到API级别
- **IP白名单**: 可选配置，限制管理后台访问来源
- **双因素认证**: 超级管理员强制开启2FA

### 6.2 数据安全
- **敏感数据加密**: 密码bcrypt加密，Token随机生成
- **SQL注入防护**: 参数化查询（虽然用NoSQL也要防注入）
- **XSS防护**: 输出转义，CSP策略
- **CSRF防护**: 关键操作需验证CSRF Token
- **文件上传校验**: 类型、大小、病毒扫描

### 6.3 审计与监控
- **操作日志**: 所有写操作100%记录
- **异常告警**: 异常登录、频繁操作、大量删除等触发告警
- **定期备份**: 数据库每日全量备份 + 实时增量备份
- **数据脱敏**: 日志中敏感信息（密码、Token）自动脱敏

---

## 7. 性能要求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **页面加载时间** | < 1.5秒 | 角色列表页首屏 |
| **API响应时间** | < 200ms | 单角色CRUD操作 |
| **并发支持** | 100 QPS | 管理后台正常使用 |
| **数据库查询** | < 50ms | 带索引的标准查询 |
| **文件上传** | 支持 10MB | 单个头像/附件 |
| **批量导入** | 100个/批次 | Excel/JSON导入 |

---

## 8. 部署方案

### 8.1 环境规划
```
开发环境 (dev):
  - URL: dev-admin.prd-debate.renrenup.cn
  - 数据库: prd_debate_dev (MongoDB)
  - 功能: 全功能开放，测试数据

预发布环境 (staging):
  - URL: staging-admin.prd-debate.renrenup.cn
  - 数据库: prd_debate_staging
  - 功能: 生产数据镜像，最终验收

生产环境 (production):
  - URL: admin.prd-debate.renrenup.cn
  - 数据库: prd_debate_prod (主从集群)
  - 功能: 正式对外服务
```

### 8.2 CI/CD 流程
```
代码提交 → 自动触发CI
  ├── 单元测试 (jest)
  ├── 集成测试 (supertest)
  ├── E2E测试 (playwright/puppeteer)
  ├── 代码质量检查 (eslint + prettier)
  ├── 安全扫描 (snyk/sonarqube)
  ├── 构建Docker镜像
  ├── 推送到镜像仓库
  └── 部署到对应环境 (k8s滚动更新)
      └── 自动通知部署结果
          └── 健康检查 & 回滚机制
```

---

## 9. 开发计划

### 9.1 里程碑规划

| 阶段 | 时间 | 交付物 | 优先级 |
|------|------|--------|--------|
| **M1: MVP** | Week 1-2 | 角色CRUD + 基础审核 + 操作日志 | P0 |
| **M2: 增强** | Week 3-4 | 统计仪表板 + 用户管理 + 权限系统 | P1 |
| **M3: 完善** | Week 5-6 | 提示词模板 + 分类管理 + 批量导入导出 | P2 |
| **M4: 优化** | Week 7-8 | 性能优化 + 安全加固 + 监控告警 | P1 |

### 9.2 技术选型确认
**前端框架决策点** (待确认):
- [ ] React + Ant Design Pro
- [ ] Vue3 + Element Plus
- [ ] Next.js + 自定义UI

**后端框架决策点** (待确认):
- [ ] Express + TypeScript
- [ ] Koa + TypeScript
- [ ] NestJS (企业级Node框架)

---

## 10. 验收标准

### 10.1 功能验收清单
- [ ] **角色管理**: CRUD、审核流程、版本历史、批量操作
- [ ] **用户管理**: 多角色权限、操作日志、登录安全
- [ ] **数据统计**: 仪表板、报表、趋势图、导出功能
- [ ] **系统设置**: 全局配置、模板管理、分类管理
- [ ] **安全性**: 认证授权、数据加密、审计日志
- [ ] **性能**: 页面<1.5s、API<200ms、并发100QPS

### 10.2 质量验收标准
- [ ] **代码覆盖率**: 单元测试>80%，集成测试>60%
- [ ] **无Critical级别Bug**
- [ ] **安全扫描**: 无High/Critical级别漏洞
- [ ] **性能测试**: 通过压测（100并发持续30分钟）
- [ ] **兼容性**: Chrome/Firefox/Safari/Edge最新版通过
- [ ] **文档完整性**: API文档、部署手册、运维手册齐全

---

## 附录

### A. 术语表
| 术语 | 解释 |
|------|------|
| **Soul** | 角色灵魂设定，包含完整的性格、思想、行为模式描述 |
| **还原度** | AI扮演该角色时的逼真程度，目标99%+ |
| **RoleType** | 角色在讨论中的定位（proposer/critic/host/reviewer/summarizer） |
| **Prompt Generator** | 提示词生成引擎，根据角色数据动态生成系统提示词 |

### B. 参考资料
- [realPersonPresets.js](./src/data/realPersonPresets.js) - 33位角色完整数据
- [roleManager.js](./server/services/roleManager.js) - 角色管理器源码
- [realPersonPromptGenerator.js](./server/services/realPersonPromptGenerator.js) - 提示词生成器源码
- [test-real-person-roles.js](./test-real-person-roles.js) - 测试脚本及报告

---

**文档结束**

*本PRD文档基于当前已完成的33位真实历史人物角色系统编写，后续将根据实际开发需求持续迭代更新。*