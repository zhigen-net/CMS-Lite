-- 移除非默认内容类型：产品、作品集
DELETE FROM contents WHERE type IN ('product', 'portfolio');
DELETE FROM content_types WHERE id IN ('product', 'portfolio');
