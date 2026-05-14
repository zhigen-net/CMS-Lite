-- Form Builder Plugin: forms + submissions tables

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  fields TEXT NOT NULL DEFAULT '[]',          -- JSON FormField[]
  webhook_url TEXT DEFAULT '',
  webhook_headers TEXT DEFAULT '{}',          -- JSON {key: value}
  webhook_field_map TEXT DEFAULT '{}',        -- JSON {formKey: crmKey}
  submit_message TEXT DEFAULT '提交成功！我们会尽快与您联系。',
  status TEXT NOT NULL DEFAULT 'active',      -- active | paused
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',            -- JSON {fieldKey: value}
  source_url TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  webhook_status TEXT DEFAULT 'pending',      -- pending | sent | failed | skipped
  webhook_sent_at INTEGER,
  webhook_response TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO plugins (id, name, version, enabled, config)
VALUES ('form-builder', '表单构建器', '1.0.0', 1, '{}');

INSERT INTO migrations (version, name) VALUES (6, '0006_form_builder');
