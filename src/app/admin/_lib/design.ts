import type { CSSProperties } from 'react'

// ── Color tokens ──────────────────────────────────────────────────────────────

export const color = {
  // Brand
  brand:      '#18181b',
  brandHover: '#27272a',
  brandLight: 'rgba(24,24,27,0.07)',

  // Page / surface backgrounds
  pageBg:       '#f5f5f5',
  surface:      '#ffffff',
  surfaceHover: '#fafafa',
  muted:        '#f4f4f5',

  // Text hierarchy
  textPrimary:   '#18181b',
  textSecondary: '#52525b',
  textTertiary:  '#71717a',
  textMuted:     '#a1a1aa',

  // Borders
  border:       '#e4e4e7',
  borderSubtle: '#f0f0f0',
  borderStrong: '#d4d4d8',

  // Sidebar
  sidebar: {
    bg:          '#ffffff',
    border:      '#ebebeb',
    text:        '#3f3f46',
    textActive:  '#111827',
    bgActive:    '#f3f4f6',
    bgHover:     '#f9fafb',
    iconActive:  '#18181b',
    iconInactive: '#71717a',
  },

  // Status
  published: { bg: '#dcfce7', text: '#166534' },
  draft:     { bg: '#f4f4f5', text: '#52525b' },
  scheduled: { bg: '#fef3c7', text: '#92400e' },

  // Semantic
  danger:       '#ef4444',
  dangerHover:  '#dc2626',
  dangerBg:     '#fef2f2',
  dangerMuted:  'rgba(239,68,68,0.08)',

  // Metric palette (stat cards)
  green:  '#10b981',
  amber:  '#f59e0b',
  violet: '#6366f1',
  pink:   '#ec4899',
} as const

// ── Shape tokens ──────────────────────────────────────────────────────────────

export const radius = {
  xs:   '4px',
  sm:   '5px',
  md:   '7px',
  lg:   '10px',
  xl:   '12px',
  '2xl':'16px',
  full: '9999px',
} as const

// ── Typography tokens ─────────────────────────────────────────────────────────

export const fontSize = {
  xs:   '11px',
  sm:   '12px',
  base: '13px',
  md:   '14px',
  lg:   '16px',
  xl:   '18px',
  '2xl':'22px',
  '3xl':'28px',
} as const

// ── Shadow tokens ─────────────────────────────────────────────────────────────

export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06)',
  md: '0 2px 8px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
} as const

// ── Transition ────────────────────────────────────────────────────────────────

export const transition = {
  fast: '0.12s ease',
  base: '0.15s ease',
  slow: '0.22s ease',
} as const

export const transitionAll = `background ${transition.fast}, color ${transition.fast}, border-color ${transition.fast}, box-shadow ${transition.fast}`

// ── Status map ────────────────────────────────────────────────────────────────

export const STATUS_MAP = {
  published: { label: '已发布', bg: color.published.bg, text: color.published.text },
  draft:     { label: '草稿',   bg: color.draft.bg,     text: color.draft.text },
  scheduled: { label: '定时',   bg: color.scheduled.bg, text: color.scheduled.text },
} as const

export function statusLabel(status: string): string {
  return STATUS_MAP[status as keyof typeof STATUS_MAP]?.label ?? status
}

// ── Reusable CSSProperties ────────────────────────────────────────────────────

export const inputBase: CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: fontSize.base,
  border: `1px solid ${color.border}`, borderRadius: radius.md,
  background: color.surface, color: color.textPrimary,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export const textareaBase: CSSProperties = {
  ...inputBase, resize: 'none', lineHeight: 1.6,
}

export const labelBase: CSSProperties = {
  display: 'block', fontSize: fontSize.sm, fontWeight: 500,
  color: color.textSecondary, marginBottom: '5px',
}

export const hintBase: CSSProperties = {
  fontSize: fontSize.xs, color: color.textMuted, marginTop: '3px', margin: 0,
}

export const sectionLabelBase: CSSProperties = {
  fontSize: fontSize.xs, fontWeight: 600, color: color.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
}

export const cardBase: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
}

// ── Page containers ───────────────────────────────────────────────────────────
// standard: list/dashboard pages (media, content, AI, users…)
// narrow:   settings/config/account pages
export const pageContainer = {
  standard: {
    maxWidth: 1100,
    padding: '32px 40px 48px',
    margin: '0 auto',
  } as CSSProperties,
  narrow: {
    maxWidth: 720,
    padding: '32px 40px 48px',
    margin: '0 auto',
  } as CSSProperties,
}
