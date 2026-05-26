import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const reports = [
  {
    id: 'REG-2042', type: 'Monthly Complaint Summary', regulator: 'RBI',
    period: 'Apr 1–30', count: 482, risk: 'High', status: 'Pending Review',
    deadline: 'Due in 2 days', deadlineHours: 48,
    categories: { 'UPI failures': 204, 'NetBanking issues': 131, 'Card disputes': 89, 'Loan complaints': 58 },
    criticalEscalations: 18, slaBreaches: 6, duplicateClusters: 4,
    summary: 'Complaint volume increased 28% compared to previous period. Major increase observed in UPI debit failures.',
  },
  {
    id: 'REG-2038', type: 'Escalation Summary', regulator: 'RBI',
    period: 'Apr 1–30', count: 38, risk: 'Medium', status: 'Submitted',
    deadline: 'Submitted May 12', deadlineHours: 0,
    categories: { 'L1→L2 escalations': 24, 'Auto-escalations': 14 },
    criticalEscalations: 12, slaBreaches: 3, duplicateClusters: 1,
    summary: 'Escalation volume consistent with prior period. Auto-escalation accuracy improved to 93%.',
  },
  {
    id: 'REG-2035', type: 'Quarterly Compliance Report', regulator: 'SEBI',
    period: 'Jan 1–Mar 31', count: 1247, risk: 'High', status: 'Draft',
    deadline: 'Due in 5 days', deadlineHours: 120,
    categories: { 'UPI': 412, 'Cards': 318, 'NetBanking': 289, 'Loans': 228 },
    criticalEscalations: 42, slaBreaches: 19, duplicateClusters: 8,
    summary: 'Q1 saw elevated UPI complaint volumes. Recommendation: pre-emptive gateway monitoring for Q2.',
  },
  {
    id: 'REG-2031', type: 'Incident Report', regulator: 'RBI',
    period: 'Apr 22', count: 86, risk: 'Critical', status: 'Pending Review',
    deadline: 'Due in 12h', deadlineHours: 12,
    categories: { 'Gateway timeout': 86 },
    criticalEscalations: 18, slaBreaches: 8, duplicateClusters: 3,
    summary: 'Critical incident report: payment gateway timeout affecting SBI→HDFC corridor. Immediate regulator notification required.',
  },
  {
    id: 'REG-2027', type: 'Monthly Complaint Summary', regulator: 'RBI',
    period: 'Mar 1–31', count: 312, risk: 'Low', status: 'Submitted',
    deadline: 'Submitted Apr 5', deadlineHours: -1,
    categories: { 'UPI': 124, 'Cards': 98, 'NetBanking': 90 },
    criticalEscalations: 8, slaBreaches: 4, duplicateClusters: 2,
    summary: 'March complaint volume within expected range. Card dispute rate declined 12% from February.',
  },
]

const calendarItems = [
  { date: 'May 12', title: 'Monthly Complaint Report', status: 'Completed' },
  { date: 'May 15', title: 'Escalation Summary', status: 'Pending' },
  { date: 'May 30', title: 'Quarterly Compliance Report', status: 'Upcoming' },
]

const auditTrail = [
  { time: '11:25 AM', action: 'Submitted to RBI — confirmation #RBI-8821' },
  { time: '11:12 AM', action: 'Reviewer approved — Neha Gupta (Compliance Head)' },
  { time: '10:51 AM', action: 'Assigned to reviewer — Compliance Team' },
  { time: '10:42 AM', action: 'Report generated — system auto-generation' },
]

const previousReports = [
  { month: 'March', status: 'Submitted', count: 312 },
  { month: 'February', status: 'Submitted', count: 284 },
  { month: 'January', status: 'Submitted', count: 301 },
]

function DeadlineBar({ hours, label }: { hours: number; label: string }) {
  const color = hours <= 24 ? '#DC2626' : hours <= 72 ? '#F59E0B' : '#16A34A'
  const pct = hours <= 0 ? 100 : Math.max(100 - (hours / 168) * 100, 10)
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 3 }}>{label}</div>
      <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color }} />
      </div>
    </div>
  )
}

export function RegulatoryReports() {
  const [period, setPeriod] = useState('Monthly')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState(reports[0])

  const toggle = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const riskColors: Record<string, { bg: string; text: string }> = {
    Critical: { bg: '#FEE2E2', text: '#DC2626' },
    High: { bg: '#FFF7ED', text: '#EA580C' },
    Medium: { bg: '#FEF3C7', text: '#92400E' },
    Low: { bg: '#DCFCE7', text: '#16A34A' },
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    'Pending Review': { bg: '#FEF3C7', text: '#92400E' },
    Draft: { bg: '#EEF2FF', text: '#4F46E5' },
    Submitted: { bg: '#DCFCE7', text: '#16A34A' },
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Regulatory Reports" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Regulatory Reports</h1>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 480, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search report ID, complaint category, RBI code, product..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }} />
          </div>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
          </button>
          <button type="button" style={{ padding: '6px 14px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Generate Report</button>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', flexShrink: 0, outline: 'none' }}>
            {['Today', 'Weekly', 'Monthly', 'Quarterly', 'Custom'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </header>

        {/* ZONE 2 — CONTROL BAR */}
        <div style={{
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '10px 28px', display: 'flex', flexDirection: 'column', gap: 10,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter</span>
            {['All', 'RBI', 'Monthly', 'Pending Review', 'Critical', 'UPI', 'SEBI', 'Draft', 'Submitted'].map((f) => (
              <button key={f} type="button" style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                border: '1px solid #E5E7EB', background: 'white', color: '#6B7280',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
              }}>{f}</button>
            ))}
            <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 4px' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Sort</span>
            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 500, color: '#374151', background: '#F9FAFB', cursor: 'pointer', outline: 'none' }}>
              {['Deadline', 'Risk Level', 'Submission Date', 'Priority', 'Newest'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
              {['Report Queue', 'Calendar', 'Timeline', 'Audit View'].map((m) => (
                <button key={m} type="button" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, background: 'white', color: '#6B7280', border: 'none', cursor: 'pointer', borderRight: m !== 'Audit View' ? '1px solid #E5E7EB' : 'none' }}>{m}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{reports.length} reports</span>
          </div>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F0F0F0', paddingTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', display: 'flex', alignItems: 'center' }}>{selectedIds.size} selected</span>
              {['Generate', 'Review', 'Export', 'Submit', 'Assign Reviewer'].map((a) => (
                <button key={a} type="button" onClick={() => setSelectedIds(new Set())}
                  style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #D1D5DB', color: '#374151', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}>{a}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ZONE 3 — WORKSPACE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

            {/* LEFT — REPORT QUEUE */}
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Regulatory Report Queue</h3>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 100px minmax(0, 1fr) 70px 100px 70px 80px 90px 100px 120px',
                gap: 6, alignItems: 'center', padding: '10px 24px', background: '#FAFBFC', borderBottom: '1px solid #F0F0F0',
                fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px',
              }}>
                {['', 'Report ID', 'Report Type', 'Reg', 'Period', 'Count', 'Risk', 'Status', 'Deadline', 'Actions'].map((h) => <div key={h}>{h}</div>)}
              </div>

              {reports.map((r) => {
                const isExpanded = expandedId === r.id
                const rk = riskColors[r.risk]
                const st = statusColors[r.status]
                return (
                  <div key={r.id}>
                    <div onClick={() => setSelectedReport(r)}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 100px minmax(0, 1fr) 70px 100px 70px 80px 90px 100px 120px',
                        gap: 6, alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #F5F6FA',
                        background: selectedIds.has(r.id) ? '#EFF6FF' : 'white',
                        borderLeft: selectedIds.has(r.id) ? '3px solid #3B82F6' : '3px solid transparent',
                        cursor: 'pointer', transition: 'background .1s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggle(r.id)}
                          style={{ width: 14, height: 14, cursor: 'pointer' }} onClick={(ev) => ev.stopPropagation()} />
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : r.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.15s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{r.id}</span>
                      <span style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{r.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{r.regulator}</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{r.period}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.count}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: rk.text, background: rk.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{r.risk}</span>
                      <span style={{ padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{r.status}</span>
                      <DeadlineBar hours={r.deadlineHours} label={r.deadline} />
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[{ label: 'View', color: '#3B82F6', bg: '#EFF6FF' }, { label: 'Generate', color: '#6B7280', bg: undefined }, { label: 'Submit', color: '#16A34A', bg: '#DCFCE7' }].map((btn) => (
                          <button key={btn.label} type="button" onClick={(ev) => ev.stopPropagation()}
                            style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: btn.color, background: btn.bg ?? 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>{btn.label}</button>
                        ))}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{
                        padding: '14px 24px 14px 60px', display: 'flex', flexDirection: 'column', gap: 10,
                        borderBottom: '1px solid #F5F6FA', background: '#FAFBFC',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Complaint Categories</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {Object.entries(r.categories).map(([k, v]) => (
                            <div key={k} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{v}</div>
                              <div style={{ fontSize: 10, color: '#9CA3AF' }}>{k}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                          <span style={{ color: '#DC2626' }}>Critical escalations: {r.criticalEscalations}</span>
                          <span style={{ color: '#F59E0B' }}>SLA breaches: {r.slaBreaches}</span>
                          <span style={{ color: '#4F46E5' }}>Duplicate clusters: {r.duplicateClusters}</span>
                        </div>
                        <div style={{ padding: 10, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 11, color: '#4B5563', lineHeight: 1.4 }}>{r.summary}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#6B7280' }}>Reviewer:</span>
                          <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151' }}>
                            <option>Compliance Team</option>
                          </select>
                          <input placeholder="Comments..." style={{ flex: 1, padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151', outline: 'none' }} />
                          <button type="button" style={{ padding: '5px 14px', borderRadius: 6, background: '#16A34A', color: 'white', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Approve Report</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* RIGHT — COMPLIANCE INTELLIGENCE */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,.03)', position: 'sticky', top: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Compliance Intelligence</h3>
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedReport.id}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Risk Analysis</div>
                  <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                    {selectedReport.risk === 'Critical' ? 'Immediate regulator notification required. Incident report must be filed within 24h.' :
                      selectedReport.risk === 'High' ? 'UPI complaints increased 42% this month. Potential compliance concern.' :
                        'Report within expected compliance thresholds.'}
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Historical Comparison</div>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#6B7280' }}>Previous period</span>
                      <strong>312 complaints</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#6B7280' }}>Current period</span>
                      <strong style={{ color: '#DC2626' }}>{selectedReport.count} complaints</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', marginBottom: 3 }}>
                      <div style={{ height: '100%', width: '62%', borderRadius: 3, background: '#3B82F6' }} />
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((selectedReport.count / 500) * 100, 100)}%`, borderRadius: 3, background: '#DC2626' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10 }}>
                      <span style={{ color: '#9CA3AF' }}>Mar</span>
                      <span style={{ color: '#9CA3AF' }}>Apr</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                      Increase: +{Math.round(((selectedReport.count - 312) / 312) * 100)}%
                    </div>
                  </div>
                </div>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>AI Recommendation</div>
                  <ul style={{ margin: '0 0 12px 0', paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                    <li>Flag for senior review</li>
                    <li>Create escalation cluster</li>
                    <li>Add UPI incident summary</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Apply', 'Generate Draft', 'Export'].map((b) => (
                      <button key={b} type="button" style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: b === 'Apply' ? '#3B82F6' : b === 'Export' ? '#E5E7EB' : '#EEF2FF', color: b === 'Apply' ? 'white' : b === 'Export' ? '#6B7280' : '#4F46E5', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{b}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ZONE 4 — BOTTOM INTELLIGENCE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

            {/* SUBMISSION CALENDAR */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Submission Calendar</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {calendarItems.map((ci) => (
                  <div key={ci.date} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8,
                    border: '1px solid #F0F0F0', borderLeft: ci.status === 'Completed' ? '3px solid #16A34A' : ci.status === 'Pending' ? '3px solid #F59E0B' : '3px solid #D1D5DB',
                  }}>
                    <div style={{ textAlign: 'center', minWidth: 44 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{ci.date.split(' ')[1]}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF' }}>{ci.date.split(' ')[0]}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{ci.title}</div>
                      <div style={{ fontSize: 10, color: ci.status === 'Completed' ? '#16A34A' : ci.status === 'Pending' ? '#F59E0B' : '#9CA3AF' }}>{ci.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT TRAIL */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Audit Trail</h3>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: '#E5E7EB' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 24 }}>
                  {auditTrail.map((entry, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -19, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 2 }}>{entry.time}</div>
                      <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{entry.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PREVIOUS REPORTS */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Previous Reports</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previousReports.map((pr) => (
                  <div key={pr.month} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 12, borderRadius: 10, border: '1px solid #F0F0F0',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{pr.month} Monthly Report</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{pr.count} complaints · {pr.status}</div>
                    </div>
                    <span style={{ padding: '2px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#DCFCE7', color: '#16A34A' }}>✓</span>
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