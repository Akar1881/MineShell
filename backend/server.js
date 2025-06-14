const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const YAML = require('yamljs');

// Import modules
const auth = require('./auth');
const mcControl = require('./mc_control');
const fileManager = require('./file_manager');

// Load configuration
const config = YAML.load('./config.yaml');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  verifyClient: (info, callback) => {
    const origin = info.origin || info.req.headers.origin;
    if (origin === 'http://localhost:3000' || origin === 'http://localhost:5173') {
      callback(true);
    } else {
      callback(false, 403, 'Forbidden');
    }
  }
});

// Middleware
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Create necessary directories
const createDirectories = () => {
  const dirs = ['../servers', './uploads', './logs'];
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createDirectories();

// WebSocket connections storage
const wsConnections = new Map();

// WebSocket handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);
      
      switch (data.type) {
        case 'auth':
          // Authenticate WebSocket connection
          const isValid = auth.verifyToken(data.token);
          if (isValid) {
            ws.authenticated = true;
            ws.send(JSON.stringify({ type: 'auth_success' }));
            console.log('WebSocket authentication successful');
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed' }));
            console.log('WebSocket authentication failed');
            ws.close();
          }
          break;
          
        case 'console_command':
          if (ws.authenticated && data.serverId && data.command) {
            console.log(`Sending command to server ${data.serverId}: ${data.command}`);
            mcControl.sendCommand(data.serverId, data.command);
          }
          break;
          
        case 'subscribe_console':
          if (ws.authenticated && data.serverId) {
            console.log(`Client subscribed to server ${data.serverId} console`);
            wsConnections.set(ws, data.serverId);
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    wsConnections.delete(ws);
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsConnections.delete(ws);
  });
});

// Broadcast console output to connected clients
const broadcastConsoleOutput = (serverId, output) => {
  console.log(`Broadcasting to server ${serverId}:`, output);
  wsConnections.forEach((subscribedServerId, ws) => {
    if (subscribedServerId === serverId && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'console_output',
          serverId,
          output
        }));
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        wsConnections.delete(ws);
      }
    }
  });
};

// Set broadcast function for mc_control
mcControl.setBroadcastFunction(broadcastConsoleOutput);

// API Routes
app.use('/api/auth', auth.router);
app.use('/api/servers', auth.authenticateToken, mcControl.router);
app.use('/api/files', auth.authenticateToken, fileManager.router);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    name: config.webpanelname,
    version: '1.0.0'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start server
const PORT = config.port || 8080;
server.listen(PORT, () => {
  console.log(`🚀 ${config.webpanelname} running on port ${PORT}`);
  console.log(`📱 Access panel at: http://localhost:${PORT}`);
  console.log(`👤 Default login: ${config.admin.username} / ${config.admin.password}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  mcControl.stopAllServers();
  server.close(() => {
    process.exit(0);
  });
});