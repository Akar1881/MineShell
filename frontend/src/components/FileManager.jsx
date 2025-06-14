import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Plus, 
  MoreVertical,
  ArrowLeft,
  Save,
  X
} from 'lucide-react'

const FileManager = ({ serverId }) => {
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    fetchDirectory(currentPath)
  }, [currentPath, serverId])

  const fetchDirectory = async (path = '') => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/files/${serverId}`, {
        params: { path }
      })
      
      if (response.data.success) {
        if (response.data.type === 'directory') {
          setItems(response.data.items)
          setEditingFile(null)
        } else if (response.data.type === 'file') {
          // Handle file content
          if (!response.data.binary) {
            setEditingFile({
              name: response.data.name,
              path: path,
              content: response.data.content
            })
            setFileContent(response.data.content)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching directory:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToPath = (path) => {
    setCurrentPath(path)
  }

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const handleFileClick = (item) => {
    if (item.type === 'directory') {
      navigateToPath(item.path)
    } else {
      // Try to open file for editing
      fetchDirectory(item.path)
    }
  }

  const saveFile = async () => {
    try {
      await axios.put(`/api/files/${serverId}`, {
        path: editingFile.path,
        content: fileContent
      })
      
      setEditingFile(null)
      fetchDirectory(currentPath)
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const deleteItem = async (itemPath) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/files/${serverId}`, {
          params: { path: itemPath }
        })
        fetchDirectory(currentPath)
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  const createFolder = async () => {
    const name = prompt('Enter folder name:')
    if (name) {
      try {
        await axios.post(`/api/files/${serverId}/mkdir`, {
          path: currentPath,
          name
        })
        fetchDirectory(currentPath)
      } catch (error) {
        console.error('Error creating folder:', error)
      }
    }
  }

  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', currentPath)

    try {
      await axios.post(`/api/files/${serverId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      fetchDirectory(currentPath)
      setShowUpload(false)
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (editingFile) {
    return (
      <div className="card h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => setEditingFile(null)}
              className="btn btn-secondary mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium text-white">Editing: {editingFile.name}</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setEditingFile(null)}
              className="btn btn-secondary"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </button>
            <button
              onClick={saveFile}
              className="btn btn-primary"
            >
              <Save className="w-5 h-5 mr-2" />
              Save
            </button>
          </div>
        </div>

        <textarea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          className="w-full h-96 p-4 bg-black text-green-400 font-mono text-sm rounded-lg border border-dark-600 resize-none"
          placeholder="File content..."
        />
      </div>
    )
  }

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-white mr-4">File Manager</h3>
          {currentPath && (
            <button
              onClick={navigateUp}
              className="btn btn-secondary text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={createFolder}
            className="btn btn-secondary text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Folder
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="btn btn-primary text-sm"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-dark-400">
        <span>servers/{serverId}/</span>
        {currentPath && <span>{currentPath}</span>}
      </div>

      {/* File List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-white">Loading...</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              This directory is empty
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
              >
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => handleFileClick(item)}
                >
                  {item.type === 'directory' ? (
                    <Folder className="w-5 h-5 text-blue-400 mr-3" />
                  ) : (
                    <File className="w-5 h-5 text-dark-400 mr-3" />
                  )}
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-xs text-dark-400">
                      {item.type === 'file' && formatFileSize(item.size)} • 
                      {new Date(item.modified).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => deleteItem(item.path)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h3 className="text-lg font-medium text-white">Upload File</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    uploadFile(e.target.files[0])
                  }
                }}
                className="w-full p-3 border-2 border-dashed border-dark-600 rounded-lg text-dark-400 hover:border-dark-500 transition-colors"
              />
              <p className="text-xs text-dark-400 mt-2">
                Select a file to upload to the current directory
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileManager