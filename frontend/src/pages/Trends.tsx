import { useState } from 'react'
import { AppSidebar } from '../layout/AppSidebar'

const productTrends = [
  { name: 'UPI', growth: 42, color: '#DC2626', sign: '▲' },
  { name: 'Cards', growth: -8, color: '#16A34A', sign: '▼' },
  { name: 'NetBanking', growth: 12, color: '#EA580C', sign: '▲' },
  { name: 'Loans', growth: 0, color: '#6B7280', sign: '▬' },
]

const channelTrends = [
  { name: 'WhatsApp', pct: 42, color: '#25D366' },
  { name: 'App', pct: 31, color: '#3B82F6' },
  { name: 'Email', pct: 17, color: '#8B5CF6' },
  { name: 'IVR', pct: 10, color: '#F59E0B' },
]

const emergingIssues = [
  { name: 'UPI Pending Transactions', count: 62, time: '45m', severity: 'Critical', growth: 240, indicator: '🔥 Fastest growing issue' },
  { name: 'Credit Card Disputes', count: 28, time: '2h', severity: 'High', growth: 85, indicator: '⚠ Rising across channels' },
  { name: 'App Login Failures', count: 15, time: '3h', severity: 'Medium', growth: 40, indicator: '📱 App Store mentions rising' },
]

function Sparkline({ growth }: { growth: number }) {
  const w = 80; const h = 24; const pad = 4; const points = 6
  const seg = (w - pad * 2) / (points - 1)
  const mid = (h - pad * 2) / 2 + pad
  const vals = Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1)
    return growth > 0
      ? mid - (h - pad * 2) * 0.35 * t - Math.sin(t * Math.PI) * (h - pad * 2) * 0.3 * (growth / 100)
      : mid + (h - pad * 2) * 0.35 * t * (-growth / 100) + Math.sin(t * Math.PI) * (h - pad * 2) * 0.2 * (-growth / 100)
  })
  const d = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * seg} ${v}`).join(' ')
  const c = growth > 0 ? '#DC2626' : growth < 0 ? '#16A34A' : '#6B7280'
  return <svg width={w} height={h}><path d={d} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MainTrendChart() {
  const w = 700; const h = 200; const pad = 30
  const lines = [
    { name: 'UPI', color: '#3B82F6', data: [32, 35, 45, 58, 72, 84] },
    { name: 'Cards', color: '#16A34A', data: [40, 38, 35, 33, 30, 28] },
    { name: 'NetBanking', color: '#8B5CF6', data: [22, 25, 28, 35, 42, 48] },
    { name: 'Loans', color: '#F59E0B', data: [18, 20, 19, 22, 21, 20] },
  ]
  const maxVal = 90
  const chW = w - pad * 2
  const chH = h - pad * 2
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const xStep = chW / (labels.length - 1)
  const yPos = (v: number) => pad + chH * (1 - v / maxVal)

  return (
    <div>
      <h4 style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>Complaint Volume Over Time</h4>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto' }}>
        {[0, 30, 60, 90].map((v) => {
          const y = yPos(v)
          return <g key={v}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={pad - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
          </g>
        })}
        {labels.map((l, i) => (
          <text key={l} x={pad + i * xStep} y={h - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">{l}</text>
        ))}
        {lines.map((line) => (
          <path key={line.name}
            d={line.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${yPos(v)}`).join(' ')}
            fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {lines[0].data.map((_, i) => i === 4 && (
          <g key={`anom-${i}`}>
            <circle cx={pad + 4 * xStep} cy={yPos(lines[0].data[4])} r="14" fill="rgba(220,38,38,.1)" stroke="#DC2626" strokeWidth="1" strokeDasharray="2 2" />
            <text x={pad + 4 * xStep + 20} y={yPos(lines[0].data[4])} fontSize="10" fill="#DC2626" fontWeight="700">⚠ +43% surge</text>
          </g>
        ))}
        <g transform={`translate(${w - 100}, 10)`}>
          {lines.map((l, i) => (
            <g key={l.name} transform={`translate(0, ${i * 16})`}>
              <line x1={0} y1={6} x2={12} y2={6} stroke={l.color} strokeWidth="2" />
              <text x={16} y={9} fontSize="10" fill="#6B7280">{l.name}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

function SentimentChart() {
  const w = 280; const h = 80; const pad = 16; const points = 7
  const vals = [20, 35, 50, 55, 65, 78, 82]
  const chW = w - pad * 2; const chH = h - pad * 2
  const d = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + (i * chW) / (points - 1)} ${pad + chH * (1 - v / 100)}`).join(' ')
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
          <span>🟢</span><span style={{ color: '#9CA3AF' }}>→</span><span>🟡</span><span style={{ color: '#9CA3AF' }}>→</span><span>🔴</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>+18% this week</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <line x1={pad} y1={pad + chH} x2={w - pad} y2={pad + chH} stroke="#F3F4F6" strokeWidth="1" />
        <path d={d} fill="url(#sentGrad)" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity=".15" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function ForecastChart() {
  const w = 280; const h = 80; const pad = 12; const points = 5
  const actual = [32, 45, 58, 72, 78]
  const forecast = [78, 88, 95, 98, 92]
  const chW = w - pad * 2; const chH = h - pad * 2
  const maxVal = 100
  const dx = chW / (points + forecast.length - 1)

  const actD = actual.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * dx} ${pad + chH * (1 - v / maxVal)}`).join(' ')
  const foreD = forecast.map((v, i) => `${'L'} ${pad + (actual.length + i) * dx} ${pad + chH * (1 - v / maxVal)}`).join(' ')

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 11, color: '#6B7280' }}>
        Predicted surge: <strong style={{ color: '#DC2626' }}>+28%</strong> — 4 PM to 6 PM
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <line x1={pad} y1={pad + chH} x2={w - pad} y2={pad + chH} stroke="#F3F4F6" strokeWidth="1" />
        <path d={actD} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <path d={`M ${pad + (actual.length - 1) * dx} ${pad + chH * (1 - actual[actual.length - 1] / maxVal)}` + foreD}
          fill="none" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
        <line x1={pad + (actual.length - 1) * dx} y1={pad} x2={pad + (actual.length - 1) * dx} y2={pad + chH} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
        <text x={pad + (actual.length - 1) * dx + 4} y={10} fontSize="8" fill="#9CA3AF">Now</text>
      </svg>
    </div>
  )
}

export function Trends() {
  const [dateRange, setDateRange] = useState('Last 7d')
  const [compare, setCompare] = useState('Week vs Week')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Trends" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        {/* ZONE 1 — TOP BAR */}
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Trends</h1>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 460, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search trend, product, complaint type, issue cluster..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }} />
          </div>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
          </button>
          <button type="button" style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Export Report</button>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', flexShrink: 0, outline: 'none' }}>
            {['Last 24h', 'Last 7d', 'Last 30d', 'Custom Range'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </header>

        {/* ZONE 2 — CONTROL BAR */}
        <div style={{
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter</span>
          {['All', 'UPI', 'Cards', 'NetBanking', 'Loans', 'Critical', 'Negative', 'Premium'].map((f) => (
            <button key={f} type="button" style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>{f}</button>
          ))}
          <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 4px' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Compare</span>
          <select value={compare} onChange={(e) => setCompare(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 500, color: '#374151', background: '#F9FAFB', cursor: 'pointer', outline: 'none' }}>
            {['Today vs Yesterday', 'Week vs Week', 'Month vs Month'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
            {['Charts', 'Heatmaps', 'Tables', 'Forecast'].map((m) => (
              <button key={m} type="button" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, background: 'white', color: '#6B7280', border: 'none', cursor: 'pointer', borderRight: m !== 'Forecast' ? '1px solid #E5E7EB' : 'none' }}>{m}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>18,492 complaints</span>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ZONE 3 — MAIN TREND CHART */}
          <div style={{
            background: 'white', borderRadius: 16, padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,.03)',
          }}>
            <MainTrendChart />
          </div>

          {/* ZONE 3 — TREND CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
            {/* PRODUCT TRENDS */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Product Trends</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {productTrends.map((p) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkline growth={p.growth} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
                      {p.sign} {Math.abs(p.growth)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CHANNEL TRENDS */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Channel Trends</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {channelTrends.map((ch) => (
                  <div key={ch.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: '#6B7280' }}>{ch.name}</span>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{ch.pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ch.pct}%`, borderRadius: 3, background: ch.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: '#F9FAFB', fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
                ⚠ WhatsApp complaints rising faster than app complaints.
              </div>
            </div>

            {/* SENTIMENT TRENDS */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Sentiment Trends</h3>
              <SentimentChart />
              <div style={{ marginTop: 8, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                Negative sentiment: +18% this week
              </div>
            </div>
          </div>

          {/* ZONE 4 — AI INTELLIGENCE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

            {/* AI TREND INTELLIGENCE */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" /></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>Trend Intelligence</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>Emerging Pattern</div>
                  <p style={{ margin: 0, fontSize: 11, color: '#4B5563', lineHeight: 1.5 }}>
                    Abnormal increase in: <strong style={{ color: '#DC2626' }}>UPI debit failures</strong> (Started 11:40 AM)
                  </p>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', marginTop: 2 }}>Confidence: 91%</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>Correlation</div>
                  <p style={{ margin: 0, fontSize: 11, color: '#4B5563', lineHeight: 1.5 }}>
                    Negative sentiment ↑ + Escalations ↑ + UPI failures ↑ — <strong style={{ color: '#DC2626' }}>strong link</strong>
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>Geography</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mumbai</span><span style={{ color: '#DC2626', fontWeight: 600 }}>High</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delhi</span><span style={{ color: '#F59E0B', fontWeight: 600 }}>Medium</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bangalore</span><span style={{ color: '#16A34A', fontWeight: 600 }}>Low</span></div>
                  </div>
                </div>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>Recommendation</div>
                  <ul style={{ margin: '0 0 10px 0', paddingLeft: 16, fontSize: 11, color: '#374151', lineHeight: 1.5 }}>
                    <li>Notify Payments Ops</li>
                    <li>Create master escalation</li>
                    <li>Send proactive customer advisory</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Apply', 'Create Escalation', 'Export Insight'].map((b) => (
                      <button key={b} type="button" style={{ padding: '4px 10px', borderRadius: 4, background: '#3B82F6', color: 'white', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{b}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* EMERGING ISSUES */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Emerging Issues</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {emergingIssues.map((issue) => (
                  <div key={issue.name} style={{ padding: 12, borderRadius: 10, border: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{issue.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: 4 }}>{issue.severity}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      +{issue.count} complaints in {issue.time}
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${Math.min(issue.growth / 2.4, 100)}%`, borderRadius: 3, background: '#DC2626' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: '#DC2626', fontWeight: 700 }}>+{issue.growth}% growth</span>
                      <span>{issue.indicator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FORECASTING */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,.03)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>Forecasting</h3>
              <ForecastChart />
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 11, color: '#4B5563', lineHeight: 1.5 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>Contributors</div>
                Historical spikes · Current escalation growth · Sentiment deterioration · Payment gateway latency
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}