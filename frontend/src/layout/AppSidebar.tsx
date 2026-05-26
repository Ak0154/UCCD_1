import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface BadgeCounts {
  complaints?: number
  slaBreaches?: number
  escalations?: number
}

interface NavItem {
  name: string
  icon: string
  badgeKey?: 'complaints' | 'slaBreaches' | 'escalations'
  href: string
}

const ITEMS_BY_ROLE: Record<string, NavItem[]> = {
  AGENT: [
    { name: 'Dashboard', icon: '◫', href: '/app/dashboard' },
    { name: 'My Queue', icon: '📋', badgeKey: 'complaints', href: '/app/complaints?assigned_to=me' },
    { name: 'AI Drafts', icon: '✨', href: '/app/drafts' },
    { name: '360° View', icon: '🔍', href: '/app/360-view' },
    { name: 'Search', icon: '🔎', href: '/app/search' },
  ],
  SUPERVISOR: [
    { name: 'Dashboard', icon: '◫', href: '/app/dashboard' },
    { name: 'All Complaints', icon: '📋', badgeKey: 'complaints', href: '/app/complaints' },
    { name: 'Escalations', icon: '⬆', badgeKey: 'escalations', href: '/app/escalations' },
    { name: 'SLA Breaches', icon: '⏱', badgeKey: 'slaBreaches', href: '/app/sla-breaches' },
    { name: 'Trends', icon: '📈', href: '/app/trends' },
    { name: 'Root Cause', icon: '🌳', href: '/app/root-cause' },
    { name: 'Search', icon: '🔎', href: '/app/search' },
  ],
  COMPLIANCE: [
    { name: 'Dashboard', icon: '◫', href: '/app/dashboard' },
    { name: 'Regulatory Reports', icon: '🛡', href: '/app/regulatory' },
    { name: 'SLA Breaches', icon: '⏱', badgeKey: 'slaBreaches', href: '/app/sla-breaches' },
    { name: 'Root Cause', icon: '🌳', href: '/app/root-cause' },
    { name: 'Trends', icon: '📈', href: '/app/trends' },
  ],
}

export function AppSidebar({ activeItem }: { activeItem: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges] = useState<BadgeCounts>({})

  const role = user?.role ?? 'AGENT'

  useEffect(() => {
    api.getKpis().then(kpis => {
      setBadges({
        complaints: kpis.open,
        slaBreaches: kpis.breached,
        escalations: kpis.escalated,
      })
    }).catch(() => {})
  }, [])

  const items = ITEMS_BY_ROLE[role] || []

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

      <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => {
          const isActive = item.name === activeItem
          const badgeValue = item.badgeKey ? badges[item.badgeKey] : undefined
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
              {badgeValue !== undefined && badgeValue > 0 && (
                <span style={{
                  background: '#DC2626', color: 'white',
                  fontSize: 10, fontWeight: 700, padding: '1px 7px',
                  borderRadius: 10, lineHeight: '16px', minWidth: 24, textAlign: 'center',
                }}>
                  {badgeValue}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,.1)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#3B82F6',
          color: 'white', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{user?.name ? user.name.split(' ').map(n => n[0]).join('') : '??'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{user?.name ?? 'User'}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', lineHeight: 1.3 }}>{user?.role ?? 'Agent'}</div>
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