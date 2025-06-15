const sequelize = require('./database');
const Server = require('../models/Server');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
async function initDatabase() {
  try {
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');

    // Migrate existing servers from files to database
    const serversDir = path.join(__dirname, '../../servers');
    if (fs.existsSync(serversDir)) {
      const serverDirs = fs.readdirSync(serversDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const serverId of serverDirs) {
        const configPath = path.join(serversDir, serverId, 'server-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          // Check if server already exists in database
          const existingServer = await Server.findByPk(serverId);
          if (!existingServer) {
            await Server.create({
              id: serverId,
              name: config.name,
              edition: config.edition,
              minRam: config.minRam,
              maxRam: config.maxRam,
              port: config.port,
              jarFile: config.jarFile,
              status: 'stopped',
              createdAt: config.created
            });
            console.log(`Migrated server: ${config.name}`);
          }
        }
      }
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

module.exports = initDatabase; 