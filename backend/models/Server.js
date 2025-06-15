const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Server = sequelize.define('Server', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  edition: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['java', 'bedrock']]
    }
  },
  minRam: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1G'
  },
  maxRam: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '2G'
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1024,
      max: 65535
    }
  },
  jarFile: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'server.jar'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'stopped',
    validate: {
      isIn: [['running', 'stopped', 'starting', 'stopping']]
    }
  },
  lastStarted: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastStopped: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Server; 