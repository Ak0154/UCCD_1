'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/hooks/use-router'
import { api } from '@/lib/api-client'
import type { Complaint, CustomerProfile } from '@/types/complaint'
import { DashboardShell } from '@/components/dashboard-shell'
import type { ShellTab } from '@/components/dashboard-shell'
import { AppBreadcrumb } from '@/components/app-breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Loader2, MessageSquare, Search, Shield, Star, UserRound } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const AGENT_TABS: ShellTab[] = [
  { label: 'Dashboard', route: 'dashboard' },
  { label: 'My Queue', route: 'complaints' },
  { label: 'AI Drafts', route: 'ai-drafts' },
  { label: '360 View', route: '360-view' },
]

function getInitials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CU'
}

function formatTimestamp(value?: string | null) {
  if (!value) return 'N/A'
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(value?: string | null) {
  if (!value) return 'N/A'
  const d = new Date(value)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function slaTimeLeft(deadline?: string | null) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Breached'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

function statusColor(status: string) {
  if (status === 'resolved') return 'bg-success-muted text-success'
  if (status === 'escalated') return 'bg-destructive/10 text-destructive'
  if (status === 'in_progress') return 'bg-primary/10 text-primary'
  return 'bg-muted text-muted-foreground'
}

function issueDescription(item: { complaint_type?: string | null; intent?: string | null; product_code?: string | null }) {
  return [item.complaint_type, item.intent, item.product_code].filter(Boolean).join(' · ') || 'General complaint'
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon?: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function ComplaintTimelineItem({
  item,
  onClick,
}: {
  item: CustomerProfile['complaint_history'][number]
  onClick: () => void
}) {
  const sla = slaTimeLeft(item.sla_deadline)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="mt-0.5 shrink-0">
        <div className={`h-2.5 w-2.5 rounded-full ${item.status === 'resolved' ? 'bg-success' : item.sla_breached ? 'bg-destructive' : 'bg-primary'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatTimestamp(item.created_at)}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(item.status)}`}>
            {statusLabel(item.status)}
          </span>
          {item.regulatory_flag && (
            <span className="rounded-full bg-warning-muted px-2 py-0.5 text-[10px] font-semibold text-warning">Regulatory</span>
          )}
        </div>
        <div className="mt-1 text-sm font-medium text-foreground">{issueDescription(item)}</div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.raw_text}</p>
        {sla && (
          <div className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${sla === 'Breached' ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Clock className="h-3 w-3" />
            {sla}
          </div>
        )}
      </div>
    </button>
  )
}

export function ThreeSixtyViewPage() {
  const { navigate } = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<CustomerProfile['complaint_history'][number] | null>(null)
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])

  useEffect(() => {
    let cancelled = false
    async function loadRecent() {
      setInitialLoading(true)
      try {
        const response = await api.listComplaints({ limit: 50 })
        if (!cancelled) setRecentComplaints(response.complaints || [])
      } catch {
        if (!cancelled) setRecentComplaints([])
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }
    loadRecent()
    return () => { cancelled = true }
  }, [])

  const customerSuggestions = useMemo(() => {
    const seen = new Set<string>()
    return recentComplaints
      .filter((c) => {
        if (seen.has(c.customer_id)) return false
        seen.add(c.customer_id)
        return true
      })
      .slice(0, 5)
  }, [recentComplaints])

  const searchCustomer = useCallback(async (value?: string) => {
    const term = (value ?? searchTerm).trim()
    if (!term) return

    setLoading(true)
    setError(null)
    setSearched(true)
    setSearchTerm(term)

    try {
      const result = await api.getCustomerProfile(term)
      setProfile(result)
      setSelectedTimelineItem(null)
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setError(`No complaints found for "${term}". Try searching with a different customer ID.`)
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load customer history')
      }
      setProfile(null)
      setSelectedTimelineItem(null)
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  const handleEscalate = useCallback(async () => {
    if (!selectedTimelineItem) return
    try {
      await api.updateStatus(selectedTimelineItem.complaint_id, 'escalated')
      toast({ title: 'Case escalated', description: 'The selected complaint has been escalated.' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Escalation failed', description: err instanceof Error ? err.message : 'Unknown error' })
    }
  }, [selectedTimelineItem])

  const customerName = profile?.customer_name || 'Unknown Customer'

  return (
    <DashboardShell
      activeItem="360° View"
      tabs={AGENT_TABS}
      activeTab="360° View"
      breadcrumb={<AppBreadcrumb current="360° View" />}
    >
      <div className="space-y-5 p-5">
        <Card>
          <CardContent className="p-4">
            <form
              className="flex flex-col gap-3 lg:flex-row lg:items-end"
              onSubmit={(e) => {
                e.preventDefault()
                searchCustomer()
              }}
            >
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="customer-search">
                  Customer lookup
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Customer ID, name, email, phone, or account"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading || !searchTerm.trim()} className="min-w-32">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>

            {customerSuggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {customerSuggestions.map((c) => (
                  <button
                    key={c.customer_id}
                    type="button"
                    onClick={() => searchCustomer(c.customer_id)}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {c.customer_name || c.customer_id}
                    <span className="ml-2 font-mono text-[10px]">{c.customer_id}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!searched && !error && (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border bg-card">
            <div className="flex flex-col items-center text-center text-muted-foreground">
              {initialLoading ? <Loader2 className="mb-4 h-10 w-10 animate-spin" /> : <UserRound className="mb-4 h-10 w-10" />}
              <div className="mb-2 text-base font-semibold text-foreground">Search a customer to open their 360° view</div>
              <div className="max-w-sm text-sm">Pick a recent customer chip or search by ID, contact, or account details.</div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            <div className="mb-3 font-semibold">{error}</div>
            <Button variant="outline" onClick={() => searchCustomer()} disabled={!searchTerm.trim() || loading}>Retry</Button>
          </div>
        )}

        {profile && !error && (
          <>
            <div className="flex flex-col gap-4 rounded-lg border bg-card px-5 py-4 lg:flex-row lg:items-center">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">{getInitials(customerName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-xl font-bold text-foreground">{customerName}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{profile.customer_id}</span>
                  {profile.vip_customer && (
                    <Badge className="gap-1 text-[10px] font-bold">
                      <Star className="h-3 w-3" /> VIP
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.customer_email && <Badge variant="secondary">{profile.customer_email}</Badge>}
                  {profile.customer_phone && <Badge variant="secondary">{profile.customer_phone}</Badge>}
                  {profile.account_number && <Badge variant="secondary">{profile.account_number}</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border bg-background px-4 py-2">
                  <div className="text-lg font-bold">{profile.total_complaints}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Total</div>
                </div>
                <div className="rounded-lg border bg-background px-4 py-2">
                  <div className="text-lg font-bold">{profile.open_complaints}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Open</div>
                </div>
                <div className="rounded-lg border bg-background px-4 py-2">
                  <div className="text-lg font-bold">{profile.sla_breach_count}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Breaches</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Avg Resolution"
                value={profile.avg_resolution_hours ? `${profile.avg_resolution_hours}h` : 'N/A'}
                icon={<Clock className="h-3.5 w-3.5" />}
              />
              <StatCard
                label="Most Common Issue"
                value={profile.most_common_issue || 'N/A'}
                icon={<MessageSquare className="h-3.5 w-3.5" />}
              />
              <StatCard
                label="Preferred Channel"
                value={profile.preferred_channel || 'N/A'}
                icon={<Search className="h-3.5 w-3.5" />}
              />
              <StatCard
                label="Resolved"
                value={`${profile.resolved_complaints}/${profile.total_complaints}`}
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                sub={
                  profile.total_complaints > 0
                    ? `${Math.round((profile.resolved_complaints / profile.total_complaints) * 100)}% resolution rate`
                    : undefined
                }
              />
            </div>

            {(profile.viral_risk_score != null && profile.viral_risk_score > 0) || profile.regulatory_flagged || profile.repeat_complaint ? (
              <Card className="border-warning/30 bg-warning-muted/20">
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Indicators
                  </div>
                  {profile.viral_risk_score != null && profile.viral_risk_score > 0 && (
                    <Badge variant="outline" className="border-warning/50 text-warning">
                      Viral risk: {(profile.viral_risk_score * 100).toFixed(0)}%
                    </Badge>
                  )}
                  {profile.regulatory_flagged && (
                    <Badge className="gap-1 bg-warning-muted text-warning">
                      <Shield className="h-3 w-3" /> Regulatory flagged
                    </Badge>
                  )}
                  {profile.repeat_complaint && (
                    <Badge variant="outline" className="border-warning/50 text-warning">
                      Repeat complainant
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {profile.active_complaints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Complaints ({profile.active_complaints.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.active_complaints.map((item) => {
                    const sla = slaTimeLeft(item.sla_deadline)
                    return (
                      <div key={item.complaint_id} className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{item.complaint_id.slice(0, 8)}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-foreground">{issueDescription(item)}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.raw_text}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {sla && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sla === 'Breached' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                              {sla}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card>
                <CardHeader>
                  <CardTitle>Complaint History ({profile.complaint_history.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.complaint_history.map((item) => (
                      <ComplaintTimelineItem
                        key={item.complaint_id}
                        item={item}
                        onClick={() => setSelectedTimelineItem(item)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:sticky xl:top-20 xl:self-start">
                <CardHeader>
                  <CardTitle>Selected Case</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTimelineItem ? (
                    <>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{selectedTimelineItem.complaint_id.slice(0, 8)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(selectedTimelineItem.status)}`}>
                            {statusLabel(selectedTimelineItem.status)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/85">{selectedTimelineItem.raw_text}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(selectedTimelineItem.created_at)}
                          {selectedTimelineItem.resolved_at && ` → resolved ${formatDateTime(selectedTimelineItem.resolved_at)}`}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-muted/30 px-3">
                        <div className="flex items-start justify-between gap-4 border-b py-2">
                          <span className="text-xs text-muted-foreground">Channel</span>
                          <span className="text-right text-sm font-medium">{selectedTimelineItem.channel || 'N/A'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 border-b py-2">
                          <span className="text-xs text-muted-foreground">Issue</span>
                          <span className="text-right text-sm font-medium">{issueDescription(selectedTimelineItem)}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 border-b py-2">
                          <span className="text-xs text-muted-foreground">Assigned</span>
                          <span className="text-right text-sm font-medium">{selectedTimelineItem.assigned_to || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 py-2">
                          <span className="text-xs text-muted-foreground">SLA</span>
                          <span className={`text-right text-sm font-medium ${selectedTimelineItem.sla_breached ? 'text-destructive' : ''}`}>
                            {selectedTimelineItem.sla_breached ? 'Breached' : slaTimeLeft(selectedTimelineItem.sla_deadline) || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {(selectedTimelineItem.ai_draft || selectedTimelineItem.root_cause) && (
                        <div className="rounded-lg border bg-card p-3">
                          {selectedTimelineItem.root_cause && (
                            <>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Root cause</div>
                              <p className="mb-3 text-sm text-foreground/85">{selectedTimelineItem.root_cause}</p>
                            </>
                          )}
                          {selectedTimelineItem.ai_draft && (
                            <>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI draft</div>
                              <p className="line-clamp-5 text-sm text-muted-foreground">{selectedTimelineItem.ai_draft}</p>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedTimelineItem(null)}>Clear</Button>
                        <Button className="flex-1" variant="destructive" onClick={handleEscalate}>Escalate</Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">Select a timeline item to view details.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}