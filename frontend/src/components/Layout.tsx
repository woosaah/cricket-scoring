import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Users, Shield, Trophy, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/players', label: 'Players', icon: Users },
    { to: '/teams', label: 'Teams', icon: Shield },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-50 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">🏏 Cricket Scoring</h1>
              <nav className="hidden md:flex space-x-4">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
                      location.pathname === to
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-dark-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary transition"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-dark-50 border-b border-gray-800 sticky top-16 z-40">
        <div className="flex justify-around py-2">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center px-3 py-2 rounded-md transition ${
                location.pathname === to
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-50 border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Cricket Scoring App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
