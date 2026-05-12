-- AI CMS 初始化 Schema
-- 迁移版本: 0001

-- 迁移记录表
CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 内容类型定义
CREATE TABLE IF NOT EXISTS content_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '📄',
  has_timeline INTEGER DEFAULT 1,
  has_author INTEGER DEFAULT 1,
  has_category INTEGER DEFAULT 1,
  has_tag INTEGER DEFAULT 1,
  has_comment INTEGER DEFAULT 0,
  fields TEXT DEFAULT '[]',        -- JSON: 自定义字段定义
  is_builtin INTEGER DEFAULT 0,    -- 内置类型不可删除
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 内置内容类型
INSERT INTO content_types (id, name, slug, icon, has_timeline, has_author, has_category, has_tag, is_builtin, fields) VALUES
  ('post', '文章', 'post', '📝', 1, 1, 1, 1, 1, '[]'),
  ('page', '页面', 'page', '📄', 0, 0, 0, 0, 1, '[]');

-- 统一内容表
CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL REFERENCES content_types(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,                    -- TipTap JSON 格式
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft/published/scheduled
  author_id TEXT,
  category_id TEXT,
  cover_image TEXT,
  published_at INTEGER,
  scheduled_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  -- AI
  ai_generated INTEGER DEFAULT 0,
  ai_reviewed INTEGER DEFAULT 0,
  UNIQUE(type, slug)
);

CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_published_at ON contents(published_at DESC);

-- 全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS contents_fts USING fts5(
  id UNINDEXED,
  title,
  excerpt,
  content=contents,
  content_rowid=rowid,
  tokenize='unicode61'
);

-- 自定义字段值
CREATE TABLE IF NOT EXISTS content_fields (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,                -- JSON 存储
  UNIQUE(content_id, field_key)
);

-- 分类
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL REFERENCES content_types(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id TEXT,
  description TEXT,
  cover_image TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(content_type, slug)
);

-- 标签
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS content_tags (
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(content_id, tag_id)
);

-- 用户（管理员）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'editor',  -- admin/editor/author
  password_hash TEXT NOT NULL,
  last_login INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 媒体库
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  ai_alt TEXT,
  uploaded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 插件
CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  config TEXT DEFAULT '{}',        -- JSON
  installed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 内置插件注册
INSERT INTO plugins (id, name, version, enabled, config) VALUES
  ('seo-analyzer',    'SEO 分析',       '1.0.0', 1, '{"minWordCount":300}'),
  ('reading-time',    '阅读时长',       '1.0.0', 1, '{}'),
  ('toc',             '文章目录',       '1.0.0', 1, '{}'),
  ('sitemap',         'Sitemap',        '1.0.0', 1, '{}'),
  ('full-text-search','全文搜索',       '1.0.0', 1, '{}'),
  ('related-posts',   '相关内容推荐',   '1.0.0', 0, '{"limit":5}'),
  ('ai-writer',       'AI 写作助手',    '1.0.0', 0, '{}'),
  ('og-image',        'OG 图自动生成',  '1.0.0', 0, '{}'),
  ('ai-alt',          '图片 Alt 生成',  '1.0.0', 0, '{}');

-- AI 任务记录
CREATE TABLE IF NOT EXISTS ai_tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,              -- content/seo/design/analytics/setup
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/running/done/failed
  input TEXT DEFAULT '{}',
  output TEXT,
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_type ON ai_tasks(type);

-- 站点设置（key-value）
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,             -- JSON 存储
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 默认站点设置
INSERT INTO settings (key, value) VALUES
  ('site.name',            '"My AI CMS"'),
  ('site.description',     '"An AI-powered website"'),
  ('site.logo',            'null'),
  ('site.favicon',         'null'),
  ('site.language',        '"zh-CN"'),
  ('theme.active',         '"default"'),
  ('theme.variables',      '{}'),
  ('theme.customCss',      '""'),
  ('nav.main',             '[]'),
  ('nav.footer',           '[]'),
  ('seo.titleTemplate',    '"%s | My AI CMS"'),
  ('seo.defaultDesc',      '""'),
  ('seo.robots',           '"index,follow"'),
  ('ai.autonomyLevel',     '"standard"'),
  ('ai.contentFrequency',  '"weekly"'),
  ('ai.writingStyle',      '"professional"'),
  ('setup.completed',      'false');

-- 记录此次迁移
INSERT INTO migrations (version, name) VALUES (1, '0001_init');
