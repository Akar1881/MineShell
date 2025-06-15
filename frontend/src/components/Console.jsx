import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Send } from 'lucide-react'
import ServerStats from './ServerStats'

const Console = ({ serverId, onStatusChange }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const { token } = useAuth()
  const processedMessagesRef = useRef(new Set())

  // Poll for new messages
  useEffect(() => {
    if (!serverId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/console/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch console output')
        }

        const data = await response.json()
        
        if (data.outputs && Array.isArray(data.outputs)) {
          // Filter out already processed messages
          const newMessages = data.outputs.filter(msg => !processedMessagesRef.current.has(msg))
          
          if (newMessages.length > 0) {
            console.log('New console outputs:', newMessages)
            
            // Add new messages to processed set
            newMessages.forEach(msg => processedMessagesRef.current.add(msg))
            
            // Update messages state
            setMessages(prev => {
              const updated = [...prev, ...newMessages]
              // Keep only last 1000 messages
              if (updated.length > 1000) {
                return updated.slice(-1000)
              }
              return updated
            })
            
            setIsConnected(true)
            setError(null)

            // Update server status based on console messages
            newMessages.forEach(msg => {
              if (msg.includes('Stopping the server')) {
                onStatusChange('stopping')
              } else if (msg.includes('Server stopped')) {
                onStatusChange('stopped')
                // Clear console messages when server is stopped
                setMessages([])
                processedMessagesRef.current.clear()
              }
            })
          }
        }
      } catch (error) {
        console.error('Error polling console:', error)
        setIsConnected(false)
        setError('Connection error')
      }
    }, 500) // Poll every 500ms for more frequent updates

    return () => clearInterval(pollInterval)
  }, [serverId, token, onStatusChange])

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
    }
  }, [messages])

  const sendCommand = async (e) => {
    e.preventDefault()
    
    if (!input.trim() || !isConnected) return

    try {
      // Send command via REST API
      const response = await fetch(`/api/servers/${serverId}/console/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ command: input.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to send command')
      }

      // Add command to output for display
      setMessages(prev => [...prev, `> ${input.trim()}\n`])
      setInput('')
    } catch (error) {
      console.error('Error sending command:', error)
      setMessages(prev => [...prev, `Error: Failed to send command\n`])
    }
  }

  const clearConsole = () => {
    setMessages([])
    processedMessagesRef.current.clear()
  }

  return (
    <div className="bg-dark-800 rounded-lg p-4">
      {/* Server Stats Panel */}
      <ServerStats serverId={serverId} />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Console</h3>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={clearConsole}
            className="text-sm text-dark-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={messagesEndRef}
        className="console h-96 mb-4 overflow-y-auto bg-dark-900 rounded p-4 font-mono text-sm"
      >
        {messages.length === 0 ? (
          <div className="text-dark-500 text-center py-8">
            Console output will appear here...
          </div>
        ) : (
          messages.map((line, index) => (
            <div
              key={index}
              className={`whitespace-pre-wrap ${line.startsWith('>') ? 'text-yellow-400' : 'text-green-400'}`}
            >
              <span className="text-dark-500 text-xs mr-2">
                {new Date().toLocaleTimeString()}
              </span>
              {line}
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={sendCommand} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter server command..."
          className="input flex-1 font-mono"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !input.trim()}
          className="btn btn-primary"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

export default Console