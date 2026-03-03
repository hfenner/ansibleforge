import { useState, useEffect } from 'react'

/* ── Glitch text effect on logo ── */
export const GlitchText = ({ children }) => {
  const [glitch, setGlitch] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 120)
    }, 5000 + Math.random() * 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {glitch && (
        <span style={{
          position: 'absolute', left: '1px', top: '-1px',
          color: 'var(--af-red)', clipPath: 'inset(30% 0 40% 0)', opacity: 0.6,
        }}>{children}</span>
      )}
      {children}
    </span>
  )
}

/* ── Terminal window chrome ── */
export const TerminalBlock = ({ children, title = 'terminal' }) => (
  <div style={{
    background: 'var(--af-bg-darkest)',
    border: '1px solid var(--af-border)',
    fontFamily: 'var(--af-font-mono)',
    fontSize: '13px',
    overflow: 'hidden',
  }}>
    <div style={{
      background: 'var(--af-bg-surface)',
      borderBottom: '1px solid var(--af-border)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--af-red)', opacity: 0.8 }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--af-amber)', opacity: 0.8 }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--af-green)', opacity: 0.8 }} />
      <span style={{
        color: 'var(--af-text-muted)', marginLeft: '8px', fontSize: '12px',
        fontFamily: 'var(--af-font-mono)',
      }}>{title}</span>
    </div>
    <div style={{ padding: '20px 24px', lineHeight: 1.9 }}>
      {children}
    </div>
  </div>
)

/* ── Feature card with reveal animation ── */
export const FeatureCard = ({ icon, title, desc, delay = 0 }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div style={{
      background: 'var(--af-bg-elevated)',
      padding: '28px',
      borderLeft: '3px solid var(--af-red)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--af-font-mono)',
          color: 'var(--af-red)',
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>{title}</span>
      </div>
      <div style={{
        fontFamily: 'var(--af-font-text)',
        color: 'var(--af-text-secondary)',
        fontSize: '14px',
        lineHeight: 1.65,
      }}>{desc}</div>
    </div>
  )
}

/* ── Stack row for "what gets deployed" ── */
export const StackItem = ({ label, tools, color }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid var(--af-border-subtle)',
  }}>
    <div style={{
      fontFamily: 'var(--af-font-mono)',
      fontSize: '11px',
      fontWeight: 500,
      color: color,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      minWidth: '100px',
      paddingTop: '2px',
    }}>{label}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {tools.map((t, i) => (
        <span key={i} style={{
          fontFamily: 'var(--af-font-text)',
          fontSize: '13px',
          color: 'var(--af-text-primary)',
          background: 'var(--af-bg-surface)',
          border: '1px solid var(--af-border)',
          padding: '4px 12px',
        }}>{t}</span>
      ))}
    </div>
  </div>
)

/* ── Bullet list for feature panels ── */
export const FeatureList = ({ items }) => (
  <ul style={{
    listStyle: 'none', padding: 0,
    fontFamily: 'var(--af-font-text)',
    fontSize: '14px', color: 'var(--af-text-secondary)', lineHeight: 2,
  }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--af-green)', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>▹</span>
        {item}
      </li>
    ))}
  </ul>
)
