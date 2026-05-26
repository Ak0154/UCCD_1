import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppShell } from './layout/AppShell'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { AllComplaints } from './pages/AllComplaints'
import { SlaBreaches } from './pages/SlaBreaches'
import { ThreeSixtyView } from './pages/ThreeSixtyView'
import { Escalations } from './pages/Escalations'
import { Duplicates } from './pages/Duplicates'
import { AiDrafts } from './pages/AiDrafts'
import { Trends } from './pages/Trends'
import { RootCause } from './pages/RootCause'
import { RegulatoryReports } from './pages/RegulatoryReports'
import { QueuePage } from './pages/QueuePage'
import { SearchPage } from './pages/SearchPage'
import { SupervisorPage } from './pages/SupervisorPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { NotFound } from './components/uccd/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/complaints" element={<AllComplaints />} />
          <Route path="/app/sla-breaches" element={<SlaBreaches />} />
          <Route path="/app/360-view" element={<ThreeSixtyView />} />
          <Route path="/app/escalations" element={<Escalations />} />
          <Route path="/app/duplicates" element={<Duplicates />} />
          <Route path="/app/drafts" element={<AiDrafts />} />
          <Route path="/app/trends" element={<Trends />} />
          <Route path="/app/root-cause" element={<RootCause />} />
          <Route path="/app/regulatory" element={<RegulatoryReports />} />
          <Route path="/app/classic" element={<AppShell />}>
            <Route index element={<Navigate to="/app/classic/queue" replace />} />
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
