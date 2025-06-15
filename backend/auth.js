const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

// Load environment variables if not already loaded
if (!process.env.ADMIN_USER) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

// Load configuration and process environment variables
let configContent = fs.readFileSync(path.join(__dirname, '../config.yaml'), 'utf8');

// Replace environment variables in the format ${VAR_NAME} with their values
configContent = configContent.replace(/\${([^}]+)}/g, (match, varName) => {
  return process.env[varName] || match; // Return the env var value or keep the placeholder if not found
});

const config = YAML.parse(configContent);
const router = express.Router();

// Hash the admin password on startup
const adminPasswordHash = bcrypt.hashSync(config.admin.password, 10);

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check credentials
    if (username === config.admin.username && bcrypt.compareSync(password, adminPasswordHash)) {
      const token = jwt.sign(
        { username, role: 'admin' },
        config.jwt_secret,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: { username, role: 'admin' }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  jwt.verify(token, config.jwt_secret, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Verify token function for WebSocket
function verifyToken(token) {
  try {
    jwt.verify(token, config.jwt_secret);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  router,
  authenticateToken,
  verifyToken
};