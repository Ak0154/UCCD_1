import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const timelineEvents = [
  { time: '2h ago', type: 'complaint', icon: '📄', text: 'Complaint created: "UPI amount debited but not credited"', status: 'Escalated', detail: 'Transaction #TXN-59321 for ₹65,000. Debit confirmed at HDFC end, credit not received at SBI beneficiary. 72+ hours pending.', linked: '#CNS-4924' },
  { time: 'Yesterday', type: 'call', icon: '📞', text: 'Customer called support', duration: '8 min', sentiment: 'Frustrated', detail: 'Agent Priya M. handled the call. Customer expressed frustration about the delay. Promised callback within 2 hours.' },
  { time: 'Yesterday', type: 'email', icon: '✉', text: 'Automated email sent: "Complaint registered"', reference: 'REF-8821' },
  { time: '3 days ago', type: 'payment', icon: '₹', text: 'Credit card payment completed', amount: '₹12,400' },
  { time: '5 days ago', type: 'branch', icon: '🏦', text: 'FD account created', amount: '₹50,000', branch: 'Bandra West' },
  { time: '1 week ago', type: 'complaint', icon: '📄', text: 'Previous complaint: "NetBanking app crash on iOS 18"', status: 'Resolved', detail: 'Issue resolved after app update v4.2.1 was released. Customer confirmed resolution.', linked: '#CNS-4789' },
  { time: '2 weeks ago', type: 'chat', icon: '💬', text: 'WhatsApp chat: Balance inquiry', duration: '3 messages' },
  { time: '3 weeks ago', type: 'payment', icon: '₹', text: 'Personal loan EMI paid', amount: '₹18,500' },
]

const products = [
  { name: 'Savings Account', detail: 'Balance: ₹1.2L', number: '****4521', status: 'Active' },
  { name: 'Credit Card', detail: 'Limit: ₹3L', number: '****4532', status: 'Active', dueDate: '12 Jul', outstanding: '₹14,000', utilPct: 67 },
  { name: 'Personal Loan', detail: 'Outstanding: ₹2.8L', number: 'LN-8823', status: 'Active' },
  { name: 'Fixed Deposit', detail: '₹50,000', number: 'FD-4412', status: 'Matured' },
]

const relationshipNodes = [
  { name: 'Akash Kumar', type: 'primary', x: 130, y: 40 },
  { name: 'Savings', type: 'product', x: 30, y: 130, linked: true },
  { name: 'Credit Card', type: 'product', x: 130, y: 170, linked: true },
  { name: 'Loan', type: 'product', x: 230, y: 130, linked: true },
  { name: 'FD', type: 'product', x: 130, y: 90, linked: false },
]

const complaints = [
  { id: '#CNS-4924', issue: 'UPI amount debited not credited', status: 'Escalated', sla: '1h', assigned: 'RS' },
  { id: '#CNS-4789', issue: 'NetBanking app crash iOS', status: 'Resolved', sla: '4h', assigned: 'PM' },
  { id: '#CNS-4612', issue: 'Credit card EMI not updated', status: 'Resolved', sla: '20h', assigned: 'NG' },
]

const transactions = [
  { date: '22 May 2026', type: 'UPI Debit', amount: '₹65,000', status: 'Pending' },
  { date: '19 May 2026', type: 'Credit Card Payment', amount: '₹12,400', status: 'Completed' },
  { date: '15 May 2026', type: 'Loan EMI', amount: '₹18,500', status: 'Completed' },
  { date: '12 May 2026', type: 'FD Created', amount: '₹50,000', status: 'Completed' },
]

const messages = [
  { time: '9:10 AM', sender: 'customer', text: 'Still waiting for my refund. It has been 3 days now. This is unacceptable.' },
  { time: '9:12 AM', sender: 'agent', text: 'We understand your frustration, Mr. Kumar. Our payments team is investigating transaction #TXN-59321. We will update you within the next 2 hours.' },
  { time: '9:15 AM', sender: 'customer', text: 'If I don\'t hear back by 11 AM, I am filing a complaint with RBI.' },
  { time: '9:18 AM', sender: 'agent', text: 'I have escalated this to our L2 Payments team. Reference #ESC-8841. You will receive an SMS update shortly.' },
]

const documents = [
  { name: 'PAN Card', type: 'KYC', icon: '🪪' },
  { name: 'KYC Form', type: 'Form', icon: '📝' },
  { name: 'Loan Agreement', type: 'Loan', icon: '📋' },
  { name: 'Aadhaar Card', type: 'KYC', icon: '🆔' },
]

type Tab = 'Complaints' | 'Transactions' | 'Communication' | 'Documents' | 'Notes'
const tabs: Tab[] = ['Complaints', 'Transactions', 'Communication', 'Documents', 'Notes']

function BottomTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Complaints')
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null)

  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            style={{
              padding: '14px 22px', border: 'none', background: 'none',
              fontSize: 13, fontWeight: activeTab === t ? 600 : 500,
              color: activeTab === t ? '#111827' : '#9CA3AF',
              borderBottom: activeTab === t ? '2px solid #3B82F6' : '2px solid transparent',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >{t}</button>
        ))}
      </div>

      <div style={{ padding: '16px 24px' }}>
        {activeTab === 'Complaints' && (
          <div style={{ display: 'grid', gridTemplateColumns: '90px minmax(0, 1fr) 80px 70px 70px', gap: 12, alignItems: 'center',
            fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px',
            padding: '8px 0', borderBottom: '1px solid #F0F0F0',
          }}>
            {['ID', 'Issue', 'Status', 'SLA', 'Assigned'].map((h) => <div key={h}>{h}</div>)}
            {complaints.map((c) => (
              <>
                <span key={c.id + 'id'} style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{c.id}</span>
                <span key={c.id + 'i'} style={{ fontSize: 12, color: '#374151' }}>{c.issue}</span>
                <span key={c.id + 's'}>{c.status}</span>
                <span key={c.id + 'sl'}>{c.sla}</span>
                <span key={c.id + 'a'}>{c.assigned}</span>
              </>
            ))}
          </div>
        )}

        {activeTab === 'Transactions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 100px 100px', gap: 16, alignItems: 'center',
            fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px',
            padding: '8px 0', borderBottom: '1px solid #F0F0F0',
          }}>
            {['Date', 'Type', 'Amount', 'Status'].map((h) => <div key={h}>{h}</div>)}
            {transactions.map((t) => (
              <>
                <span key={t.date} style={{ fontSize: 12, color: '#374151' }}>{t.date}</span>
                <span key={t.type} style={{ fontSize: 12, color: '#374151' }}>{t.type}</span>
                <span key={t.amount} style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{t.amount}</span>
                <span key={t.status} style={{ fontSize: 11, color: t.status === 'Completed' ? '#16A34A' : '#F59E0B' }}>{t.status}</span>
              </>
            ))}
          </div>
        )}

        {activeTab === 'Communication' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                onClick={() => setExpandedMsg(expandedMsg === i ? null : i)}
                style={{
                  display: 'flex', gap: 12, background: msg.sender === 'customer' ? '#F9FAFB' : '#EFF6FF',
                  borderRadius: 10, padding: 12, cursor: 'pointer', border: '1px solid #F0F0F0',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.sender === 'customer' ? '#FEE2E2' : '#DBEAFE', color: msg.sender === 'customer' ? '#DC2626' : '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {msg.sender === 'customer' ? 'AK' : 'PM'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{msg.sender === 'customer' ? 'Akash Kumar' : 'Priya M. (Agent)'}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{msg.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Documents' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {documents.map((d) => (
              <div key={d.name} style={{
                background: '#F9FAFB', borderRadius: 10, padding: 16,
                border: '1px solid #F0F0F0', textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{d.name}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{d.type}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Notes' && (
          <div style={{ padding: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.6, fontStyle: 'italic' }}>
              • Customer tends to escalate quickly — handle with care.<br />
              • Prefers WhatsApp communication over phone calls.<br />
              • Previous complaint #CNS-4789 was resolved after app update.<br />
              • Has three active products with the bank (Savings, CC, Loan).<br />
              • VIP treatment recommended — high-value customer.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ThreeSixtyView() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [expandedTimeline, setExpandedTimeline] = useState<number | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="360° View" />

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
            360° View
          </h1>

          <div style={{ flex: 1, minWidth: 0, maxWidth: 480, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search customer name, account number, mobile, complaint ID..."
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
            + New Complaint
          </button>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: 8, border: '1px solid #E5E7EB', background: 'white',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151',
              }}
            >
              Akash Kumar ▼
            </button>
          </div>
        </header>

        {/* ZONE 2 — CUSTOMER IDENTITY STRIP */}
        <CustomerIdentitiyStrip />

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ZONE 3 — 3-COLUMN INTELLIGENCE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.2fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* LEFT — CUSTOMER TIMELINE */}
            <div style={{
              background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden',
            }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>Activity Timeline</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['All', 'Complaints', 'Transactions', 'Calls', 'Messages'].map((f) => (
                    <button key={f} type="button" style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      border: '1px solid #E5E7EB', background: 'white', color: '#6B7280',
                      cursor: 'pointer',
                    }}>{f}</button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 35, top: 0, bottom: 0, width: 2, background: '#E5E7EB' }} />
                {timelineEvents.map((evt, i) => {
                  const isExpanded = expandedTimeline === i
                  return (
                    <div
                      key={i}
                      onClick={() => setExpandedTimeline(isExpanded ? null : i)}
                      style={{
                        position: 'relative', padding: '10px 24px 10px 52px',
                        cursor: 'pointer', transition: 'background .1s',
                        borderLeft: isExpanded ? '3px solid #3B82F6' : '3px solid transparent',
                      }}
                    >
                      <div style={{
                        position: 'absolute', left: 26, top: 14,
                        width: 20, height: 20, borderRadius: '50%', background: 'white',
                        border: '2px solid #D1D5DB', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 9,
                      }}>{evt.icon}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{evt.time}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937', lineHeight: 1.4 }}>{evt.text}</div>

                      {isExpanded && evt.detail && (
                        <div style={{
                          marginTop: 8, padding: 10, borderRadius: 8,
                          background: '#F9FAFB', border: '1px solid #F0F0F0',
                          fontSize: 11, color: '#4B5563', lineHeight: 1.5,
                        }}>
                          {evt.detail}
                          {evt.linked && (
                            <div style={{ marginTop: 6, fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>
                              Linked: {evt.linked}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* MIDDLE — PRODUCT & RELATIONSHIP */}
            <div style={{
              background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden',
            }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Products & Relationship</h3>
              </div>

              {/* Active Products */}
              <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column' }}>
                {products.map((p) => (
                  <div
                    key={p.name}
                    onClick={() => setSelectedProduct(selectedProduct === p.name ? null : p.name)}
                    style={{
                      padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer',
                      borderLeft: selectedProduct === p.name ? '3px solid #3B82F6' : '3px solid transparent',
                      paddingLeft: selectedProduct === p.name ? 12 : 0, marginLeft: selectedProduct === p.name ? -12 : 0,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                      {p.detail} · <span style={{ color: '#16A34A' }}>{p.status}</span>
                    </div>
                    {selectedProduct === p.name && p.utilPct !== undefined && (
                      <div style={{ marginTop: 8, padding: 10, background: '#F9FAFB', borderRadius: 8, fontSize: 11, color: '#4B5563', lineHeight: 1.5 }}>
                        <div>Card ending: {p.number}</div>
                        <div>Due date: {p.dueDate}</div>
                        <div>Outstanding: {p.outstanding}</div>
                        <div style={{ marginTop: 4 }}>
                          Utilization:
                          <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', marginTop: 4, overflow: 'hidden', width: '100%' }}>
                            <div style={{ height: '100%', width: `${p.utilPct}%`, borderRadius: 3, background: '#EA580C' }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#EA580C', fontWeight: 600 }}>{p.utilPct}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Relationship Graph */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>
                  Relationship
                </div>
                <svg viewBox="0 0 280 200" style={{ width: '100%', height: 'auto' }}>
                  {relationshipNodes.filter((n) => n.type === 'product' && n.linked).map((n) => (
                    <line key={n.name + 'line'} x1={130} y1={48} x2={n.x} y2={n.y} stroke="#D1D5DB" strokeWidth="1.5" />
                  ))}
                  {relationshipNodes.filter((n) => n.type === 'product' && !n.linked).map((n) => (
                    <line key={n.name + 'line'} x1={130} y1={48} x2={n.x} y2={n.y} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 3" />
                  ))}
                  {relationshipNodes.map((n) => (
                    <g key={n.name}>
                      <rect x={n.x - 40} y={n.y - 14} width={80} height={28} rx={6}
                        fill={n.type === 'primary' ? '#3B82F6' : '#F3F4F6'}
                      />
                      <text x={n.x} y={n.y + 3} textAnchor="middle"
                        fontSize="10" fontWeight="600"
                        fill={n.type === 'primary' ? 'white' : '#374151'}
                      >{n.name}</text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Health Score */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>
                  Relationship Score
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '89%', borderRadius: 4, background: '#16A34A' }} />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#16A34A' }}>89/100</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {['Payment history', 'Complaint frequency', 'Product usage', 'Customer value'].map((f) => (
                    <span key={f} style={{ fontSize: 9, color: '#9CA3AF' }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — AI CUSTOMER INSIGHTS */}
            <div style={{
              background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)',
              position: 'sticky', top: 148, padding: 24,
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
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Gen-AI Customer Insights</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Behavior Analysis</div>
                  <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                    Customer has contacted support <strong style={{ color: '#DC2626' }}>4 times in last 48 hours.</strong>
                  </p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
                    Most interactions related to:<br />UPI + NetBanking failures.
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Sentiment Trend</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <span>Jan <span style={{ fontSize: 16 }}>🟢</span> →</span>
                    <span>Feb <span style={{ fontSize: 16 }}>🟡</span> →</span>
                    <span>Mar <span style={{ fontSize: 16 }}>🔴</span></span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Positive → Neutral → Negative</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Similar Patterns</div>
                  <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                    Customer profile matches <strong style={{ color: '#DC2626' }}>37 customers</strong> affected by same issue.
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#6B7280' }}>
                    Possible system-wide payment degradation.
                  </p>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Next-Best Action</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                    <li>Route directly to Payments L2.</li>
                    <li>Offer proactive status update.</li>
                    <li style={{ color: '#DC2626', fontWeight: 600 }}>High probability of escalation if unresolved beyond 2 hours.</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[
                      { label: 'Apply', bg: '#3B82F6', color: 'white' },
                      { label: 'Edit', bg: '#EEF2FF', color: '#4F46E5' },
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
          </div>

          {/* ZONE 4 — BOTTOM TABS */}
          <BottomTabs />
        </div>
      </div>
    </div>
  )
}

function CustomerIdentitiyStrip() {
  return (
    <div style={{
      background: 'white', borderBottom: '1px solid #E5E7EB',
      padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 20,
      position: 'sticky', top: 0, zIndex: 15,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>AK</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Akash Kumar</h2>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>CUS-10294</span>
          <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>Premium Banking</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {['Savings', 'Credit Card', 'Loan', 'UPI'].map((tag) => (
            <span key={tag} style={{ padding: '2px 10px', borderRadius: 8, background: '#F3F4F6', color: '#6B7280', fontSize: 11, fontWeight: 600 }}>{tag}</span>
          ))}
          <span style={{ width: 1, height: 16, background: '#E5E7EB', margin: '0 4px' }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Risk: <strong style={{ color: '#F59E0B' }}>Medium</strong></span>
          <span style={{ width: 1, height: 16, background: '#E5E7EB', margin: '0 4px' }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Sentiment: <strong style={{ color: '#EA580C' }}>Negative</strong></span>
          <span style={{ width: 1, height: 16, background: '#E5E7EB', margin: '0 4px' }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Value: <strong style={{ color: '#16A34A' }}>High</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {['📞 Call', '✉ Email', '💬 WhatsApp', 'Create', 'Escalate'].map((action) => (
          <button key={action} type="button" style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: '1px solid #E5E7EB', background: 'white', color: '#374151',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{action}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid #E5E7EB', paddingLeft: 16, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Complaints</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>14</div>
        </div>
        <span style={{ width: 1, height: 24, background: '#E5E7EB' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Open</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>3</div>
        </div>
        <span style={{ width: 1, height: 24, background: '#E5E7EB' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Resolved</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>11</div>
        </div>
      </div>
    </div>
  )
}