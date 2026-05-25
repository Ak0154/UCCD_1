import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const presets = [
  { label: 'Agent', email: 'agent@example.com' },
  { label: 'Supervisor', email: 'supervisor@example.com' },
]

function redirectFor(role: string) {
  return role === 'SUPERVISOR' ? '/app/supervisor' : '/app/queue'
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('agent@example.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated && user) {
    return <Navigate to={redirectFor(user.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const loggedIn = await login({ email, password })
      const target = (location.state as { from?: string } | null)?.from ?? redirectFor(loggedIn.role)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-8 text-text">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section>
          <a href="/landing" className="inline-flex text-sm font-medium text-accent">UCCD OmniResol</a>
          <h1 className="mt-8 max-w-3xl font-display text-5xl leading-tight text-text md:text-6xl">
            Complaint operations workspace
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            Sign in to manage live queues, AI triage, SLA risk, and supervisor operations from one connected console.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {['AI triage', 'SLA risk', 'Live queues'].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                <span className="block text-base font-semibold text-text">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 shadow-2xl shadow-black/30">
          <div>
            <h2 className="font-display text-2xl text-text">Sign in</h2>
            <p className="mt-2 text-sm text-muted">Use a seeded Neon DB user account.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.email}
                type="button"
                onClick={() => setEmail(preset.email)}
                className={`h-10 rounded-md border text-sm transition ${
                  email === preset.email
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border text-muted hover:border-muted'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label className="mt-5 block text-sm text-muted">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="mt-2 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              required
            />
          </label>

          <label className="mt-4 block text-sm text-muted">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              required
            />
          </label>

          {error && (
            <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
