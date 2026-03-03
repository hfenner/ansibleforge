import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { GlitchText, TerminalBlock, StackItem, FeatureList } from './components/ui'

export default function App() {
  const [showHero, setShowHero] = useState(false)
  const [showCards, setShowCards] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowHero(true), 300)
    setTimeout(() => setShowCards(true), 800)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Subtle background grid */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(238, 0, 0, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(238, 0, 0, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        zIndex: 0, pointerEvents: 'none',
      }} />

      <Header />

      <main style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        {/* Hero */}
        <section style={{
          maxWidth: '1120px', margin: '0 auto',
          padding: '80px 32px 48px',
          opacity: showHero ? 1 : 0,
          transform: showHero ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            fontFamily: 'var(--af-font-mono)',
            fontSize: '12px', color: 'var(--af-red)',
            letterSpacing: '0.08em', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{
              display: 'inline-block', width: '8px', height: '8px',
              background: 'var(--af-green)', borderRadius: '50%',
              boxShadow: '0 0 6px rgba(62, 134, 53, 0.4)',
            }} />
            GitOps-driven platform on OpenShift
          </div>

          <h1 style={{
            fontFamily: 'var(--af-font-display)',
            fontSize: 'clamp(36px, 5vw, 54px)',
            fontWeight: 700, lineHeight: 1.15,
            marginBottom: '24px', color: '#fff',
          }}>
            A complete Ansible development{' '}
            <span style={{ color: 'var(--af-red)' }}>platform</span>,
            <br />deployed from a single command
          </h1>

          <p style={{
            fontFamily: 'var(--af-font-text)',
            fontSize: '17px', color: 'var(--af-text-secondary)',
            maxWidth: '620px', lineHeight: 1.7, marginBottom: '40px',
          }}>
            AnsibleForge provisions DevSpaces, Vault, AAP, Keycloak, GitLab,
            and a full suite of GitOps-managed infrastructure — so teams can
            start writing and running automation from a browser tab.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <a href="/ansibleforge/docs/getting-started/" style={{
              background: 'var(--af-red)', border: 'none', color: '#fff',
              padding: '14px 32px', fontFamily: 'var(--af-font-text)',
              fontSize: '15px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', textDecoration: 'none',
            }}
              onMouseEnter={(e) => { e.target.style.background = '#c00'; e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.target.style.background = 'var(--af-red)'; e.target.style.transform = 'translateY(0)' }}
            >
              Get started →
            </a>
            <button style={{
              background: 'transparent', border: '1px solid #525252',
              color: '#d4d4d4', padding: '14px 32px',
              fontFamily: 'var(--af-font-text)', fontSize: '15px',
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.target.style.borderColor = '#737373'; e.target.style.color = '#fff' }}
              onMouseLeave={(e) => { e.target.style.borderColor = '#525252'; e.target.style.color = '#d4d4d4' }}
            >
              Configure your deployment
            </button>
          </div>

          <TerminalBlock title="quickstart">
            <div>
              <span style={{ color: 'var(--af-red)' }}>$</span>{' '}
              <span style={{ color: '#d4d4d4' }}>git clone</span>{' '}
              <span style={{ color: 'var(--af-amber)' }}>https://github.com/hfenner/ansibleforge.git</span>
            </div>
            <div>
              <span style={{ color: 'var(--af-red)' }}>$</span>{' '}
              <span style={{ color: '#d4d4d4' }}>cd</span> ansibleforge
            </div>
            <div>
              <span style={{ color: 'var(--af-red)' }}>$</span>{' '}
              <span style={{ color: '#d4d4d4' }}>ansible-playbook</span>{' '}
              <span style={{ color: 'var(--af-blue)' }}>ocp/ansible/gitops_deploy.yml</span>
            </div>
            <div style={{ marginTop: '12px', color: 'var(--af-text-muted)' }}>
              ─────────────────────────────────────────────────────
            </div>
            <div style={{ marginTop: '4px' }}>
              <span style={{ color: 'var(--af-green)' }}>PLAY RECAP</span>
            </div>
            <div>
              <span style={{ color: '#d4d4d4' }}>localhost</span>
              <span style={{ color: 'var(--af-text-muted)' }}> : </span>
              <span style={{ color: 'var(--af-green)' }}>ok=42</span>{'  '}
              <span style={{ color: 'var(--af-amber)' }}>changed=18</span>{'  '}
              <span style={{ color: 'var(--af-text-muted)' }}>unreachable=0</span>{'  '}
              <span style={{ color: 'var(--af-green)' }}>failed=0</span>
            </div>
          </TerminalBlock>
        </section>

        <div style={{ maxWidth: '1120px', margin: '40px auto', padding: '0 32px' }}>
          <div style={{ height: '1px', background: 'var(--af-border)' }} />
        </div>

        {/* For developers / For operators */}
        <section style={{
          maxWidth: '1120px', margin: '0 auto', padding: '20px 32px 60px',
          opacity: showCards ? 1 : 0, transition: 'opacity 0.6s ease',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))',
            gap: '24px',
          }}>
            <div style={{ background: 'var(--af-bg-surface)', border: '1px solid var(--af-border)', padding: '32px' }}>
              <div style={{
                fontFamily: 'var(--af-font-mono)', fontSize: '11px',
                color: 'var(--af-red)', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: '16px', fontWeight: 500,
              }}>For developers</div>
              <FeatureList items={[
                'Browser-based DevSpaces with every Ansible tool pre-loaded',
                'Vault secrets automatically injected — no manual credential setup',
                'Persistent storage and per-user namespace isolation',
                'Ansible dev tools, Terraform, AWS CLI, Helm, Podman, Claude Code',
                '30+ Ansible collections ready to use',
              ]} />
            </div>
            <div style={{ background: 'var(--af-bg-surface)', border: '1px solid var(--af-border)', padding: '32px' }}>
              <div style={{
                fontFamily: 'var(--af-font-mono)', fontSize: '11px',
                color: 'var(--af-red)', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: '16px', fontWeight: 500,
              }}>For operators</div>
              <FeatureList items={[
                'One ArgoCD bootstrap application deploys the entire stack',
                'HashiCorp Vault auto-initialized and unsealed on first boot',
                'External Secrets Operator with Vault and AWS backends',
                'Per-user provisioning via ApplicationSet — one-line git change',
                'Shared BuildConfigs keeping images fresh in the internal registry',
              ]} />
            </div>
          </div>
        </section>

        {/* What gets deployed */}
        <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 32px 60px' }}>
          <div style={{
            fontFamily: 'var(--af-font-display)', fontSize: '24px',
            fontWeight: 600, color: '#fff', marginBottom: '24px',
          }}>What gets deployed</div>
          <div style={{ background: 'var(--af-bg-surface)', border: '1px solid var(--af-border)', padding: '8px 28px' }}>
            <StackItem label="GitOps" color="var(--af-red)" tools={['ArgoCD', 'App-of-apps bootstrap', 'ApplicationSet']} />
            <StackItem label="Secrets" color="var(--af-amber)" tools={['HashiCorp Vault', 'External Secrets Operator', 'AWS Secrets Manager']} />
            <StackItem label="Dev" color="var(--af-blue)" tools={['DevSpaces', 'ansible-devspaces container', 'ee-dragonslair EE']} />
            <StackItem label="Platform" color="var(--af-green)" tools={['AAP Operator', 'Keycloak', 'GitLab', 'OpenShift Pipelines']} />
            <StackItem label="Builds" color="var(--af-text-secondary)" tools={['Shared BuildConfigs', 'ImageStreams', 'Internal registry']} />
          </div>
        </section>

        {/* Repo layout */}
        <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 32px 80px' }}>
          <div style={{
            fontFamily: 'var(--af-font-display)', fontSize: '24px',
            fontWeight: 600, color: '#fff', marginBottom: '24px',
          }}>Repository layout</div>
          <TerminalBlock title="tree — ansibleforge/">
            {[
              { text: '├── helm/', color: 'var(--af-text-muted)', comment: 'RHDP field content CI' },
              { text: '├── containers/', color: 'var(--af-blue)' },
              { text: '│   ├── ansible-devspaces/', color: 'var(--af-blue)', comment: 'developer container' },
              { text: '│   └── ee-dragonslair/', color: 'var(--af-blue)', comment: 'execution environment' },
              { text: '├── devspaces-template/', color: 'var(--af-amber)', comment: 'devfile template' },
              { text: '└── ocp/', color: 'var(--af-green)' },
              { text: '    ├── ansible/', color: 'var(--af-green)', comment: 'playbooks + collections' },
              { text: '    └── gitops/', color: 'var(--af-red)' },
              { text: '        ├── bootstrap/', color: 'var(--af-red)', comment: 'app-of-apps' },
              { text: '        ├── vault/', color: 'var(--af-amber)' },
              { text: '        ├── external-secrets/', color: 'var(--af-amber)' },
              { text: '        ├── shared-builds/', color: 'var(--af-text-secondary)' },
              { text: '        ├── devspaces/', color: 'var(--af-blue)' },
              { text: '        ├── user-devspace/', color: 'var(--af-blue)', comment: 'per-user helm chart' },
              { text: '        ├── pipelines/', color: 'var(--af-green)' },
              { text: '        ├── gitlab/', color: 'var(--af-green)' },
              { text: '        ├── keycloak/', color: 'var(--af-green)' },
              { text: '        └── aap/', color: 'var(--af-green)' },
            ].map((line, i) => (
              <div key={i}>
                <span style={{ color: line.color }}>{line.text}</span>
                {line.comment && <span style={{ color: 'var(--af-text-muted)' }}> # {line.comment}</span>}
              </div>
            ))}
          </TerminalBlock>
        </section>
      </main>

      <Footer />
    </div>
  )
}
