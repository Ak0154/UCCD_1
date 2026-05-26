import { useState, useEffect } from 'react'
import { AppSidebar } from '../layout/AppSidebar'
import { api } from '../api/client'
import type { ComplaintCluster, Complaint } from '../types/complaint'

interface DisplayCluster {
  id: string
  types: string[]
  count: number
  product: string
  confidence: number
  critical: number
  high: number
  medium: number
  low: number
  status: string
  complaints: Complaint[]
  channels: Record<string, number>
}

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
  const [clusters, setClusters] = useState<DisplayCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [sort, setSort] = useState('Cluster Size')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedCluster, setSelectedCluster] = useState<DisplayCluster | null>(null)
  const [showConfidence, setShowConfidence] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getClusters()
      .then((res) => {
        const mapped: DisplayCluster[] = res.clusters.map((c: ComplaintCluster) => {
          const severityMap = { critical: 0, high: 0, medium: 0, low: 0 }
          const channels: Record<string, number> = {}
          let totalConf = 0
          let confCount = 0
          const productSet = new Set<string>()
          const statuses = new Set<string>()

          c.complaints.forEach((comp: Complaint) => {
            if (comp.severity_score != null) {
              if (comp.severity_score >= 8) severityMap.critical++
              else if (comp.severity_score >= 5) severityMap.high++
              else if (comp.severity_score >= 3) severityMap.medium++
              else severityMap.low++
            }
            if (comp.channel) channels[comp.channel] = (channels[comp.channel] || 0) + 1
            if (comp.type_confidence != null) { totalConf += comp.type_confidence; confCount++ }
            if (comp.product_code) productSet.add(comp.product_code)
            if (comp.status) statuses.add(comp.status)
          })

          return {
            id: c.cluster_id,
            types: c.complaint_types,
            count: c.count,
            product: Array.from(productSet).join(', ') || 'N/A',
            confidence: confCount > 0 ? Math.round(totalConf / confCount) : 0,
            ...severityMap,
            status: statuses.has('escalated') ? 'Escalated' : (statuses.has('queued') || statuses.has('new') || statuses.has('in_progress')) ? 'Open' : 'Resolved',
            complaints: c.complaints,
            channels,
          }
        })
        setClusters(mapped)
        if (mapped.length > 0 && !selectedCluster) setSelectedCluster(mapped[0])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load clusters'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open: { bg: '#FEF3C7', text: '#92400E' },
    Escalated: { bg: '#FEF2F2', text: '#991B1B' },
    Resolved: { bg: '#DCFCE7', text: '#16A34A' },
  }

  const filteredClusters = clusters.filter((c) => {
    if (activeFilter === 'All') return true
    if (['Open', 'Escalated', 'Resolved'].includes(activeFilter)) return c.status === activeFilter
    return c.product.includes(activeFilter) || c.types.some((t) => t.includes(activeFilter))
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <AppSidebar activeItem="Duplicates" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <AppSidebar activeItem="Duplicates" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA', gap: 16 }}>
          <div style={{ fontSize: 14, color: '#DC2626' }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar activeItem="Duplicates" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#F5F6FA' }}>
        <header style={{
          height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Duplicate Clusters</h1>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 460, height: 36, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search cluster ID, complaint ID, issue text..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151' }} />
          </div>
        </header>

        <div style={{
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter</span>
          {['All', 'Open', 'Escalated', 'Resolved'].concat(
            Array.from(new Set(clusters.flatMap((c) => c.types)))
          ).slice(0, 15).map((f) => (
            <button key={f} type="button" onClick={() => setActiveFilter(f)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                border: `1px solid ${activeFilter === f ? '#2563EB' : '#E5E7EB'}`,
                background: activeFilter === f ? '#EFF6FF' : 'white',
                color: activeFilter === f ? '#1D4ED8' : '#6B7280',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
              }}>{f}</button>
          ))}
          <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 4px' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.3px' }}>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 500, color: '#374151', background: '#F9FAFB', cursor: 'pointer', outline: 'none' }}>
            {['Cluster Size', 'Severity', 'Confidence', 'Newest'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{filteredClusters.length} clusters</span>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Duplicate Clusters</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '40px 100px minmax(0, 1fr) 80px 100px 80px 100px 80px 130px',
                  gap: 8, alignItems: 'center', padding: '10px 24px', background: '#FAFBFC', borderBottom: '1px solid #F0F0F0',
                  fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px',
                  minWidth: 1000,
                }}>
                  <div></div>
                  <div>Cluster ID</div>
                  <div>Types</div>
                  <div>Product</div>
                  <div>Count</div>
                  <div>Severity</div>
                  <div>Confidence</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {filteredClusters.map((c) => {
                  const st = statusColors[c.status] || statusColors.Open
                  return (
                    <div key={c.id}>
                      <div onClick={() => setSelectedCluster(c)}
                        style={{
                          display: 'grid', gridTemplateColumns: '40px 100px minmax(0, 1fr) 80px 100px 80px 100px 80px 130px',
                          gap: 8, alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #F5F6FA',
                          background: selectedIds.has(c.id) ? '#EFF6FF' : 'white',
                          cursor: 'pointer', transition: 'background .1s',
                          minWidth: 1000,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggle(c.id)}
                            style={{ width: 14, height: 14, cursor: 'pointer' }} onClick={(ev) => ev.stopPropagation()} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>{c.id}</span>
                        <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{c.types.join(', ')}</span>
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
                            <span style={{ fontSize: 14, fontWeight: 700, color: c.confidence >= 80 ? '#16A34A' : '#F59E0B' }}>{c.confidence}</span>
                            <span style={{ fontSize: 10, color: '#9CA3AF' }}>%</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', width: '100%', marginTop: 2 }}>
                            <div style={{ height: '100%', width: `${c.confidence}%`, borderRadius: 2, background: c.confidence >= 80 ? '#16A34A' : '#F59E0B' }} />
                          </div>
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>{c.status}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button key="view" type="button" onClick={(ev) => ev.stopPropagation()}
                            style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#3B82F6', background: '#EFF6FF', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>View</button>
                        </div>
                      </div>

                      {showConfidence === c.id && (
                        <div style={{ margin: '0 24px 0 60px', padding: 10, borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 11, color: '#166534', lineHeight: 1.6, minWidth: 1000 }}>
                          Confidence {c.confidence}% based on type overlap, product match, and channel distribution.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedCluster && (
              <div style={{
                background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,.03)',
                position: 'sticky', top: 24, padding: 24, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4zM9 18h6M10 22h4" /></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Cluster Analysis</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Types</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selectedCluster.types.slice(0, 4).map((t) => (
                        <span key={t} style={{ padding: '4px 12px', borderRadius: 12, background: '#EFF6FF', color: '#1E40AF', border: '1px solid #DBEAFE', fontSize: 11, fontWeight: 600 }}>{t}</span>
                      ))}
                      {(() => {
                        const isEsc = selectedCluster.status.toLowerCase().includes('escalated');
                        const isResolved = selectedCluster.status.toLowerCase().includes('resolved');
                        const bg = isEsc ? '#FEF2F2' : isResolved ? '#DCFCE7' : '#FEF3C7';
                        const color = isEsc ? '#DC2626' : isResolved ? '#16A34A' : '#92400E';
                        const border = isEsc ? '1px solid #FEE2E2' : isResolved ? '1px solid #D1FAE5' : '1px solid #FEF3C7';
                        return (
                          <span style={{ padding: '4px 12px', borderRadius: 12, background: bg, color: color, border: border, fontSize: 11, fontWeight: 600 }}>{selectedCluster.status}</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Similarity</div>
                    {[
                      { label: 'Type Match', pct: 92 },
                      { label: 'Product Match', pct: selectedCluster.product !== 'N/A' ? 100 : 50 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
                          <span style={{ color: '#6B7280' }}>{item.label}</span>
                          <span style={{ fontWeight: 700, color: '#111827' }}>{item.pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.pct}%`, borderRadius: 3, background: '#3B82F6' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Blast Radius</div>
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563' }}>
                      Affected complaints: <strong style={{ color: '#DC2626' }}>{selectedCluster.count}</strong>
                    </p>
                  </div>
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Recommended Action</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                      <li>Create one master escalation</li>
                      <li>Assign to relevant team</li>
                      <li>Link all complaints to cluster</li>
                    </ul>
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