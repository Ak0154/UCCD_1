import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppShell } from './layout/AppShell'
import { LandingPage } from './pages/LandingPage'
import { SignInPage } from './pages/SignInPage'
import { QueuePage } from './pages/QueuePage'
import { SearchPage } from './pages/SearchPage'
import { SupervisorPage } from './pages/SupervisorPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { NotFound } from './components/uccd/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="/app/queue" replace />} />
            <Route path="queue" element={<QueuePage />} />
            <Route path="supervisor" element={<SupervisorPage />} />
            <Route path="search" element={<SearchPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
