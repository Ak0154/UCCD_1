import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const allNavItems = [
  { label: 'Queue', path: '/app/queue', roles: ['AGENT', 'SUPERVISOR'] },
  { label: 'Supervisor', path: '/app/supervisor', roles: ['SUPERVISOR'] },
  { label: 'Search', path: '/app/search', roles: ['AGENT', 'SUPERVISOR'] },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role ?? ''))

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const isAgentDashboard = location.pathname === '/app/queue' || location.pathname === '/app/search'
  if (isAgentDashboard) {
    return (
      <div className="min-h-screen bg-dash-bg text-dash-text font-sans selection:bg-dash-primary/20 selection:text-white">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface px-4 py-5 lg:block">
        <div className="text-sm font-semibold text-accent">UCCD</div>
        <div className="mt-8 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-bg hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-bg/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-muted">Signed in</p>
              <h1 className="text-sm font-semibold text-text">{user?.name ?? 'UCCD user'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-border px-3 py-1 text-xs text-muted">{user?.role}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:border-muted hover:text-text"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-accent/15 text-accent' : 'text-muted'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
