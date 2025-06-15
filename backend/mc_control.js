const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const Server = require('./models/Server');

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
router.get('/', async (req, res) => {
  try {
    const servers = await Server.findAll();
    const serversWithStatus = servers.map(server => ({
      ...server.toJSON(),
      status: runningServers.has(server.id) ? 'running' : server.status
    }));
    
    res.json({ success: true, servers: serversWithStatus });
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
    const existingServer = await Server.findByPk(serverId);
    if (existingServer) {
      return res.status(400).json({ success: false, message: 'Server already exists' });
    }
    
    // Create server directory
    fs.mkdirSync(serverDir, { recursive: true });
    
    // Create server in database
    const server = await Server.create({
      id: serverId,
      name,
      edition,
      minRam: minRam || '1G',
      maxRam: maxRam || '2G',
      port: parseInt(port),
      jarFile: jarFile || 'server.jar',
      status: 'stopped'
    });
    
    // Create basic server.properties
    const serverPropsPath = path.join(serverDir, 'server.properties');
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

    // Create eula.txt
    const eulaPath = path.join(serverDir, 'eula.txt');
    const eulaContent = `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
#Generated for MineShell
eula=true`;
    fs.writeFileSync(eulaPath, eulaContent, 'utf8');
    
    res.json({
      success: true,
      message: 'Server created successfully',
      server: { ...server.toJSON(), status: 'stopped' }
    });
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ success: false, message: 'Failed to create server' });
  }
});

// Start server
router.post('/:id/start', async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = await Server.findByPk(serverId);
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }
    
    if (runningServers.has(serverId)) {
      return res.status(400).json({ success: false, message: 'Server is already running' });
    }
    
    const serverDir = path.join(__dirname, '../servers', serverId);
    const jarPath = path.join(serverDir, server.jarFile);
    
    if (!fs.existsSync(jarPath)) {
      return res.status(400).json({ success: false, message: 'Server JAR file not found' });
    }
    
    // Update server status
    await server.update({ 
      status: 'starting',
      lastStarted: new Date()
    });
    
    // Start the server process
    const javaArgs = [
      `-Xms${server.minRam}`,
      `-Xmx${server.maxRam}`,
      '-jar',
      server.jarFile,
      'nogui'
    ];
    
    const serverProcess = spawn('java', javaArgs, {
      cwd: serverDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store the process
    runningServers.set(serverId, {
      process: serverProcess,
      config: server
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
    
    serverProcess.on('close', async (code) => {
      console.log(`[${serverId}] Server process exited with code ${code}`);
      runningServers.delete(serverId);
      
      // Update server status
      await server.update({ 
        status: 'stopped',
        lastStopped: new Date()
      });
      
      if (broadcastFunction) {
        broadcastFunction(serverId, `Server stopped with exit code ${code}\n`);
      }
    });
    
    // Update server status to running after a short delay
    setTimeout(async () => {
      if (runningServers.has(serverId)) {
        await server.update({ status: 'running' });
      }
    }, 5000);
    
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
    const server = await Server.findByPk(serverId);
    const serverProcess = runningServers.get(serverId);
    const forceStop = req.query.force === 'true';
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }
    
    if (!serverProcess) {
      return res.status(400).json({ success: false, message: 'Server is not running' });
    }
    
    // Update server status
    await server.update({ status: 'stopping' });
    
    if (forceStop) {
      // Force stop - kill immediately
      serverProcess.process.kill('SIGKILL');
      runningServers.delete(serverId);
      await server.update({ 
        status: 'stopped',
        lastStopped: new Date()
      });
      if (broadcastFunction) {
        broadcastFunction(serverId, 'Server force stopped\n');
      }
      return res.json({ success: true, message: 'Server force stopped' });
    }
    
    // Normal stop - try graceful shutdown first
    serverProcess.process.stdin.write('stop\n');
    
    // Set a timeout for graceful shutdown
    const timeout = setTimeout(async () => {
      if (runningServers.has(serverId)) {
        console.log(`[${serverId}] Force stopping server after timeout`);
        const server = runningServers.get(serverId);
        if (server) {
          // Try SIGTERM first for cleaner shutdown
          server.process.kill('SIGTERM');
          
          // If still running after 5 seconds, use SIGKILL
          setTimeout(async () => {
            if (runningServers.has(serverId)) {
              const server = runningServers.get(serverId);
              if (server) {
                server.process.kill('SIGKILL');
                runningServers.delete(serverId);
                await Server.update(
                  { 
                    status: 'stopped',
                    lastStopped: new Date()
                  },
                  { where: { id: serverId } }
                );
                if (broadcastFunction) {
                  broadcastFunction(serverId, 'Server force killed\n');
                }
              }
            }
          }, 5000);
        }
      }
    }, 30000); // 30 seconds for normal shutdown
    
    res.json({ 
      success: true, 
      message: 'Server stop command sent',
      note: 'Server is saving chunks and worlds. This may take a few minutes.'
    });
  } catch (error) {
    console.error('Error stopping server:', error);
    res.status(500).json({ success: false, message: 'Failed to stop server' });
  }
});

// Delete server
router.delete('/:id', async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = await Server.findByPk(serverId);
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }
    
    // Stop server if running
    if (runningServers.has(serverId)) {
      const serverData = runningServers.get(serverId);
      serverData.process.kill('SIGTERM');
      runningServers.delete(serverId);
    }
    
    // Delete server directory
    const serverDir = path.join(__dirname, '../servers', serverId);
    if (fs.existsSync(serverDir)) {
      fs.rmSync(serverDir, { recursive: true, force: true });
    }
    
    // Delete from database
    await server.destroy();
    
    res.json({ success: true, message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({ success: false, message: 'Failed to delete server' });
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

module.exports = {
  router,
  setBroadcastFunction,
  sendCommand
};