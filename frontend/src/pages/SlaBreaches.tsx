import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  Critical: { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' },
  High: { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C' },
  Medium: { bg: '#FEF9C3', text: '#CA8A04', dot: '#CA8A04' },
  Low: { bg: '#DCFCE7', text: '#16A34A', dot: '#16A34A' },
}

const breaches = [
  {
    id: '#CNS-4924', priority: 'Critical',
    customer: 'Customer 1043',
    issue: 'UPI ₹65,000 debited but not credited',
    timeLeftMin: 38, slaPercent: 92, slaColor: '#DC2626',
    assigned: 'RS', assignedTeam: 'L2 Payments Team',
    escalation: 'Auto Escalated', slaStatus: 'BREACH IMMINENT',
  },
  {
    id: '#CNS-4918', priority: 'High',
    customer: 'Customer 1029',
    issue: 'Credit card duplicate charge ₹24,998',
    timeLeftMin: 82, slaPercent: 74, slaColor: '#EA580C',
    assigned: 'PM', assignedTeam: 'Cards Dispute Team',
    escalation: 'Manual Review', slaStatus: 'AT RISK',
  },
  {
    id: '#CNS-4915', priority: 'Medium',
    customer: 'Customer 1051',
    issue: 'NetBanking locked — urgent access needed',
    timeLeftMin: 156, slaPercent: 55, slaColor: '#EA580C',
    assigned: 'NG', assignedTeam: 'Tech Support',
    escalation: 'Auto Escalated', slaStatus: 'WATCHING',
  },
  {
    id: '#CNS-4911', priority: 'High',
    customer: 'Customer 1037',
    issue: 'FD maturity ₹2,50,000 not credited — 5 days',
    timeLeftMin: 210, slaPercent: 42, slaColor: '#EA580C',
    assigned: 'AK', assignedTeam: 'Deposits Team',
    escalation: 'Manual Review', slaStatus: 'WATCHING',
  },
  {
    id: '#CNS-4907', priority: 'Low',
    customer: 'Customer 1062',
    issue: 'Mobile number update pending — 10 days',
    timeLeftMin: 420, slaPercent: 18, slaColor: '#22C55E',
    assigned: 'PM', assignedTeam: 'KYC Team',
    escalation: 'Manual Review', slaStatus: 'ON TRACK',
  },
  {
    id: '#CNS-4903', priority: 'Medium',
    customer: 'Customer 1048',
    issue: 'Auto-debit insurance without consent — ₹450/mo',
    timeLeftMin: 295, slaPercent: 32, slaColor: '#22C55E',
    assigned: 'RS', assignedTeam: 'Insurance Desk',
    escalation: 'Auto Escalated', slaStatus: 'WATCHING',
  },
  {
    id: '#CNS-4899', priority: 'High',
    customer: 'Customer 1012',
    issue: 'Gold loan ornaments not returned after closure',
    timeLeftMin: 65, slaPercent: 78, slaColor: '#EA580C',
    assigned: 'AK', assignedTeam: 'L2 Loans Team',
    escalation: 'Auto Escalated', slaStatus: 'AT RISK',
  },
]

const pills = ['All', 'Critical', 'High', 'Medium', 'Low', 'Auto Escalated', 'Manual Review']

const trends = [
  { day: 'Mon', val: 28 },
  { day: 'Tue', val: 22 },
  { day: 'Wed', val: 35 },
  { day: 'Thu', val: 18 },
  { day: 'Fri', val: 42 },
  { day: 'Sat', val: 15 },
  { day: 'Sun', val: 8 },
]

const riskCategories = [
  { name: 'UPI Failures', pct: 42, color: '#DC2626' },
  { name: 'NetBanking', pct: 27, color: '#EA580C' },
  { name: 'Cards', pct: 18, color: '#3B82F6' },
  { name: 'Loans', pct: 13, color: '#16A34A' },
]

function KpiCard({ title, value, badge, badgeBg, badgeColor }: {
  title: string; value: string; badge: string; badgeBg: string; badgeColor: string
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 28,
      boxShadow: '0 2px 10px rgba(0,0,0,.03)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      height: 150, boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px' }}>
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
        {value}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600, background: badgeBg, color: badgeColor,
        padding: '3px 10px', borderRadius: 8, display: 'inline-block', width: 'fit-content',
      }}>
        {badge}
      </span>
    </div>
  )
}

function TrendChart() {
  const h = 100
  const w = 600
  const pad = 24
  const maxVal = 50
  const chartW = w - pad * 2
  const step = chartW / (trends.length - 1)

  const points = trends.map((t, i) => ({
    x: pad + i * step,
    y: pad + (h - pad * 2) * (1 - t.val / maxVal),
    val: t.val,
    day: t.day,
  }))

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = lineD + ` L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto' }}>
      {[0, 12.5, 25, 37.5, 50].map((v) => {
        const y = pad + (h - pad * 2) * (1 - v / maxVal)
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={pad - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
          </g>
        )
      })}
      {points.map((p) => (
        <text key={p.day} x={p.x} y={h - 4} textAnchor="middle" fontSize="9" fill="#9CA3AF">{p.day}</text>
      ))}
      <path d={lineD} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={areaD} fill="url(#blueGrad)" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.val >= 30 ? 4 : 2.5}
          fill={p.val >= 30 ? '#DC2626' : '#3B82F6'} stroke="white" strokeWidth="1.5" />
      ))}
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function SlaBreaches() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState('#CNS-4924')

  const filtered = filter === 'All'
    ? breaches
    : filter === 'Auto Escalated' || filter === 'Manual Review'
      ? breaches.filter((b) => b.escalation === filter)
      : breaches.filter((b) => b.priority === filter)

  const selectedRow = breaches.find((b) => b.id === selectedId) ?? breaches[0]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="SLA Breaches" />

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* HEADER */}
        <header style={{
          height: 64, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20,
        }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.1 }}>
              SLA Breaches
            </h1>
            <p style={{ fontSize: 13, color: '#8A94A6', margin: '2px 0 0 0' }}>
              Monitor critical complaints approaching SLA violation
            </p>
          </div>

          <div style={{ flex: 1, minWidth: 0, maxWidth: 420, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, marginLeft: 'auto' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search complaint ID, customer, issue..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }}
            />
          </div>

          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
          </button>

          <button type="button" style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            + New
          </button>
        </header>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20 }}>
            <KpiCard title="Critical Breaches" value="18" badge="↑ 6 since last hour" badgeBg="#FEE2E2" badgeColor="#EF4444" />
            <KpiCard title="At Risk" value="42" badge="11 due within 2h" badgeBg="#FEF3C7" badgeColor="#F59E0B" />
            <KpiCard title="Auto Escalated" value="27" badge="93% escalation success" badgeBg="#DCFCE7" badgeColor="#16A34A" />
            <KpiCard title="Avg Breach Delay" value="2.8h" badge="Target: <1h" badgeBg="#E0E7FF" badgeColor="#4F46E5" />
          </div>

          {/* MAIN CONTENT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

            {/* BREACH FEED TABLE */}
            <div style={{
              background: 'white', borderRadius: 16, overflow: 'hidden', minWidth: 0,
              boxShadow: '0 2px 10px rgba(0,0,0,.03)',
            }}>
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>SLA Breach Feed</h3>
                <button type="button" style={{
                  fontSize: 12, fontWeight: 600, color: '#3B82F6', background: 'none',
                  border: 'none', cursor: 'pointer',
                }}>View All →</button>
              </div>

              {/* FILTER PILLS */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pills.map((p) => {
                  const isActive = filter === p
                  return (
                    <button key={p} type="button" onClick={() => setFilter(p)}
                      style={{
                        height: 36, padding: '0 18px', borderRadius: 999,
                        border: `1px solid ${isActive ? '#4F46E5' : '#E5E7EB'}`,
                        background: isActive ? '#EEF2FF' : 'white',
                        color: isActive ? '#4F46E5' : '#6B7280',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        whiteSpace: 'nowrap', transition: 'all .15s',
                      }}
                    >{p}</button>
                  )
                })}
              </div>

              {/* TABLE HEADER */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px 80px 120px minmax(0, 1fr) 80px 60px 130px 90px 120px',
                gap: 10, alignItems: 'center',
                height: 50, padding: '0 24px',
                background: '#FAFBFC', borderBottom: '1px solid #F0F0F0',
                fontSize: 11, fontWeight: 600, letterSpacing: '.4px',
                color: '#9CA3AF', textTransform: 'uppercase',
              }}>
                {['ID', 'Priority', 'Customer', 'Issue', 'Time Left', 'Assigned', 'Escalation', 'SLA Status', 'Actions'].map((h) => (
                  <div key={h} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</div>
                ))}
              </div>

              {/* TABLE ROWS */}
              {filtered.map((b) => {
                const isSelected = b.id === selectedId
                const sev = severityColors[b.priority]
                const hoursLeft = Math.ceil(b.timeLeftMin / 60)
                const timeLabel = b.timeLeftMin < 60 ? `${b.timeLeftMin}m left` : `${hoursLeft}h left`

                return (
                  <div key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 80px 120px minmax(0, 1fr) 80px 60px 130px 90px 120px',
                      gap: 10, alignItems: 'center',
                      padding: '13px 24px', borderBottom: '1px solid #F5F6FA',
                      background: isSelected ? '#EFF6FF' : 'white',
                      borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                      cursor: 'pointer', transition: 'background .1s',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>
                      {b.id}
                    </span>

                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      color: sev.text, background: sev.bg, whiteSpace: 'nowrap',
                      width: 'fit-content',
                    }}>{b.priority}</span>

                    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.customer}
                    </span>

                    <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {b.issue}
                    </span>

                    <div>
                      <div style={{ height: 6, borderRadius: 999, background: '#F3F4F6', overflow: 'hidden', width: 80 }}>
                        <div style={{
                          height: '100%', width: `${b.slaPercent}%`,
                          borderRadius: 999, background: b.slaColor,
                        }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: b.slaColor, marginTop: 3 }}>{timeLabel}</div>
                    </div>

                    <span style={{
                      width: 26, height: 26, borderRadius: '50%', background: '#EEF2FF',
                      color: '#4F46E5', fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{b.assigned}</span>

                    <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.assignedTeam}
                    </span>

                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: b.escalation === 'Auto Escalated' ? '#16A34A' : '#F59E0B',
                    }}>{b.slaStatus}</span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer',
                      }}>Escalate</button>
                      <button type="button" style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: '#EFF6FF', color: '#3B82F6', border: 'none', cursor: 'pointer',
                      }}>View</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* GEN-AI ESCALATION INTELLIGENCE */}
            <div style={{
              background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)',
              position: 'sticky', top: 24, padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" />
                  </svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Escalation Intelligence</h3>
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedRow.id}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                    Breach Classification
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {['Payments', 'UPI', 'Critical', 'High Value'].map((t) => (
                      <span key={t} style={{
                        padding: '4px 12px', borderRadius: 12, background: '#EEF2FF',
                        color: '#4F46E5', fontSize: 11, fontWeight: 600,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                    Risk Analysis
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.55 }}>
                    Customer contacted support <strong style={{ color: '#DC2626' }}>4 times in 90 minutes.</strong>
                  </p>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: '#6B7280' }}>Likelihood of escalation:</span>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>Very High</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: '#6B7280' }}>Risk of social media escalation:</span>
                      <span style={{ fontWeight: 700, color: '#EA580C' }}>High</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                    Duplicate Pattern
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                    7 similar UPI complaints detected in past 3 hours.<br />
                    Possible payment gateway degradation identified.
                  </p>
                </div>

                <div style={{
                  background: '#F9FAFB', border: '1px solid #E5E7EB',
                  borderRadius: 12, padding: 18,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>
                    AI Recommended Action
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                    <li>Immediately route to L2 Payments.</li>
                    <li>Send proactive SMS update.</li>
                    <li>Mark as high-priority queue.</li>
                    <li>Notify customer within 15 minutes.</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[
                      { label: 'Edit', bg: '#EEF2FF', color: '#4F46E5' },
                      { label: 'Apply', bg: '#3B82F6', color: 'white' },
                      { label: 'Regenerate', bg: '#E5E7EB', color: '#6B7280' },
                    ].map((btn) => (
                      <button key={btn.label} type="button"
                        style={{
                          padding: '5px 14px', borderRadius: 6, border: 'none',
                          background: btn.bg, color: btn.color,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >{btn.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

            {/* BREACH TREND */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,.03)',
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                SLA Breach Trend
              </h3>
              <TrendChart />
            </div>

            {/* RISK CATEGORIES */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,.03)',
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                Risk Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {riskCategories.map((cat) => (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{cat.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cat.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${cat.pct}%`,
                        borderRadius: 999, background: cat.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}