import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Send } from 'lucide-react'

const Console = ({ serverId, onStatusChange }) => {
  const [output, setOutput] = useState([])
  const [command, setCommand] = useState('')
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const outputRef = useRef(null)
  const { token } = useAuth()

  useEffect(() => {
    if (!token || !serverId) return

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      setReconnectAttempt(0)
      
      // Authenticate
      websocket.send(JSON.stringify({
        type: 'auth',
        token
      }))
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('WebSocket message received:', data)
        
        switch (data.type) {
          case 'auth_success':
            // Subscribe to console output for this server
            websocket.send(JSON.stringify({
              type: 'subscribe_console',
              serverId
            }))
            break
            
          case 'console_output':
            if (data.serverId === serverId) {
              setOutput(prev => [...prev, {
                timestamp: new Date(),
                text: data.output
              }])

              // Update server status based on console messages
              if (data.output.includes('Stopping the server')) {
                onStatusChange('stopping')
              } else if (data.output.includes('Server stopped')) {
                onStatusChange('stopped')
              }
            }
            break
            
          case 'auth_failed':
            console.error('WebSocket authentication failed')
            setConnected(false)
            websocket.close()
            break
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      
      // Attempt to reconnect after a delay
      if (reconnectAttempt < 5) {
        setTimeout(() => {
          setReconnectAttempt(prev => prev + 1)
        }, 3000)
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [token, serverId, reconnectAttempt])

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const sendCommand = (e) => {
    e.preventDefault()
    
    if (!command.trim() || !ws || !connected) return

    // Send command via WebSocket
    ws.send(JSON.stringify({
      type: 'console_command',
      serverId,
      command: command.trim()
    }))

    // Add command to output for display
    setOutput(prev => [...prev, {
      timestamp: new Date(),
      text: `> ${command.trim()}\n`,
      isCommand: true
    }])

    setCommand('')
  }

  const clearConsole = () => {
    setOutput([])
  }

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Console</h3>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            onClick={clearConsole}
            className="btn btn-secondary text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={outputRef}
        className="console h-96 mb-4 overflow-y-auto"
      >
        {output.length === 0 ? (
          <div className="text-dark-500 text-center py-8">
            Console output will appear here...
          </div>
        ) : (
          output.map((line, index) => (
            <div
              key={index}
              className={`whitespace-pre-wrap ${line.isCommand ? 'text-yellow-400' : 'text-green-400'}`}
            >
              <span className="text-dark-500 text-xs mr-2">
                {line.timestamp.toLocaleTimeString()}
              </span>
              {line.text}
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={sendCommand} className="flex space-x-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter server command..."
          className="input flex-1 font-mono"
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!connected || !command.trim()}
          className="btn btn-primary"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-2 text-xs text-dark-400">
        Common commands: help, list, stop, say &lt;message&gt;, gamemode &lt;mode&gt; &lt;player&gt;
      </div>
    </div>
  )
}

export default Console