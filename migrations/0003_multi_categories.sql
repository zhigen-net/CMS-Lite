-- 迁移版本: 0003
-- 功能: 多分类支持，URL 对齐 WordPress

CREATE TABLE IF NOT EXISTS content_categories (
  content_id  TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_cc_content  ON content_categories(content_id);
CREATE INDEX IF NOT EXISTS idx_cc_category ON content_categories(category_id);

-- 将旧 category_id 单字段数据迁移到新关联表
INSERT OR IGNORE INTO content_categories (content_id, category_id)
SELECT id, category_id FROM contents WHERE category_id IS NOT NULL;

INSERT INTO migrations (version, name) VALUES (3, '0003_multi_categories');
