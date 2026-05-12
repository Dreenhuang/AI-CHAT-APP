# PRD辩论APP - 微任务级开发计划 (DEV-PLAN.md)

## 文档信息

| 项目 | 内容 |
|------|------|
| **文档版本** | v1.0 |
| **创建日期** | 2026-05-12 |
| **最后更新** | 2026-05-12 |
| **项目目录** | `G:\ai-gongju\prd-debate\aichat-app` |
| **总Phase数** | 8个 |
| **总Task数** | 156个 |

---

## 一、项目目标

### 1.1 产品定位

构建一款**100%复刻微信UI风格**的AI辩论移动应用，主题色为`#AFDD22`（仅用于微信绿色的地方），核心功能包括：

- **会话列表 + 聊天页面**：历史讨论记录、群组辩论、Soul私聊
- **通讯录管理**：群组列表 + Soul好友列表（支持拖拽排序）
- **发现页**：200个预设议题，随机推送20个，下拉筛选分类
- **个人中心**：用户信息、会员状态、设置管理
- **实时通信**：WebSocket流式消息、100-300字自然表达

### 1.2 技术目标

- **前端框架**：React Native / Expo SDK 55（React Native 0.83 + React 19.2）
- **状态管理**：Zustand v4.5+
- **导航系统**：React Navigation 7.x（Bottom Tabs + Stack）
- **UI框架**：NativeWind v2/v3（Tailwind CSS v3）
- **实时通信**：WebSocket（ws库）
- **后端服务**：Node.js + Express（端口9461已锁定）
- **设计尺寸**：360×800px（Android主流）

### 1.3 验收标准

- ✅ 所有4个Tab页面完整实现且可交互
- ✅ 聊天页面支持群组辩论和Soul私聊两种模式
- ✅ WebSocket实时通信正常工作，流式输出流畅
- ✅ UI 100%复刻微信风格，主题色正确应用
- ✅ 支持游客模式和登录模式
- ✅ 空状态、加载状态、错误处理完善

---

## 二、技术栈确认表（经WebSearch验证）

| 层级 | 技术 | 版本 | 验证来源 | 说明 |
|------|------|------|----------|------|
| **跨平台框架** | Expo | SDK 55 | [Expo官方](https://expo.dev/changelog/sdk-55) | 包含RN 0.83 + React 19.2 |
| **React引擎** | React | 19.2.0 | [RN 0.83发布](https://reactnative.dev/blog/2025/12/10/react-native-0.83) | Activity API + useEffectEvent |
| **React Native** | react-native | 0.83.6 | [GitHub PR #44870](https://github.com/expo/expo/pull/44870) | 仅New Architecture |
| **状态管理** | Zustand | ^4.5.2 | npm latest | 轻量级，无依赖 |
| **导航** | @react-navigation/native | ^7.0.0 | [官方文档](https://reactnavigation.reactnative.net.cn/docs/upgrading-from-6.x/) | 需要RN >= 0.72, Expo >= 52 |
| **底部Tab** | @react-navigation/bottom-tabs | ^7.0.0 | 同上 | Tab图标纯文字风格 |
| **栈导航** | @react-navigation/native-stack | ^7.0.0 | 同上 | popTo新API |
| **UI框架** | nativewind | ^2.0.19 | [官方安装指南](https://www.nativewind.dev/docs/getting-started/installation) | 仅支持Tailwind v3 |
| **Tailwind CSS** | tailwindcss | ^3.4.17 | [NativeWind要求](https://dev.to/cathylai/how-to-set-up-nativewind-tailwind-css-in-your-expo-react-native-app-5g23) | 不支持v4 |
| **动画** | react-native-reanimated | ~3.17.4 | npm | 高性能动画 |
| **手势** | react-native-gesture-handler | ~2.30.0 | Expo SDK 55内置 | 拖拽排序必需 |
| **安全区域** | react-native-safe-area-context | 5.4.0 | npm | 导航栏适配 |
| **本地存储** | @react-native-async-storage/async-storage | latest | Expo官方 | 数据持久化 |
| **Lottie动画** | lottie-react-native | latest | npm | 加载动画 |
| **图标** | @expo/vector-icons | latest | Expo内置 | 发现页灯泡图标 |

**关键兼容性说明：**

1. **Expo SDK 55** 是当前最新稳定版（2026年2月26日发布），**仅支持New Architecture**，不再支持Legacy Architecture
2. **React Navigation 7** 有重大API变更：`navigate()`不再返回已存在的屏幕，需使用新的`popTo()`方法
3. **NativeWind** 当前只支持 **Tailwind CSS v3**（^3.4.17），不支持v4
4. **端口9461** 已锁定用于后端API服务，必须在.env文件中明确配置

---

## 三、数据库设计（Supabase）

### 3.1 数据表清单

| 表名 | 首次创建Phase | 用途说明 | 核心字段 |
|------|---------------|----------|----------|
| **users** | Phase 7 | 用户信息存储 | id(uuid), phone, nickname, vip_status, created_at |
| **groups** | Phase 5 | 辩论群组 | id(uuid), name, mode_id, owner_id, created_at |
| **souls** | Phase 6 | Soul好友定义 | id(uuid), user_id, name, soul_content, is_preset, created_at |
| **group_members** | Phase 5 | 群组成员关系 | id(uuid), group_id, soul_id, role |
| **debates** | Phase 8 | 辩论记录 | id(uuid), user_id, group_id, topic, messages(jsonb), status, created_at |
| **topics** | Phase 4 | 预设议题库（200个） | id(uuid), title, description, category, created_at |

---

## 四、Phase规划总览

| Phase | 名称 | 核心交付物 | 优先级 | 前置依赖 | Task数 |
|-------|------|-----------|--------|----------|--------|
| **Phase 1** | 项目基础搭建 | Expo初始化+NativeWind+Navigation骨架+Store | P0 | 无 | 18个 |
| **Phase 2** | 设计系统建立 | 主题色彩+字体规范+基础组件库(20个组件) | P0 | Phase 1 | 20个 |
| **Phase 3** | Tab导航实现 | 底部4个Tab页面+TabBar定制+导航栏 | P0 | Phase 2 | 16个 |
| **Phase 4** | 发现页实现 | 200议题+随机推送20个+下拉筛选+卡片 | P1 | Phase 3 | 22个 |
| **Phase 5** | 会话列表+聊天 | 会话列表页+群组辩论聊天页+消息气泡 | P0 | Phase 3 | 24个 |
| **Phase 6** | 通讯录+Soul | 群组列表+Soul好友+拖拽排序+CRUD | P0 | Phase 3 | 22个 |
| **Phase 7** | 个人中心+用户体系 | 个人中心+登录注册+游客模式+VIP | P1 | Phase 3 | 18个 |
| **Phase 8** | WebSocket+后端集成 | WS连接+流式输出+后端API对接 | P0 | Phase 5 | 16个 |

**总计：156个微任务**

---

## 五、详细Phase分解

---

# Phase 1: 项目基础搭建 (18个Task)

**目标**：完成Expo项目初始化、依赖安装、NativeWind配置、Navigation骨架搭建

**前置依赖**：无

**交付清单**：
- ✅ Expo SDK 55项目创建完成
- ✅ NativeWind + Tailwind CSS v3 配置完成
- ✅ React Navigation 7 安装配置完成
- ✅ Zustand状态管理初始化
- ✅ 项目目录结构建立
- ✅ .env文件配置（端口9461）
- ✅ TypeScript类型定义完善

**验收标准**：
- `npx expo start --android` 能正常启动并在模拟器/真机显示空白页面
- `npx tsc --noEmit` 无类型错误
- NativeWind的className能正常生效
- NavigationContainer能正常渲染

---

## Task 1.1: 升级Expo SDK到55

**Files:** Modify: `package.json`, `babel.config.js`, Create: `metro.config.js`

**Steps:**
- [ ] 备份现有package.json
- [ ] 更新expo到^55.0.0, react到19.2.0, react-native到0.83.6
- [ ] 更新reanimated到~3.17.4, gesture-handler到~2.30.0
- [ ] 运行`bun install`
- [ ] 检查breaking changes警告

**Verification:** Command: `npx expo doctor` → Expected: "✓ No issues found"

---

## Task 1.2: 安装NativeWind + Tailwind CSS v3

**Files:** Create: `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`, Modify: `babel.config.js`, `metro.config.js`, `App.tsx`

**Steps:**
- [ ] `bun add nativewind react-native-reanimated react-native-safe-area-context`
- [ ] `bun add -d tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo`
- [ ] 创建tailwind.config.js（content路径+nativewind/preset）
- [ ] 创建global.css（@tailwind base/components/utilities）
- [ ] 修改babel.config.js（jsxImportSource: "nativewind" + nativewind/babel预设）
- [ ] 修改metro.config.js（withNativeWind包装）
- [ ] 创建nativewind-env.d.ts（/// <reference types="nativewind/types" />）

**Verification:** 测试组件使用className="flex-1 items-center justify-center bg-white" → 页面居中显示白色背景

---

## Task 1.3: 安装React Navigation 7

**Files:** Modify: `package.json`, Create: `src/navigation/index.tsx`, `src/navigation/types.ts`

**Steps:**
- [ ] `bun add @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context`
- [ ] 创建NavigationContainer包装组件
- [ ] 定义RootStackParamList和RootTabParamList类型

**Verification:** `npx tsc --noEmit` → 无Navigation相关类型错误

---

## Task 1.4: 初始化Zustand Store

**Files:** Create: `src/stores/index.ts`, `src/stores/useAppStore.ts`, `src/stores/types.ts`

**Steps:**
- [ ] `bun add zustand`
- [ ] 定义AppState接口（user, theme, isConnected等）
- [ ] 创建useAppStore（初始状态+actions）
- [ ] 导出store实例

**Verification:** 组件中调用useAppStore → state和actions可用

---

## Task 1.5: 建立项目目录结构

**Files:** 创建完整目录树（见下方）

```
aichat-app/
├── app/
│   ├── _layout.tsx
│   ├── (tabs)/_layout.tsx, index.tsx, contacts.tsx, discover.tsx, me.tsx
│   ├── chat/[id].tsx
│   └── login/index.tsx
├── src/
│   ├── components/ui/ (Button, Input, Card, Avatar, EmptyState, LoadingSpinner, Toast, Badge, Divider, Modal, SegmentControl, DropdownSelect)
│   ├── components/chat/ (MessageBubble, MessageInput, ChatHeader, TypingIndicator)
│   ├── components/topic/ (TopicCard)
│   ├── components/contact/ (GroupListItem, SoulListItem, DraggableList, ModeSelector)
│   ├── components/common/ (SearchBar, ListItem, FABButton, ConfirmDialog)
│   ├── navigation/ (index.tsx, AppNavigator.tsx, TabNavigator.tsx, types.ts, HeaderConfig.tsx)
│   ├── stores/ (index.ts, useAppStore.ts, useChatStore.ts, useContactsStore.ts, useTopicStore.ts, useDebateStore.ts, useAuthStore.ts, types.ts)
│   ├── services/ (api.ts, apiClient.ts, websocket.ts, storage.ts, debateService.ts, contactService.ts, topicService.ts, authService.ts, mockAIService.ts)
│   ├── hooks/ (useAuth.ts, useWebSocket.ts, useDebounce.ts, useTheme.ts, useNetworkStatus.ts, useToast.ts)
│   ├── utils/ (format.ts, validation.ts, date.ts, clipboard.ts, constants.ts)
│   ├── types/ (user.ts, group.ts, soul.ts, debate.ts, message.ts, topic.ts, common.ts)
│   └── constants/ (colors.ts, fonts.ts, sizes.ts, endpoints.ts)
├── data/topics.json (200个预设议题)
├── assets/fonts/, images/, animations/, icons/
└── .env (环境变量)
```

**Verification:** `ls -R src/` → 显示完整目录树

---

## Task 1.6-1.18: 快速清单

- **Task 1.6**: 配置.env文件（API_BASE_URL, WS_URL, SUPABASE配置, APP_NAME, THEME_COLOR=#AFDD22, 端口9461）
- **Task 1.7**: TypeScript严格模式（strict, path别名@/→src/）
- **Task 1.8**: 常量定义文件（colors.ts: #AFDD22/#95EC69/#FFFFFF/#F5F5F5; fonts.ts: 导航栏17sp Bold等; sizes.ts: 360x800/44px/49px; endpoints.ts: 所有API路径）
- **Task 1.9**: 工具函数模块（formatPhoneNumber, truncateText, isValidPhone, isValidCode, isValidPassword）
- **Task 1.10**: HTTP API服务封装（fetch/axios, baseURL, 拦截器, 10s超时, 3次重试）
- **Task 1.11**: AsyncStorage封装（setItem/getItem/removeItem/clear, JSON序列化）
- **Task 1.12**: TypeScript类型定义（User, Group, Soul, Debate, Message, Topic, ApiResponse<T>接口）
- **Task 1.13**: 全局Context Provider（ThemeProvider）
- **Task 1.14**: 配置Expo Router或手动路由（_layout.tsx + NavigationContainer）
- **Task 1.15**: SafeAreaProvider包裹应用 + StatusBar配置
- **Task 1.16**: 创建4个占位Tab页面（显示Tab名称文字）
- **Task 1.17**: TabBar基础样式配置（高度49px+SafeArea, 背景#FFFFFF, 选中#AFDD22, 未选中#888888, 字体10sp）
- **Task 1.18**: Phase 1自检（tsc无错, expo启动成功, NativeWind生效, 4个Tab可切换, .env可读, 目录完整）

---

# Phase 2: 设计系统建立 (20个Task)

**目标**：建立完整的设计系统，包括主题色彩、字体规范、基础UI组件库

**前置依赖**：Phase 1

**交付清单**：
- ✅ Tailwind主题扩展配置完成
- ✅ 20个基础UI组件全部完成
- ✅ 微信视觉规范100%落地
- ✅ Lottie加载动画集成
- ✅ 发现页灯泡图标资源

**验收标准**：所有基础组件能在测试页面正常渲染，props符合TypeScript约束，视觉与UI规范文档一致

---

## Task 2.1: 扩展Tailwind主题配置

**Files:** Modify: `tailwind.config.js`

**Steps:**
- [ ] colors扩展: primary(#AFDD22), bubble-user(#95EC69), bubble-ai(#FFFFFF), bg-page(#F5F5F5), text-primary(#1F1F1F), text-secondary(#888888), border(#E5E5E5), error(#FA5151)
- [ ] fontSize扩展: nav(17sp Bold), title(17sp), body(16sp), caption(15sp), tiny(12sp), tab(10sp)
- [ ] spacing, borderRadius(气泡8px, 按钮4px), boxShadow扩展

**Verification:** 使用`className="bg-primary text-title"` → 样式正确应用

---

## Task 2.2-2.11: 基础UI组件（10个核心组件）

| Task | 组件名 | 文件路径 | 核心Props | 关键样式要点 |
|------|--------|----------|-----------|-------------|
| 2.2 | Button | `src/components/ui/Button.tsx` | title, onPress, variant(primary/secondary/outline/text), size(s/m/l), disabled, loading | primary: #AFDD22背景白字, 高32/40/48px, 17sp Medium |
| 2.3 | Input | `src/components/ui/Input.tsx` | value, onChangeText, placeholder, error, multiline | 16sp, #F5F5F5背景, 圆角4px, focus边框#AFDD22 |
| 2.4 | Card | `src/components/ui/Card.tsx` | children, onPress, variant(elevated/outlined/filled) | 白色背景, 圆角8px, padding 16px, 1px边框或阴影 |
| 2.5 | Avatar | `src/components/ui/Avatar.tsx` | source(URL/string), size(small40/medium48/large72), name(fallback首字母), onlineStatus | 圆形, cover裁剪, 在线绿点8px |
| 2.6 | EmptyState | `src/components/ui/EmptyState.tsx` | icon, title, description, actionLabel, onAction | 居中布局, 标题17sp #888888, 操作按钮primary |
| 2.7 | LoadingSpinner | `src/components/ui/LoadingSpinner.tsx` | size(s/l), color(默认#AFDD22), fullScreen, text | ActivityIndicator, 全屏半透明遮罩 |
| 2.8 | Toast | `src/components/ui/Toast.tsx` + `useToast.ts` hook | visible, message, type(success/error/info), duration | 底部上方80px, rgba(0,0,0,0.8)背景, 3秒自动消失, 全局单例 |
| 2.9 | SearchBar | `src/components/common/SearchBar.tsx` | value, onChangeText, placeholder, onClear | 36px高, #F5F5F5背景, 圆角8px, 左侧搜索图标 |
| 2.10 | ListItem | `src/components/common/ListItem.tsx` | avatar, title, subtitle, rightElement, onPress, showArrow | 高约60px, 标题17sp, 副标题14sp #888888, 底部分割线 |
| 2.11 | FABButton | `src/components/common/FABButton.tsx` | onPress, icon(默认+号), position | 56x56px圆形, #AFDD22背景, 右下距边16px/底100px |

---

## Task 2.12-2.19: 扩展组件（9个辅助组件）

| Task | 组件名 | 说明 |
|------|--------|------|
| 2.12 | LottieAnimation | 安装lottie-react-native, 下载聊天动画JSON, 循环播放包装组件 |
| 2.13 | DiscoverIcon | 下载灯泡图标资源(选中#AFDD22/未选中#888888), 创建组件根据focused切换 |
| 2.14 | SegmentControl | 群聊/好友分段切换, 选中#AFDD22背景白字, 高32px, 平滑滑动动画 |
| 2.15 | DropdownSelect | 发现页分类筛选, iOS Picker或底部弹出Modal, 支持搜索过滤 |
| 2.16 | TopicCard | 议题卡片: 白色背景1px边框圆角8px, 标题17sp Bold, 描述14sp #888888, "开始讨论"按钮 |
| 2.17 | Badge | VIP/未读数/分类标签, small(16px高10sp字)/medium(22px高12sp字), 3种variant配色 |
| 2.18 | Divider | 分割线1px/0.5px宽, 全宽减padding, 支持虚线, 自定义颜色间距 |
| 2.19 | Modal | 半透明遮罩rgba(0,0,0,0.5), 白色内容区圆角12px从底部滑入, 标题栏+关闭按钮 |

---

## Task 2.20: Phase 2自检

**Verification:**
- ✅ 20个基础组件全部完成
- ✅ TypeScript类型定义完整
- ✅ 视觉规范100%符合设计文档
- ✅ 所有组件可独立使用
- ✅ `npx tsc --noEmit` 无错误

---

# Phase 3: Tab导航实现 (16个Task)

**目标**：实现底部4个Tab页面的基础结构和TabBar完整定制

**前置依赖**：Phase 2

**交付清单**：
- ✅ 4个Tab页面基础布局完成
- ✅ TabBar完全定制（微信风格，#AFDD22主题色）
- ✅ 发现页灯泡图标正确显示
- ✅ Tab切换动画流畅
- ✅ 每个Tab页的导航栏配置完成

**验收标准**：4个Tab都能正常显示和切换，TabBar外观与微信一致，导航栏#AFDD22背景正确

---

## Task 3.1-3.8: Tab核心功能

| Task | 任务 | 关键实现点 |
|------|------|-----------|
| 3.1 | 定制TabBar外观 | tab bar高度49+SafeArea, 背景#FFFFFF, borderTop #E5E5E5, activeTintColor #AFDD22, inactive #888888, label fontSize 10sp Regular |
| 3.2 | Tab1-微信(会话列表)骨架 | headerTitle"讨论", headerStyle #AFDD22, SearchBar+FlatList+FAB+EmptyState, mock数据3-5条 |
| 3.3 | Tab2-通讯录骨架 | headerTitle"通讯录", SearchBar+SegmentControl(群聊/好友)+FlatList+FAB+EmptyState, mock数据 |
| 3.4 | Tab3-发现页骨架 | headerTitle"发现", DropdownSelect分类筛选+FlatList(TopicCard列表)+RefreshControl+EmptyState, mock数据10-20条 |
| 3.5 | Tab4-我的(个人中心)骨架 | 无导航栏(微信风格), 顶部用户信息区(Avatar 72px+昵称+手机号+VIP Badge), 统计数据3列, 功能菜单列表, 退出登录 |
| 3.6 | 导航参数类型定义 | RootTabParamList(4个tab), RootStackParamList(Chat/Login/GroupDetail/SoulDetail/TopicDetail/Settings) |
| 3.7 | 导航栏统一样式 | defaultHeaderOptions: backgroundColor #AFDD22, titleStyle white 17sp Bold, tintColor white |
| 3.8 | Tab切换动画优化 | animationEnabled true, swipeEnabled true, 60fps流畅 |

---

## Task 3.9-3.16: 增强功能

| Task | 任务 | 说明 |
|------|------|------|
| 3.9 | 深色模式预留 | useTheme Hook读取系统颜色方案, 定义亮/暗两套色彩变量, 当前仅预留接口 |
| 3.10 | 页面缓存策略 | keepAlive或detachInactiveScreens, 切换Tab不重载, 内存监控 |
| 3.11 | TabBar安全区域适配 | useSafeAreaInsets()动态设置paddingBottom, iPhone X+/Android虚拟键适配 |
| 3.12 | 页面加载状态集成 | 首次加载Lottie动画2秒, LoadingSpinner备用, 下拉刷新短暂loading |
| 3.13 | Error Boundary | 类组件捕获渲染错误, 显示友好错误页面+重试按钮, console.error日志 |
| 3.14 | 网络状态监听 | NetInfo API监听连接, 断网Toast提示"网络连接失败", 恢复自动重试, 更新store.isConnected |
| 3.15 | 滚动回顶部 | 双击Tab图标scrollToOffset({offset:0, animated:true}), 300ms内双击判定 |
| 3.16 | Phase 3自检 | 4个Tab全部可显示, TabBar像素级一致, 导航栏#AFDD22正确, 发现页灯泡图标正常, 动画流畅, 错误处理完善 |

---

# Phase 4: 发现页实现 (22个Task)

**目标**：完整实现发现页功能，包括200个预设议题、随机推送20个、下拉筛选分类

**前置依赖**：Phase 3

**交付清单**：
- ✅ 200个预设议题数据准备完成
- ✅ 议题列表渲染（卡片样式）
- ✅ 下拉筛选功能（按分类）
- ✅ 随机推送逻辑（每次显示20个）
- ✅ 点击议题跳转选择群组/角色
- ✅ 下拉刷新 + 上拉加载更多

**验收标准**：发现页能显示20个议题卡片，分类筛选正常，点击议题能跳转下一步

---

## Task 4.1-4.8: 核心功能

| Task | 任务 | 关键实现 |
|------|------|----------|
| 4.1 | 准备200个预设议题数据 | data/topics.json, 每个议题: id/title/description/category/hotLevel(1-5星), 分类: 科技50/生活40/教育35/社会35/文化25/其他15 |
| 4.2 | 议题数据服务 | topicService: getAllTopics/getRandomTopics(20)/getTopicsByCategory/search/getCategories, 数据源优先级: API>本地JSON>mock, 内存缓存5分钟 |
| 4.3 | 议题列表状态管理 | useTopicStore(Zustand): topics/categories/selectedCategory/isLoading/error, actions: loadTopics/setCategory/refreshTopics/searchTopics |
| 4.4 | 发现页完整布局 | DropdownSelect(固定顶部) + FlatList(TopicCard单列, columnWrapperStyle间距12px) + RefreshControl + EmptyState |
| 4.5 | 分类筛选功能 | DropdownSelect选项: 全部/科技/生活/教育/社会/文化/其他, 选择后setCategory->getByCategory->更新FlatList |
| 4.6 | 随机推送逻辑 | Fisher-Yates洗牌算法真正随机, 下拉刷新重新随机20个, 避免连续重复(记录上次ID集合), hotLevel高权重略高 |
| 4.7 | 议题点击交互 | 点击TopicCard->navigation.navigate('Chat', {debateId:'new', type:'group', topicId}), scale(0.98)按压反馈 |
| 4.8 | 下拉刷新功能 | FlatList refreshControl, onRefresh->refreshTopics(重新随机20或按分类), 指示器颜色#AFDD22 |

---

## Task 4.9-4.16: 增强功能

| Task | 任务 | 说明 |
|------|------|------|
| 4.9 | 议题搜索(可选) | 搜索图标按钮展开SearchBar, 实时防抖300ms搜索, 范围标题+描述 |
| 4.10 | 热度排序 | hotLevel降序, 同hotLevel按时间降序, 前20个默认展示 |
| 4.11 | 议题详情预览Modal | 长按卡片弹出详情(完整标题描述), 底部"开始讨论"+"取消"按钮, 底部滑入动画 |
| 4.12 | 空状态引导 | "暂无议题"/"当前分类下没有找到议题，试试其他分类吧"/"刷新"按钮 |
| 4.13 | 加载更多分页 | 初始20条, onEndReachedThreshold 0.5自动加载下一批20条, 底部spinner, "没有更多了" |
| 4.14 | 收藏功能(可选) | 长按或右上角收藏图标, AsyncStorage持久化, 金色星标, "我的收藏"分类, 上限50 |
| 4.15 | 分享功能(可选) | Share API分享: 议题标题+描述+下载链接, 系统分享面板 |
| 4.16 | 性能优化 | React.memo包裹TopicCard, key={topic.id}, removeClippedSubviews, maxToRenderPerBatch=10, windowSize=21 |

---

## Task 4.17-4.22: 完善与验收

| Task | 任务 | 说明 |
|------|------|------|
| 4.17 | 过渡动画 | 分类切换淡入淡出300ms, reanimated Animated.opacity |
| 4.18 | 离线缓存策略 | 首次加载后缓存AsyncStorage, 离线从缓存读取, 联网后台静默更新, 缓存过期24h |
| 4.19 | 埋点统计(可选) | PV/点击事件/停留时长, console.log预留, 后续对接友盟/神策 |
| 4.20 | 无障碍支持 | accessibilityLabel/hint/role, 屏幕阅读器朗读, WCAG AA对比度 |
| 4.21 | 国际化预留(可选) | zh-CN/en-US语言包, i18next/react-intl, 仅预留接口 |
| 4.22 | Phase 4自测 | 200数据就绪, 随机推送正常, 6个分类筛选OK, 卡片样式符合规范, 点击跳转OK, 下拉刷新/加载更多OK, 离线缓存有效, 性能优秀 |

---

# Phase 5: 会话列表+聊天页面实现 (24个Task)

**目标**：实现核心聊天功能，包括会话列表页、群组辩论聊天页、消息气泡、输入框

**前置依赖**：Phase 3, Phase 2

**交付清单**：
- ✅ 会话列表页完整功能（历史辩论记录）
- ✅ 群组辩论聊天页面（消息气泡+角色头像）
- ✅ 消息输入框（多行+发送按钮）
- ✅ 正在输入状态指示器
- ✅ 消息时间戳控制（不显示）
- ✅ 空状态和加载状态

**验收标准**：会话列表能显示历史辩论记录，进入聊天页能看到消息气泡，能发送消息并看到自己的气泡，AI消息和用户消息样式区分明显

---

## Task 5.1-5.8: 聊天核心架构

| Task | 任务 | 关键实现 |
|------|------|----------|
| 5.1 | 会话列表数据模型和服务 | Conversation接口(id/type/title/avatar/lastMessage/unreadCount/participants/isPinned), debateService(getConversations/deleteConversation/pinConversation/searchConversations), useDebateStore |
| 5.2 | 会话列表页完整功能 | FlatList+ListItem(头像+标题+摘要+未读Badge), 点击navigate到Chat, 长按删除菜单, SearchBar搜索, FAB新建讨论, 置顶排序, EmptyState"暂无讨论记录" |
| 5.3 | 聊天页面路由和结构 | app/chat/[id].tsx, header动态标题(群组名/Soul名), headerStyle #AFDD22, headerRight更多菜单, 消息列表FlatList(inverted反向渲染)+输入区域固定底部+TypingIndicator条件渲染 |
| 5.4 | **消息气泡组件(核心UI)** | MessageBubble: 自己消息右侧对齐背景#95EC69圆角8px padding 10px 12px最大宽度70%, 他人消息左侧对齐背景#FFFFFF圆角8px, 头像40x40px圆形, 发送者名称12sp #888888(仅群组), 连续消息隐藏头像缩小间距4px vs 16px, 文字16sp #1F1F1F自动折行 |
| 5.5 | **消息输入框组件** | MessageInput: TextInput胶囊形(36px高/多行max80px, #F5F5F5背景, 圆角18px, 16sp字体, flex-1) + 发送按钮(36x36px圆形#AFDD22背景白色图标), 多行自适应onContentSizeChange, 仅有内容时激活发送, 回车发送 |
| 5.6 | 正在输入指示器 | TypingIndicator: 输入框上方, 左侧头像32px+"XXX正在输入..."文字13sp #888888, #F5F5F5背景圆角12px, 三个跳动小圆点动画, 断开时显示"用户离线"红色 |
| 5.7 | 聊天头部组件 | ChatHeader: 返回<箭头白色 + 标题17sp Bold #FFFFFF + 更多三点白色, 点击更多弹出菜单(群组成员/群组设置/清空消息 或 Soul资料/删除记录) |
| 5.8 | 消息列表渲染逻辑 | FlatList inverted={true}, data正序排列, renderItem MessageBubble, 消息分组逻辑(同发送者隐藏头像名称不同显示, 时间间隔>5min也显示), 自动滚动底部维护scrollRef |

---

## Task 5.9-5.16: 聊天交互流程

| Task | 任务 | 说明 |
|------|------|------|
| 5.9 | 消息发送流程 | 输入文字->点击发送/回车->创建Message对象(id/debateId/senderId/senderRole/content/timestamp/type/status:'sending')->乐观更新UI(unshift到messages)->清空输入->滚动到底部->WS发送(Phase 8对接) |
| 5.10 | AI回复模拟(Mock) | mockAIService.generateReply(): 根据关键词返回预设回复或模板池随机选取, 控制字数100-300字, 模拟打字延迟分块输出(每块50-100字间隔500ms), 自然口语化拒绝AI腔 |
| 5.11 | 聊天页空状态 | messages为空时显示EmptyState"暂无消息"+"开始讨论吧"+ 可选议题信息+ 可选快捷回复建议3-5个 |
| 5.12 | 聊天页加载状态 | 进入时LoadingSpinner, 加载历史消息(API或AsyncStorage), 上拉加载更早历史分页, 顶部loading indicator |
| 5.13 | 消息长按操作 | 自己消息: 复制/删除/撤回(2min内显示"你撤回了一条消息"), 他人消息: 复制/引用回复/举报, ActionSheet或自定义Modal |
| 5.14 | 消息复制功能 | Clipboard.setString(text), Toast"已复制", iOS/Android兼容 |
| 5.15 | 消息撤回功能 | 条件: 发送时间<2min, 从messages移除原消息插入系统消息"你撤回了一条消息", 通知服务器(Phase 8), >2min不显示撤回选项 |
| 5.16 | 键盘避让 | KeyboardAvoidingView, iOS behavior='padding', Android behavior=null(adjustResize), 键盘弹出时自动滚动到最后一条, 收起恢复正常 |

---

## Task 5.17-5.24: 完善与验收

| Task | 任务 | 说明 |
|------|------|------|
| 5.17 | 未读标记 | 进入聊天页标记已读unreadCount=0, 通知后端(Phase 8), 新消息到达增加count, 会话列表显示Badge |
| 5.18 | 多媒体消息预留 | 当前仅text, 预留image/voice type渲染位置(不崩溃显示占位符) |
| 5.19 | 聊天性能优化 | React.memo MessageBubble(浅比较id+content), FlatList removeClippedSubviews/maxToRenderPerBatch=15/windowSize=21, 避免内联样式对象提取constants, 长列表虚拟化 |
| 5.20 | 消息搜索(可选) | 头部更多->搜索, SearchBar实时搜索内容, 高亮关键词, 跳转位置 |
| 5.21 | 消息导出(可选) | 导出TXT格式"[时间] 发送者: 内容", FileSystem.writeAsStringAsync, Share API分享 |
| 5.22 | **Soul私聊模式差异** | type==='soul': 不显示名称(仅两人), 头像始终显示, 输入框无角色选择, 头部副标题Soul名称; 群组: 显示名称, 连续隐藏头像, 有角色选择, 头部成员数 |
| 5.23 | 错误处理 | 发送失败重试按钮(红色!), 3次失败提示检查网络, 加载失败ErrorBoundary+重试按钮, 断网Toast+"消息将在恢复后发送"+本地队列缓存重发 |
| 5.24 | **Phase 5自测验收** | 会话列表完整, 聊天UI 100%复刻微信, 气泡样式正确(自己#95EC69他人#FFFFFF), 发送接收流畅, Mock AI自然(100-300字口语化), 输入框交互良好, 错误处理完善, 性能优秀 |

---

# Phase 6: 通讯录+Soul管理实现 (22个Task)

**目标**：完整实现通讯录页面，包括群组列表、Soul好友列表、拖拽排序、新建群组/添加好友

**前置依赖**：Phase 3, Phase 2

**交付清单**：
- ✅ 通讯录页完整功能（群组+好友分段切换）
- ✅ 群组列表展示和管理
- ✅ Soul好友列表展示和管理
- ✅ 拖拽排序功能
- ✅ 新建群组流程
- ✅ 添加/自定义Soul流程

**验收标准**：通讯录页能显示群组和好友列表，分段切换正常，拖拽排序功能可用，能新建群组和添加Soul

---

## Task 6.1-6.8: 通讯录核心功能

| Task | 任务 | 关键实现 |
|------|------|----------|
| 6.1 | 通讯录数据模型和服务 | contactService: getGroups/getSouls/createGroup/updateGroup/deleteGroup/addSoul/updateSoul/deleteSoul/reorderGroups/reorderSouls, useContactStore状态管理 |
| 6.2 | 通讯录页完整布局 | SearchBar点击展开 + SegmentControl(群聊/好友切换) + FlatList(群组or好友) + FAB(+) + EmptyState(群组空/好友空分别处理) |
| 6.3 | 群组列表项 | GroupListItem: 群组图标48px + 群组名称17sp + 成员数副标题 + 箭头>, 点击导航群组详情/群聊, 长呼出删除/置顶菜单 |
| 6.4 | Soul好友列表项 | SoulListItem: Soul头像48px + Soul名称17sp + 预设/自定义Badge + 描述副标题, 点击导航Soul私聊, 长呼出编辑/删除 |
| 6.5 | **拖拽排序功能** | 安装react-native-draggable-flatlist, DraggableFlatList替代FlatList, onDragEnd回调获取新顺序->保存reorderGroups/reorderSouls->更新store, 视觉反馈: 拖拽项放大1.05倍+其他项让位+背景高亮, 拖拽手柄六点图标:::, 拖拽中禁用其他交互 |
| 6.6 | **新建群组流程** | FAB触发->Modal/新页面表单: 群组名称(必填<20字) + 图标(可选上传/预设) + 讨论模式选择(Picker 19种之一) + 初始成员(可选), 表单验证->contactService.createGroup()->成功Toast->跳转聊天或返回通讯录 |
| 6.7 | **添加Soul好友流程** | FAB"添加好友"->Modal/新页面, A.预设Soul: 显示10-20个常见角色列表点击添加; B.自定义Soul: Soul名称(必填) + 头像(可选) + 性格描述TextArea(必填50-200字) + 说话风格(温和/犀利/幽默/理性) + 专业领域(科技/人文/商业/艺术), 提交addSoul()->成功Toast->跳转私聊或返回 |
| 6.8 | 群组详情页 | app/group/[id].tsx: 顶部大图标+名称+编辑, 中上信息(创建时间/模式/成员数), 中下成员列表(头像+名称+角色Badge, 查看/添加/移除/编辑角色), 底部"进入讨论"(主按钮#AFDD22)+"编辑群组"+"解散群组"(红色二次确认) |

---

## Task 6.9-6.16: 通讯录增强功能

| Task | 任务 | 说明 |
|------|------|------|
| 6.9 | Soul详情/编辑页 | app/soul/[id].tsx: 大头像+名称, 详细信息(类型/描述/风格/领域/时间), "开始私聊"+"编辑资料"(自定义Soul)+"删除好友"(红色确认) |
| 6.10 | 通讯录搜索 | 点击顶部展开SearchBar, 实时搜索当前段(群组搜名称, 好友搜名称描述), 防抖300ms, 高亮关键词, 无结果"未找到结果", 点击外侧收回 |
| 6.11 | 空状态处理 | 群组空: "暂无群组"+"还没有创建任何群组，快去创建第一个吧"+"创建群组"; 好友空: "暂无好友"+"添加Soul好友，开始一对一深度交流"+"添加好友"; 搜索空: "未找到结果"+"换个关键词试试" |
| 6.12 | 删除确认对话框 | ConfirmDialog通用组件(title/message/confirmText/cancelText/onConfirm/onCancel), 群组:"解散「XXX」?不可恢复"/"解散"(红色); 好友:"删除「XXX」?聊天记录将被清除"/"删除"(红色) |
| 6.13 | 列表动画 | 入场: 从右侧滑入交错延迟stagger 300ms Easing.out(Easing.quad); 删除: 淡出+左滑250ms; 分段切换: 交叉淡入淡出 |
| 6.14 | 性能优化 | React.memo GroupListItem/SoulListItem, FlatList虚拟化, 避免内联onPress, 图片resizeMode+cache, 大列表分页(>50条时) |
| 6.15 | 群组成员管理 | 成员列表FlatList, 每项: 头像+名称+角色Badge, 左滑删除/点击详情, 添加: 弹出Soul选择器(从已有好友选)或新建, 移除: 左滑/长呼菜单+ConfirmDialog, 角色: 指定主持人/正方/反方/评委(影响聊天显示) |
| 6.16 | 讨论模式选择器 | ModeSelector组件: 19种讨论模式列表, 每个显示: 名称+一句话描述+适用场景标签+人数推荐, 单选选中高亮, 用于新建/编辑群组 |

---

## Task 6.17-6.22: 完善与验收

| Task | 任务 | 说明 |
|------|------|------|
| 6.17 | 数据持久化 | AsyncStorage保存contacts_groups/souls/order/last_updated, 每次增删改自动保存, 启动时本地加载, 后台静默同步云端(Phase 7), 冲突以最新操作为准 |
| 6.18 | 数据导入导出(可选) | 导出JSON(群组+好友+排序), Share API分享, 导入: 选择JSON文件->解析合并->冲突提示, 备份换机迁移 |
| 6.19 | 权限隐私(可选) | 群组可见性公开/私密, 私密仅成员可见, 好友单向关注 or 双向, 黑名单屏蔽, 当前阶段仅预留接口 |
| 6.20 | 批量操作(可选) | 长按进入多选模式, 顶部选中数量+操作按钮, 批量删除/移动分组/添加群组, 全选/取消全选 |
| 6.21 | 快速跳转(可选) | 右侧字母索引A-Z(大量好友时), 点击跳转首字母, 当前字母高亮, 顶部粘性分组标题(群聊/好友), 仅大数据量时显示 |
| 6.22 | **Phase 6自测验收** | 布局正确(群组在前好友在后), 分段切换流畅, 群组CRUD完整, Soul CRUD完整, 拖拽排序正常, 搜索实时响应, 空状态引导清晰, 数据持久化有效, 性能优秀 |

---

# Phase 7: 个人中心+用户体系实现 (18个Task)

**目标**：实现个人中心页面、登录注册流程、游客模式

**前置依赖**：Phase 3, Phase 2

**交付清单**：
- ✅ 个人中心页面完整功能（用户信息、统计数据、功能菜单）
- ✅ 登录注册页面（手机号+验证码）
- ✅ 游客模式（完整功能但不保存数据）
- ✅ VIP会员状态显示
- ✅ 设置页面

**验收标准**：个人中心页显示正确的用户信息，登录注册流程完整可用，游客模式能正常使用核心功能，VIP状态正确显示

---

## Task 7.1-7.8: 用户体系核心

| Task | 任务 | 关键实现 |
|------|------|----------|
| 7.1 | 用户认证服务 | authService: sendVerifyCode/verifyCode/register/loginWithGuest/logout/getCurrentUser/refreshToken, Token AsyncStorage存储, 请求自动注入Authorization, 401自动刷新token, useAuthStore, useAuth Hook封装 |
| 7.2 | **登录页面** | app/login/index.tsx: Logo(#AFDD22背景+"辩"字) + 手机号Input(86+号码maxlength11) + 验证码Input(4位数字) + 获取验证码按钮(倒计时60s) + 登录按钮(#AFDD22) + 游客入口("先看看"), 验证(手机号11位1开头+验证码4位数字)->verifyCode()->成功保存token/user->MainTabs, 失败Toast, sendVerifyCode->60s倒计时, 游客loginWithGuest->MainTabs标记游客身份 |
| 7.3 | 注册流程 | 登录页内Tab切换(登录/注册)或独立注册页, 注册表单: 手机号+验证码+密码(6位以上+强度指示)+确认密码+用户协议勾选, register()->成功自动登录->MainTabs |
| 7.4 | **个人中心页面** | app/(tabs)/me.tsx(无导航栏微信风格): 顶部用户区(Avatar 72px+昵称17sp Bold+手机号14sp #888888格式化138****1234+VIP Badge), 统计数据3列(辩论记录/群组/好友数量, 点击跳转), 功能菜单(账号设置: 资料/账号安全/通知设置; 支持: 帮助反馈/关于我们/检查更新; 其他: 清除缓存/退出登录红色), 版本信息"PRD辩论APP v1.0.0" |
| 7.5 | VIP会员状态显示 | VipBadge组件: VIP会员(渐变金背景+白字+👑皇冠), 正式会员(#AFDD22背景白字), 免费用户(#F5F5F5背景#888888字), 22px高12sp Medium, 个人中心+聊天头部显示 |
| 7.6 | **游客模式限制** | 限制规则: 最多5条辩论记录(超出自动删最早), 最多3个群组, Soul好友无限制, 数据仅本地不同步云端, 部分功能标注"登录后解锁", 检查: 创建前检查数量<5/<3, 超出弹窗"达到免费版上限"+"登录解锁无限"+"[立即登录][稍后再说]", 游客标签显示 |
| 7.7 | 设置页面 | app/settings/: headerTitle"设置"#AFDD22背景, 账号设置(昵称/头像ImagePicker/密码), 通知设置(推送Toggle/声音Toggle/震动Toggle), 通用(字体大小/语言/清除缓存显示大小), 关于(版本/协议/隐私/检查更新), Toggle使用Switch或自定义 |
| 7.8 | 个人资料编辑 | app/profile/edit: 头像点击更换(expo-image-picker相机/相册+裁剪正方形+上传OSS/Base64), 昵称Input(2-20字符必填), 性别Radio(男/女/保密), 个性签名TextArea(50字内可选), 验证->API更新->成功返回个人中心刷新, 失败错误提示 |

---

## Task 7.9-7.16: 用户体系完善

| Task | 任务 | 说明 |
|------|------|------|
| 7.9 | 修改密码 | 旧密码+新密码+确认新 password输入, 验证(旧密码必填/新>6位≠旧/确认一致+强度提示), changePassword()->成功Toast->跳转Login需重新登录 |
| 7.10 | 忘记密码(可选) | 4步流程: 输入手机号->获取验证码->新密码+确认->提交重置->跳转Login |
| 7.11 | 用户协议+隐私政策 | app/legal/agreement + /privacy: WebView远程URL或ScrollView纯文本, headerTitle对应, 注册必须勾选同意, 占位符文本待法务审核 |
| 7.12 | 清除缓存功能 | 计算缓存大小(AsyncStorage估算+Image缓存, 显示如"12.5MB"), ConfirmDialog确认->AsyncStorage.clear(保留token)+Image.clearDiskCache()->Toast"已清除"->刷新显示新大小(~0) |
| 7.13 | 关于我们 | app/about: App Logo大+名称"PRD辩论APP"+版本号app.json读取+简介+团队+版权©2026+链接(协议/隐私/意见反馈邮件)+检查更新按钮 |
| 7.14 | 退出登录 | 页面底部红色"退出登录", ConfirmDialog"确定要退出登录?"->确认logout()->清除token/userInfo->重置所有Store->导航Login(reset stack)->Toast"已退出"; 游客退出: "退出将清除所有本地数据"->清除AsyncStorage全部->Login |
| 7.15 | Session管理和自动登录 | App启动检查本地token->存在则verifyToken有效性->有效自动登录MainTabs->无效清除token显Login页; Token刷新: 401响应时/App后台恢复前台时/定时; Session超时:"登录已过期请重新登录"->Login |
| 7.16 | 手机号格式化和验证 | 输入格式化: 自动空格138 1234 5678或纯数字, 限11位数字, 非数字过滤; 验证正则/^1[3-9]\d{9}$/, 实时+提交验证, 错误"请输入正确的手机号"; 国际区号(可选) 默认+86可切换 |

---

## Task 7.17-7.18: 收尾与验收

| Task | 任务 | 说明 |
|------|------|------|
| 7.17 | 验证码倒计时组件 | CountdownButton: 默认"获取验证码"蓝色可点击->倒计时"60s后重新获取"灰色disabled->结束后恢复, useState+useEffect+setInterval, 卸载清理timer, 14sp字体 |
| 7.18 | **Phase 7自测验收** | 个人中心信息完整正确, 登录注册流程通畅, 游客模式限制生效(5辩论3群组), VIP状态显示正确, 设置页功能完整, Session自动登录正常, 退出登录清理彻底, 手机号验证码交互良好 |

---

# Phase 8: WebSocket实时通信+后端集成 (16个Task)

**目标**：实现WebSocket实时通信、流式输出、后端API完整对接

**前置依赖**：Phase 5（聊天页面）

**交付清单**：
- ✅ WebSocket连接管理（连接/断开/重连）
- ✅ 消息实时收发
- ✅ AI流式输出（chunk by chunk）
- ✅ 后端REST API完整对接
- ✅ 离线消息队列
- ✅ 心跳保活机制

**验收标准**：WebSocket连接稳定，消息实时送达，流式输出流畅自然，断线自动重连

---

## Task 8.1-8.8: WebSocket核心

| Task | 任务 | 关键实现 |
|------|------|----------|
| 8.1 | WebSocket服务封装 | websocket.ts: 连接管理类, 构造函数接收url(从env EXPO_PUBLIC_WS_URL), connect()/disconnect()/send()/onMessage()/onClose()/onError(), 自动重连指数退避(1s/2s/4s/8s最大30s最大5次), 心跳ping/pong间隔30s |
| 8.2 | useWebSocket Hook | 状态: isConnected/isConnecting/error/reconnectAttempts, 方法: connect/send/disconnect, 生命周期: 组件挂载connect卸载disconnect, 网络状态变化时重连, 与useNetworkStatus联动 |
| 8.3 | WS消息协议定义 | 类型: debate:start(客户端->服务端开始辩论), debate:message(双向辩论消息), debate:stream:chunk(服务端->客户端流式输出块), debate:complete(服务端->客户端辩论完成), debate:stop(客户端->服务端停止), debate:error(服务端->客户端错误) |
| 8.4 | WS消息序列化/反序列化 | JSON.stringify/parse, 消息体{type, payload, timestamp, messageId}, messageId UUID唯一标识, timestamp ISO格式, 错误处理(parse异常容错) |
| 8.5 | 连接状态UI同步 | isConnected变化时更新聊天页TypingIndicator, 断连显示"用户离线"红色, 重连中显示"正在重连..."橙色+进度, 连接成功隐藏指示器, Toast提示断连/重连成功 |
| 8.6 | 消息发送通过WS | 修改Task 5.9发送流程: 替换Mock为真实WS发送, {type:'debate:message', payload:{debateId, senderId, content, role}}, 发送乐观更新UI不变, 发送失败加入离线队列, WS重连后补发离线消息 |
| 8.7 | 消息接收通过WS | websocket.onMessage回调, 根据type分发: debate:message->插入messages数组+滚动底部; debate:stream:chunk->追加到当前AI消息content(打字效果); debate:complete->标记消息完成+停止TypingIndicator; debate:error->Toast错误提示 |
| 8.8 | **AI流式输出实现** | 接收到debate:stream:chunk时: 如果当前最后一条是AI消息则追加content否则创建新AI消息, 每50-100字触发一次UI更新(避免频繁setState性能问题), 打字光标闪烁效果(可选), chunk间隔模拟自然打字速度, 完整消息100-300字自然口语化 |

---

## Task 8.9-8.16: 后端集成与完善

| Task | 任务 | 说明 |
|------|------|------|
| 8.9 | 后端REST API对接 | 替换所有Mock数据为真实API调用: GET /api/health健康检查, POST /api/auth/login/register/send-code, GET/POST /api/groups, GET/POST/DELETE /api/souls, GET/POST /api/topics/random, GET/POST /api/debates, apiClient统一处理baseURL(localhost:9461)->生产环境43.139.1.48:9461 |
| 8.10 | Supabase集成 | 安装@supabase/supabase-js, 初始化client(EXPO_PUBLIC_SUPABASE_URL+ANON_KEY), 用户认证: signUp/signInWithOauth/signOut/getUser getCurrentSession, 数据库查询: from('tables').select().insert().update().delete(), 实时订阅: supabase.channel().on('postgres_changes') |
| 8.11 | 离线消息队列 | 离线时消息存入AsyncStorage队列(key:'offline_messages'), 数组结构[{message, retryCount, createdAt}], WS连接成功后逐条补发, 补发成功从队列移除, 补发失败retryCount++(最多3次->丢弃+Toast"消息发送失败"), App启动时检查并补发残留队列 |
| 8.12 | 心跳保活机制 | setInterval 30s发送{type:'ping'}, 服务端响应{type:'pong'}, 连续3次pong超时判定断连->触发重连, 心跳数据轻量(仅type字段), 网络切换时立即发送ping检测 |
| 8.13 | 消息去重和顺序保证 | messageId全局唯一(UUID), 接收消息时检查是否已存在(防止重复投递), 按timestamp排序显示(解决乱序问题), 本地messageId与服务器messageId映射(可选) |
| 8.14 | 大消息分片传输 | 消息内容>1000字符时分片发送: {type:'debate:message:start', totalChunks, messageId} -> {type:'debate:message:chunk', chunkIndex, data} -> {type:'debate:message:end', messageId}, 接收端重组完整消息, 防止WS帧大小限制截断 |
| 8.15 | WebSocket性能优化 | 消息批量更新(useRef缓存messages减少setState频率, 100ms批处理), 长列表虚拟化(Phase 5.19已有), 图片/文件消息懒加载, 内存泄漏预防(组件卸载时取消订阅cleanup) |
| 8.16 | **Phase 8自测验收** | WS连接稳定(手动断网重连成功), 消息实时收发<500ms延迟, 流式输出自然流畅(打字效果), 后端API全部对接成功, 离线队列补发正常, 心跳保活不断连, 消息去重无重复, 大消息分片传输完整, 性能优秀(长时间聊天不卡顿) |

---

## 六、开发规则

### 6.1 编码规范

1. **TypeScript strict模式**：所有文件必须通过`tsc --noEmit`检查
2. **组件命名**：PascalCase（MessageBubble.tsx），文件名与组件名一致
3. **Hook命名**：use开头（useAuth, useWebSocket）
4. **常量命名**：UPPER_SNAKE_CASE（API_BASE_URL, THEME_COLOR）
5. **接口命名**：PascalCase + I前缀可选（IUserProps或UserProps均可）
6. **CSS类名**：kebab-case，使用Tailwind utility classes优先
7. **注释要求**：复杂逻辑必须有中文注释，说明"为什么"而非"做什么"

### 6.2 Git提交规范

- **feat**: 新功能
- **fix**: Bug修复
- **style**: 格式调整（不影响代码运行）
- **refactor**: 重构（既不是新功能也不是修复）
- **perf**: 性能优化
- **test**: 测试相关
- **docs**: 文档
- **chore**: 构建/工具链变更

**Commit Message格式**：
```
type(scope): subject

body (optional)

footer (optional)
```

示例：
```
feat(chat): 实现消息气泡组件

- 完成自己和他人消息的差异化样式
- 支持连续消息头像隐藏
- 添加消息长按操作菜单

Closes #123
```

### 6.3 分支策略

- **main**: 生产分支，只接受Merge Request
- **develop**: 开发分支，每个Phase完成后合并
- **feature/phase-N**: 功能分支，每个Phase一个分支
- **hotfix/**: 紧急修复分支

### 6.4 Code Review Checklist

- [ ] TypeScript无类型错误
- [ ] 无console.log/debugger遗留（允许console.warn/error）
- [ ] 无硬编码的魔法数字（提取为常量）
- [ ] 组件props有完整的TypeScript接口定义
- [ ] 异步操作有错误处理（try/catch或.catch）
- [ ] 网络请求有超时和重试机制
- [ ] UI在不同屏幕尺寸下表现合理（至少测试360x800和375x812）
- [ ] 无内存泄漏（useEffect cleanup, 事件监听器移除）
- [ ] 符合微信UI视觉规范（颜色/字体/间距）

### 6.5 性能基准

- **启动时间**：<3秒（冷启动）
- **Tab切换**：<100ms
- **消息列表滚动**：保持55-60 FPS
- **内存占用**：<200MB（正常使用场景）
- **APK体积**：<50MB（Release模式）
- **WebSocket消息延迟**：<500ms

---

## 七、风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Expo SDK 55兼容性问题 | 中 | 高 | 先在测试设备验证，保留SDK 54回退方案 |
| NativeWind v2/v3 API差异 | 中 | 中 | 严格按照官方安装指南，锁定tailwindcss@^3.4.17 |
| React Navigation 7 breaking changes | 高 | 中 | 仔细阅读升级指南，特别注意navigate/popTo变更 |
| WebSocket在移动网络不稳定 | 高 | 高 | 实现健壮的重连机制+离线队列+心跳保活 |
| 后端API 9461端口部署延迟 | 低 | 高 | 前期使用Mock数据，后端就绪后无缝切换 |
| Android机型碎片化 | 中 | 中 | 至少测试3款主流机型（华为/小米/OPPO） |
| Lottie动画包体积过大 | 低 | 低 | 选择轻量级动画JSON（<100KB） |
| Supabase免费额度不足 | 低 | 高 | 监控用量，准备迁移到自建PostgreSQL方案 |

---

## 八、后续迭代规划（超出本次DEV-PLAN范围）

### Phase 9: 推送通知（P2）
- 极光推送/华为推送集成
- 辩论结束通知
- 新消息推送
- 通知点击跳转到对应聊天

### Phase 10: 数据同步与备份（P2）
- 本地<->云端双向同步
- 冲突解决策略（以云端为准/以最新为准/手动选择）
- 数据导出（JSON/TXT/PDF）
- 多设备登录同步

### Phase 11: 社交增强（P2）
- 分享辩论记录到社交平台
- 邀请好友加入群组
- 辩论精彩片段生成（AI总结）
- 成就系统/等级体系

### Phase 12: 发布上线
- 应用商店素材准备（截图/描述/关键词）
- APK/AAB打包签名
- 应用市场上架（应用宝/华为/小米/OPPO/vivo）
- 用户反馈收集渠道建立
- 崩溃监控（Bugly/Sentry）
- 性能监控（PerfDog/Firebase）

---

## 九、附录

### A. 环境变量完整列表

```env
# ====================
# 后端API配置（端口9461已锁定）
# ====================
EXPO_PUBLIC_API_BASE_URL=http://43.139.1.48:9461
EXPO_PUBLIC_WS_URL=ws://43.139.1.48:9461/ws

# ====================
# Supabase配置
# ====================
EXPO_PUBLIC_SUPABASE_URL=https://jaduaifzmgvaotyqnjfe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_-oEDqL3QIqzluxLgonXHZg_hMTYXZJE

# ====================
# 应用配置
# ====================
EXPO_PUBLIC_APP_NAME=PRD辩论APP
EXPO_PUBLIC_THEME_COLOR=#AFDD22
EXPO_PUBLIC_DESIGN_WIDTH=360
EXPO_PUBLIC_DESIGN_HEIGHT=800

# ====================
# 功能开关
# ====================
EXPO_PUBLIC_ENABLE_GUEST_MODE=true
EXPO_PUBLIC_MAX_FREE_DEBATES=5
EXPO_PUBLIC_MAX_FREE_GROUPS=3
```

### B. 关键依赖版本锁定

```json
{
  "dependencies": {
    "expo": "^55.0.0",
    "react": "19.2.0",
    "react-native": "0.83.6",
    "zustand": "^4.5.2",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "nativewind": "^2.0.19",
    "tailwindcss": "^3.4.17",
    "react-native-reanimated": "~3.17.4",
    "react-native-gesture-handler": "~2.30.0",
    "react-native-safe-area-context": "5.4.0",
    "@react-native-async-storage/async-storage": "latest",
    "lottie-react-native": "latest",
    "@expo/vector-icons": "latest"
  }
}
```

### C. 设计规范速查表

| 元素 | 规格 |
|------|------|
| 主色调 | #AFDD22（仅微信绿色处） |
| 用户消息气泡 | #95EC69 |
| AI消息气泡 | #FFFFFF |
| 页面背景 | #F5F5F5 |
| 卡片背景 | #FFFFFF |
| 主文字 | #1F1F1F |
| 次要文字 | #888888 |
| 分割线 | #E5E5E5 |
| 错误提示 | #FA5151 |
| 导航栏高度 | 44px + 状态栏 |
| TabBar高度 | 49px + 安全区域 |
| 导航栏标题 | 17sp Bold #FFFFFF |
| 列表标题 | 17sp Regular #1F1F1F |
| 消息内容 | 16sp Regular #1F1F1F |
| Tab标签 | 10sp Regular |
| 设计尺寸 | 360×800px |
| 小头像 | 40×40px |
| 中头像 | 48×48px |
| 大头像 | 72×72px |
| 气泡圆角 | 8px |
| 气泡内边距 | 10px 12px |
| 气泡最大宽度 | 70%屏幕宽度 |
| 消息间距(同角色) | 4px |
| 消息间距(不同角色) | 16px |
| 推荐消息字数 | 100-300字/条 |
| 禁止表达 | "作为一个AI..." / "从多个角度..." / "综上所述..." |

---

*文档版本：v1.0*
*创建日期：2026-05-12*
*生成工具：dev-planner skill powered by GLM-5V-Turbo*
*预计总工期：6-8周（全职开发）*
