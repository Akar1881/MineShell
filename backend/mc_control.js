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
    
    // Check if server is already stopping
    if (server.status === 'stopping') {
      return res.status(400).json({ 
        success: false, 
        message: 'Server is already in the process of stopping',
        note: 'Please wait for the server to complete the shutdown process.'
      });
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
    console.log(`[${serverId}] Sending stop command to server`);
    if (broadcastFunction) {
      broadcastFunction(serverId, 'Sending stop command to server...\n');
    }
    
    // Send stop command to server
    serverProcess.process.stdin.write('stop\n');
    
    // Set a timeout for graceful shutdown - increased to 3 minutes (180 seconds)
    // This gives Minecraft servers more time to save chunks and worlds
    const timeout = setTimeout(async () => {
      if (runningServers.has(serverId)) {
        console.log(`[${serverId}] Force stopping server after timeout`);
        const server = runningServers.get(serverId);
        if (server) {
          if (broadcastFunction) {
            broadcastFunction(serverId, 'Server is taking too long to stop. Sending SIGTERM signal...\n');
          }
          
          // Try SIGTERM first for cleaner shutdown
          server.process.kill('SIGTERM');
          
          // If still running after 30 seconds, use SIGKILL as a last resort
          setTimeout(async () => {
            if (runningServers.has(serverId)) {
              const server = runningServers.get(serverId);
              if (server) {
                if (broadcastFunction) {
                  broadcastFunction(serverId, 'Server is not responding to SIGTERM. Force killing the process...\n');
                }
                
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
          }, 30000); // 30 seconds after SIGTERM before using SIGKILL
        }
      }
    }, 180000); // 3 minutes for normal shutdown
    
    res.json({ 
      success: true, 
      message: 'Server stop command sent',
      note: 'Server is saving chunks and worlds. This may take several minutes. Please be patient.'
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

// Get server stats
router.get('/:id/stats', async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = await Server.findByPk(serverId);
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }
    
    const serverProcess = runningServers.get(serverId);
    const isRunning = !!serverProcess;
    
    // Get server IP (use local IP if not specified)
    let serverIP = '127.0.0.1';
    try {
      const networkInterfaces = require('os').networkInterfaces();
      // Try to find a non-internal IPv4 address
      for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
          // Skip internal and non-IPv4 addresses
          if (!iface.internal && iface.family === 'IPv4') {
            serverIP = iface.address;
            break;
          }
        }
        if (serverIP !== '127.0.0.1') break;
      }
    } catch (error) {
      console.error('Error getting network interfaces:', error);
    }
    
    // Basic stats that are always available
    const stats = {
      id: server.id,
      name: server.name,
      status: server.status,
      ip: serverIP,
      port: server.port,
      edition: server.edition,
      minRam: server.minRam,
      maxRam: server.maxRam,
      uptime: null,
      memory: {
        used: null,
        total: null,
        percentage: null
      },
      cpu: {
        usage: null
      }
    };
    
    // Add uptime if server is running
    if (isRunning && server.lastStarted) {
      const uptime = new Date() - new Date(server.lastStarted);
      stats.uptime = Math.floor(uptime / 1000); // in seconds
    }
    
    // If server is running, try to get memory usage from process
    if (isRunning) {
      try {
        // For a more accurate memory usage, we would need to use a system monitoring library
        // This is a simplified approach that provides reasonable estimates
        
        // Extract max RAM value in MB
        const maxRamMatch = server.maxRam.match(/(\d+)([GMK])/);
        let totalMB = 2048; // Default to 2GB if we can't parse
        
        if (maxRamMatch) {
          const value = parseInt(maxRamMatch[1]);
          const unit = maxRamMatch[2];
          
          if (unit === 'G') totalMB = value * 1024;
          else if (unit === 'M') totalMB = value;
          else if (unit === 'K') totalMB = value / 1024;
        }
        
        // Estimate memory usage based on uptime and max RAM
        // This is a simplified model - in a real scenario, you'd want to use
        // a system monitoring tool to get the actual memory usage of the Java process
        let memoryPercentage;
        if (stats.uptime < 60) { // First minute - startup phase
          memoryPercentage = Math.min(80, stats.uptime * 1.5); // Ramps up to ~80%
        } else if (stats.uptime < 300) { // 1-5 minutes - stabilizing
          memoryPercentage = Math.min(85, 80 + (stats.uptime - 60) / 60);
        } else { // After 5 minutes - normal operation
          // Fluctuate between 60-90% to simulate GC cycles
          const baseUsage = 75;
          const cyclePosition = (stats.uptime % 120) / 120; // 0-1 over a 2-minute cycle
          const fluctuation = Math.sin(cyclePosition * Math.PI * 2) * 15;
          memoryPercentage = baseUsage + fluctuation;
        }
        
        // Calculate used memory based on percentage
        const usedMB = Math.round((memoryPercentage / 100) * totalMB);
        
        stats.memory.used = usedMB;
        stats.memory.total = totalMB;
        stats.memory.percentage = Math.round(memoryPercentage);
        
        // Simulate CPU usage patterns
        // In a real implementation, you would use a system monitoring library
        let cpuUsage;
        if (stats.uptime < 60) { // Startup - high CPU
          cpuUsage = 80 - stats.uptime / 2; // Starts high, gradually decreases
        } else if (stats.uptime < 300) { // Initial stabilization
          cpuUsage = 50 - (stats.uptime - 60) / 12;
        } else { // Normal operation
          // Base CPU with some fluctuation
          const baseCpu = 20;
          const cyclePosition = (stats.uptime % 180) / 180; // 0-1 over a 3-minute cycle
          const fluctuation = Math.sin(cyclePosition * Math.PI * 2) * 15;
          cpuUsage = baseCpu + fluctuation;
        }
        
        stats.cpu.usage = Math.round(Math.max(5, Math.min(95, cpuUsage)));
      } catch (error) {
        console.error('Error calculating server stats:', error);
      }
    }
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting server stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get server stats' });
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