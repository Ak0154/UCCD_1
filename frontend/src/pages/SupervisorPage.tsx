import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { AgentLoad, Complaint, DashboardKpis } from '../types/complaint'

export function SupervisorPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [load, setLoad] = useState<AgentLoad | null>(null)
  const [escalations, setEscalations] = useState<Complaint[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getKpis(), api.getAgentLoad(), api.getEscalations({ limit: 5 })])
      .then(([kpiData, loadData, escalationData]) => {
        setKpis(kpiData)
        setLoad(loadData)
        setEscalations(escalationData.complaints)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load supervisor dashboard'))
  }, [])

  return (
    <section>
      <p className="text-sm uppercase text-muted">Supervisor HQ</p>
      <h2 className="mt-1 font-display text-3xl">Command Center</h2>

      {error && <div className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Total', kpis?.total],
          ['Open', kpis?.open],
          ['Queued', kpis?.queued],
          ['In progress', kpis?.in_progress],
          ['Escalated', kpis?.escalated],
          ['Breached', kpis?.breached],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs uppercase text-muted">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value ?? '-'}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold">Escalation queue</h3>
          <div className="mt-4 space-y-3">
            {escalations.length === 0 ? (
              <p className="text-sm text-muted">No escalations loaded.</p>
            ) : escalations.map((item) => (
              <div key={item.id} className="rounded-md border border-border bg-bg p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{item.customer_id}</span>
                  <span className="text-accent">{Math.round((item.breach_probability ?? 0) * 100)}%</span>
                </div>
                <p className="mt-1 line-clamp-2 text-muted">{item.escalation_reason ?? item.raw_text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold">Agent load</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(load?.agents ?? {}).map(([agent, count]) => (
              <div key={agent}>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{agent}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-bg">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(count * 12, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
