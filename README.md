# PRD辩论APP

基于React Native开发的微信风格AI辩论应用，支持多种讨论模式和角色参与讨论。

## 功能特性

- 🎯 **多种讨论模式**：支持标准正反方辩论、头脑风暴、问题拆解等多种讨论模式
- 👥 **多角色参与**：内置35个预设AI角色，支持自定义添加
- 💬 **流式回复**：即时输出讨论内容，实时显示讨论进度
- 📱 **微信风格UI**：完全复刻微信界面设计，清新浅绿色主题
- 🔍 **发现页面**：AI预设200个议题，随机推荐热门话题
- 🔐 **用户认证**：支持手机号登录和游客模式

## 技术架构

```
├── src/
│   ├── components/     # UI组件
│   │   ├── NavBar.jsx      # 导航栏
│   │   ├── MessageBubble.jsx  # 消息气泡
│   │   ├── ChatItem.jsx      # 会话列表项
│   │   └── TopicCard.jsx     # 议题卡片
│   ├── pages/         # 页面
│   │   ├── ChatList.jsx      # 聊天列表
│   │   ├── Contacts.jsx      # 通讯录
│   │   ├── ChatDetail.jsx    # 聊天详情
│   │   ├── Discover.jsx      # 发现页面
│   │   ├── Profile.jsx       # 个人中心
│   │   └── Login.jsx         # 登录页
│   ├── stores/        # 状态管理
│   │   └── chatStore.js      # Zustand store
│   ├── styles/        # 样式
│   │   └── theme.js          # 主题配置
│   └── App.jsx        # 主应用入口
├── index.js           # Expo入口
└── package.json       # 依赖配置
```

## 颜色主题

| 颜色 | Hex | 用途 |
|------|-----|------|
| 主色调 | `#AFDD22` | 导航栏、按钮、选中状态 |
| 消息气泡(AI) | `#FFFFFF` | AI发送消息 |
| 消息气泡(用户) | `#95EC69` | 用户发送消息 |
| 背景色 | `#F5F5F5` | 页面背景 |

## 开发环境

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
expo install
```

### 启动开发服务器

```bash
npm start
npm run android
npm run ios
npm run web
```

## 项目配置

### 环境变量

创建 `.env` 文件：

```env
API_URL=http://43.139.1.48:9461
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 设计规范

- **设计尺寸**：360×800px（Android主流尺寸）
- **字体规范**：系统默认字体，字号12-18px
- **间距规范**：8px基准网格系统
- **圆角规范**：按钮16px，卡片8px

## 许可证

MIT License