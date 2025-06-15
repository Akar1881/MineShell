const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const YAML = require('yamljs');
const initDatabase = require('./config/init-db');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import modules
const auth = require('./auth');
const mcControl = require('./mc_control');
const fileManager = require('./file_manager');

// Load configuration and process environment variables
let configContent = fs.readFileSync(path.join(__dirname, '../config.yaml'), 'utf8');

// Replace environment variables in the format ${VAR_NAME} with their values
configContent = configContent.replace(/\${([^}]+)}/g, (match, varName) => {
  return process.env[varName] || match; // Return the env var value or keep the placeholder if not found
});

const config = YAML.parse(configContent);

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  verifyClient: (info, callback) => {
    const origin = info.origin || info.req.headers.origin;
    console.log('WebSocket connection attempt from origin:', origin);
    const allowedOrigins = [
      `http://${config.server.frontend.host}:${config.server.frontend.port}`,
      `http://${config.server.backend.host}:${config.server.backend.port}`
    ];
    if (allowedOrigins.includes(origin)) {
      callback(true);
    } else {
      console.log('WebSocket connection rejected from origin:', origin);
      callback(false, 403, 'Forbidden');
    }
  }
});

// Middleware
app.use(compression());
app.use(cors({
  origin: [
    `http://${config.server.frontend.host}:${config.server.frontend.port}`,
    `http://${config.server.backend.host}:${config.server.backend.port}`
  ],
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

// SSE connections storage
const sseConnections = new Map();

// Store console output buffer for each server
const serverOutputs = new Map();
const MAX_BUFFER_SIZE = 1000; // Keep last 1000 messages

// WebSocket handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established from:', req.socket.remoteAddress);
  
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
            console.log('WebSocket authentication successful');
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } else {
            console.log('WebSocket authentication failed');
            ws.send(JSON.stringify({ type: 'auth_failed' }));
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
  
  ws.on('close', (code, reason) => {
    console.log('WebSocket connection closed:', code, reason);
    wsConnections.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsConnections.delete(ws);
  });
});

// SSE endpoint for console streaming
app.get('/api/servers/:serverId/console/stream', (req, res) => {
  console.log('SSE connection attempt from:', req.headers.origin);
  console.log('Server ID:', req.params.serverId);
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  const connectMessage = JSON.stringify({ type: 'connected' });
  console.log('Sending connection message:', connectMessage);
  res.write(`data: ${connectMessage}\n\n`);

  // Store the connection
  const clientId = Date.now().toString();
  const serverId = req.params.serverId;
  console.log('New SSE connection established:', clientId, 'for server:', serverId);
  sseConnections.set(clientId, { res, serverId });

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected:', clientId);
    sseConnections.delete(clientId);
  });
});

// Get latest console output
app.get('/api/servers/:serverId/console/latest', auth.authenticateToken, (req, res) => {
  const { serverId } = req.params;
  const outputs = serverOutputs.get(serverId) || [];
  res.json({ outputs }); // Send all buffered messages
});

// Console command endpoint
app.post('/api/servers/:serverId/console/command', auth.authenticateToken, async (req, res) => {
  const { serverId } = req.params;
  const { command } = req.body;

  try {
    await mcControl.sendCommand(serverId, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// Broadcast console output to connected clients
const broadcastConsoleOutput = (serverId, output) => {
  console.log(`Broadcasting to server ${serverId}:`, output);
  
  // Store the output in buffer
  if (!serverOutputs.has(serverId)) {
    serverOutputs.set(serverId, []);
  }
  
  const outputs = serverOutputs.get(serverId);
  outputs.push(output);
  
  // Keep buffer size limited
  if (outputs.length > MAX_BUFFER_SIZE) {
    outputs.shift(); // Remove oldest message
  }
  
  // Also broadcast to SSE clients if any
  let sentCount = 0;
  sseConnections.forEach((connection, clientId) => {
    if (connection.serverId === serverId) {
      try {
        const message = JSON.stringify({
          type: 'console_output',
          output: output + '\n'
        });
        connection.res.write(`data: ${message}\n\n`);
        sentCount++;
      } catch (error) {
        console.error('Error broadcasting to client:', clientId, error);
        sseConnections.delete(clientId);
      }
    }
  });
  
  console.log(`Broadcast complete. Sent to ${sentCount} clients.`);
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
const PORT = config.server.backend.port;
const HOST = config.server.backend.host;
server.listen(PORT, HOST, () => {
  console.log(`🚀 MineShell running on ${HOST}:${PORT}`);
  console.log(`📱 Access panel at: http://${config.server.frontend.host}:${config.server.frontend.port}`);
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