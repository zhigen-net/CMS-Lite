import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg, #fff)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: 'clamp(4rem, 15vw, 8rem)', fontWeight: 900,
        color: 'var(--color-border, #e4e4e7)',
        lineHeight: 1, margin: '0 0 1rem', letterSpacing: '-0.05em',
        fontFamily: 'var(--font-heading, system-ui)',
      }}>404</p>
      <h1 style={{
        fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 700,
        color: 'var(--color-text, #18181b)', margin: '0 0 0.75rem',
      }}>页面不存在</h1>
      <p style={{
        fontSize: '1rem', color: 'var(--color-text-secondary, #71717a)',
        margin: '0 0 2.5rem', maxWidth: '360px', lineHeight: 1.6,
      }}>
        你访问的页面已被移除或地址有误，请检查链接是否正确。
      </p>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.625rem 1.5rem', borderRadius: '8px',
        background: 'var(--color-text, #18181b)', color: '#fff',
        fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
        transition: 'opacity 0.15s',
      }}>
        ← 返回首页
      </Link>
    </div>
  )
}
