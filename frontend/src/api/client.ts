import type {
  AgentLoad,
  Complaint,
  ComplaintFilters,
  ComplaintHistoryResponse,
  ComplaintListResponse,
  DashboardKpis,
  DraftResponse,
  LoginRequest,
  LoginResponse,
  TrendsResponse,
} from '../types/complaint'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'uccd.access_token'
const USER_KEY = 'uccd.user'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface StoredUser {
  role: LoginResponse['role']
  user_id: string
  name: string
  email: string
  expires_at: string
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function storeSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function toQuery(params: object) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearSession()
    window.location.href = '/login'
    throw new ApiError(401, 'Session expired')
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = await response.json()
      message = payload.detail ?? message
    } catch {
      // keep default message
    }
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}

export const api = {
  async login(body: LoginRequest) {
    const response = await request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    storeSession(response.access_token, {
      role: response.role,
      user_id: response.user_id,
      name: response.name,
      email: body.email,
      expires_at: response.expires_at,
    })
    return response
  },

  listComplaints(filters: ComplaintFilters = {}) {
    return request<ComplaintListResponse>(`/api/v1/complaints${toQuery(filters)}`)
  },

  getComplaint(id: string) {
    return request<Complaint>(`/api/v1/complaints/${id}`)
  },

  getComplaintHistory(id: string) {
    return request<ComplaintHistoryResponse>(`/api/v1/complaints/${id}/history`)
  },

  getDraft(id: string, tone = 'apologetic') {
    return request<DraftResponse>(`/api/v1/ai/draft/${id}${toQuery({ tone })}`)
  },

  respond(id: string, responseText: string) {
    return request<{ status: string; message: string; complaint_id: string; telegram_sent: boolean }>(
      `/api/v1/complaints/${id}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({ response_text: responseText }),
      },
    )
  },

  assign(id: string) {
    return request<Complaint>(`/api/v1/complaints/${id}/assign`, { method: 'PUT' })
  },

  getKpis() {
    return request<DashboardKpis>('/api/v1/kpis')
  },

  getEscalations(filters: Pick<ComplaintFilters, 'page' | 'limit'> = {}) {
    return request<ComplaintListResponse>(`/api/v1/escalations${toQuery(filters)}`)
  },

  getAgentLoad() {
    return request<AgentLoad>('/api/v1/agents/load')
  },

  getTrends(window = 7) {
    return request<TrendsResponse>(`/api/v1/analytics/trends${toQuery({ window })}`)
  },
}

export { API_BASE_URL }
