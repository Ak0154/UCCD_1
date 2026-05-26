import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const causeChain = [
  { name: 'Payment Gateway Timeout', bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  { name: 'Transaction Retry Failure', bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  { name: 'Debit Processed Without Credit Confirmation', bg: '#FEF9C3', text: '#CA8A04', border: '#FDE68A' },
  { name: 'Customer Complaints Generated', bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
]

const timelineEvents = [
  { time: '11:32 AM', event: 'Gateway latency increased — response time jumped from 120ms to 3200ms', color: '#F59E0B' },
  { time: '11:37 AM', event: 'Transaction retries increased — 5x normal retry volume detected', color: '#F59E0B' },
  { time: '11:42 AM', event: 'Complaint volume increased — 43 complaints in 10 minutes', color: '#DC2626' },
  { time: '11:45 AM', event: 'Negative sentiment spike — customer frustration surging across WhatsApp', color: '#DC2626' },
  { time: '11:50 AM', event: 'Escalations triggered — L1 → L2 auto-escalations activated', color: '#DC2626' },
  { time: '11:55 AM', event: 'Payments team notified — incident response initiated', color: '#3B82F6' },
]

const actionLog = [
  { time: '11:45 AM', action: 'Escalation ESC-2042 created' },
  { time: '11:48 AM', action: 'Payments team notified via Slack + email' },
  { time: '11:53 AM', action: 'Proactive customer advisory sent to 327 customers' },
  { time: '12:00 PM', action: 'Root cause investigation opened — RCA-2042' },
]

const relatedComplaints = [
  { id: '#CNS-4821', summary: 'UPI amount debited — not credited', product: 'UPI', severity: 'Critical', status: 'Escalated' },
  { id: '#CNS-4832', summary: 'UPI payment pending since morning', product: 'UPI', severity: 'High', status: 'Open' },
  { id: '#CNS-4850', summary: 'Money debited twice — single transaction', product: 'UPI', severity: 'Critical', status: 'Escalated' },
  { id: '#CNS-4861', summary: 'Transfer not reflecting in recipient account', product: 'UPI', severity: 'High', status: 'Open' },
]

const similarIncidents = [
  { date: 'March 12', issue: 'UPI debit failures — SBI corridor', similarity: 89, resolution: 'Gateway patch deployed v3.2.1' },
  { date: 'February 3', issue: 'Payment timeout during peak hours', similarity: 72, resolution: 'Load balancer capacity doubled' },
  { date: 'January 18', issue: 'Transaction confirmation delay', similarity: 65, resolution: 'Database connection pool increased' },
]

export function RootCause() {
  const [timeWindow, setTimeWindow] = useState('Last 24h')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Root Cause" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Root Cause</h1>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 480, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search complaint ID, issue, product, error code, cluster ID..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }} />
          </div>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
          </button>
          <button type="button" style={{ padding: '6px 14px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Create Investigation</button>
          <select value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', flexShrink: 0, outline: 'none' }}>
            {['Last 1h', 'Last 6h', 'Last 24h', 'Custom'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </header>

        {/* ZONE 2 — CONTROL BAR */}
        <div style={{
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter</span>
          {['All', 'UPI', 'Cards', 'NetBanking', 'Gateway', 'Critical', 'Negative', 'Mumbai'].map((f) => (
            <button key={f} type="button" style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>{f}</button>
          ))}
          <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 4px' }} />
          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
            {['Cause Tree', 'Dependency Graph', 'Timeline', 'Cluster View'].map((m) => (
              <button key={m} type="button" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, background: 'white', color: '#6B7280', border: 'none', cursor: 'pointer', borderRight: m !== 'Cluster View' ? '1px solid #E5E7EB' : 'none' }}>{m}</button>
            ))}
          </div>
          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginLeft: 4 }}>
            {['System Failures', 'Behavior Patterns', 'Escalation Drivers', 'Customer Signals'].map((m) => (
              <button key={m} type="button" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, background: 'white', color: '#6B7280', border: 'none', cursor: 'pointer', borderRight: m !== 'Customer Signals' ? '1px solid #E5E7EB' : 'none' }}>{m}</button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>82 root-cause candidates</span>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ZONE 3 — INVESTIGATION WORKSPACE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24, alignItems: 'start' }}>

            {/* LEFT — ROOT CAUSE ANALYSIS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Root Cause Card */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>UPI Debit Failure Spike</h3>
                <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 12 }}>
                  <span>Detected: <strong>11:42 AM</strong></span>
                  <span>Affected: <strong style={{ color: '#DC2626' }}>327 customers</strong></span>
                  <span>Confidence: <strong style={{ color: '#16A34A' }}>92%</strong></span>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 12 }}>Cause Chain</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                  {causeChain.map((step, i) => (
                    <div key={step.name} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: step.bg, border: `1px solid ${step.border}`,
                        fontSize: 12, fontWeight: 600, color: step.text,
                        whiteSpace: 'nowrap',
                      }}>{step.name}</div>
                      {i < causeChain.length - 1 && (
                        <span style={{ fontSize: 18, color: '#CBD5E1', margin: '0 6px' }}>→</span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Confidence</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '92%', borderRadius: 3, background: '#16A34A' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>High</span>
                </div>
              </div>

              {/* Signal Timeline */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>Signal Timeline</h3>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#E5E7EB' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 28 }}>
                    {timelineEvents.map((evt, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: -23, top: 4,
                          width: 10, height: 10, borderRadius: '50%',
                          background: evt.color,
                        }} />
                        <div style={{ fontSize: 10, fontWeight: 700, color: evt.color, marginBottom: 2 }}>{evt.time}</div>
                        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{evt.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — AI INVESTIGATION PANEL */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,.03)',
              position: 'sticky', top: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" /></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Root Cause Intelligence</h3>
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>RCA-2042</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>AI Diagnosis</div>
                  <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                    Payment Gateway timeout spike observed between <strong>11:35–11:42 AM</strong>.
                  </p>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', marginTop: 4 }}>Confidence: 91%</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Signal Correlation</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#DC2626', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEE2E2' }}>Gateway</span>
                      <span style={{ color: '#9CA3AF' }}>↕</span>
                      <span style={{ color: '#EA580C', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FFF7ED' }}>Complaints</span>
                      <span style={{ color: '#9CA3AF' }}>↕</span>
                      <span style={{ color: '#DC2626', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEE2E2' }}>Escalations</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Impact Analysis</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Affected customers</span>
                      <strong style={{ color: '#DC2626' }}>327</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Affected complaints</span>
                      <strong style={{ color: '#DC2626' }}>482</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Affected products</span>
                      <strong style={{ color: '#374151' }}>UPI · NetBanking</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>AI Recommended Action</div>
                  <ul style={{ margin: '0 0 12px 0', paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                    <li>Notify Payments Team</li>
                    <li>Create cluster escalation</li>
                    <li>Send customer advisory</li>
                    <li>Enable retry fallback</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Apply', 'Escalate', 'Create Incident'].map((b) => (
                      <button key={b} type="button" style={{
                        padding: '5px 14px', borderRadius: 6, border: 'none',
                        background: b === 'Create Incident' ? '#DC2626' : b === 'Apply' ? '#3B82F6' : '#EEF2FF',
                        color: b === 'Create Incident' || b === 'Apply' ? 'white' : '#4F46E5',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      }}>{b}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dependency Map */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>Dependency Map</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 500 180" style={{ width: '100%', maxWidth: 500, height: 'auto' }}>
                {/* UPI Service */}
                <rect x={190} y={10} width={120} height={24} rx={6} fill="#DBEAFE" />
                <text x={250} y={26} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1E40AF">UPI Service</text>
                <circle cx={230} cy={44} r="5" fill="#3B82F6" /><circle cx={270} cy={44} r="5" fill="#3B82F6" />

                {/* Payment Gateway */}
                <line x1={230} y1={44} x2={170} y2={90} stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x={110} y={90} width={120} height={24} rx={6} fill="#FEE2E2" />
                <text x={170} y={106} textAnchor="middle" fontSize="11" fontWeight="600" fill="#DC2626">Payment Gateway</text>
                <circle cx={140} cy={124} r="6" fill="#DC2626" />
                <text x={170} y={140} textAnchor="middle" fontSize="9" fill="#DC2626" fontWeight="700">🔴 FAILING</text>

                {/* Auth Service */}
                <line x1={270} y1={44} x2={330} y2={90} stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x={270} y={90} width={120} height={24} rx={6} fill="#DCFCE7" />
                <text x={330} y={106} textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">Auth Service</text>
                <circle cx={300} cy={124} r="6" fill="#16A34A" />
                <text x={330} y={140} textAnchor="middle" fontSize="9" fill="#16A34A" fontWeight="700">🟢 HEALTHY</text>

                {/* Database */}
                <line x1={140} y1={124} x2={100} y2={160} stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x={40} y={155} width={90} height={22} rx={6} fill="#F3F4F6" />
                <text x={85} y={169} textAnchor="middle" fontSize="10" fontWeight="500" fill="#6B7280">Database</text>

                {/* Notification Service */}
                <line x1={330} y1={114} x2={400} y2={155} stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x={355} y={155} width={120} height={22} rx={6} fill="#F3F4F6" />
                <text x={415} y={169} textAnchor="middle" fontSize="10" fontWeight="500" fill="#6B7280">Notification Service</text>
              </svg>
            </div>
          </div>

          {/* ZONE 4 — BOTTOM INTELLIGENCE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

            {/* Related Complaints */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Related Complaints</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {relatedComplaints.map((c) => (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr) 70px 70px 70px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F5F6FA', fontSize: 11 }}>
                    <span style={{ fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{c.id}</span>
                    <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.summary}</span>
                    <span style={{ color: '#6B7280' }}>{c.product}</span>
                    <span style={{ color: '#DC2626', fontWeight: 600 }}>{c.severity}</span>
                    <span style={{ color: '#4F46E5', fontWeight: 600 }}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Incidents */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Similar Incidents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {similarIncidents.map((si) => (
                  <div key={si.date} style={{ padding: 10, borderRadius: 8, border: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#1F2937' }}>{si.date}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: 4 }}>{si.similarity}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.4, marginBottom: 4 }}>{si.issue}</div>
                    <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 600 }}>
                      ✓ {si.resolution}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Log */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Action Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {actionLog.map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '8px 0',
                    borderBottom: i < actionLog.length - 1 ? '1px solid #F5F6FA' : 'none',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap', minWidth: 64 }}>{entry.time}</span>
                    <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{entry.action}</span>
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