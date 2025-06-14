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
  X,
  Archive,
  Check
} from 'lucide-react'
import FileContextMenu from './FileContextMenu'

const FileManager = ({ serverId }) => {
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null
  })
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      setUploadStatus('uploading')
      setUploadProgress(0)

      await axios.post(`/api/files/${serverId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })

      setUploadStatus('success')
      setTimeout(() => {
        setUploadStatus(null)
        setUploadProgress(null)
      }, 2000)

      fetchDirectory(currentPath)
      setShowUpload(false)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadStatus('error')
      setTimeout(() => {
        setUploadStatus(null)
        setUploadProgress(null)
      }, 3000)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor(e.currentTarget);
    setContextMenu({
      isOpen: true,
      position: { x: rect.right, y: rect.top },
      item
    });
  };

  const handleMobileMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor(e.currentTarget);
    setContextMenu({
      isOpen: true,
      position: { x: rect.right, y: rect.top },
      item
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, item: null })
    setMenuAnchor(null)
  }

  const handleRename = async () => {
    const newName = prompt('Enter new name:', contextMenu.item.name)
    if (newName && newName !== contextMenu.item.name) {
      try {
        await axios.post(`/api/files/${serverId}/rename`, {
          oldPath: contextMenu.item.path,
          newName
        })
        fetchDirectory(currentPath)
      } catch (error) {
        console.error('Error renaming item:', error)
      }
    }
    closeContextMenu()
  }

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/files/${serverId}`, {
        params: { path: contextMenu.item.path },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', contextMenu.item.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
    closeContextMenu()
  }

  const handleArchive = async () => {
    try {
      const response = await axios.get(`/api/files/${serverId}/archive`, {
        params: { path: contextMenu.item.path },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${contextMenu.item.name}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error archiving file:', error)
    }
    closeContextMenu()
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedItems(new Set())
  }

  const toggleItemSelection = (itemPath) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemPath)) {
      newSelected.delete(itemPath)
    } else {
      newSelected.add(itemPath)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkArchive = async () => {
    if (selectedItems.size === 0) return

    try {
      const response = await axios.post(`/api/files/${serverId}/bulk-archive`, {
        paths: Array.from(selectedItems)
      }, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'archive.zip')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSelectedItems(new Set())
      setIsSelectMode(false)
    } catch (error) {
      console.error('Error archiving files:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      try {
        await Promise.all(Array.from(selectedItems).map(path =>
          axios.delete(`/api/files/${serverId}`, {
            params: { path }
          })
        ))
        fetchDirectory(currentPath)
        setSelectedItems(new Set())
        setIsSelectMode(false)
      } catch (error) {
        console.error('Error deleting items:', error)
      }
    }
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
    <div className="card h-full" onContextMenu={(e) => e.preventDefault()}>
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
        
        <div className="flex items-center space-x-2">
          {isSelectMode && (
            <>
              <button
                onClick={handleBulkArchive}
                className="btn btn-secondary"
                disabled={selectedItems.size === 0}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn btn-danger"
                disabled={selectedItems.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </button>
            </>
          )}
          <button
            onClick={toggleSelectMode}
            className={`btn ${isSelectMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isSelectMode ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel Selection
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Select Files
              </>
            )}
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="btn btn-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </button>
          <button
            onClick={createFolder}
            className="btn btn-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Folder
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
            <div className="grid grid-cols-1 gap-2">
              {items.map((item) => (
                <div
                  key={item.path}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedItems.has(item.path)
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-dark-600 hover:bg-dark-500'
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelectMode) {
                      toggleItemSelection(item.path);
                    } else {
                      handleFileClick(item);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {isSelectMode && (
                      <div className={`w-5 h-5 rounded border ${
                        selectedItems.has(item.path)
                          ? 'bg-blue-400 border-blue-400'
                          : 'border-gray-400'
                      }`}>
                        {selectedItems.has(item.path) && (
                          <Check className="w-5 h-5 text-white" />
                        )}
                      </div>
                    )}
                    {item.type === 'directory' ? (
                      <Folder className="w-5 h-5 text-blue-400" />
                    ) : (
                      <File className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-white">{item.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {item.type === 'file' ? formatFileSize(item.size) : ''}
                    </span>
                    {!isSelectMode && (
                      <button
                        onClick={(e) => handleMobileMenu(e, item)}
                        className="p-1 hover:bg-dark-400 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FileContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onDelete={() => deleteItem(contextMenu.item?.path)}
        onRename={handleRename}
        onDownload={handleDownload}
        onArchive={handleArchive}
        onUpload={() => setShowUpload(true)}
        onCreateFolder={createFolder}
        isDirectory={contextMenu.item?.type === 'directory'}
        isMobile={isMobile}
        anchorElement={menuAnchor}
      />

      {/* Upload Progress */}
      {uploadStatus && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          uploadStatus === 'success' ? 'bg-green-500' :
          uploadStatus === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        } text-white`}>
          {uploadStatus === 'uploading' && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading... {uploadProgress}%</span>
            </div>
          )}
          {uploadStatus === 'success' && (
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Upload complete!</span>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Upload failed</span>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-700 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium text-white mb-4">Upload File</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-dark-500 rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      uploadFile(file);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-400 hover:text-blue-300"
                >
                  {uploadStatus === 'uploading' ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading... {uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <span>Click to select file</span>
                    </>
                  )}
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className="btn btn-secondary"
                  disabled={uploadStatus === 'uploading'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileManager