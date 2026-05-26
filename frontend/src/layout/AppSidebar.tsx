import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

const NAV_CONFIG = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', icon: '◫', badge: undefined, href: '/app/dashboard' },
      { name: 'All Complaints', icon: '📋', badge: { text: '24', color: '#DC2626' }, href: '/app/complaints' },
      { name: 'SLA Breaches', icon: '⏱', badge: { text: '7', color: '#F59E0B' }, href: '/app/sla-breaches' },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: '360° View', icon: '🔍', badge: undefined, href: '/app/360-view' },
      { name: 'Escalations', icon: '⬆', badge: { text: '3', color: '#DC2626' }, href: '/app/escalations' },
      { name: 'Duplicates', icon: '⧉', badge: undefined, href: '/app/duplicates' },
      { name: 'AI Drafts', icon: '✨', badge: undefined, href: '/app/drafts' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Trends', icon: '📈', badge: undefined, href: '/app/trends' },
      { name: 'Root Cause', icon: '🌳', badge: undefined, href: '/app/root-cause' },
      { name: 'Regulatory Reports', icon: '🛡', badge: undefined, href: '/app/regulatory' },
    ],
  },
]

export function AppSidebar({ activeItem }: { activeItem: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside
      style={{
        width: 256,
        flexShrink: 0,
        background: '#0d2d5e',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '24px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>ComplaintIQ</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', lineHeight: 1.3 }}>HDFC Bank · Gen-AI</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {NAV_CONFIG.map((section) => (
          <div key={section.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.8px', padding: '0 20px', marginBottom: 4 }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = item.name === activeItem
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => { if (item.href) navigate(item.href) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 20px',
                    background: isActive ? 'rgba(59,130,246,.18)' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,.7)',
                    cursor: item.href ? 'pointer' : 'default',
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    textAlign: 'left', transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.badge && (
                    <span style={{
                      background: item.badge.color, color: 'white',
                      fontSize: 10, fontWeight: 700, padding: '1px 7px',
                      borderRadius: 10, lineHeight: '16px', minWidth: 24, textAlign: 'center',
                    }}>
                      {item.badge.text}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,.1)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#3B82F6',
          color: 'white', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>AK</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Arjun Kumar</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', lineHeight: 1.3 }}>Senior Agent</div>
        </div>
        <button
          type="button"
          onClick={() => { logout(); navigate('/', { replace: true }) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 4 }}
          title="Logout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  )
}