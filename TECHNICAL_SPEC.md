# AI-Native CMS 技术方案文档

> 基于 Cloudflare 全家桶的 AI 时代内容管理系统
> 版本：v1.0 | 日期：2026-05-09

---

## 一、产品定位

### 核心理念

```
不是"带AI功能的CMS"
而是"AI雇了一个网站团队，人只负责方向"
```

| 传统CMS | AI-Native CMS |
|---------|--------------|
| 人建站、人写内容、人做SEO | 人提需求，AI建站运营 |
| AI是功能插件 | AI是核心驱动力 |
| 需要技术门槛 | 对话即可完成一切 |
| 手动维护更新 | AI自主定期运营 |

### 用户角色

- **普通用户**：只需提供网站方向和偶尔审核，无需任何技术能力
- **开发者**：可开发自定义主题/插件，通过 GitHub 管理代码
- **AI Agent**：负责内容创作、SEO优化、主题迭代、数据分析

---

## 二、技术栈（全免费）

| 层级 | 技术 | 用途 | 免费额度 |
|------|------|------|---------|
| 前端/SSR | Next.js 15 (App Router) | 前台展示 + 管理后台 | - |
| 托管 | Cloudflare Pages | 全球边缘部署 | 无限带宽 |
| API | Pages Functions（内置）| 边缘 API，无需独立 Workers | 10万请求/天 |
| 数据库 | Cloudflare D1 (SQLite) | 内容/配置/插件数据 | 10个库/5GB |
| 存储 | Cloudflare R2 | 图片/文件/主题资源 | 10GB/100万操作 |
| AI推理 | Workers AI | 内容生成/图片生成/Embedding | 每日免费额度 |
| 定时任务 | Cloudflare Cron Triggers | AI Agent 定时运营 | 免费 |
| 异步队列 | Cloudflare Queues | AI任务异步处理 | 100万消息/月 |
| 向量搜索 | Cloudflare Vectorize | 语义搜索/防重复选题 | 3万向量免费 |
| 代码托管 | GitHub | 版本管理/自动部署 | 免费 |
| 自动部署 | GitHub → Cloudflare Pages CI | 每次push自动部署 | 500次构建/月 |

### AI 模型选型（Workers AI）

| 用途 | 模型 |
|------|------|
| 文章写作/对话/SEO | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| 图片生成（配图/OG图）| `@cf/black-forest-labs/flux-1-schnell` |
| 图片理解（Alt生成）| `@cf/llava-hf/llava-1.5-7b-hf` |
| 文本向量化 | `@cf/baai/bge-base-en-v1.5` |

---

## 三、系统架构

```
┌─────────────────────────────────────────────────────┐
│                   用户 / AI Agent                    │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  前台网站    │        │  Admin后台  │
    │ (Next.js)   │        │ (Next.js)   │
    └──────┬──────┘        └──────┬──────┘
           │                      │
    ┌──────▼──────────────────────▼──────┐
    │         Pages Functions API         │
    │  (路由 / 认证 / 业务逻辑)           │
    └────┬──────┬──────┬──────┬──────────┘
         │      │      │      │
    ┌────▼─┐ ┌──▼─┐ ┌──▼──┐ ┌▼────────┐
    │  D1  │ │ R2 │ │ KV  │ │Workers │
    │ 数据 │ │文件│ │缓存 │ │  AI    │
    └──────┘ └────┘ └─────┘ └────────┘
         │
    ┌────▼──────────────┐
    │   GitHub API      │
    │ (代码/主题/插件)  │
    └───────────────────┘
```

---

## 四、内容类型系统

### 内置内容类型

| 类型 | slug | 说明 | 适用场景 |
|------|------|------|---------|
| 文章 | `post` | 有时间/分类/标签/作者 | 博客、新闻、资讯 |
| 页面 | `page` | 无时间线，层级结构 | 关于/联系/隐私政策 |
| 产品 | `product` | 有价格/规格/库存 | 电商、产品介绍 |
| 作品集 | `portfolio` | 有封面/项目链接/技术栈 | 个人/设计/开发展示 |

### 自定义内容类型（Admin可配置）

在 Admin 后台动态创建任意内容类型，无需改代码：

```
/admin/settings/content-types

已有类型: post / page / product / portfolio

+ 新建内容类型
  ├── 显示名称: 课程
  ├── slug: course
  ├── 图标: 📚
  ├── 是否有时间线: 是
  ├── 是否支持评论: 否
  └── 自定义字段:
      ├── 难度等级   (select: 初级/中级/高级)
      ├── 价格       (number, 单位: 元)
      ├── 讲师姓名   (text)
      ├── 视频链接   (url)
      ├── 是否免费   (boolean)
      └── 封面图     (image)
```

### 自定义字段类型

| 字段类型 | 说明 | 示例 |
|---------|------|------|
| `text` | 单行文本 | 副标题、作者名 |
| `textarea` | 多行文本 | 简介 |
| `number` | 数字 | 价格、评分 |
| `boolean` | 开关 | 是否精选 |
| `select` | 下拉选择 | 难度级别 |
| `multiselect` | 多选 | 技术栈 |
| `date` | 日期 | 活动时间 |
| `image` | 单图 | 封面图 |
| `images` | 多图 | 作品集图组 |
| `url` | 链接 | 项目地址 |
| `relation` | 关联其他内容 | 相关课程 |

### 前台路由规则

```
/                          首页
/[post-slug]               文章（post类型）
/page/[page-slug]          独立页面
/product/[product-slug]    产品页
/portfolio/[item-slug]     作品集
/[type]/[slug]             自定义类型（自动生成路由）

/category/[slug]           分类归档
/tag/[slug]                标签归档
/author/[slug]             作者归档
```

---

## 五、配置管理（两层）

### 层1 — wrangler.toml（基础设施绑定）

```toml
name = "cms-mysite"

[[d1_databases]]
binding = "DB"
database_name = "cms-mysite-db"
database_id = "xxxx"

[[r2_buckets]]
binding = "R2"
bucket_name = "cms-mysite-media"

[ai]
binding = "AI"

[[queues.producers]]
binding = "QUEUE"
queue = "cms-mysite-tasks"

[[queues.consumers]]
queue = "cms-mysite-tasks"
max_batch_size = 5

[triggers]
crons = ["0 2 * * *"]  # 每天凌晨2点运行 AI 运营任务
```

### 层2 — D1 settings 表（所有业务配置）

所有配置在 Admin 后台管理，AI 和人工都可修改，实时生效：

```
站点基础：名称 / Logo / 描述 / favicon
SEO：默认标题模板 / meta描述模板 / robots规则
主题：当前主题 / CSS变量（颜色/字体/间距）
导航：菜单结构 / 页脚链接
AI设置：自主权限级别 / 内容计划频率 / 写作风格偏好
插件：已安装插件列表 / 每个插件的独立配置
社交账号：Twitter / 微博 / 微信等
内容类型：自定义类型定义（JSON存储）
```

### AI 自主权限级别

```
保守模式  → AI只提建议，所有修改需人工确认后执行
标准模式  → 内容类AI自动执行，代码/主题类需人工确认
自主模式  → AI全权处理，每日生成汇报，人可随时覆盖
```

---

## 六、多实例管理

### 策略：一套代码，多次部署

```
GitHub: your-cms（模板仓库）
    ↓ 用户fork或npx安装
用户Cloudflare账号：
    ├── cms-blog      → D1: cms-blog-db      + R2: cms-blog-media
    ├── cms-shop      → D1: cms-shop-db      + R2: cms-shop-media
    └── cms-docs      → D1: cms-docs-db      + R2: cms-docs-media
```

每个实例独立，免费额度互不影响。
一个账号最多可创建 **10个实例**（受D1免费库数量限制）。

### 多实例部署命令

```bash
# 创建新实例
npx create-ai-cms --name=blog

# 在同一仓库管理多个实例
npm run deploy -- --env=blog
npm run deploy -- --env=shop
```

---

## 七、一键部署流程

### CLI 安装（推荐）

```bash
npx create-ai-cms
```

```
? 请输入 GitHub Token (需要 repo 权限): ghp_xxxx
? 请输入 Cloudflare API Token:          xxxx
? 站点名称（用于资源命名）:              myblog

⠸ 正在创建 GitHub 仓库...              ✓
⠸ 正在创建 Cloudflare D1 数据库...     ✓
⠸ 正在创建 Cloudflare R2 存储桶...     ✓
⠸ 正在创建 Pages 项目并连接仓库...     ✓
⠸ 正在注入环境变量...                  ✓
⠸ 等待首次部署（约2分钟）...           ✓
⠸ 初始化数据库...                      ✓

✅ 你的 AI CMS 已就绪！

   网站地址:  https://myblog.pages.dev
   管理后台:  https://myblog.pages.dev/admin
   初始密码:  Xk9mP2qR

   下一步：进入管理后台，和 AI 对话开始建站
```

### README 一键部署按钮

```markdown
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourname/ai-cms)
```

### 更新流程

```bash
git pull upstream main   # 同步上游新版本
npm run migrate          # 执行新的数据库迁移（数据安全）
# Cloudflare Pages 自动重新部署
```

---

## 八、AI Agent 体系

### 5个核心 Agent

#### 1. 建站 Agent（初始化时，一次性）

```
触发：用户首次进入 Admin，进行对话引导

流程：对话收集 → 品牌设计 → 主题生成 → 内容生成 → 部署上线

对话示例：
  AI: 你的网站是做什么的？
  用: 面向上班族的健身博客
  AI: 目标读者年龄段？偏好哪种风格？有参考网站吗？
  用: 25-35岁，Men's Health 那种，专业但不枯燥
  AI: 我来帮你完成品牌方案/网站结构/主题开发/首批文章，约8分钟
```

#### 2. 内容 Agent（Cron定时，每周/每天）

```
触发：Cloudflare Cron Triggers（可配置频率）

流程：
  1. Vectorize 查询已有内容（避免重复选题）
  2. Workers AI 分析热门话题 + 用户定位
  3. 生成文章大纲 → 全文 → SEO优化 → AI配图
  4. 根据权限级别：自动发布 或 存为草稿等待审核
  5. 更新 Vectorize 向量库（下次防重复）
```

#### 3. SEO Agent（Cron定时，每周）

```
触发：每周一凌晨

流程：
  1. 读取所有已发布内容（含自定义类型）
  2. 分析 meta 描述 / 标题是否达标
  3. 检查内链机会
  4. 识别需要更新的过时内容
  5. 生成 SEO 报告写入 Admin 通知中心
  6. 根据权限级别自动执行或生成待办清单
```

#### 4. 设计 Agent（按需触发）

```
触发：用户在 Admin 发送设计指令 或 AI自主优化

功能：
  - 修改主题颜色/字体/布局
  - 生成新页面/内容类型模板
  - 编辑主题代码文件
  - 提交到 GitHub → 自动重部署（约1-2分钟）
  - 截图预览发回给用户确认
```

#### 5. 运营 Agent（Cron定时，每日）

```
触发：每天早上8点生成日报

功能：
  - 读取 Cloudflare Analytics 数据
  - 分析热门内容 / 流量趋势 / 搜索词
  - 生成运营建议
  - 推送到 Admin 通知中心
```

### Agent 调度架构

```
Cron Trigger 触发
      ↓
Pages Function 接收
      ↓
写入 Cloudflare Queue（异步，避免超时）
      ↓
Queue Consumer 处理
      ↓
调用 Workers AI（长文生成分段处理）
      ↓
结果写入 D1 / 调用 GitHub API
```

---

## 九、主题系统

### 目录结构

```
src/themes/
├── default/              # 内置默认主题
│   ├── theme.config.ts   # 主题元信息与CSS变量声明
│   ├── layout.tsx        # 整体布局
│   ├── home.tsx          # 首页
│   ├── post.tsx          # 文章页（post类型）
│   ├── page.tsx          # 独立页面
│   ├── product.tsx       # 产品页（内置类型）
│   ├── archive.tsx       # 归档页（分类/标签/作者）
│   ├── [type].tsx        # 自定义内容类型通用模板
│   └── styles.css        # CSS变量定义
├── minimal/              # 内置简约主题
└── [custom]/             # 用户/社区自定义主题
```

### theme.config.ts 结构

```typescript
export default {
  id: "default",
  name: "Default",
  version: "1.0.0",
  author: "AI CMS Team",
  preview: "/themes/default/preview.jpg",
  variables: {
    "--color-primary": "#3b82f6",
    "--color-bg": "#ffffff",
    "--color-text": "#1a1a1a",
    "--font-heading": "Inter",
    "--font-body": "Inter",
    "--radius": "8px",
    "--max-width": "1200px",
  },
  // 支持哪些内容类型的自定义模板
  supports: ["post", "page", "product", "portfolio"]
}
```

### 主题自定义方式

| 方式 | 操作入口 | 是否重部署 |
|------|---------|-----------|
| 调节颜色/字体/间距 | Admin 可视化面板 | 否（CSS变量存D1） |
| 注入全局自定义CSS | Admin 代码输入框 | 否 |
| 编辑主题模板文件 | Admin Monaco编辑器 | 是（GitHub API提交）|
| 安装社区主题 | Admin 主题市场 | 是（GitHub API提交）|
| 本地开发新主题 | git push | 是（自动触发）|

### AI 设计主题流程

```
用户: 我想要日系极简风，主色调墨绿色，强调留白

AI 设计 Agent:
  1. 生成设计规范（色板/字体/间距体系）
  2. 生成完整主题代码（TSX + CSS）
  3. GitHub API 提交到 src/themes/ai-generated/
  4. Cloudflare Pages 自动部署（约1-2分钟）
  5. 截图预览返回给用户确认

用户: 标题字体再大一点
AI: 修改 --font-size-heading → 重新提交 → 再次预览
```

---

## 十、插件系统

### 插件类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 内容插件 | 处理内容保存/渲染 | SEO分析、阅读时长 |
| 编辑器插件 | 扩展编辑器功能 | 自定义块、AI写作面板 |
| Admin插件 | 扩展后台页面/小组件 | 数据看板、第三方集成 |
| API插件 | 扩展 API 端点 | Webhook、RSS增强 |
| Cron插件 | 定时任务 | 自动备份、定期推送 |

### 内置插件清单（全部免费）

| 插件 | 功能 | 依赖 |
|------|------|------|
| `seo-analyzer` | 文章SEO评分+建议 | 无 |
| `reading-time` | 阅读时长自动计算 | 无 |
| `toc` | 自动生成文章目录 | 无 |
| `ai-writer` | 编辑器内AI写作助手 | Workers AI |
| `og-image` | OG图自动生成 | Workers AI |
| `sitemap` | 自动sitemap.xml | 无 |
| `full-text-search` | 全文搜索（D1 FTS5）| D1 |
| `related-posts` | 相关内容推荐 | Vectorize |
| `ai-alt` | 图片Alt文本自动生成 | Workers AI |

### plugin.json 规范

```json
{
  "id": "seo-analyzer",
  "name": "SEO 分析",
  "version": "1.0.0",
  "description": "内容发布前的SEO评分与优化建议",
  "hooks": ["onPostSave", "onAdminEditorSidebar"],
  "adminPages": [
    { "path": "/admin/seo", "label": "SEO概览", "icon": "chart" }
  ],
  "settings": {
    "minWordCount": { "type": "number", "default": 300, "label": "最低字数" },
    "checkReadability": { "type": "boolean", "default": true, "label": "检查可读性" }
  },
  "contentTypes": ["post", "product", "*"]
}
```

### 插件钩子

```typescript
// 内容钩子
onContentSave(content, type)     // 任意内容类型保存后
onContentPublish(content, type)  // 发布后（更新sitemap/向量库）
onMediaUpload(file)              // 媒体上传后

// 渲染钩子
onHeadRender(page)               // 注入 <head> 内容
onContentRender(content, type)   // 内容页追加内容
onPageRender(page)               // 所有页面

// Admin钩子
onAdminSidebar()                 // 添加侧边栏菜单
onAdminEditorSidebar(type)       // 编辑器右侧面板（按内容类型）
onAdminDashboard()               // 仪表盘小组件
```

### 插件安装流程

```
内置插件（随仓库自带）
└── Admin 直接启用/禁用，无需重部署

社区插件（来自插件市场/GitHub）
└── Admin 点击安装
    → 调用 GitHub API 提交插件代码到用户仓库
    → Cloudflare Pages 自动重部署（约1-2分钟）
    → Admin 显示"安装完成"

自定义插件（用户自己开发）
└── 放到 src/plugins/ 文件夹 → git push → 自动重部署
```

---

## 十一、数据库 Schema

### 核心表

```sql
-- 内容类型定义（内置+自定义）
CREATE TABLE content_types (
  id TEXT PRIMARY KEY,             -- 'post'/'page'/'product'/自定义
  name TEXT NOT NULL,              -- 显示名称
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  has_timeline INTEGER DEFAULT 1,  -- 是否有发布时间线
  has_author INTEGER DEFAULT 1,
  has_category INTEGER DEFAULT 1,
  has_tag INTEGER DEFAULT 1,
  has_comment INTEGER DEFAULT 0,
  fields TEXT,                     -- JSON: 自定义字段定义
  created_at INTEGER
);

-- 统一内容表（所有类型共用）
CREATE TABLE contents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,              -- 对应 content_types.id
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,                    -- 主体内容（富文本JSON）
  excerpt TEXT,
  status TEXT DEFAULT 'draft',     -- draft/published/scheduled
  author_id TEXT,
  category_id TEXT,
  published_at INTEGER,
  scheduled_at INTEGER,
  created_at INTEGER,
  updated_at INTEGER,
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  -- AI
  ai_generated INTEGER DEFAULT 0,
  ai_reviewed INTEGER DEFAULT 0,
  UNIQUE(type, slug)
);

-- 全文搜索（D1 FTS5）
CREATE VIRTUAL TABLE contents_fts USING fts5(
  title, content, excerpt,
  content=contents, content_rowid=rowid
);

-- 自定义字段值
CREATE TABLE content_fields (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_value TEXT,               -- JSON存储，支持所有类型
  FOREIGN KEY(content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 分类（支持多内容类型）
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id TEXT,
  description TEXT,
  UNIQUE(content_type, slug)
);

-- 标签
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE content_tags (
  content_id TEXT,
  tag_id TEXT,
  PRIMARY KEY(content_id, tag_id)
);

-- 用户（管理员）
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'editor',      -- admin/editor/author
  password_hash TEXT,
  created_at INTEGER
);

-- 媒体库
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  filename TEXT,
  r2_key TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  ai_alt TEXT,
  created_at INTEGER
);

-- 站点设置（key-value）
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,                      -- JSON存储
  updated_at INTEGER
);

-- 插件
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  enabled INTEGER DEFAULT 0,
  config TEXT,                     -- JSON
  installed_at INTEGER
);

-- AI任务记录
CREATE TABLE ai_tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,              -- content/seo/design/analytics/setup
  status TEXT DEFAULT 'pending',   -- pending/running/done/failed
  input TEXT,                      -- JSON
  output TEXT,                     -- JSON
  error TEXT,
  created_at INTEGER,
  completed_at INTEGER
);

-- 数据库迁移版本记录
CREATE TABLE migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER
);
```

---

## 十二、Admin 后台结构

```
/admin
├── /                        仪表盘（数据概览 + AI日报 + 待办事项）
├── /setup                   初始化向导（首次使用，AI对话建站）
│
├── /[type]                  内容管理（动态路由，支持所有内容类型）
│   ├── /                    内容列表
│   ├── /new                 新建内容
│   └── /[id]                编辑内容（TipTap编辑器 + AI助手面板）
│
├── /media                   媒体库（R2文件管理）
│
├── /ai                      AI运营中心
│   ├── /chat                与AI对话（建站/内容/设计全功能）
│   ├── /tasks               AI任务队列与历史记录
│   ├── /schedule            内容计划（AI选题/排期/草稿）
│   └── /settings            AI自主权限 / 写作风格 / 频率设置
│
├── /appearance              外观管理
│   ├── /themes              主题市场 + 当前主题切换
│   ├── /editor              主题代码编辑器（Monaco Editor）
│   ├── /menus               导航菜单拖拽管理
│   └── /customize           可视化样式调节（颜色/字体/CSS变量）
│
├── /plugins                 插件管理
│   ├── /                    已安装插件（启用/禁用/配置）
│   └── /market              插件市场（GitHub索引）
│
└── /settings                站点设置
    ├── /general             基本信息（站名/Logo/描述）
    ├── /content-types       内容类型管理（新建/编辑/自定义字段）
    ├── /seo                 SEO全局配置
    ├── /github              GitHub Token（主题/插件安装所需）
    └── /security            密码/管理员账号
```

---

## 十三、项目文件结构

```
ai-cms/
├── src/
│   ├── app/
│   │   ├── (site)/                  # 前台（主题渲染层）
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # 首页
│   │   │   ├── [slug]/              # post类型文章页
│   │   │   ├── [type]/[slug]/       # 其他内容类型
│   │   │   ├── category/[slug]/     # 分类归档
│   │   │   └── tag/[slug]/          # 标签归档
│   │   ├── admin/                   # 管理后台
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # 仪表盘
│   │   │   ├── [type]/              # 动态内容管理
│   │   │   ├── ai/
│   │   │   ├── appearance/
│   │   │   ├── plugins/
│   │   │   └── settings/
│   │   └── api/                     # API Routes
│   │       ├── contents/
│   │       ├── content-types/
│   │       ├── media/
│   │       ├── settings/
│   │       ├── ai/
│   │       ├── plugins/
│   │       └── cron/                # Cron Trigger 入口
│   ├── themes/                      # 主题系统
│   ├── plugins/                     # 插件系统
│   ├── agents/                      # AI Agent 实现
│   │   ├── setup.ts
│   │   ├── content.ts
│   │   ├── seo.ts
│   │   ├── design.ts
│   │   └── analytics.ts
│   └── lib/
│       ├── db.ts                    # D1封装
│       ├── r2.ts                    # R2封装
│       ├── ai.ts                    # Workers AI封装
│       ├── github.ts                # GitHub API封装
│       ├── config.ts                # 配置读取（D1 settings）
│       └── auth.ts                  # JWT认证
├── migrations/                      # D1数据库迁移文件
│   ├── 0001_init.sql
│   ├── 0002_content_types.sql
│   └── 0003_ai_tasks.sql
├── scripts/
│   └── create.ts                    # npx create-ai-cms 脚本
├── wrangler.toml
├── next.config.ts
├── package.json
└── README.md                        # 含 Deploy to Cloudflare 按钮
```

---

## 十四、开发路线图

### Phase 1 — 基础骨架（Week 1-2）

- [ ] Next.js 15 初始化（Cloudflare Pages 适配）
- [ ] D1 Schema + 迁移管理系统
- [ ] 内容类型系统（内置4种 + 自定义）
- [ ] R2 媒体上传管理
- [ ] JWT 认证
- [ ] 前台基础渲染（default主题）
- [ ] Admin 内容 CRUD（支持所有类型）

### Phase 2 — 主题与插件（Week 3-4）

- [ ] 主题系统架构（含自定义类型模板支持）
- [ ] default / minimal 内置主题
- [ ] 插件钩子系统
- [ ] 内置插件全部实现
- [ ] Admin 外观/插件管理页

### Phase 3 — AI 集成（Week 5-6）

- [ ] Workers AI 封装（文章/图片/Embedding）
- [ ] AI 写作助手（编辑器内嵌，支持所有内容类型）
- [ ] AI 建站 Agent（对话式初始化向导）
- [ ] Vectorize 向量搜索

### Phase 4 — 自动运营（Week 7-8）

- [ ] Cloudflare Cron Triggers + Queues 接入
- [ ] 内容 Agent（定时选题写作）
- [ ] SEO Agent（每周自动优化）
- [ ] 运营 Agent（每日数据报告）
- [ ] GitHub API 集成（主题/插件动态安装）
- [ ] 设计 Agent（对话改主题）

### Phase 5 — 发布（Week 9-10）

- [ ] `npx create-ai-cms` CLI 脚本
- [ ] Deploy to Cloudflare 按钮配置
- [ ] 插件/主题市场（GitHub Topic 索引）
- [ ] 文档网站
- [ ] 开源发布到 GitHub

---

## 十五、免费额度评估

### 单实例月度消耗估算

| 服务 | 预估消耗 | 免费额度 | 状态 |
|------|---------|---------|------|
| Pages 带宽 | ~10GB | 无限 | ✅ 充裕 |
| D1 读操作 | ~200万/月 | 2500万/月 | ✅ 充裕 |
| D1 写操作 | ~10万/月 | 5000万/月 | ✅ 充裕 |
| R2 存储 | ~2GB | 10GB | ✅ 充裕 |
| R2 操作 | ~5万/月 | 100万/月 | ✅ 充裕 |
| Queues | ~1万消息/月 | 100万/月 | ✅ 充裕 |
| Vectorize | ~1万向量 | 3万向量 | ✅ 够用 |
| Cron Triggers | 5个任务 | 免费 | ✅ |
| Workers AI | 每日AI任务 | 有限免费 | ⚠️ 需监控 |

> Workers AI 是最可能触达限制的服务。高频用户可在 Admin 设置中切换为 Anthropic API 或 OpenAI API 作为备用（用户自带 key，完全免费使用本系统）。

---

*文档版本 v1.0 | 持续更新中*
