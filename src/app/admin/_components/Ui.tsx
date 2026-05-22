'use client'

/**
 * Shared admin UI primitives — all admin pages should import from here.
 * Tokens live in ../_lib/design.ts; components here are wrappers that apply them.
 */

import Link from 'next/link'
import {
  color, radius, fontSize, shadow, transition,
  STATUS_MAP, transitionAll,
} from '@/app/admin/_lib/design'

// ── Btn ───────────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger'
type BtnSize    = 'sm' | 'md'

const BTN_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
  transition: transitionAll, lineHeight: 1,
}

const BTN_VARIANTS: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: color.brand, color: '#fff',              fontWeight: 600 },
  outline: { background: color.surface, color: color.textSecondary, border: `1px solid ${color.border}`, fontWeight: 500 },
  ghost:   { background: 'transparent', color: color.textSecondary, fontWeight: 500 },
  danger:  { background: color.dangerMuted, color: color.danger,   border: `1px solid rgba(239,68,68,0.3)`, fontWeight: 500 },
}

const BTN_SIZES: Record<BtnSize, React.CSSProperties> = {
  sm: { padding: '5px 12px',  fontSize: fontSize.sm,   borderRadius: radius.sm },
  md: { padding: '7px 16px',  fontSize: fontSize.base, borderRadius: radius.md },
}

const BTN_HOVER: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: color.brandHover },
  outline: { background: color.surfaceHover, borderColor: color.borderStrong },
  ghost:   { background: color.muted },
  danger:  { background: color.dangerBg, borderColor: color.danger },
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
}

export function Btn({ variant = 'outline', size = 'md', style, children, onMouseEnter, onMouseLeave, ...rest }: BtnProps) {
  return (
    <button
      style={{ ...BTN_BASE, ...BTN_VARIANTS[variant], ...BTN_SIZES[size], ...style }}
      onMouseEnter={e => {
        Object.assign(e.currentTarget.style, BTN_HOVER[variant])
        onMouseEnter?.(e)
      }}
      onMouseLeave={e => {
        Object.assign(e.currentTarget.style, BTN_VARIANTS[variant], BTN_SIZES[size])
        // Re-apply border for outline/danger
        if (variant === 'outline') e.currentTarget.style.borderColor = color.border
        if (variant === 'danger')  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
        onMouseLeave?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

// ── BtnLink — same as Btn but renders an <a> via next/link ────────────────────

interface BtnLinkProps {
  href: string
  variant?: BtnVariant
  size?: BtnSize
  style?: React.CSSProperties
  children: React.ReactNode
  target?: string
}

export function BtnLink({ href, variant = 'outline', size = 'md', style, children, target }: BtnLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      style={{ textDecoration: 'none', ...BTN_BASE, ...BTN_VARIANTS[variant], ...BTN_SIZES[size], ...style }}
      onMouseEnter={e => Object.assign(e.currentTarget.style, BTN_HOVER[variant])}
      onMouseLeave={e => {
        Object.assign(e.currentTarget.style, BTN_VARIANTS[variant], BTN_SIZES[size])
        if (variant === 'outline') e.currentTarget.style.borderColor = color.border
        if (variant === 'danger')  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
      }}
    >
      {children}
    </Link>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

const BADGE_BASE: React.CSSProperties = {
  fontSize: fontSize.xs, fontWeight: 600,
  padding: '3px 8px', borderRadius: radius.sm,
  border: 'none', display: 'inline-block',
  whiteSpace: 'nowrap', fontFamily: 'inherit',
}

interface StatusBadgeProps {
  status: string
  onClick?: () => void
  title?: string
}

export function StatusBadge({ status, onClick, title }: StatusBadgeProps) {
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? STATUS_MAP.draft
  return (
    <span
      title={title}
      onClick={onClick}
      style={{
        ...BADGE_BASE,
        background: s.bg,
        color: s.text,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: fontSize.xl, fontWeight: 600, color: color.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: fontSize.base, color: color.textTertiary, margin: '4px 0 0' }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string
  action?: React.ReactNode
  style?: React.CSSProperties
}

export function SectionHeader({ label, action, style }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', ...style }}>
      <p style={{ fontSize: fontSize.xs, fontWeight: 600, color: color.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
        {label}
      </p>
      {action}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, style, hover, onClick }: CardProps) {
  const base: React.CSSProperties = {
    background: color.surface,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    transition: hover ? `border-color ${transition.base}, box-shadow ${transition.base}` : undefined,
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  }
  return (
    <div
      style={base}
      onClick={onClick}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.borderColor = color.borderStrong
        e.currentTarget.style.boxShadow   = shadow.md
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.borderColor = color.border
        e.currentTarget.style.boxShadow   = 'none'
      } : undefined}
    >
      {children}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📄', title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: radius.xl,
        background: color.muted, display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 14px',
        fontSize: '22px',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: fontSize.md, fontWeight: 600, color: color.textPrimary, margin: '0 0 6px' }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: fontSize.base, color: color.textTertiary, margin: action ? '0 0 20px' : 0 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

interface ThumbnailProps {
  src?: string | null
  letter?: string
  size?: number
}

export function Thumbnail({ src, letter, size = 38 }: ThumbnailProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius.md, flexShrink: 0,
      background: src ? `url(${src}) center/cover` : color.muted,
      border: `1px solid ${color.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {!src && letter && (
        <span style={{ fontSize: fontSize.sm, color: color.textMuted, fontWeight: 700 }}>
          {letter.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: '1px', background: color.border, ...style }} />
}
