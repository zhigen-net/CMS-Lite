-- 标签页按标签查文章（content_tags.tag_id = ?）、热门标签统计都要按 tag_id 查；
-- 原来只有主键 (content_id, tag_id)，按 tag_id 查只能扫全表。
CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags (tag_id, content_id);

INSERT INTO migrations (version, name) VALUES (13, '0013_content_tags_tag_index');
