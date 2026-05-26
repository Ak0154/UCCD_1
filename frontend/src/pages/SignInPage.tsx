import { useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../types/complaint'

function redirectFor(role: string) {
  return role === 'SUPERVISOR' ? '/app/supervisor' : '/app/queue'
}

const rolesConfig: { role: UserRole; label: string; email: string; icon: ReactNode; description: string }[] = [
  {
    role: 'AGENT',
    label: 'Agent',
    email: 'agent@example.com',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      </svg>
    ),
    description: 'Handle complaints, triage cases & manage queues',
  },
  {
    role: 'SUPERVISOR',
    label: 'Supervisor',
    email: 'supervisor@example.com',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    description: 'Monitor teams, SLA compliance & escalations',
  },
  {
    role: 'COMPLIANCE',
    label: 'Compliance',
    email: 'compliance@example.com',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    description: 'Regulatory view, audit trails & evidence management',
  },
]

export function SignInPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedRole, setSelectedRole] = useState<UserRole>('AGENT')
  const [email, setEmail] = useState('agent@example.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'login' | 'success'>('login')

  if (isAuthenticated && user) {
    return <Navigate to={redirectFor(user.role)} replace />
  }

  const handleRoleSelect = (role: UserRole, presetEmail: string) => {
    setSelectedRole(role)
    setEmail(presetEmail)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const loggedIn = await login({ email, password })
      setStep('success')
      setTimeout(() => {
        const target = (location.state as { from?: string } | null)?.from ?? redirectFor(loggedIn.role)
        navigate(target, { replace: true })
      }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full bg-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/4 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,164,76,0.04)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 flex w-full">
        <div className="hidden flex-1 items-center justify-center bg-surface/30 border-r border-border lg:flex">
          <div className="max-w-md px-8 py-12 space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium text-accent tracking-wide uppercase">Enterprise Platform</span>
              </div>

              <h1 className="font-display text-[2.75rem] leading-tight font-bold tracking-tight text-text">
                Unified Customer
                <span className="block text-accent">Complaint Dashboard</span>
              </h1>

              <p className="text-base text-muted leading-relaxed">
                AI-powered complaint operations for banking and financial services. 
                Triage, resolve, and track customer issues across every channel — all from one connected workspace.
              </p>
            </div>

            <div className="flex gap-3">
              {[
                { value: '6+', label: 'Channels' },
                { value: '99.7%', label: 'Uptime SLA' },
                { value: '24/7', label: 'AI Triage' },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 rounded-lg border border-border bg-surface/60 p-3 text-center">
                  <div className="text-xl font-bold text-accent font-display">{stat.value}</div>
                  <div className="text-[11px] text-muted uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { title: 'Multi-channel Intake', desc: 'Email, chat, SMS, voice, web, and social — unified in one queue.' },
                { title: 'AI Agent Triage', desc: 'Seven specialized AI agents classify, score, and escalate complaints instantly.' },
                { title: 'SLA & Compliance', desc: 'Real-time breach prediction with regulatory audit trails and evidence exports.' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface/40 p-3.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <svg className="h-3 w-3 text-accent" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{feature.title}</p>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-8">
          <div className="w-full max-w-[440px]">
            <Link to="/landing" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:brightness-110 transition mb-8 lg:hidden">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
              UCCD
            </Link>

            <AnimatePresence mode="wait">
              {step === 'login' ? (
                <motion.div
                  key="login-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="font-display text-[1.75rem] font-bold tracking-tight text-text">Welcome back</h2>
                    <p className="text-sm text-muted">Sign in to your workspace to continue.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Select Workspace</label>
                    <div className="grid grid-cols-3 gap-2">
                      {rolesConfig.map(({ role, label, email: presetEmail, icon, description }) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role, presetEmail)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200 text-center',
                            selectedRole === role
                              ? 'border-accent bg-accent/10 shadow-[0_0_16px_rgba(201,164,76,0.12)]'
                              : 'border-border bg-surface/40 hover:border-muted/50 hover:bg-surface/60',
                          )}
                          title={description}
                        >
                          <span className={cn(
                            'transition-colors',
                            selectedRole === role ? 'text-accent' : 'text-muted',
                          )}>
                            {icon}
                          </span>
                          <span className={cn(
                            'text-xs font-semibold transition-colors',
                            selectedRole === role ? 'text-accent' : 'text-text',
                          )}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@bank.com"
                        className="h-11 w-full rounded-lg border border-border bg-surface/60 px-3.5 text-sm text-text outline-none placeholder:text-muted/50 transition focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="h-11 w-full rounded-lg border border-border bg-surface/60 px-3.5 pr-11 text-sm text-text outline-none placeholder:text-muted/50 transition focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-text"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-200"
                      >
                        {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-[#0a0f1e] transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(201,164,76,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        `Sign in as ${rolesConfig.find((r) => r.role === selectedRole)?.label}`
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs text-muted">
                    Need help?{' '}
                    <a href="mailto:support@omniresol.tech" className="font-medium text-accent hover:brightness-110 transition">
                      Contact support
                    </a>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                      <svg className="h-6 w-6 text-[#0a0f1e]" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </motion.div>

                  <div className="space-y-1.5">
                    <h2 className="font-display text-2xl font-bold text-text">Welcome back</h2>
                    <p className="text-sm text-muted">
                      Redirecting to your{' '}
                      <span className="font-semibold text-accent">{rolesConfig.find((r) => r.role === selectedRole)?.label}</span>
                      {' '}workspace...
                    </p>
                  </div>

                  <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-surface">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.6, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}