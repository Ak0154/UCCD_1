import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const severityColors = {
  Critical: { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' },
  High: { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C' },
  Medium: { bg: '#FEF9C3', text: '#CA8A04', dot: '#CA8A04' },
  Low: { bg: '#DCFCE7', text: '#16A34A', dot: '#16A34A' },
}

const sentimentColors: Record<string, { text: string; bg: string }> = {
  'Very negative': { text: '#DC2626', bg: '#FEE2E2' },
  Negative: { text: '#EA580C', bg: '#FFF7ED' },
  Neutral: { text: '#6B7280', bg: '#F3F4F6' },
  Positive: { text: '#16A34A', bg: '#DCFCE7' },
}

const complaints = [
  {
    id: '#CNS-4821', severity: 'Critical' as const,
    title: 'UPI transaction of ₹45,000 debited but not credited to beneficiary — 72 hours pending',
    timeAgo: '12m ago', channel: 'WhatsApp', channelIcon: '💬',
    sentiment: 'Very negative', slaPercent: 95, slaHours: 1, slaColor: '#DC2626',
  },
  {
    id: '#CNS-4819', severity: 'High' as const,
    title: 'Credit card charged twice for single Amazon transaction — ₹12,499 × 2',
    timeAgo: '28m ago', channel: 'Email', channelIcon: '📧',
    sentiment: 'Negative', slaPercent: 68, slaHours: 4, slaColor: '#EA580C',
  },
  {
    id: '#CNS-4815', severity: 'High' as const,
    title: 'NetBanking locked after 3 incorrect password attempts — urgent access needed',
    timeAgo: '45m ago', channel: 'App', channelIcon: '📱',
    sentiment: 'Negative', slaPercent: 55, slaHours: 5, slaColor: '#EA580C',
  },
  {
    id: '#CNS-4812', severity: 'Medium' as const,
    title: 'Fixed deposit maturity amount not reflecting in savings account — 3 days passed',
    timeAgo: '1h ago', channel: 'IVR Call', channelIcon: '📞',
    sentiment: 'Neutral', slaPercent: 30, slaHours: 16, slaColor: '#22C55E',
  },
  {
    id: '#CNS-4808', severity: 'Low' as const,
    title: 'Request to update registered mobile number via branch — document submitted',
    timeAgo: '2h ago', channel: 'Branch', channelIcon: '🏦',
    sentiment: 'Positive', slaPercent: 15, slaHours: 20, slaColor: '#22C55E',
  },
]

const categories = [
  { rank: 1, name: 'UPI / Payments', count: 84, trend: '↑ Rising', trendColor: '#DC2626' },
  { rank: 2, name: 'NetBanking access', count: 61, trend: '↑ Rising', trendColor: '#DC2626' },
  { rank: 3, name: 'Credit card billing', count: 46, trend: '→ Stable', trendColor: '#6B7280' },
  { rank: 4, name: 'Loan processing', count: 32, trend: '↓ Falling', trendColor: '#16A34A' },
  { rank: 5, name: 'Fixed deposits', count: 18, trend: '→ Stable', trendColor: '#6B7280' },
]

const channels = [
  { name: 'WhatsApp', pct: 72, color: '#25D366' },
  { name: 'Mobile App', pct: 55, color: '#3B82F6' },
  { name: 'Email', pct: 38, color: '#8B5CF6' },
  { name: 'IVR / Call', pct: 28, color: '#F59E0B' },
  { name: 'Branch walk-in', pct: 15, color: '#EC4899' },
]

function KpiCard({ label, value, badge, color }: { label: string; value: string; badge: string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #F0F0F0' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}12`, padding: '2px 8px', borderRadius: 10 }}>{badge}</span>
    </div>
  )
}

export function Dashboard() {
  const [selectedId, setSelectedId] = useState('#CNS-4821')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('Live Feed')

  const selectedComp = complaints.find((c) => c.id === selectedId)
  const filters = ['All', 'Critical', 'High', 'Medium', 'Low']
  const tabs = ['Live Feed', 'Assigned to me', 'Escalated']

  const filtered = severityFilter === 'All'
    ? complaints
    : complaints.filter((c) => c.severity === severityFilter)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Dashboard" />

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Dashboard
          </h1>

          <div style={{ flex: 1, minWidth: 0, maxWidth: 440, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search complaints, customers…"
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

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ROW 1 - KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <KpiCard label="Total Open" value="248" badge="↑ 12% vs last week" color="#DC2626" />
            <KpiCard label="SLA at Risk" value="37" badge="7 breached today" color="#F59E0B" />
            <KpiCard label="Resolved Today" value="83" badge="94% resolution rate" color="#16A34A" />
            <KpiCard label="Avg. Resolution" value="4.2h" badge="Target: 6h" color="#3B82F6" />
          </div>

          {/* ROW 2 - COMPLAINT FEED + AI INSIGHTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 16, alignItems: 'start' }}>

            {/* COMPLAINT LIVE FEED */}
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #F0F0F0', boxShadow: '0 1px 3px rgba(0,0,0,.04)', minWidth: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Complaint Live Feed</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {filters.map((f) => {
                    const isActive = severityFilter === f
                    const sevCfg = f !== 'All' ? severityColors[f as keyof typeof severityColors] : undefined
                    return (
                      <button key={f} type="button" onClick={() => setSeverityFilter(f)}
                        style={{
                          padding: '5px 12px', borderRadius: 16,
                          border: `1px solid ${isActive ? (sevCfg?.dot ?? '#3B82F6') : '#E5E7EB'}`,
                          background: isActive ? (sevCfg?.bg ?? '#EFF6FF') : 'white',
                          color: isActive ? (sevCfg?.text ?? '#3B82F6') : '#6B7280',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                        }}
                      >
                        {f === 'Critical' ? '🔴 ' : f === 'High' ? '🟠 ' : f === 'Medium' ? '🟡 ' : f === 'Low' ? '🟢 ' : ''}{f}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  {tabs.map((t) => (
                    <button key={t} type="button" onClick={() => setActiveTab(t)}
                      style={{
                        padding: '4px 0', border: 'none', background: 'none',
                        fontSize: 12, fontWeight: activeTab === t ? 600 : 400,
                        color: activeTab === t ? '#111827' : '#9CA3AF',
                        cursor: 'pointer', borderBottom: activeTab === t ? '2px solid #3B82F6' : '2px solid transparent',
                        transition: 'all .15s',
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div>
                {filtered.map((comp) => {
                  const sev = severityColors[comp.severity]
                  const sent = sentimentColors[comp.sentiment] ?? sentimentColors.Neutral
                  const isSelected = selectedId === comp.id
                  return (
                    <button key={comp.id} type="button" onClick={() => setSelectedId(comp.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '13px 20px',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        border: 'none', borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                        borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                        textAlign: 'left', transition: 'background .12s',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', fontFamily: 'monospace', minWidth: 80, flexShrink: 0 }}>{comp.id}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, color: sev.text, background: sev.bg, whiteSpace: 'nowrap', flexShrink: 0 }}>{comp.severity}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{comp.title}</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{comp.timeAgo}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap', flexShrink: 0 }}>{comp.channelIcon} {comp.channel}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: sent.text, background: sent.bg, whiteSpace: 'nowrap', flexShrink: 0 }}>{comp.sentiment}</span>
                      <div style={{ width: 70, flexShrink: 0 }}>
                        <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${comp.slaPercent}%`, borderRadius: 3, background: comp.slaColor }} />
                        </div>
                        <div style={{ fontSize: 9, color: comp.slaColor, fontWeight: 700, marginTop: 2, textAlign: 'right' }}>{comp.slaHours}h left</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GEN-AI INSIGHTS */}
            {selectedComp && (
              <div style={{
                background: 'white', borderRadius: 10, border: '1px solid #F0F0F0',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                position: 'sticky', top: 20,
              }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" />
                    </svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>Gen-AI Insights</h3>
                  <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedComp.id}</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Classification</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {['UPI / Payments', 'Transaction Failed', 'High Financial Impact'].map((tag) => (
                        <span key={tag} style={{ padding: '3px 10px', borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Sentiment Analysis</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.55 }}>Customer is highly distressed — 3 follow-ups in 2 hours. Risk of social media escalation is elevated.</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Duplicate Detection</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.55 }}>4 similar UPI failure complaints today (same corridor: SBI→HDFC). Likely systemic issue.</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>AI-Drafted Response</div>
                    <div style={{ padding: 12, borderRadius: 8, background: '#F9FAFB', border: '1px solid #F0F0F0', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                      Dear Customer, we sincerely regret the inconvenience caused by the delay in your UPI transaction of ₹45,000. Our payments team has identified the issue and is working to credit the amount within the next 4 hours. Your transaction reference is tracked under complaint #CNS-4821. We will keep you updated via SMS and WhatsApp.
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {[
                        { label: 'Edit ↗', bg: '#EEF2FF', color: '#4F46E5' },
                        { label: 'Send', bg: '#3B82F6', color: 'white' },
                        { label: 'Regenerate', bg: '#F3F4F6', color: '#6B7280' },
                      ].map((btn) => (
                        <button key={btn.label} type="button" style={{ padding: '5px 14px', borderRadius: 6, background: btn.bg, color: btn.color, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{btn.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Suggested Next Action</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.55 }}>Escalate to L2 Payments team. Initiate manual credit of ₹45,000. Contact customer proactively.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ROW 3 - CATEGORIES + CHANNELS/CSAT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>

            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #F0F0F0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Top Complaint Categories</h3>
                <button type="button" style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>Root cause ↗</button>
              </div>
              <div style={{ padding: '12px 20px' }}>
                {categories.map((cat) => (
                  <div key={cat.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: cat.rank < 5 ? '1px solid #F9FAFB' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 16, textAlign: 'center', flexShrink: 0 }}>{cat.rank}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1F2937', minWidth: 0 }}>{cat.name}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden', minWidth: 0 }}>
                      <div style={{ height: '100%', width: `${(cat.count / 84) * 100}%`, borderRadius: 4, background: '#3B82F6' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', width: 28, textAlign: 'right', flexShrink: 0 }}>{cat.count}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cat.trendColor, width: 58, textAlign: 'right', flexShrink: 0 }}>{cat.trend}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #F0F0F0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Channel Distribution</h3>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {channels.map((ch) => (
                  <div key={ch.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{ch.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{ch.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ch.pct}%`, borderRadius: 4, background: ch.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #F0F0F0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>CSAT Score</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1 }}>4.1</span>
                      <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>/ 5.0</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Based on 641 responses this week</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} width="22" height="22" viewBox="0 0 24 24" fill={star <= 4 ? '#F59E0B' : '#E5E7EB'} stroke={star <= 4 ? '#F59E0B' : '#D1D5DB'} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}