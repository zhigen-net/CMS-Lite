INSERT OR IGNORE INTO settings (key, value) VALUES ('site.showAiBadge', 'true');

INSERT OR IGNORE INTO migrations (version, name) VALUES (11, '0011_ai_badge_setting');
