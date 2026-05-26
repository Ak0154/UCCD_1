import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Login } from './pages/Login'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { AllComplaints } from './pages/AllComplaints'
import { SlaBreaches } from './pages/SlaBreaches'
import { ThreeSixtyView } from './pages/ThreeSixtyView'
import { Escalations } from './pages/Escalations'
import { AiDrafts } from './pages/AiDrafts'
import { Trends } from './pages/Trends'
import { RootCause } from './pages/RootCause'
import { RegulatoryReports } from './pages/RegulatoryReports'
import { SearchPage } from './pages/SearchPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { NotFound } from './components/uccd/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Protected */}
        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="complaints" element={<AllComplaints />} />
          <Route path="escalations" element={<Escalations />} />
          <Route path="sla-breaches" element={<SlaBreaches />} />
          <Route path="360-view" element={<ThreeSixtyView />} />
          <Route path="drafts" element={<AiDrafts />} />
          <Route path="trends" element={<Trends />} />
          <Route path="root-cause" element={<RootCause />} />
          <Route path="regulatory" element={<RegulatoryReports />} />
          <Route path="search" element={<SearchPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
