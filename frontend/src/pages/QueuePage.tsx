import { useEffect, useState, useMemo } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Star,
  Send,
  Mail,
  MessageSquare,
  Copy,
  Edit3,
  CheckCircle,
  HelpCircle,
  FileText,
  User,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Check,
  LogOut,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Complaint as ApiComplaint } from '../types/complaint'

interface TimelineEvent {
  status: string
  timestamp: string
  description: string
}

interface Complaint {
  id: string
  origId: string
  customer_id: string
  vip_customer: boolean
  regulatory_flag: boolean
  channel: 'whatsapp' | 'email' | 'telegram' | string
  language: string
  complaint_type: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  raw_text: string
  translated_text?: string
  status: 'queued' | 'new' | 'in_progress' | 'escalated' | 'resolved'
  assigned_to: string | null
  sla_tier: string
  sla_total_seconds: number
  sla_remaining_seconds: number
  deadline: string
  breach_probability: number
  product_code: string
  intent: string
  regulatory_obligation: string
  type_confidence: number
  emotion_arc: {
    initial: string
    current: string
    trajectory: string
    intensity: number
  }
  bot_slots: Record<string, string>
  ai_draft_response: string
  history: TimelineEvent[]
  created_at: string
}

function mapApiComplaint(c: ApiComplaint): Complaint {
  const slaDeadline = c.sla_deadline ? new Date(c.sla_deadline).getTime() : Date.now() + 3600000
  const slaTotal = c.sla_tier === 'HIGH' || c.sla_tier === 'REGULATORY' ? 7200 : 28800
  const slaRemaining = Math.max(0, Math.round((slaDeadline - Date.now()) / 1000))
  const isBreached = c.sla_breached
  const effectiveRemaining = isBreached ? 0 : slaRemaining

  return {
    id: String(c.id).slice(0, 8),
    origId: String(c.id),
    customer_id: c.customer_id,
    vip_customer: c.vip_customer ?? false,
    regulatory_flag: c.regulatory_flag ?? false,
    channel: c.channel as Complaint['channel'],
    language: c.detected_language ?? c.language_code ?? 'EN',
    complaint_type: c.complaint_type ?? 'unclassified',
    severity: (c.priority_tier && c.priority_tier <= 2 ? 'HIGH' : c.priority_tier === 3 ? 'MEDIUM' : 'LOW') as Complaint['severity'],
    raw_text: c.raw_text,
    translated_text: c.translated_text ?? undefined,
    status: c.status as Complaint['status'],
    assigned_to: c.assigned_to ?? null,
    sla_tier: c.sla_tier ?? 'NORMAL',
    sla_total_seconds: slaTotal,
    sla_remaining_seconds: effectiveRemaining,
    deadline: c.sla_deadline ?? new Date(Date.now() + slaTotal * 1000).toISOString(),
    breach_probability: c.breach_probability ?? 0,
    product_code: c.product_code ?? '',
    intent: c.intent ?? '',
    regulatory_obligation: c.regulatory_obligation ?? '',
    type_confidence: c.type_confidence ?? 0,
    emotion_arc: (c.emotion_arc as Complaint['emotion_arc']) ?? { initial: 'Neutral', current: 'Neutral', trajectory: 'Neutral', intensity: 5 },
    bot_slots: (c.bot_slots as Record<string, string>) ?? {},
    ai_draft_response: c.ai_draft ?? '',
    history: [],
    created_at: c.created_at,
  }
}

interface QueuePageProps {
  searchQuery?: string
  defaultStatus?: string
}

export function QueuePage({ searchQuery: initialSearch = '', defaultStatus = 'my_queue' }: QueuePageProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const standaloneId = searchParams.get('id')
  const isStandalone = searchParams.get('standalone') === 'true'

  // Main complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Fetch complaints from API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [allRes, myQueueRes] = await Promise.all([
          api.listComplaints({ limit: 50 }),
          api.getMyQueue(50),
        ])
        const allComplaints = allRes.complaints.map(mapApiComplaint)
        const myQueue = myQueueRes.complaints.map(mapApiComplaint)

        // Merge deduplicated by id
        const seen = new Set<string>()
        const merged: Complaint[] = []
        for (const c of [...myQueue, ...allComplaints]) {
          if (!seen.has(c.id)) {
            seen.add(c.id)
            merged.push(c)
          }
        }
        setComplaints(merged)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load complaints')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const initialFilter = useMemo(() => {
    if (defaultStatus === 'queued' || defaultStatus === 'new') return 'my_queue'
    if (defaultStatus === 'in_progress') return 'in_progress'
    if (defaultStatus === 'resolved') return 'resolved'
    if (defaultStatus === 'escalated') return 'escalated'
    return 'my_queue'
  }, [defaultStatus])

  // Sidebar filtering: 'my_queue' | 'in_progress' | 'resolved' | 'escalated'
  const [sidebarFilter, setSidebarFilter] = useState<'my_queue' | 'in_progress' | 'resolved' | 'escalated'>(initialFilter)

  // Center panel category tabs: 'all' | 'urgent' | 'regulatory' | 'vip'
  const [centerTab, setCenterTab] = useState<'all' | 'urgent' | 'regulatory' | 'vip'>('all')

  // Search input state
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  useEffect(() => {
    setSearchQuery(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    setSidebarFilter(initialFilter)
  }, [initialFilter])

  // Active complaint ID
  const [selectedId, setSelectedId] = useState<string | null>(standaloneId || null)

  const handleCardClick = (comp: Complaint) => {
    setSelectedId(comp.id)
  }

  // Draft response editing state
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [draftContent, setDraftContent] = useState('')
  const [showToast, setShowToast] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  // Escalation Modal state
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [escalateTeam, setEscalateTeam] = useState('Compliance Supervisor')
  const [escalateReason, setEscalateReason] = useState('')

  // Sentiment UI helpers
  const getEmotionEmoji = (sentiment: string) => {
    const s = sentiment?.toLowerCase() || ''
    if (s.includes('angry') || s.includes('rage') || s.includes('irate')) return '😡'
    if (s.includes('frustrated') || s.includes('annoyed') || s.includes('disappointed')) return '😠'
    if (s.includes('anxious') || s.includes('worry') || s.includes('fear') || s.includes('concerned') || s.includes('scared')) return '😰'
    if (s.includes('satisfied') || s.includes('happy') || s.includes('resolved') || s.includes('hopeful')) return '🙂'
    if (s.includes('neutral') || s.includes('stable')) return '😐'
    return '😐'
  }

  const getTrajectoryDetails = (trajectory: string, status: string) => {
    if (status === 'resolved') {
      return { label: 'Resolved (Positive Outcome)', icon: '📈', color: 'text-dash-success' }
    }
    const t = trajectory?.toLowerCase() || ''
    if (t === 'positive') return { label: 'Improving Sentiment', icon: '📈', color: 'text-dash-success' }
    if (t === 'negative') return { label: 'Deteriorating Sentiment', icon: '📉', color: 'text-dash-error' }
    return { label: 'Stable Sentiment', icon: '➡️', color: 'text-dash-text-muted' }
  }

  // Real-time ticking timer for SLA
  useEffect(() => {
    const interval = setInterval(() => {
      setComplaints((prevComplaints) =>
        prevComplaints.map((comp) => {
          if (comp.status === 'resolved' || comp.sla_remaining_seconds <= 0) {
            return comp
          }
          return {
            ...comp,
            sla_remaining_seconds: comp.sla_remaining_seconds - 1
          }
        })
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync draft response editor when active complaint changes
  const activeComplaint = useMemo(() => {
    if (!selectedId) return null
    return complaints.find((c) => c.id === selectedId) || null
  }, [complaints, selectedId])

  useEffect(() => {
    if (activeComplaint) {
      setDraftContent(activeComplaint.ai_draft_response)
      setIsEditingDraft(false)
      setShowOriginal(false) // Reset original text view toggle on selection change
    }
  }, [selectedId]) // ONLY depend on selectedId to avoid resetting on SLA timer tick

  // Count helper functions
  const countStats = useMemo(() => {
    const myQueue = complaints.filter(
      (c) => c.status !== 'resolved' && (c.assigned_to === user?.email || c.assigned_to === 'current_agent@omniresol.com' || !c.assigned_to)
    ).length
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length
    const resolvedToday = complaints.filter((c) => c.status === 'resolved').length
    const escalated = complaints.filter((c) => c.status === 'escalated').length
    return { myQueue, inProgress, resolvedToday, escalated }
  }, [complaints, user])

  // Filter complaints based on Sidebar + Tabs + Search
  const filteredComplaints = useMemo(() => {
    return complaints.filter((comp) => {
      // 1. Sidebar Filter
      if (sidebarFilter === 'my_queue') {
        // Active queue for this agent: not resolved, and either unassigned or assigned to current agent
        const isAssignedToMeOrUnassigned =
          comp.assigned_to === null ||
          comp.assigned_to === user?.email ||
          comp.assigned_to === 'current_agent@omniresol.com'
        if (comp.status === 'resolved' || !isAssignedToMeOrUnassigned) return false
      } else if (sidebarFilter === 'in_progress') {
        if (comp.status !== 'in_progress') return false
      } else if (sidebarFilter === 'resolved') {
        if (comp.status !== 'resolved') return false
      } else if (sidebarFilter === 'escalated') {
        if (comp.status !== 'escalated') return false
      }

      // 2. Center Tabs Filter
      if (centerTab === 'urgent') {
        // Severity high or SLA < 25% remaining (or breached)
        const isUrgent = comp.severity === 'HIGH' || (comp.sla_remaining_seconds / comp.sla_total_seconds < 0.25)
        if (!isUrgent) return false
      } else if (centerTab === 'regulatory') {
        if (!comp.regulatory_flag) return false
      } else if (centerTab === 'vip') {
        if (!comp.vip_customer) return false
      }

      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchId = comp.id.toLowerCase().includes(query)
        const matchCust = comp.customer_id.toLowerCase().includes(query)
        const matchText = comp.raw_text.toLowerCase().includes(query)
        const matchType = comp.complaint_type.toLowerCase().includes(query)
        if (!matchId && !matchCust && !matchText && !matchType) return false
      }

      return true
    })
  }, [complaints, sidebarFilter, centerTab, searchQuery, user])

  // Sort complaints: Breached/Urgent first, Resolved at bottom
  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      // Resolved complaints always at the bottom
      if (a.status === 'resolved' && b.status !== 'resolved') return 1
      if (a.status !== 'resolved' && b.status === 'resolved') return -1

      // Breached (sla_remaining_seconds === 0) at the very top
      if (a.sla_remaining_seconds === 0 && b.sla_remaining_seconds > 0) return -1
      if (a.sla_remaining_seconds > 0 && b.sla_remaining_seconds === 0) return 1

      // Sort by SLA remaining seconds ascending (most urgent first)
      return a.sla_remaining_seconds - b.sla_remaining_seconds
    })
  }, [filteredComplaints])

  // Display HH:MM:SS format
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':')
  }

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setShowToast(msg)
    setTimeout(() => {
      setShowToast(null)
    }, 3000)
  }

  // Handle Draft Save
  const handleSaveDraft = () => {
    if (!selectedId) return
    setComplaints((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ai_draft_response: draftContent } : c))
    )
    setIsEditingDraft(false)
    triggerToast('Draft response saved.')
  }

  // Handle Copy Draft
  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draftContent)
    triggerToast('Draft response copied to clipboard!')
  }

  // Action Buttons
  const handleSendResponse = async () => {
    if (!selectedId || !activeComplaint) return
    const complaintUuid = activeComplaint.origId ?? selectedId
    try {
      await api.respond(complaintUuid, draftContent)
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === selectedId) {
            return {
              ...c,
              status: 'resolved' as const,
              ai_draft_response: draftContent,
              history: [
                ...c.history,
                { status: 'resolved', timestamp: nowStr, description: 'Agent responded to customer and marked resolved.' }
              ]
            }
          }
          return c
        })
      )
      triggerToast(`Response sent for ${selectedId}! Marked resolved.`)
    } catch (err) {
      triggerToast(`Error: ${err instanceof Error ? err.message : 'Failed to send response'}`)
    }
  }

  const handleConfirmEscalation = async () => {
    if (!selectedId || !activeComplaint) return
    const complaintUuid = activeComplaint.origId ?? selectedId
    try {
      await api.updateStatus(complaintUuid, 'escalated')
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
      const notesStr = escalateReason.trim() ? `. Reason: ${escalateReason.trim()}` : ''
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === selectedId) {
            return {
              ...c,
              status: 'escalated' as const,
              history: [
                ...c.history,
                { status: 'escalated', timestamp: nowStr, description: `Manually escalated to ${escalateTeam}${notesStr}` }
              ]
            }
          }
          return c
        })
      )
      setShowEscalateModal(false)
      triggerToast(`Complaint ${selectedId} escalated to ${escalateTeam}.`)
    } catch (err) {
      triggerToast(`Error: ${err instanceof Error ? err.message : 'Failed to escalate'}`)
    }
  }

  const handleRequestInfo = async () => {
    if (!selectedId || !activeComplaint) return
    const complaintUuid = activeComplaint.origId ?? selectedId
    try {
      await api.requestDetails(complaintUuid)
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === selectedId) {
            return {
              ...c,
              history: [
                ...c.history,
                { status: 'info_requested', timestamp: nowStr, description: 'System dispatched request for additional documents/verification.' }
              ]
            }
          }
          return c
        })
      )
      triggerToast(`Additional info requested from customer for ${selectedId}.`)
    } catch (err) {
      triggerToast(`Error: ${err instanceof Error ? err.message : 'Failed to request info'}`)
    }
  }

  const handleMarkResolved = async () => {
    if (!selectedId || !activeComplaint) return
    const complaintUuid = activeComplaint.origId ?? selectedId
    try {
      await api.respond(complaintUuid, activeComplaint.ai_draft_response || 'Resolved by agent.')
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === selectedId) {
            return { ...c, status: 'resolved' as const, history: [...c.history, { status: 'resolved', timestamp: nowStr, description: 'Marked resolved by agent.' }] }
          }
          return c
        })
      )
      triggerToast(`Complaint ${selectedId} marked resolved.`)
    } catch (err) {
      triggerToast(`Error: ${err instanceof Error ? err.message : 'Failed to resolve'}`)
    }
  }

  // Channel UI helpers
  const renderChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />
      case 'email':
        return <Mail className="h-4 w-4 text-sky-400" />
      case 'telegram':
        return <Send className="h-4 w-4 text-blue-400" />
      default:
        return <HelpCircle className="h-4 w-4 text-dash-text-muted" />
    }
  }

  // Circular SLA Ring Generator
  const renderCircularSlaRing = (comp: Complaint) => {
    if (comp.status === 'resolved') {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dash-success/15 border border-dash-success/30 text-dash-success">
          <Check className="h-4 w-4" />
        </div>
      )
    }

    const ratio = comp.sla_total_seconds > 0 ? comp.sla_remaining_seconds / comp.sla_total_seconds : 0
    const percent = Math.min(100, Math.max(0, Math.round(ratio * 100)))

    // Color decisions
    let colorClass = 'text-dash-success'
    let bgCircleClass = 'stroke-dash-success/20'
    if (ratio < 0.25) {
      colorClass = 'text-dash-error'
      bgCircleClass = 'stroke-dash-error/20'
    } else if (ratio < 0.5) {
      colorClass = 'text-yellow-500'
      bgCircleClass = 'stroke-yellow-500/20'
    }

    // Circular calculations
    const radius = 16
    const strokeWidth = 3
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percent / 100) * circumference

    return (
      <div className="relative flex items-center justify-center">
        <svg className="h-9 w-9 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={radius}
            className={`${bgCircleClass}`}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            className={`transition-all duration-300 ${colorClass}`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[9px] font-semibold text-dash-text-muted font-mono">
          {percent}%
        </span>
      </div>
    )
  }

  // Stats computation for sidebar display
  const myStats = useMemo(() => {
    const totalCount = complaints.length
    const resolved = complaints.filter((c) => c.status === 'resolved').length
    const breached = complaints.filter((c) => c.status !== 'resolved' && c.sla_remaining_seconds <= 0).length
    return {
      resolutionRate: totalCount > 0 ? Math.round((resolved / totalCount) * 100) : 94,
      avgTime: '2.4hrs',
      breachedToday: breached
    }
  }, [complaints])

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-dash-bg font-sans antialiased text-dash-text justify-center">
      <div className="flex h-full w-full max-w-[1600px] overflow-hidden">

      {/* LOADING / ERROR STATES */}
      {loading && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-dash-text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-dash-primary" />
            <span className="text-sm">Loading complaints...</span>
          </div>
        </div>
      )}

      {fetchError && !loading && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dash-error/30 bg-dash-error/10 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-dash-error" />
            <span className="text-sm text-dash-error">{fetchError}</span>
            <button onClick={() => window.location.reload()} className="rounded bg-dash-error/20 px-3 py-1 text-xs font-semibold text-dash-error hover:bg-dash-error/30 cursor-pointer">Retry</button>
          </div>
        </div>
      )}

      {!loading && !fetchError && (<>

      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-dash-primary/30 bg-dash-surface-lowest/90 px-4 py-3 text-sm text-dash-text shadow-2xl backdrop-blur-md transition-all duration-300 violet-glow animate-bounce">
          <Sparkles className="h-4 w-4 text-dash-primary" />
          <span>{showToast}</span>
        </div>
      )}

      {/* COLUMN 1: LEFT SIDEBAR (200px) */}
      {!isStandalone && (
        <aside className="flex h-full w-[200px] flex-shrink-0 flex-col border-r border-dash-border bg-dash-surface-lowest px-3 py-4 select-none justify-between">
        
        {/* Top: Logo & Avatar */}
        <div className="flex flex-col gap-5">
          
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-dash-primary/10 border border-dash-primary/35 text-dash-primary shadow-sm flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Zm0 2.3L5.5 8.2v7.6l6.5 3.4 6.5-3.4V8.2L12 4.8Zm0 3.2 3.2 1.7v3.8L12 15.2l-3.2-1.7V9.7L12 8Z" />
              </svg>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-sm font-bold tracking-tight text-white truncate leading-tight">OmniResol</span>
              <span className="text-[9px] uppercase tracking-wider text-dash-text-muted/80 font-medium truncate">Workspace</span>
            </div>
          </div>

          {/* User Info Card */}
          <div className="flex items-center gap-2 rounded-lg border border-dash-border bg-dash-surface-low/50 p-2">
            <div className="relative flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dash-surface-high border border-dash-outline text-xs font-bold text-dash-text shadow-inner">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'SJ'}
              </div>
              {/* status badge */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-dash-surface-lowest bg-dash-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[11px] font-semibold text-dash-text leading-tight">{user?.name ?? 'Sarah Jenkins'}</span>
              <span className="text-[9px] text-dash-text-muted font-mono truncate leading-none mt-0.5">{user?.role ?? 'Agent (Level II)'}</span>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="flex flex-col gap-0.5">
            {[
              { id: 'my_queue', label: 'My Queue', badge: countStats.myQueue },
              { id: 'in_progress', label: 'In Progress', badge: countStats.inProgress },
              { id: 'resolved', label: 'Resolved Today', badge: countStats.resolvedToday },
              { id: 'escalated', label: 'Escalated', badge: countStats.escalated }
            ].map((item) => {
              const isActive = sidebarFilter === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSidebarFilter(item.id as any)}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-dash-primary/15 text-dash-primary border-l-2 border-dash-primary'
                      : 'text-dash-text-muted hover:bg-dash-surface-low hover:text-white'
                  }`}
                >
                  <span className="truncate pr-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold flex-shrink-0 ${
                        isActive ? 'bg-dash-primary/30 text-dash-primary' : 'bg-dash-surface-high text-dash-text-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom: My Stats Card & Logout */}
        <div className="flex flex-col gap-3">
          
          {/* Stats Card */}
          <div className="rounded-lg border border-dash-border bg-dash-surface-low/80 p-2.5 shadow-md glass-card">
            <span className="text-[9px] uppercase font-bold text-dash-text-muted/80 tracking-wider">My Stats Today</span>
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-dash-text-muted">Resolution Rate:</span>
                <span className="font-semibold text-white">{myStats.resolutionRate}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-dash-text-muted">Avg Time:</span>
                <span className="font-semibold text-white">{myStats.avgTime}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-dash-text-muted">Breached Today:</span>
                <span className={`font-semibold ${myStats.breachedToday > 0 ? 'text-dash-error font-bold' : 'text-white'}`}>
                  {myStats.breachedToday}
                </span>
              </div>
            </div>
          </div>

          {/* Action to switch routes (Supervisor Page for supervisor role, etc.) */}
          {user?.role === 'SUPERVISOR' && (
            <button
              onClick={() => navigate('/app/classic/supervisor')}
              className="flex items-center justify-center gap-1.5 rounded-md border border-dash-border py-1 px-1.5 text-center text-[10px] font-semibold text-dash-primary hover:bg-dash-primary/10 hover:text-white transition-colors cursor-pointer"
            >
              <TrendingUp className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Go to Command Center</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-dash-text-muted hover:bg-dash-error/10 hover:text-dash-error transition-all duration-150 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      )}

      {/* COLUMN 2: MASTER COMPLAINT QUEUE PANEL */}
      {!isStandalone && !selectedId && (
      <section className="flex h-full flex-1 flex-col bg-dash-bg px-5 py-5 border-r border-dash-border select-none animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-sans text-2xl font-bold tracking-tight text-white">My Queue</h2>
              <span className="rounded-full bg-dash-primary/15 px-2 py-0.5 text-xs text-dash-primary font-semibold font-mono border border-dash-border">
                {sortedComplaints.length} Total
              </span>
            </div>
            {/* Filter Tabs */}
            <div className="flex items-center rounded-lg bg-dash-surface-lowest/90 p-1 border border-dash-border">
              {[
                { id: 'all', label: 'All' },
                { id: 'urgent', label: 'Urgent' },
                { id: 'regulatory', label: 'Regulatory' },
                { id: 'vip', label: 'VIP' }
              ].map((tab) => {
                const isActive = centerTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCenterTab(tab.id as any)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive ? 'bg-dash-primary text-black font-semibold shadow-sm' : 'text-dash-text-muted hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-dash-text-muted" />
            <input
              type="text"
              placeholder="Search complaint ID, customer, content, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-dash-border bg-dash-surface-lowest/50 pl-10 pr-4 text-xs text-white placeholder-dash-text-muted/60 outline-none transition-all duration-200 focus:border-dash-primary/50 focus:bg-dash-surface-lowest/90 focus:ring-1 focus:ring-dash-primary/50"
            />
          </div>
        </div>

        {/* Complaint list container */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 dashboard-scrollbar">
          {sortedComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-dash-border bg-dash-surface-low/20 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-dash-text-muted/50 mb-2" />
              <p className="text-xs text-dash-text-muted">No complaints match the current filter or search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {sortedComplaints.map((comp) => {
                const isSelected = comp.id === selectedId
                const isBreached = comp.status !== 'resolved' && comp.sla_remaining_seconds <= 0
                
                // Severity badges classes
                let sevColor = 'bg-blue-500/10 text-sky-400 border-blue-500/20'
                if (comp.severity === 'HIGH') {
                  sevColor = 'bg-dash-error/10 text-dash-error border-dash-error/20'
                } else if (comp.severity === 'MEDIUM') {
                  sevColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }

                // Complaint Type color classes
                let typeClass = 'bg-dash-error/15 text-dash-error border-dash-error/30'
                if (comp.complaint_type === 'billing') {
                  typeClass = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                } else if (comp.complaint_type === 'kyc') {
                  typeClass = 'bg-blue-500/15 text-sky-400 border-blue-500/30'
                } else if (comp.complaint_type === 'loans') {
                  typeClass = 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                }

                return (
                  <div
                    key={comp.id}
                    onClick={() => handleCardClick(comp)}
                    className={`group relative flex flex-col gap-3 rounded-lg p-4 cursor-pointer glass-card transition-all duration-300 hover:scale-[1.01] hover:bg-dash-surface-low/50 ${
                      isSelected
                        ? 'border-l-4 border-l-dash-primary border-dash-primary bg-dash-surface/40 violet-glow'
                        : 'border-l-4 border-l-transparent hover:border-dash-border'
                    } ${isBreached ? 'pulse-urgent' : ''}`}
                  >
                    {/* Top Row: ID, Cust ID, VIP/REG/Translated badges */}
                    <div className="flex items-center justify-between border-b border-dash-primary/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-white group-hover:text-dash-primary transition-colors">
                          {comp.id}
                        </span>
                        <span className="text-[9px] text-dash-text-muted font-mono bg-dash-surface-lowest px-1.5 py-0.5 rounded border border-dash-border">
                          {comp.customer_id}
                        </span>
                      </div>
                      
                      {/* Priority Badges */}
                      <div className="flex items-center gap-1">
                        {comp.vip_customer && (
                          <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[8px] font-bold text-amber-400 border border-amber-500/25">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            <span>VIP</span>
                          </span>
                        )}
                        {comp.regulatory_flag && (
                          <span className="flex items-center gap-0.5 rounded bg-dash-error/15 px-1 py-0.5 text-[8px] font-bold text-dash-error border border-dash-error/25">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            <span>REG</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Row: Channel, Language, Type, Severity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {renderChannelIcon(comp.channel)}
                        <span className="text-[9px] uppercase text-dash-text-muted font-medium">{comp.channel}</span>
                        {comp.language !== 'EN' && comp.translated_text && (
                          <span className="rounded bg-dash-primary/15 px-1 py-0.2 text-[8px] font-bold text-dash-primary border border-dash-primary/25" title={`Translated from ${comp.language}`}>
                            TRANSLATED
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wide border font-bold ${typeClass}`}>
                          {comp.complaint_type}
                        </span>
                        <span className={`rounded px-1 py-0.5 text-[8px] uppercase border font-bold ${sevColor}`}>
                          {comp.severity}
                        </span>
                      </div>
                    </div>

                    {/* Statement Preview */}
                    <p className="text-xs text-dash-text-muted line-clamp-3 break-words leading-relaxed flex-1">
                      {comp.translated_text && comp.language !== 'EN' ? comp.translated_text : comp.raw_text}
                    </p>

                    {/* Bottom Row: SLA Progress Timer */}
                    <div className="flex items-center justify-between border-t border-dash-primary/5 pt-2 mt-1">
                      <div className="flex items-center gap-2">
                        {renderCircularSlaRing(comp)}
                        <span className="text-[10px] text-dash-text-muted font-semibold">SLA Progress</span>
                      </div>
                      {comp.status !== 'resolved' && (
                        <span className={`text-[10px] font-mono font-bold ${isBreached ? 'text-dash-error animate-pulse' : 'text-dash-text-muted'}`}>
                          {isBreached ? 'BREACHED' : formatTime(comp.sla_remaining_seconds)}
                        </span>
                      )}
                      {comp.status === 'resolved' && (
                        <span className="text-[10px] text-dash-success font-semibold uppercase flex items-center gap-1">
                          <Check className="h-3 w-3" /> Resolved
                        </span>
                      )}
                      {comp.status === 'escalated' && (
                        <span className="text-[10px] text-dash-error font-semibold uppercase flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Escalated
                        </span>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
      )}

      {/* COLUMN 3: DETAILED COMPLAINT WORKSPACE */}
      {(isStandalone || selectedId) && activeComplaint && (
        <main className="flex h-full flex-grow flex-1 flex-col bg-dash-surface-lowest overflow-y-auto dashboard-scrollbar p-6 animate-fadeIn">
          <div className="flex flex-col gap-5">
            
            {/* Header info */}
            <div className="flex flex-col gap-2 border-b border-dash-border pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!isStandalone && (
                    <button
                      onClick={() => setSelectedId(null)}
                      className="flex items-center gap-1.5 text-xs text-dash-primary hover:text-white transition-colors cursor-pointer font-bold mr-2 bg-dash-primary/10 border border-dash-primary/25 rounded px-2.5 py-1"
                    >
                      <span>← Back to Queue</span>
                    </button>
                  )}
                  <span className="font-mono text-base font-bold text-white tracking-tight">{activeComplaint.id}</span>
                  {!isStandalone && (
                    <button
                      onClick={() => window.open(`/app/classic/queue?id=${activeComplaint.id}&standalone=true`, `complaint_${activeComplaint.id}`, 'width=1200,height=900,status=no,menubar=no,toolbar=no')}
                      className="text-dash-text-muted hover:text-dash-primary transition-colors cursor-pointer"
                      title="Open in new standalone window"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* status badge */}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold border tracking-wider ${
                    activeComplaint.status === 'resolved'
                      ? 'bg-dash-success/15 text-dash-success border-dash-success/35'
                      : activeComplaint.status === 'escalated'
                      ? 'bg-dash-error/15 text-dash-error border-dash-error/35'
                      : activeComplaint.status === 'in_progress'
                      ? 'bg-dash-primary/15 text-dash-primary border-dash-primary/35'
                      : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/35'
                  }`}
                >
                  {activeComplaint.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-medium">
                  <User className="h-3.5 w-3.5 text-dash-text-muted" />
                  <span className="text-dash-text-muted font-mono">{activeComplaint.customer_id}</span>
                  {activeComplaint.vip_customer && (
                    <span className="ml-1.5 rounded bg-amber-500/15 px-1 py-0.2 text-[8px] font-bold text-amber-400 border border-amber-500/20">VIP</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-dash-surface-high px-1.5 py-0.5 rounded text-dash-text-muted font-mono font-semibold uppercase">{activeComplaint.channel}</span>
                  <span className="text-[10px] bg-dash-surface-high px-1.5 py-0.5 rounded text-dash-text-muted font-mono font-semibold">{activeComplaint.language}</span>
                </div>
              </div>
            </div>

            {/* Split layout detailed workspace */}
            <div className={`flex flex-col gap-6 ${isStandalone ? 'lg:flex-row' : ''}`}>
              
              {/* Main Workspace Column: Statements, Draft Response, Actions */}
              <div className="flex-1 flex flex-col gap-5 min-w-0">
                
                {/* Complaint Text & Translation Toggle */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-dash-text-muted/80 tracking-wider">
                        {showOriginal ? `Original Statement (${activeComplaint.language})` : 'Customer Statement'}
                      </span>
                      {activeComplaint.language !== 'EN' && activeComplaint.translated_text && (
                        <span className="rounded bg-dash-primary/10 border border-dash-primary/20 px-1.5 py-0.2 text-[8px] font-bold text-dash-primary tracking-wide uppercase select-none">
                          Translated
                        </span>
                      )}
                    </div>
                    {activeComplaint.language !== 'EN' && activeComplaint.translated_text && (
                      <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className="flex items-center gap-1 rounded bg-dash-surface-high border border-dash-outline px-2 py-0.5 text-[9px] font-semibold text-dash-text hover:text-white transition-colors cursor-pointer"
                      >
                        <span>{showOriginal ? 'View English Translation' : 'View Original Text'}</span>
                      </button>
                    )}
                  </div>
                  <div className="rounded-lg border border-dash-border bg-dash-bg p-3.5 text-xs leading-relaxed text-dash-text-muted font-sans min-h-[100px] whitespace-pre-line">
                    {showOriginal ? activeComplaint.raw_text : (activeComplaint.translated_text || activeComplaint.raw_text)}
                  </div>
                </div>

                {/* AI Draft Response Card */}
                <div className="rounded-lg p-4 glass-card">
                  <div className="flex items-center justify-between border-b border-dash-primary/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-dash-primary" />
                      <span className="text-xs font-bold text-white">AI Draft Response</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingDraft(!isEditingDraft)}
                        className="flex items-center gap-1 rounded bg-dash-primary/10 border border-dash-primary/30 px-2 py-0.5 text-[10px] font-bold text-dash-primary hover:bg-dash-primary/20 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>{isEditingDraft ? 'Locked' : 'Edit'}</span>
                      </button>
                      <button
                        onClick={handleCopyDraft}
                        className="flex items-center gap-1 rounded bg-dash-surface-high px-2 py-0.5 text-[10px] font-bold text-dash-text hover:bg-dash-surface-highest hover:text-white transition-colors cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    {isEditingDraft ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={draftContent}
                          onChange={(e) => setDraftContent(e.target.value)}
                          rows={8}
                          className="w-full rounded-md border border-dash-primary/30 bg-dash-bg p-2.5 text-xs text-white outline-none focus:border-dash-primary focus:ring-1 focus:ring-dash-primary font-sans leading-relaxed"
                        />
                        <button
                          onClick={handleSaveDraft}
                          className="self-end rounded bg-dash-primary px-3 py-1 text-[10px] font-semibold text-black hover:bg-dash-primary-hover transition-colors cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap rounded-md bg-dash-bg/40 p-3 text-[11px] leading-relaxed text-dash-text-muted font-sans border border-dash-border">
                        {draftContent}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Buttons Row */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSendResponse}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-dash-primary py-2.5 text-center text-xs font-semibold text-black shadow-md hover:bg-dash-primary-hover transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Response</span>
                  </button>
                  
                  <button
                    onClick={handleMarkResolved}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-dash-success py-2.5 text-center text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Mark Resolved</span>
                  </button>

                  <button
                    onClick={() => {
                      setEscalateReason('')
                      setEscalateTeam('Compliance Supervisor')
                      setShowEscalateModal(true)
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dash-error/50 bg-dash-error/5 py-2.5 text-center text-xs font-bold text-dash-error hover:bg-dash-error/15 hover:border-dash-error transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Escalate Team</span>
                  </button>

                  <button
                    onClick={handleRequestInfo}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dash-outline bg-dash-bg py-2 text-center text-xs font-bold text-dash-text hover:bg-dash-surface-low hover:text-white transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Request Info</span>
                  </button>
                </div>

              </div>

              {/* Inspector Sidebar Column: SLA, AI Meta, Sentiment, Slots, Timeline */}
              <div className={`flex flex-col gap-5 ${
                isStandalone 
                  ? 'w-full lg:w-[280px] xl:w-[320px] flex-shrink-0' 
                  : 'w-full'
              }`}>
                
                {/* SLA Control Dashboard */}
                <div className="rounded-lg border border-dash-border bg-dash-bg p-4">
                  <div className="flex justify-between border-b border-dash-border pb-2 text-[10px] font-bold text-dash-text-muted tracking-wider uppercase">
                    <span>SLA Control Dashboard</span>
                    <span>Tier: {activeComplaint.sla_tier}</span>
                  </div>
                  <div className="mt-3.5 flex flex-col items-center">
                    {activeComplaint.status === 'resolved' ? (
                      <div className="flex flex-col items-center py-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dash-success/10 border border-dash-success/30 text-dash-success mb-1.5">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-bold text-dash-success uppercase tracking-wide">SLA Resolved</span>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`font-mono text-3xl font-bold tracking-wider leading-none ${
                            activeComplaint.sla_remaining_seconds <= 0
                              ? 'text-dash-error animate-pulse'
                              : activeComplaint.sla_remaining_seconds < 1800
                              ? 'text-dash-error'
                              : activeComplaint.sla_remaining_seconds < 7200
                              ? 'text-yellow-400'
                              : 'text-dash-success'
                          }`}
                        >
                          {activeComplaint.sla_remaining_seconds <= 0 ? '00:00:00' : formatTime(activeComplaint.sla_remaining_seconds)}
                        </span>
                        <span className="mt-1.5 text-[10px] text-dash-text-muted font-semibold uppercase tracking-wide">
                          {activeComplaint.sla_remaining_seconds <= 0 ? 'SLA Deadline Breached' : 'Remaining Resolution Time'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Deadline & Probability */}
                  <div className="mt-4 space-y-2 border-t border-dash-border pt-3 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-dash-text-muted">Resolution Target:</span>
                      <span className="font-semibold text-white font-mono text-[11px]">{activeComplaint.deadline}</span>
                    </div>
                    {activeComplaint.status !== 'resolved' && (
                      <div className="flex justify-between">
                        <span className="text-dash-text-muted">Breach Risk:</span>
                        <span
                          className={`font-semibold ${
                            activeComplaint.breach_probability > 0.8
                              ? 'text-dash-error'
                              : activeComplaint.breach_probability > 0.4
                              ? 'text-yellow-400'
                              : 'text-dash-success'
                          }`}
                        >
                          {Math.round(activeComplaint.breach_probability * 100)}% Probability
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Classification Card (Glassmorphism) */}
                <div className="rounded-lg p-4 glass-card">
                  <div className="flex items-center gap-1.5 border-b border-dash-primary/10 pb-2">
                    <Sparkles className="h-4 w-4 text-dash-primary" />
                    <span className="text-xs font-bold text-white">AI Classification Metadata</span>
                  </div>
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="grid grid-cols-[90px_1fr] items-center">
                      <span className="text-dash-text-muted font-medium">Type:</span>
                      <span className="capitalize font-semibold text-white">{activeComplaint.complaint_type}</span>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] items-center">
                      <span className="text-dash-text-muted font-medium">Product Code:</span>
                      <span className="font-mono text-white text-[11px] font-semibold">{activeComplaint.product_code}</span>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] items-center">
                      <span className="text-dash-text-muted font-medium">Intent:</span>
                      <span className="text-white font-medium truncate" title={activeComplaint.intent.replace(/_/g, ' ')}>
                        {activeComplaint.intent.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] items-start">
                      <span className="text-dash-text-muted font-medium mt-0.5">Regulatory:</span>
                      <span className="text-[#f8fafc] text-[10px] font-mono leading-tight bg-dash-error/5 border border-dash-error/25 px-1 py-0.5 rounded inline-block text-dash-error break-words">
                        {activeComplaint.regulatory_obligation}
                      </span>
                    </div>
                    
                    {/* Confidence Bar */}
                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-dash-text-muted">Confidence:</span>
                        <span className="font-mono font-bold text-dash-primary">{Math.round(activeComplaint.type_confidence * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-dash-primary/20">
                        <div
                          className="h-1.5 rounded-full bg-dash-primary transition-all duration-500"
                          style={{ width: `${activeComplaint.type_confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Sentiment Card (Emotion Analysis) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-dash-text-muted/80 tracking-wider">Customer Sentiment & Emotion Arc</span>
                  <div className="rounded-lg border border-dash-border bg-dash-bg p-3 space-y-3">
                    
                    {/* Visual progression */}
                    <div className="flex items-center justify-around rounded-md bg-dash-surface-low p-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-dash-text-muted text-[8px] uppercase font-bold tracking-wider">Initial</span>
                        <span className="text-xl cursor-default" title={activeComplaint.emotion_arc.initial}>
                          {getEmotionEmoji(activeComplaint.emotion_arc.initial)}
                        </span>
                        <span className="text-[9px] font-medium text-white truncate max-w-[50px]">{activeComplaint.emotion_arc.initial}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-xs font-bold ${getTrajectoryDetails(activeComplaint.emotion_arc.trajectory, activeComplaint.status).color}`}>
                          {getTrajectoryDetails(activeComplaint.emotion_arc.trajectory, activeComplaint.status).icon}
                        </span>
                        <span className="text-[8px] text-dash-text-muted uppercase font-bold mt-0.5 text-center leading-none">
                          {getTrajectoryDetails(activeComplaint.emotion_arc.trajectory, activeComplaint.status).label.replace(' Sentiment', '')}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-dash-text-muted text-[8px] uppercase font-bold tracking-wider">Current</span>
                        <span className="text-xl cursor-default" title={activeComplaint.status === 'resolved' ? 'Satisfied' : activeComplaint.emotion_arc.current}>
                          {getEmotionEmoji(activeComplaint.status === 'resolved' ? 'Satisfied' : activeComplaint.emotion_arc.current)}
                        </span>
                        <span className="text-[9px] font-medium text-white truncate max-w-[50px]">
                          {activeComplaint.status === 'resolved' ? 'Satisfied' : activeComplaint.emotion_arc.current}
                        </span>
                      </div>
                    </div>

                    {/* Intensity progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-dash-text-muted">Peak Intensity:</span>
                        <span className={`font-bold ${activeComplaint.emotion_arc.intensity > 7 ? 'text-dash-error' : 'text-white'}`}>
                          {activeComplaint.emotion_arc.intensity} / 10
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-dash-surface-low">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            activeComplaint.emotion_arc.intensity > 7
                              ? 'bg-dash-error'
                              : activeComplaint.emotion_arc.intensity > 4
                              ? 'bg-yellow-500'
                              : 'bg-dash-success'
                          }`}
                          style={{ width: `${activeComplaint.emotion_arc.intensity * 10}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Chatbot Extracted Slots */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-dash-text-muted/80 tracking-wider">Bot Slots Extracted</span>
                  <div className="rounded-lg border border-dash-border bg-dash-bg p-3.5 space-y-1.5 font-mono text-[10px] text-dash-text-muted leading-normal">
                    {Object.entries(activeComplaint.bot_slots).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-dash-bg pb-1 last:border-0 last:pb-0">
                        <span className="text-dash-text-muted font-bold truncate max-w-[140px]" title={key}>{key}:</span>
                        <span className="text-white font-semibold truncate max-w-[140px]" title={val}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="flex flex-col gap-2 pb-5">
                  <span className="text-[10px] uppercase font-bold text-dash-text-muted/80 tracking-wider">Status Event Timeline</span>
                  <div className="relative border-l border-dash-border pl-4 ml-1 space-y-4 pt-1">
                    {activeComplaint.history.map((evt, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* circle marker */}
                        <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-dash-primary ring-4 ring-dash-surface-lowest" />
                        <div className="flex justify-between font-mono text-[10px] text-dash-text-muted">
                          <span className="uppercase font-bold text-white/85">{evt.status.replace('_', ' ')}</span>
                          <span>{evt.timestamp}</span>
                        </div>
                        <p className="mt-1 text-dash-text-muted leading-tight text-[11px] font-sans">
                          {evt.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>
      )}
      </>)}
      </div>

      {/* ESCALATION MODAL */}
      {!loading && !fetchError && showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-xl border border-dash-border bg-dash-surface-lowest p-6 shadow-2xl glass-card">
            
            <div className="flex items-center gap-2 border-b border-dash-border pb-3.5">
              <ShieldAlert className="h-5 w-5 text-dash-error" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Escalate Complaint {selectedId}</h3>
            </div>
            
            <div className="mt-4 space-y-4">
              {/* Select Team */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-dash-text-muted/80 tracking-wider">Select Destination Team</label>
                <select
                  value={escalateTeam}
                  onChange={(e) => setEscalateTeam(e.target.value)}
                  className="w-full rounded-md border border-dash-border bg-dash-bg px-3 py-2 text-xs text-white outline-none focus:border-dash-primary focus:ring-1 focus:ring-dash-primary cursor-pointer font-sans"
                >
                  <option value="Compliance Supervisor">⚖️ Compliance Supervisor (Regulation E / FCBA)</option>
                  <option value="Fraud Risk Operations">🛡️ Fraud Risk Operations (Disputes & Holds)</option>
                  <option value="Credit Risk Underwriting">💳 Credit Risk Underwriting (Limits & Loans)</option>
                  <option value="Customer Support Level III">📞 Customer Support Level III (Escalated Help)</option>
                </select>
              </div>

              {/* Escalation Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-dash-text-muted/80 tracking-wider">Escalation Notes / Justification</label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Provide context, findings, or reasons for escalation..."
                  rows={4}
                  className="w-full rounded-md border border-dash-border bg-dash-bg p-2.5 text-xs text-white outline-none focus:border-dash-primary focus:ring-1 focus:ring-dash-primary font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-dash-border pt-4">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="rounded-lg border border-dash-outline bg-dash-bg px-4 py-2 text-xs font-bold text-dash-text hover:bg-dash-surface-low hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                className="rounded-lg bg-dash-error px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Confirm Escalation
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
