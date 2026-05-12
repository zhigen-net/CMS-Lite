import { getSettings, setSetting } from './db'
import type { SiteSettings } from '@/types'

let cachedSettings: Partial<SiteSettings> | null = null

export async function getSiteSettings(db: D1Database): Promise<SiteSettings> {
  const rows = await getSettings(db)
  return rows as unknown as SiteSettings
}

export async function getSiteSettingValue<K extends keyof SiteSettings>(
  db: D1Database,
  key: K
): Promise<SiteSettings[K] | null> {
  const val = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>()
  return val ? JSON.parse(val.value) as SiteSettings[K] : null
}

export async function updateSiteSettings(
  db: D1Database,
  updates: Partial<SiteSettings>
): Promise<void> {
  const stmts = Object.entries(updates).map(([key, value]) =>
    db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()'
    ).bind(key, JSON.stringify(value))
  )
  await db.batch(stmts)
}

export async function isSetupCompleted(db: D1Database): Promise<boolean> {
  const val = await getSiteSettingValue(db, 'setup.completed')
  return val === true
}
