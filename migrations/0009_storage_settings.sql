INSERT OR IGNORE INTO settings (key, value) VALUES ('storage.driver', '"r2"');
INSERT OR IGNORE INTO settings (key, value) VALUES ('storage.s3.endpoint', '""');
INSERT OR IGNORE INTO settings (key, value) VALUES ('storage.s3.bucket', '""');
INSERT OR IGNORE INTO settings (key, value) VALUES ('storage.s3.region', '"auto"');
INSERT OR IGNORE INTO settings (key, value) VALUES ('storage.s3.public_url', '""');

-- Repair rows that were inserted as plain strings (not JSON) by the original migration
UPDATE settings SET value = '"r2"'   WHERE key = 'storage.driver'     AND value = 'r2';
UPDATE settings SET value = '""'     WHERE key = 'storage.s3.endpoint' AND value = '';
UPDATE settings SET value = '""'     WHERE key = 'storage.s3.bucket'   AND value = '';
UPDATE settings SET value = '"auto"' WHERE key = 'storage.s3.region'   AND value = 'auto';
UPDATE settings SET value = '""'     WHERE key = 'storage.s3.public_url' AND value = '';

INSERT OR IGNORE INTO migrations (version, name) VALUES (9, '0009_storage_settings');
