import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Server, LogOut, Home, Settings } from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile header */}
      <div className="lg:hidden bg-dark-800 border-b border-dark-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">MineShell</h1>
          </div>
          <button
            onClick={logout}
            className="p-2 text-dark-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-dark-800 border-r border-dark-700">
            <div className="flex items-center px-6 py-4 border-b border-dark-700">
              <div className="bg-primary-600 p-2 rounded-lg mr-3">
                <Server className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">MineShell</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="px-4 py-4 border-t border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-primary-600 p-2 rounded-full mr-3">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-white">{user?.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-dark-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout