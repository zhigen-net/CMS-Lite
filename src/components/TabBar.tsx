'use client'

interface Tab { key: string; label: string }

interface Props {
  tabs: readonly Tab[]
  active: string
  onChange: (key: string) => void
}

export function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div style={{
      display: 'flex', gap: '2px',
      background: '#f4f4f5', borderRadius: '9px', padding: '3px',
      width: 'fit-content',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '6px 16px', fontSize: '13px', border: 'none', cursor: 'pointer',
            borderRadius: '7px', transition: 'all 0.15s',
            fontWeight: active === t.key ? 500 : 400,
            background: active === t.key ? '#fff' : 'transparent',
            color: active === t.key ? '#18181b' : '#71717a',
            boxShadow: active === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >{t.label}</button>
      ))}
    </div>
  )
}
