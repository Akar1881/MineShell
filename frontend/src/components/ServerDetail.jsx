import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Play, Square, Settings, FolderOpen, Terminal, Upload } from 'lucide-react'
import Console from './Console'
import FileManager from './FileManager'

const ServerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('console')

  useEffect(() => {
    fetchServer()
  }, [id])

  const fetchServer = async () => {
    try {
      const response = await axios.get('/api/servers')
      if (response.data.success) {
        const foundServer = response.data.servers.find(s => s.id === id)
        setServer(foundServer)
      }
    } catch (error) {
      console.error('Error fetching server:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServerAction = async (action) => {
    try {
      await axios.post(`/api/servers/${id}/${action}`)
      fetchServer() // Refresh server data
    } catch (error) {
      console.error(`Error ${action} server:`, error)
    }
  }

  const handleStatusChange = (newStatus) => {
    setServer(prev => ({
      ...prev,
      status: newStatus
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-900/50'
      case 'stopped':
        return 'text-red-400 bg-red-900/50'
      default:
        return 'text-yellow-400 bg-yellow-900/50'
    }
  }

  const tabs = [
    { id: 'console', name: 'Console', icon: Terminal },
    { id: 'files', name: 'Files', icon: FolderOpen },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  const handleTabChange = (tabId) => {
    if (tabId === 'settings') {
      navigate(`/server/${id}/settings`)
    } else {
      setActiveTab(tabId)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-white">Loading server...</div>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-white">Server not found</div>
          <Link to="/" className="btn btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link
            to="/"
            className="btn btn-secondary mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center mb-2">
              <h1 className="text-3xl font-bold text-white mr-3">{server.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(server.status)}`}>
                {server.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-dark-400">
              <span>Edition: {server.edition}</span>
              <span>Port: {server.port}</span>
              <span>RAM: {server.minRam} - {server.maxRam}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {server.status === 'stopped' ? (
            <button
              onClick={() => handleServerAction('start')}
              className="btn btn-success"
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </button>
          ) : (
            <button
              onClick={() => handleServerAction('stop')}
              className="btn btn-danger"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-dark-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-dark-400 hover:text-dark-300 hover:border-dark-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'console' && (
          <Console 
            serverId={id} 
            onStatusChange={handleStatusChange}
          />
        )}
        {activeTab === 'files' && <FileManager serverId={id} />}
      </div>
    </div>
  )
}

export default ServerDetail