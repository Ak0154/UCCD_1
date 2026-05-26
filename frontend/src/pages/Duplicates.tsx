import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

interface Cluster {
  id: string
  summary: string
  product: string
  count: number
  critical: number
  high: number
  medium: number
  low: number
  confidence: number
  rootCause: string
  status: 'Open' | 'Escalated' | 'Resolved'
  complaints: string[]
  corridor: string
  timeWindow: string
  channels: Record<string, number>
}

const clusters: Cluster[] = [
  {
    id: 'DUP-102', summary: 'UPI amount debited but not credited — SBI→HDFC corridor',
    product: 'UPI', count: 43, critical: 7, high: 16, medium: 20, low: 0,
    confidence: 94, rootCause: 'Payment gateway timeout during inter-bank UPI transfer processing',
    status: 'Open',
    complaints: ['#CNS-4821', '#CNS-4832', '#CNS-4850', '#CNS-4858', '#CNS-4861', '#CNS-4873', '#CNS-4880', '#CNS-4892'],
    corridor: 'SBI → HDFC', timeWindow: '2 hours',
    channels: { WhatsApp: 18, App: 11, Email: 8, IVR: 6 },
  },
  {
    id: 'DUP-098', summary: 'Credit card duplicate charge — payment gateway double-capture',
    product: 'Credit Card', count: 28, critical: 3, high: 10, medium: 12, low: 3,
    confidence: 88, rootCause: 'Payment gateway replayed transaction during checkout timeout recovery',
    status: 'Escalated',
    complaints: ['#CNS-4819', '#CNS-4841', '#CNS-4847', '#CNS-4855'],
    corridor: 'Amazon → HDFC', timeWindow: '4 hours',
    channels: { App: 14, Email: 9, WhatsApp: 5 },
  },
  {
    id: 'DUP-095', summary: 'NetBanking login failures — overseas IP auto-lock',
    product: 'NetBanking', count: 15, critical: 2, high: 5, medium: 6, low: 2,
    confidence: 85, rootCause: 'Security auto-lock triggered by VPN and international IP ranges',
    status: 'Open',
    complaints: ['#CNS-4815', '#CNS-4830', '#CNS-4844'],
    corridor: 'International IPs', timeWindow: '6 hours',
    channels: { Email: 7, App: 5, IVR: 3 },
  },
  {
    id: 'DUP-091', summary: 'FD maturity not credited — reconciliation batch failure',
    product: 'Fixed Deposit', count: 11, critical: 1, high: 3, medium: 5, low: 2,
    confidence: 90, rootCause: 'FD auto-credit batch job timing out during peak banking hours',
    status: 'Resolved',
    complaints: ['#CNS-4808', '#CNS-4825', '#CNS-4838'],
    corridor: 'Core Banking', timeWindow: '24 hours',
    channels: { Branch: 5, Email: 3, WhatsApp: 3 },
  },
  {
    id: 'DUP-087', summary: 'Insurance auto-debit without consent — partner enrollment issue',
    product: 'Insurance', count: 19, critical: 4, high: 8, medium: 5, low: 2,
    confidence: 92, rootCause: 'Third-party insurance partner enrolled customers without opt-in confirmation',
    status: 'Open',
    complaints: ['#CNS-4794', '#CNS-4781', '#CNS-4773', '#CNS-4765'],
    corridor: 'Partner API', timeWindow: '1 week',
    channels: { Email: 10, WhatsApp: 6, IVR: 3 },
  },
]

function SizeIndicator({ count }: { count: number }) {
  const scale = count >= 50 ? 'Massive' : count >= 20 ? 'Large' : count >= 6 ? 'Medium' : 'Small'
  const icons = count >= 50 ? 5 : count >= 20 ? 4 : count >= 6 ? 3 : 2
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex' }}>
        {Array.from({ length: icons }).map((_, i) => (
          <span key={i} style={{ fontSize: 13, marginLeft: i > 0 ? -6 : 0 }}>👤</span>
        ))}
      </div>
      <div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{count}</span>
        <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 4 }}>{scale}</span>
      </div>
    </div>
  )
}

export function Duplicates() {
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Cluster Size')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(clusters[0])
  const [viewDropdown, setViewDropdown] = useState(false)
  const [showConfidence, setShowConfidence] = useState<string | null>(null)
  const [showRootCause, setShowRootCause] = useState<string | null>(null)

  const toggle = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open: { bg: '#FEF3C7', text: '#92400E' },
    Escalated: { bg: '#EEF2FF', text: '#4F46E5' },
    Resolved: { bg: '#DCFCE7', text: '#16A34A' },
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Duplicates" />

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Duplicates</h1>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 460, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search cluster ID, complaint ID, customer, issue text..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }} />
          </div>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
          </button>
          <button type="button" style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Create Cluster</button>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button type="button" onClick={() => setViewDropdown(!viewDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>Auto Detected ▼</button>
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
            {['All', 'Open', 'Escalated', 'Resolved', 'UPI', 'Credit Card', 'NetBanking', 'Insurance', 'FD'].map((f) => (
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
              {['Cluster Size', 'Severity', 'SLA Impact', 'Confidence', 'Newest'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{clusters.length} clusters</span>
          </div>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F0F0F0', paddingTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', display: 'flex', alignItems: 'center' }}>{selectedIds.size} selected</span>
              {['Merge', 'Escalate as Cluster', 'Assign Team', 'Mark False Duplicate', 'Export'].map((a) => (
                <button key={a} type="button" onClick={() => setSelectedIds(new Set())}
                  style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #D1D5DB', color: '#374151', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}>{a}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* ZONE 3 — WORKSPACE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
            {/* LEFT — CLUSTER FEED */}
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Duplicate Clusters</h3>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 100px minmax(0, 1fr) 80px 100px 80px 100px minmax(0, 1fr) 80px 130px',
                gap: 8, alignItems: 'center', padding: '10px 24px', background: '#FAFBFC', borderBottom: '1px solid #F0F0F0',
                fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px',
              }}>
                {['', 'Cluster ID', 'Summary', 'Product', 'Count', 'Severity Mix', 'Confidence', 'Root Cause', 'Status', 'Actions'].map((h) => <div key={h}>{h}</div>)}
              </div>
              {clusters.map((c) => {
                const isExpanded = expandedId === c.id
                const st = statusColors[c.status]
                return (
                  <div key={c.id}>
                    <div onClick={() => setSelectedCluster(c)}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 100px minmax(0, 1fr) 80px 100px 80px 100px minmax(0, 1fr) 80px 130px',
                        gap: 8, alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #F5F6FA',
                        background: selectedIds.has(c.id) ? '#EFF6FF' : 'white',
                        borderLeft: selectedIds.has(c.id) ? '3px solid #3B82F6' : '3px solid transparent',
                        cursor: 'pointer', transition: 'background .1s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggle(c.id)}
                          style={{ width: 14, height: 14, cursor: 'pointer' }} onClick={(ev) => ev.stopPropagation()} />
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : c.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.15s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{c.id}</span>
                      <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{c.summary}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{c.product}</span>
                      <SizeIndicator count={c.count} />
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>{c.critical} C</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#EA580C' }}>{c.high} H</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#CA8A04' }}>{c.medium} M</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>{c.low} L</span>
                      </div>
                      <div onClick={(ev) => { ev.stopPropagation(); setShowConfidence(showConfidence === c.id ? null : c.id) }}
                        style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>{c.confidence}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', width: '100%', marginTop: 2 }}>
                          <div style={{ height: '100%', width: `${c.confidence}%`, borderRadius: 2, background: '#16A34A' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{c.rootCause}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{c.status}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[
                          { label: 'View', color: '#3B82F6', bg: '#EFF6FF' },
                          { label: 'Merge', color: '#6B7280', bg: undefined },
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

                    {showConfidence === c.id && (
                      <div style={{
                        margin: '0 24px 0 60px', padding: 10, borderRadius: 8,
                        background: '#DCFCE7', border: '1px solid #BBF7D0', fontSize: 11, color: '#166534', lineHeight: 1.6,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Confidence: {c.confidence}% — Contributors:</div>
                        {['Issue text similarity (+35)', 'Product similarity (+25)', 'Time window (+20)', 'Customer behavior (+14)'].map((x) => <div key={x} style={{ paddingLeft: 8 }}>• {x}</div>)}
                      </div>
                    )}

                    {isExpanded && (
                      <div style={{
                        padding: '14px 24px 14px 60px', display: 'flex', flexDirection: 'column', gap: 10,
                        borderBottom: '1px solid #F5F6FA', background: '#FAFBFC',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Included Complaints</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {c.complaints.map((id) => (
                            <span key={id} style={{ padding: '2px 10px', borderRadius: 6, background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>{id}</span>
                          ))}
                          {c.count > c.complaints.length && (
                            <span style={{ padding: '2px 10px', borderRadius: 6, background: '#F3F4F6', color: '#6B7280', fontSize: 11, fontWeight: 600 }}>+{c.count - c.complaints.length} more</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Similarity Signals</div>
                        <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                          Issue text similarity: 92% · Same product: {c.product} · Same corridor: {c.corridor} · Time window: {c.timeWindow}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Pattern Explanation</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>
                          Most customers report: Money debited, no credit confirmation, repeated retries.
                        </p>
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#6B7280' }}>Assign:</span>
                            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151' }}>
                              <option>Payments Team</option><option>Cards Dispute</option></select>
                            <span style={{ fontSize: 11, color: '#6B7280' }}>Priority:</span>
                            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151' }}>
                              <option>Critical</option><option>High</option></select>
                            <input placeholder="Cluster note..." style={{
                              flex: 1, minWidth: 100, padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151', outline: 'none',
                            }} />
                            <button type="button" style={{ padding: '5px 14px', borderRadius: 6, background: '#DC2626', color: 'white', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Escalate Cluster</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* RIGHT — DUPLICATE INTELLIGENCE */}
            {selectedCluster && (
              <div style={{
                background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)',
                position: 'sticky', top: 24, padding: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" /></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Duplicate Intelligence</h3>
                  <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedCluster.id}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Cluster Classification</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {['UPI', 'Transaction Failure', 'Critical', 'Systemic'].map((t) => (
                        <span key={t} style={{ padding: '4px 12px', borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Similarity Breakdown</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Issue Text', pct: 92 },
                        { label: 'Product Match', pct: 100 },
                        { label: 'Time Match', pct: 82 },
                        { label: 'Behavior Match', pct: 71 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
                            <span style={{ color: '#6B7280' }}>{item.label}</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{item.pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${item.pct}%`, borderRadius: 3, background: item.pct >= 90 ? '#16A34A' : '#3B82F6' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Root Cause Prediction</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>{selectedCluster.rootCause}</p>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', marginTop: 4 }}>Confidence: {selectedCluster.confidence}%</div>
                  </div>
                  <div onClick={() => setShowRootCause(showRootCause === selectedCluster.id ? null : selectedCluster.id)}
                    style={{
                      background: '#F9FAFB', borderRadius: 8, padding: 12, border: '1px solid #E5E7EB',
                      cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Failure Point</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {['SBI (Origin)', 'UPI Gateway', 'HDFC Processing'].map((step, i) => (
                        <div key={step}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{step}</span>
                          {i < 2 && <div style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center', lineHeight: 1 }}>↓</div>}
                        </div>
                      ))}
                      <div style={{ padding: '4px 10px', borderRadius: 4, background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 700, width: 'fit-content' }}>← Failure Point</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Blast Radius</div>
                    <p style={{ margin: '0 0 6px 0', fontSize: 12, color: '#4B5563' }}>
                      Affected customers: <strong style={{ color: '#DC2626' }}>{selectedCluster.count}</strong>
                    </p>
                    {Object.entries(selectedCluster.channels).map(([ch, ct]) => (
                      <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: '#6B7280' }}>{ch}</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{ct}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>AI Recommended Action</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                      <li>Create one master escalation</li>
                      <li>Assign to Payments Team</li>
                      <li>Send proactive customer communication</li>
                      <li>Link all complaints to cluster</li>
                    </ul>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      {[
                        { label: 'Apply', bg: '#3B82F6', color: 'white' },
                        { label: 'Edit', bg: '#EEF2FF', color: '#4F46E5' },
                        { label: 'Regenerate', bg: '#E5E7EB', color: '#6B7280' },
                      ].map((btn) => (
                        <button key={btn.label} type="button" style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: btn.bg, color: btn.color, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{btn.label}</button>
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