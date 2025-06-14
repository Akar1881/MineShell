import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Plus, Play, Square, Trash2, Server, Users, Cpu, HardDrive } from 'lucide-react'
import CreateServerModal from './CreateServerModal'

const Dashboard = () => {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    try {
      const response = await axios.get('/api/servers')
      if (response.data.success) {
        setServers(response.data.servers)
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServerAction = async (serverId, action) => {
    try {
      await axios.post(`/api/servers/${serverId}/${action}`)
      fetchServers() // Refresh server list
    } catch (error) {
      console.error(`Error ${action} server:`, error)
    }
  }

  const handleDeleteServer = async (serverId) => {
    if (window.confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/servers/${serverId}`)
        fetchServers() // Refresh server list
      } catch (error) {
        console.error('Error deleting server:', error)
      }
    }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-white">Loading servers...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-dark-400">Manage your Minecraft servers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Server
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-primary-600 p-3 rounded-lg mr-4">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Total Servers</p>
              <p className="text-2xl font-bold text-white">{servers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-600 p-3 rounded-lg mr-4">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Running</p>
              <p className="text-2xl font-bold text-white">
                {servers.filter(s => s.status === 'running').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="bg-red-600 p-3 rounded-lg mr-4">
              <Square className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Stopped</p>
              <p className="text-2xl font-bold text-white">
                {servers.filter(s => s.status === 'stopped').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-600 p-3 rounded-lg mr-4">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Java Edition</p>
              <p className="text-2xl font-bold text-white">
                {servers.filter(s => s.edition === 'java').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Server List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Servers</h2>
        </div>

        {servers.length === 0 ? (
          <div className="text-center py-12">
            <Server className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No servers yet</h3>
            <p className="text-dark-400 mb-6">Create your first Minecraft server to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Server
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <div key={server.id} className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-white mr-3">{server.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                        {server.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-dark-400">
                      <span>Edition: {server.edition}</span>
                      <span>Port: {server.port}</span>
                      <span>RAM: {server.minRam} - {server.maxRam}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <Link
                      to={`/server/${server.id}`}
                      className="btn btn-secondary text-sm"
                    >
                      Manage
                    </Link>
                    
                    {server.status === 'stopped' ? (
                      <button
                        onClick={() => handleServerAction(server.id, 'start')}
                        className="btn btn-success text-sm"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleServerAction(server.id, 'stop')}
                        className="btn btn-danger text-sm"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      className="btn btn-danger text-sm"
                      disabled={server.status === 'running'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchServers()
          }}
        />
      )}
    </div>
  )
}

export default Dashboard