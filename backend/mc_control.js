const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const router = express.Router();
const runningServers = new Map();
let broadcastFunction = null;

// Set broadcast function for console output
const setBroadcastFunction = (fn) => {
  broadcastFunction = fn;
};

// Check if port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    server.on('error', () => resolve(true));
  });
};

// Get all servers
router.get('/', (req, res) => {
  try {
    const serversDir = path.join(__dirname, '../servers');
    if (!fs.existsSync(serversDir)) {
      fs.mkdirSync(serversDir, { recursive: true });
    }
    
    const servers = [];
    const serverDirs = fs.readdirSync(serversDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    serverDirs.forEach(serverId => {
      const configPath = path.join(serversDir, serverId, 'server-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const isRunning = runningServers.has(serverId);
        servers.push({
          ...config,
          id: serverId,
          status: isRunning ? 'running' : 'stopped'
        });
      }
    });
    
    res.json({ success: true, servers });
  } catch (error) {
    console.error('Error getting servers:', error);
    res.status(500).json({ success: false, message: 'Failed to get servers' });
  }
});

// Create new server
router.post('/', async (req, res) => {
  try {
    const { name, edition, minRam, maxRam, port, jarFile } = req.body;
    
    // Validate input
    if (!name || !edition || !port) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check if port is available
    const portInUse = await isPortInUse(parseInt(port));
    if (portInUse) {
      return res.status(400).json({ success: false, message: 'Port is already in use' });
    }
    
    // Generate server ID
    const serverId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const serverDir = path.join(__dirname, '../servers', serverId);
    
    // Check if server already exists
    if (fs.existsSync(serverDir)) {
      return res.status(400).json({ success: false, message: 'Server already exists' });
    }
    
    // Create server directory
    fs.mkdirSync(serverDir, { recursive: true });
    
    // Create server configuration
    const serverConfig = {
      name,
      edition,
      minRam: minRam || '1G',
      maxRam: maxRam || '2G',
      port: parseInt(port),
      jarFile: jarFile || 'server.jar',
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(serverDir, 'server-config.json'),
      JSON.stringify(serverConfig, null, 2)
    );
    
    // Create basic server.properties if it doesn't exist
    const serverPropsPath = path.join(serverDir, 'server.properties');
    if (!fs.existsSync(serverPropsPath)) {
      const defaultProps = `server-port=${port}
motd=A Minecraft Server
online-mode=true
max-players=20
difficulty=easy
gamemode=survival
pvp=true
spawn-protection=16
`;
      fs.writeFileSync(serverPropsPath, defaultProps);
    }
    
    res.json({
      success: true,
      message: 'Server created successfully',
      server: { ...serverConfig, id: serverId, status: 'stopped' }
    });
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ success: false, message: 'Failed to create server' });
  }
});

// Start server
router.post('/:id/start', (req, res) => {
  try {
    const serverId = req.params.id;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const configPath = path.join(serverDir, 'server-config.json');
    
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }
    
    if (runningServers.has(serverId)) {
      return res.status(400).json({ success: false, message: 'Server is already running' });
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const jarPath = path.join(serverDir, config.jarFile);
    
    if (!fs.existsSync(jarPath)) {
      return res.status(400).json({ success: false, message: 'Server JAR file not found' });
    }
    
    // Start the server process
    const javaArgs = [
      `-Xms${config.minRam}`,
      `-Xmx${config.maxRam}`,
      '-jar',
      config.jarFile,
      'nogui'
    ];
    
    // Create EULA.txt if it doesn't exist
    const eulaPath = path.join(serverDir, 'eula.txt');
    if (!fs.existsSync(eulaPath)) {
      const eulaContent = `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
#Generated for MineShell
eula=true`;
      fs.writeFileSync(eulaPath, eulaContent, 'utf8');
    }
    
    const serverProcess = spawn('java', javaArgs, {
      cwd: serverDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store the process
    runningServers.set(serverId, {
      process: serverProcess,
      config
    });
    
    // Handle process output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[${serverId}] ${output}`);
      if (broadcastFunction) {
        broadcastFunction(serverId, output);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[${serverId}] ${output}`);
      if (broadcastFunction) {
        broadcastFunction(serverId, output);
      }
    });
    
    serverProcess.on('close', (code) => {
      console.log(`[${serverId}] Server process exited with code ${code}`);
      runningServers.delete(serverId);
      if (broadcastFunction) {
        broadcastFunction(serverId, `Server stopped with exit code ${code}\n`);
      }
    });
    
    res.json({ success: true, message: 'Server started successfully' });
  } catch (error) {
    console.error('Error starting server:', error);
    res.status(500).json({ success: false, message: 'Failed to start server' });
  }
});

// Stop server
router.post('/:id/stop', async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = runningServers.get(serverId);
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server is not running' });
    }
    
    // Send stop command
    server.process.stdin.write('stop\n');
    
    // Set a timeout for graceful shutdown
    const timeout = setTimeout(() => {
      if (runningServers.has(serverId)) {
        console.log(`[${serverId}] Force stopping server after timeout`);
        server.process.kill('SIGKILL');
      }
    }, 30000); // 30 seconds timeout
    
    // Wait for process to exit
    server.process.once('close', () => {
      clearTimeout(timeout);
      runningServers.delete(serverId);
      if (broadcastFunction) {
        broadcastFunction(serverId, 'Server stopped\n');
      }
    });
    
    res.json({ success: true, message: 'Stopping server...' });
  } catch (error) {
    console.error('Error stopping server:', error);
    res.status(500).json({ success: false, message: 'Failed to stop server' });
  }
});

// Send command to server
const sendCommand = (serverId, command) => {
  if (runningServers.has(serverId)) {
    const serverData = runningServers.get(serverId);
    serverData.process.stdin.write(command + '\n');
    return true;
  }
  return false;
};

// Delete server
router.delete('/:id', (req, res) => {
  try {
    const serverId = req.params.id;
    const serverDir = path.join(__dirname, '../servers', serverId);
    
    // Stop server if running
    if (runningServers.has(serverId)) {
      const serverData = runningServers.get(serverId);
      serverData.process.kill('SIGTERM');
      runningServers.delete(serverId);
    }
    
    // Delete server directory
    if (fs.existsSync(serverDir)) {
      fs.rmSync(serverDir, { recursive: true, force: true });
    }
    
    res.json({ success: true, message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({ success: false, message: 'Failed to delete server' });
  }
});

// Stop all servers (for graceful shutdown)
const stopAllServers = () => {
  runningServers.forEach((serverData, serverId) => {
    console.log(`Stopping server: ${serverId}`);
    serverData.process.stdin.write('stop\n');
  });
};

module.exports = {
  router,
  sendCommand,
  setBroadcastFunction,
  stopAllServers
};