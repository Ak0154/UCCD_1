import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const drafts = [
  {
    id: 'DFT-1042', complaintId: '#CNS-4821',
    summary: 'UPI amount debited but not credited',
    channel: 'Email', tone: 'Formal', confidence: 93,
    status: 'Draft', lastEdited: '2m ago',
    preview: 'Dear Akash Kumar,\n\nWe understand your concern regarding the UPI transaction issue. Our team is actively investigating this matter. Your complaint reference is #CNS-4821. We expect to resolve this within the next 4 hours.\n\nBest regards,\nHDFC Bank Support',
    variables: ['Akash Kumar', 'UPI transaction', '#CNS-4821', '4 hours'],
    checks: { noSensitiveInfo: true, toneAppropriate: true, policyCompliant: true },
  },
  {
    id: 'DFT-1038', complaintId: '#CNS-4819',
    summary: 'Credit card duplicate charge ₹12,499 × 2',
    channel: 'WhatsApp', tone: 'Apologetic', confidence: 87,
    status: 'Reviewed', lastEdited: '15m ago',
    preview: 'Dear Neha,\n\nWe sincerely apologize for the duplicate charge on your credit card. Our dispute team has identified both transactions and initiated a refund of ₹12,499. You will receive the credit within 3–5 business days. Reference: #CNS-4819.',
    variables: ['Neha', '₹12,499', '3–5 business days', '#CNS-4819'],
    checks: { noSensitiveInfo: true, toneAppropriate: true, policyCompliant: true },
  },
  {
    id: 'DFT-1035', complaintId: '#CNS-4815',
    summary: 'NetBanking locked — urgent access needed',
    channel: 'Email', tone: 'Urgent', confidence: 91,
    status: 'Sent', lastEdited: '1h ago',
    preview: 'Dear Rajesh,\n\nYour NetBanking access has been temporarily restored for the next 24 hours. Please reset your password immediately by visiting our secure portal. We recommend enabling 2-factor authentication for added security. Reference: #CNS-4815.',
    variables: ['Rajesh', '24 hours', '#CNS-4815'],
    checks: { noSensitiveInfo: true, toneAppropriate: true, policyCompliant: true },
  },
  {
    id: 'DFT-1031', complaintId: '#CNS-4808',
    summary: 'FD maturity ₹2,50,000 not credited',
    channel: 'SMS', tone: 'Formal', confidence: 85,
    status: 'Draft', lastEdited: '5m ago',
    preview: 'Dear Priya, your FD maturity amount of ₹2,50,000 is being processed. Manual credit will reflect in your savings account within 2 hours. Ref: #CNS-4808. -HDFC Bank.',
    variables: ['Priya', '₹2,50,000', '2 hours', '#CNS-4808'],
    checks: { noSensitiveInfo: true, toneAppropriate: true, policyCompliant: true },
  },
  {
    id: 'DFT-1027', complaintId: '#CNS-4794',
    summary: 'Insurance auto-debit without consent',
    channel: 'Email', tone: 'Apologetic', confidence: 78,
    status: 'Draft', lastEdited: '10m ago',
    preview: 'Dear Vikram,\n\nWe apologize for the unauthorized insurance enrollment. Our legal team has been notified. We have initiated cancellation of this policy and refund of all debited amounts. This will not recur. Reference: #CNS-4794.',
    variables: ['Vikram', '#CNS-4794'],
    checks: { noSensitiveInfo: true, toneAppropriate: true, policyCompliant: false },
  },
  {
    id: 'DFT-1023', complaintId: '#CNS-4789',
    summary: 'Gold loan ornaments not returned',
    channel: 'Email', tone: 'Formal', confidence: 94,
    status: 'Draft', lastEdited: '8m ago',
    preview: 'Dear Meera,\n\nWe understand your concern regarding your gold ornaments. Regional authorization has been obtained. You may collect your ornaments from Bandra West branch starting tomorrow at 10 AM. Please carry a valid ID. Reference: #CNS-4789.',
    variables: ['Meera', 'Bandra West branch', '10 AM', '#CNS-4789'],
    checks: { noSensitiveInfo: true, toneAppropriate: true, policyCompliant: true },
  },
]

const channelColors: Record<string, { bg: string; text: string }> = {
  Email: { bg: '#EEF2FF', text: '#4F46E5' },
  WhatsApp: { bg: '#DCFCE7', text: '#16A34A' },
  SMS: { bg: '#FEF3C7', text: '#A16207' },
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Draft: { bg: '#FEF3C7', text: '#92400E' },
  Reviewed: { bg: '#EEF2FF', text: '#4F46E5' },
  Sent: { bg: '#DCFCE7', text: '#16A34A' },
}

function ConfidenceBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? '#16A34A' : pct >= 80 ? '#F59E0B' : '#DC2626'
  const label = pct >= 90 ? 'High' : pct >= 80 ? 'Medium' : 'Low'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{pct}</span>
        <span style={{ fontSize: 10, color }}>%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', marginTop: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color }} />
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color, marginTop: 1 }}>{label} confidence</div>
    </div>
  )
}

export function AiDrafts() {
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<(typeof drafts)[0] | null>(drafts[0])
  const [showConfidence, setShowConfidence] = useState<string | null>(null)

  const toggle = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="AI Drafts" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>AI Drafts</h1>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 460, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search complaint ID, customer, draft content, template..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }} />
          </div>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
          </button>
          <button type="button" style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Create Draft</button>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', flexShrink: 0 }}>
            Complaint Resolution ▼
          </button>
        </header>

        {/* ZONE 2 — CONTROL BAR */}
        <div style={{
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '10px 28px', display: 'flex', flexDirection: 'column', gap: 10,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter</span>
            {['All', 'Email', 'WhatsApp', 'SMS', 'Formal', 'Apologetic', 'Draft', 'Reviewed', 'Sent', 'High Confidence'].map((f) => (
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
              {['Newest', 'Confidence', 'Priority', 'Complaint Severity', 'Customer Value'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
              {['List', 'Split', 'Template'].map((m) => (
                <button key={m} type="button"
                  style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, background: 'white', color: '#6B7280', border: 'none', cursor: 'pointer', borderRight: m !== 'Template' ? '1px solid #E5E7EB' : 'none' }}>{m}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{drafts.length} drafts</span>
          </div>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F0F0F0', paddingTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', display: 'flex', alignItems: 'center' }}>{selectedIds.size} selected</span>
              {['Approve', 'Regenerate', 'Assign Review', 'Export', 'Delete'].map((a) => (
                <button key={a} type="button" onClick={() => setSelectedIds(new Set())}
                  style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #D1D5DB', color: '#374151', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}>{a}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* LEFT — DRAFT QUEUE */}
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Draft Queue</h3>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 90px 130px minmax(0, 1fr) 80px 90px 90px 90px 120px',
                gap: 8, alignItems: 'center', padding: '10px 24px', background: '#FAFBFC', borderBottom: '1px solid #F0F0F0',
                fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px',
              }}>
                {['', 'Draft ID', 'Complaint', 'Channel', 'Tone', 'Confidence', 'Status', 'Last Edited', 'Actions'].map((h) => <div key={h}>{h}</div>)}
              </div>

              {drafts.map((d) => {
                const ch = channelColors[d.channel] ?? channelColors.Email
                const st = statusColors[d.status]
                const isExpanded = expandedId === d.id
                return (
                  <div key={d.id}>
                    <div onClick={() => setSelectedDraft(d)}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 90px 130px minmax(0, 1fr) 80px 90px 90px 90px 120px',
                        gap: 8, alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #F5F6FA',
                        background: selectedIds.has(d.id) ? '#EFF6FF' : 'white',
                        borderLeft: selectedIds.has(d.id) ? '3px solid #3B82F6' : '3px solid transparent',
                        cursor: 'pointer', transition: 'background .1s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggle(d.id)}
                          style={{ width: 14, height: 14, cursor: 'pointer' }} onClick={(ev) => ev.stopPropagation()} />
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : d.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '.15s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{d.id}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{d.complaintId}</div>
                        <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.summary}</div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: ch.text, background: ch.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{d.channel}</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{d.tone}</span>
                      <div onClick={(ev) => { ev.stopPropagation(); setShowConfidence(showConfidence === d.id ? null : d.id) }} style={{ cursor: 'pointer' }}>
                        <ConfidenceBar pct={d.confidence} />
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{d.status}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{d.lastEdited}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[
                          { label: 'View', color: '#3B82F6', bg: '#EFF6FF' },
                          { label: 'Edit', color: '#6B7280', bg: undefined },
                          { label: 'Send', color: '#16A34A', bg: '#DCFCE7' },
                        ].map((btn) => (
                          <button key={btn.label} type="button" onClick={(ev) => ev.stopPropagation()}
                            style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: btn.color, background: btn.bg ?? 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>{btn.label}</button>
                        ))}
                      </div>
                    </div>

                    {showConfidence === d.id && (
                      <div style={{
                        margin: '0 24px 0 60px', padding: 10, borderRadius: 8,
                        background: '#DCFCE7', border: '1px solid #BBF7D0', fontSize: 11, color: '#166534', lineHeight: 1.6,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Confidence: {d.confidence}% — Contributors:</div>
                        {['Clear complaint context (+30)', 'Known issue pattern (+25)', 'Previous successful drafts (+20)', 'Customer history (+18)'].map((x) => <div key={x} style={{ paddingLeft: 8 }}>• {x}</div>)}
                      </div>
                    )}

                    {isExpanded && (
                      <div style={{
                        padding: '14px 24px 14px 60px', display: 'flex', flexDirection: 'column', gap: 10,
                        borderBottom: '1px solid #F5F6FA', background: '#FAFBFC',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Draft Preview</div>
                        <div style={{ padding: 12, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 12, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{d.preview}</div>

                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Variables Used</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {d.variables.map((v) => (
                            <span key={v} style={{ padding: '2px 10px', borderRadius: 6, background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>{v}</span>
                          ))}
                        </div>

                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Compliance Checks</div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                          {[
                            { label: 'No sensitive info', ok: d.checks.noSensitiveInfo },
                            { label: 'Tone appropriate', ok: d.checks.toneAppropriate },
                            { label: 'Policy compliant', ok: d.checks.policyCompliant },
                          ].map((c) => (
                            <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.ok ? '#16A34A' : '#DC2626' }}>
                              {c.ok ? '✓' : '✗'} {c.label}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                          <input placeholder="Add custom note..." style={{
                            flex: 1, padding: '5px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, color: '#374151', outline: 'none',
                          }} />
                          <button type="button" style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', fontSize: 11, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}>Regenerate</button>
                          <button type="button" style={{ padding: '5px 14px', borderRadius: 6, background: '#3B82F6', color: 'white', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                          <button type="button" style={{ padding: '5px 14px', borderRadius: 6, background: '#16A34A', color: 'white', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* RIGHT — DRAFT INTELLIGENCE */}
            {selectedDraft && (
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', position: 'sticky', top: 24, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" /></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Draft Intelligence</h3>
                  <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedDraft.id}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Context Understanding</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                      <div>Category: <strong style={{ color: '#4F46E5' }}>UPI transaction failure</strong></div>
                      <div>Emotion: <strong style={{ color: '#EA580C' }}>Frustrated</strong></div>
                      <div>Urgency: <strong style={{ color: '#DC2626' }}>High</strong></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Draft Quality Analysis</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Clarity', pct: 90 },
                        { label: 'Empathy', pct: 82 },
                        { label: 'Professionalism', pct: 97 },
                        { label: 'Compliance', pct: 100 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
                            <span style={{ color: '#6B7280' }}>{item.label}</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{item.pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${item.pct}%`, borderRadius: 3, background: item.pct >= 90 ? '#16A34A' : item.pct >= 80 ? '#F59E0B' : '#DC2626' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Alternative Suggestions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Version A', desc: 'Formal reassurance', color: '#4F46E5', bg: '#EEF2FF' },
                        { label: 'Version B', desc: 'Short concise response', color: '#16A34A', bg: '#DCFCE7' },
                        { label: 'Version C', desc: 'Highly empathetic', color: '#A16207', bg: '#FEF3C7' },
                      ].map((v) => (
                        <div key={v.label} style={{ padding: '10px 14px', borderRadius: 8, background: v.bg, border: `1px solid ${v.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: v.color }}>{v.label}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{v.desc}</div>
                          </div>
                          <button type="button" style={{ padding: '3px 10px', borderRadius: 4, background: v.color, color: 'white', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Select</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>AI Recommendation</div>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>
                      <strong>Use Version C</strong> — Customer sentiment is highly negative. Include expected resolution time to reduce customer anxiety.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
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