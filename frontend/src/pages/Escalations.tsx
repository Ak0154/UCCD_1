import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

interface Escalation {
  escId: string
  complaintId: string
  summary: string
  customer: string
  segment: string
  escalatedTo: string
  level: string
  riskScore: number
  timeWaiting: string
  timeHours: number
  status: 'Pending' | 'Assigned' | 'Resolved'
  reason: string
  linkedIds: string[]
  rootCause: string
  internalNotes: string
  followUps: number
  sentiment: string
  route: string
}

const escalations: Escalation[] = [
  {
    escId: 'ESC-2042', complaintId: '#CNS-4821',
    summary: 'UPI transaction ₹45,000 pending', customer: 'Akash Kumar',
    segment: 'Premium', escalatedTo: 'Payments Team', level: 'L1 → L2',
    riskScore: 92, timeWaiting: '4h waiting', timeHours: 4,
    status: 'Pending',
    reason: 'Repeated customer follow-ups, negative sentiment spike, SLA risk >90%',
    linkedIds: ['#CNS-4811', '#CNS-4817', '#CNS-4821'],
    rootCause: 'Possible payment gateway timeout issue between SBI and HDFC corridors',
    internalNotes: 'L1 agent attempted refund verification. No transaction confirmation received from beneficiary bank.',
    followUps: 5, sentiment: 'Very negative',
    route: 'Payments Team → Gateway Ops → L3 Support',
  },
  {
    escId: 'ESC-2038', complaintId: '#CNS-4819',
    summary: 'Credit card duplicate charge ₹12,499 × 2', customer: 'Neha Singh',
    segment: 'Standard', escalatedTo: 'Cards Dispute Team', level: 'L1 → L2',
    riskScore: 78, timeWaiting: '6h waiting', timeHours: 6,
    status: 'Assigned',
    reason: 'Customer contacted support twice, no refund initiated',
    linkedIds: ['#CNS-4819', '#CNS-4804'],
    rootCause: 'Payment gateway double-capture during checkout failure recovery',
    internalNotes: 'Amazon confirmed charge but HDFC statement shows two entries 3 seconds apart.',
    followUps: 2, sentiment: 'Negative',
    route: 'Cards Dispute Team → L3 Support',
  },
  {
    escId: 'ESC-2035', complaintId: '#CNS-4815',
    summary: 'NetBanking locked — urgent access needed', customer: 'Rajesh Sharma',
    segment: 'Premium', escalatedTo: 'Tech Support → L3', level: 'L1 → L2',
    riskScore: 65, timeWaiting: '2h waiting', timeHours: 2,
    status: 'Pending',
    reason: 'Customer traveling abroad, needs access for hotel payment',
    linkedIds: ['#CNS-4815'],
    rootCause: '3 incorrect password attempts from overseas IP triggering auto-lock',
    internalNotes: 'Verified customer identity via alternate email. Temporary unlock duration: 24 hours.',
    followUps: 3, sentiment: 'Neutral',
    route: 'Tech Support → Security Team → L3 Support',
  },
  {
    escId: 'ESC-2031', complaintId: '#CNS-4808',
    summary: 'FD maturity ₹2,50,000 not credited — 5 days', customer: 'Priya Gupta',
    segment: 'Standard', escalatedTo: 'Deposits Team', level: 'L1 → L2',
    riskScore: 54, timeWaiting: '10h waiting', timeHours: 10,
    status: 'Assigned',
    reason: 'Customer needs funds for daughter\'s school fees',
    linkedIds: ['#CNS-4808'],
    rootCause: 'FD auto-credit reconciliation job failed due to database connection timeout',
    internalNotes: 'Manual credit of ₹2,50,000 approved by branch manager. Pending core banking update.',
    followUps: 1, sentiment: 'Negative',
    route: 'Deposits Team → Core Banking Ops',
  },
  {
    escId: 'ESC-2027', complaintId: '#CNS-4794',
    summary: 'Insurance auto-debit ₹450 without consent', customer: 'Vikram Patel',
    segment: 'Standard', escalatedTo: 'Insurance Desk', level: 'L2 → L3',
    riskScore: 88, timeWaiting: '1h waiting', timeHours: 1,
    status: 'Pending',
    reason: 'Possible fraudulent enrollment. Regulatory implication.',
    linkedIds: ['#CNS-4794', '#CNS-4781', '#CNS-4773'],
    rootCause: 'Third-party insurance partner enrolled customer without explicit opt-in',
    internalNotes: '3 similar complaints from same insurance partner this week. Legal team notified.',
    followUps: 4, sentiment: 'Very negative',
    route: 'Insurance Desk → Legal → L3 Support',
  },
  {
    escId: 'ESC-2023', complaintId: '#CNS-4789',
    summary: 'Gold loan ornaments not returned', customer: 'Meera Iyer',
    segment: 'VIP', escalatedTo: 'Loans Team → L3', level: 'L1 → L2',
    riskScore: 95, timeWaiting: '8h waiting', timeHours: 8,
    status: 'Pending',
    reason: 'VIP customer. Pending since morning. Physical gold at risk.',
    linkedIds: ['#CNS-4789'],
    rootCause: 'Regional office holding locker keys. Branch manager not authorized to release.',
    internalNotes: 'Regional manager contacted but awaiting authorization letter. Gold valuation: ₹3.2L.',
    followUps: 6, sentiment: 'Very negative',
    route: 'Loans Team → Regional Office → L3 Support',
  },
  {
    escId: 'ESC-2019', complaintId: '#CNS-4774',
    summary: 'App crash causing payment failures', customer: 'Ankit Desai',
    segment: 'Standard', escalatedTo: 'Tech Support', level: 'L1 → L2',
    riskScore: 42, timeWaiting: '12h waiting', timeHours: 12,
    status: 'Resolved',
    reason: 'iOS 18 compatibility issue identified by dev team',
    linkedIds: ['#CNS-4774'],
    rootCause: 'API version mismatch between iOS 18 and banking backend',
    internalNotes: 'App update v4.2.1 deployed. Customer confirmed resolution.',
    followUps: 1, sentiment: 'Positive',
    route: 'Tech Support → DevOps Team',
  },
]

const filters = ['All', 'Critical', 'L1→L2', 'L2→L3', 'Payments', 'Cards', 'Deposits', 'Loans', 'Pending', 'Assigned']
const sortOptions = ['Escalation Age', 'Risk Score', 'Severity', 'SLA Deadline', 'Customer Value']
const viewModes = ['Queue', 'Kanban', 'Timeline']

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? '#DC2626' : score >= 60 ? '#F59E0B' : '#22C55E'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}</span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>/100</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', width: '100%', marginTop: 2 }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: 2, background: color }} />
      </div>
    </div>
  )
}

function TimeBar({ hours }: { hours: number }) {
  const pct = Math.min((hours / 12) * 100, 100)
  const color = hours >= 8 ? '#DC2626' : hours >= 4 ? '#F59E0B' : '#22C55E'
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{hours}h waiting</div>
      <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', width: '100%' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color }} />
      </div>
    </div>
  )
}

export function Escalations() {
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Risk Score')
  const [viewMode, setViewMode] = useState('Queue')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedEsc, setSelectedEsc] = useState<Escalation | null>(null)
  const [queueDropdown, setQueueDropdown] = useState(false)
  const [showRiskDetail, setShowRiskDetail] = useState<string | null>(null)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filtered = filter === 'All' ? escalations
    : filter === 'Pending' || filter === 'Assigned'
      ? escalations.filter((e) => e.status === filter)
      : escalations.filter((e) => e.level === filter || e.escalatedTo.includes(filter))

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'Risk Score') return b.riskScore - a.riskScore
    if (sort === 'Escalation Age') return b.timeHours - a.timeHours
    return 0
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Escalations" />

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Escalations
          </h1>

          <div style={{ flex: 1, minWidth: 0, maxWidth: 480, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search complaint ID, customer, escalation ID, team..."
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
            + Escalate Case
          </button>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button type="button" onClick={() => setQueueDropdown(!queueDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              My escalations ▼
            </button>
            {queueDropdown && (
              <div style={{
                position: 'absolute', top: 40, right: 0, background: 'white',
                borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,.1)', border: '1px solid #F0F0F0',
                padding: 6, zIndex: 20, minWidth: 180,
              }}>
                {['My escalations', 'L1 → L2', 'L2 → L3', 'Manager review', 'Critical incidents'].map((q) => (
                  <button key={q} type="button" onClick={() => setQueueDropdown(false)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      color: '#374151', background: 'transparent', border: 'none', cursor: 'pointer',
                    }}>{q}</button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ZONE 2 — CONTROL BAR */}
        <div style={{
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '10px 28px', display: 'flex', flexDirection: 'column', gap: 10,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter</span>
            {filters.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${filter === f ? '#4F46E5' : '#E5E7EB'}`,
                  background: filter === f ? '#EEF2FF' : 'white',
                  color: filter === f ? '#4F46E5' : '#6B7280',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                }}>{f}</button>
            ))}

            <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 4px' }} />

            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 500, color: '#374151', background: '#F9FAFB', cursor: 'pointer', outline: 'none' }}>
              {sortOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>

            <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
              {viewModes.map((m) => (
                <button key={m} type="button" onClick={() => setViewMode(m)}
                  style={{
                    padding: '4px 10px', fontSize: 11, fontWeight: 500,
                    background: viewMode === m ? '#3B82F6' : 'white',
                    color: viewMode === m ? 'white' : '#6B7280',
                    border: 'none', cursor: 'pointer',
                    borderRight: m !== 'Timeline' ? '1px solid #E5E7EB' : 'none',
                  }}>{m}</button>
              ))}
            </div>

            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
              {filtered.length} escalations
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F0F0F0', paddingTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', display: 'flex', alignItems: 'center' }}>
                {selectedIds.size} selected
              </span>
              {['Assign Team', 'Escalate Further', 'Merge Cases', 'Send Update', 'Close Escalation'].map((action) => (
                <button key={action} type="button" onClick={() => setSelectedIds(new Set())}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: '1px solid #D1D5DB', color: '#374151', background: 'white',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>{action}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ZONE 3 — ESCALATION WORKSPACE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

            {/* LEFT — ESCALATION QUEUE */}
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Escalation Queue</h3>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '40px 90px 130px minmax(0, 1fr) 110px 110px 70px 90px 100px 130px',
                gap: 8, alignItems: 'center', padding: '10px 24px', background: '#FAFBFC', borderBottom: '1px solid #F0F0F0',
                fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px',
              }}>
                {['', 'Escalation ID', 'Complaint', 'Customer', 'Escalated To', 'Level', 'Risk', 'Waiting', 'Status', 'Actions'].map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>

              {sorted.map((e) => {
                const isSelected = selectedIds.has(e.escId)
                const isExpanded = expandedId === e.escId
                const statusColors: Record<string, { bg: string; text: string }> = {
                  Pending: { bg: '#FEF3C7', text: '#92400E' },
                  Assigned: { bg: '#EEF2FF', text: '#4F46E5' },
                  Resolved: { bg: '#DCFCE7', text: '#16A34A' },
                }
                const st = statusColors[e.status]

                return (
                  <div key={e.escId}>
                    <div
                      onClick={() => setSelectedEsc(e)}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 90px 130px minmax(0, 1fr) 110px 110px 70px 90px 100px 130px',
                        gap: 8, alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #F5F6FA',
                        background: isSelected ? '#EFF6FF' : 'white',
                        borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                        cursor: 'pointer', transition: 'background .1s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(e.escId)}
                          style={{ width: 14, height: 14, cursor: 'pointer' }} onClick={(ev) => ev.stopPropagation()} />
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : e.escId) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.15s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>

                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{e.escId}</span>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{e.complaintId}</div>
                        <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.summary}</div>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{e.customer}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{e.segment}</div>
                      </div>

                      <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.escalatedTo}</div>

                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: '#EEF2FF', color: '#4F46E5', whiteSpace: 'nowrap',
                        width: 'fit-content',
                      }}>{e.level}</span>

                      <div onClick={(ev) => { ev.stopPropagation(); setShowRiskDetail(showRiskDetail === e.escId ? null : e.escId) }}>
                        <RiskBar score={e.riskScore} />
                      </div>

                      <TimeBar hours={e.timeHours} />

                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{e.status}</span>

                      <div style={{ display: 'flex', gap: 4 }}>
                        {[
                          { label: 'View', color: '#3B82F6', bg: '#EFF6FF' },
                          { label: 'Assign', color: '#6B7280', bg: undefined },
                          { label: 'Escalate', color: '#DC2626', bg: '#FEE2E2' },
                        ].map((btn) => (
                          <button key={btn.label} type="button" onClick={(ev) => ev.stopPropagation()}
                            style={{
                              padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                              color: btn.color, background: btn.bg ?? 'transparent',
                              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                            }}>{btn.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* RISK SCORE DETAIL TOOLTIP */}
                    {showRiskDetail === e.escId && (
                      <div style={{
                        margin: '0 24px 0 60px', padding: 10, borderRadius: 8,
                        background: '#FFF7ED', border: '1px solid #FDE68A', fontSize: 11, color: '#92400E', lineHeight: 1.6,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Risk Score: {e.riskScore} — Contributors:</div>
                        {[
                          'Repeated follow-ups (+20)',
                          'Negative sentiment (+25)',
                          `${e.segment} customer (+15)`,
                          `SLA risk (+${e.riskScore - 60})`,
                        ].map((c) => <div key={c} style={{ paddingLeft: 8 }}>• {c}</div>)}
                      </div>
                    )}

                    {/* EXPANDED ROW */}
                    {isExpanded && (
                      <div style={{
                        padding: '14px 24px 14px 60px', display: 'flex', flexDirection: 'column', gap: 10,
                        borderBottom: '1px solid #F5F6FA', background: '#FAFBFC',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Escalation Reason</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>{e.reason}</p>

                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginTop: 4 }}>Linked Complaints</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {e.linkedIds.map((id) => (
                            <span key={id} style={{ padding: '2px 10px', borderRadius: 6, background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>{id}</span>
                          ))}
                        </div>

                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginTop: 4 }}>Root Cause</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>{e.rootCause}</p>

                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginTop: 4 }}>Internal Notes</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.4 }}>{e.internalNotes}</p>

                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginTop: 4 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>Quick Escalation</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#6B7280' }}>Escalate to:</span>
                            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151' }}>
                              <option>{e.escalatedTo}</option>
                              <option>Gateway Ops</option>
                              <option>L3 Support</option>
                            </select>
                            <span style={{ fontSize: 11, color: '#6B7280' }}>Priority:</span>
                            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151' }}>
                              <option>Critical</option>
                              <option>High</option>
                              <option>Medium</option>
                            </select>
                            <input placeholder="Comment..." style={{
                              flex: 1, minWidth: 100, padding: '4px 10px', borderRadius: 6,
                              border: '1px solid #D1D5DB', fontSize: 11, color: '#374151', outline: 'none',
                            }} />
                            <button type="button" style={{
                              padding: '5px 14px', borderRadius: 6, background: '#DC2626', color: 'white',
                              border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            }}>Escalate Now</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* RIGHT — ESCALATION INTELLIGENCE */}
            {selectedEsc && (
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
                  <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedEsc.escId}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Classification</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {['UPI', 'Transaction Failure', 'Critical', 'High Impact'].map((t) => (
                        <span key={t} style={{ padding: '4px 12px', borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Escalation Analysis</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                      Customer contacted support <strong style={{ color: '#DC2626' }}>{selectedEsc.followUps} times in last 2 hours.</strong>
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>
                      Complaint sentiment: <strong style={{ color: '#DC2626' }}>{selectedEsc.sentiment}</strong>
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: '#6B7280' }}>Escalation probability:</span>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>Very High</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Duplicate Detection</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                      {selectedEsc.linkedIds.length > 2
                        ? `${selectedEsc.linkedIds.length - 1} similar escalations found`
                        : '1 similar escalation found'}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
                      Same issue: SBI → HDFC UPI transactions
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>AI Suggested Routing</div>
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{selectedEsc.route}</div>
                      <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>Confidence: 94%</div>
                    </div>
                  </div>

                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>AI Draft Communication</div>
                    <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                      Dear Customer, we are actively investigating your transaction issue and have escalated it to our specialized payments team. Reference: {selectedEsc.escId}. We will update you within 2 hours.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { label: 'Edit', bg: '#EEF2FF', color: '#4F46E5' },
                        { label: 'Send', bg: '#3B82F6', color: 'white' },
                        { label: 'Regenerate', bg: '#E5E7EB', color: '#6B7280' },
                      ].map((btn) => (
                        <button key={btn.label} type="button" style={{
                          padding: '5px 14px', borderRadius: 6, border: 'none',
                          background: btn.bg, color: btn.color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}>{btn.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}