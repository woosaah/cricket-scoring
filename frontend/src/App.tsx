import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import Teams from './pages/Teams'
import Tournaments from './pages/Tournaments'
import TournamentDetails from './pages/TournamentDetails'
import MatchSetup from './pages/MatchSetup'
import Scoring from './pages/Scoring'
import LiveScorecard from './pages/LiveScorecard'
import Login from './pages/Login'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {isAuthenticated ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="players" element={<Players />} />
          <Route path="teams" element={<Teams />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetails />} />
          <Route path="matches/setup" element={<MatchSetup />} />
          <Route path="matches/:id/scoring" element={<Scoring />} />
          <Route path="matches/:id/live" element={<LiveScorecard />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}

export default App
