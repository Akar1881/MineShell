const { Sequelize } = require('sequelize');
const path = require('path');
const YAML = require('yamljs');
const fs = require('fs');

// Load environment variables if not already loaded
if (!process.env.ADMIN_USER) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

// Load configuration and process environment variables
let configContent = fs.readFileSync(path.join(__dirname, '../../config.yaml'), 'utf8');

// Replace environment variables in the format ${VAR_NAME} with their values
configContent = configContent.replace(/\${([^}]+)}/g, (match, varName) => {
  return process.env[varName] || match; // Return the env var value or keep the placeholder if not found
});

const config = YAML.parse(configContent);

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/mineshell.db'),
  logging: false
});

// Import models
const Server = require('./Server');

// Initialize models
const models = {
  Server: Server(sequelize)
};

// Export models and sequelize instance
module.exports = {
  sequelize,
  Server: models.Server
}; 