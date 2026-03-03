export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--af-border)',
      padding: '28px 32px',
    }}>
      <div style={{
        maxWidth: '1120px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'var(--af-font-text)',
        fontSize: '13px',
        color: 'var(--af-text-muted)',
      }}>
        <div>
          Ansible<span style={{ color: 'var(--af-red)' }}>Forge</span>
          <span style={{ margin: '0 8px' }}>·</span>
          Built by{' '}
          <a href="https://github.com/hfenner" target="_blank" rel="noopener noreferrer"
            style={{
              color: 'var(--af-text-secondary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >hfenner</a>
        </div>
        <div style={{ fontFamily: 'var(--af-font-mono)', fontSize: '12px' }}>
          MIT License
        </div>
      </div>
    </footer>
  )
}
