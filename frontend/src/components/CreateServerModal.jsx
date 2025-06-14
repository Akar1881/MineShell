import React, { useState } from 'react'
import axios from 'axios'
import { X } from 'lucide-react'

const CreateServerModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    edition: 'java',
    minRam: '1G',
    maxRam: '2G',
    port: '25565',
    jarFile: 'server.jar'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/servers', formData)
      if (response.data.success) {
        onSuccess()
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create server')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-white">Create New Server</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Server Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="My Minecraft Server"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Edition
            </label>
            <select
              name="edition"
              value={formData.edition}
              onChange={handleChange}
              className="input"
            >
              <option value="java">Java Edition</option>
              <option value="bedrock">Bedrock Edition</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Min RAM
              </label>
              <select
                name="minRam"
                value={formData.minRam}
                onChange={handleChange}
                className="input"
              >
                <option value="512M">512MB</option>
                <option value="1G">1GB</option>
                <option value="2G">2GB</option>
                <option value="4G">4GB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Max RAM
              </label>
              <select
                name="maxRam"
                value={formData.maxRam}
                onChange={handleChange}
                className="input"
              >
                <option value="1G">1GB</option>
                <option value="2G">2GB</option>
                <option value="4G">4GB</option>
                <option value="8G">8GB</option>
                <option value="16G">16GB</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Port
            </label>
            <input
              type="number"
              name="port"
              value={formData.port}
              onChange={handleChange}
              className="input"
              min="1024"
              max="65535"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              JAR File Name
            </label>
            <input
              type="text"
              name="jarFile"
              value={formData.jarFile}
              onChange={handleChange}
              className="input"
              placeholder="server.jar"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              You'll need to upload this file after creating the server
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateServerModal