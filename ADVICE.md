# MineShell - Project Advice & Known Issues

## 🚨 Critical Setup Requirements

### 1. Java Installation
**REQUIRED**: Java must be installed and accessible via command line
```bash
# Test Java installation
java -version
```
- **Windows**: Install Oracle JDK or OpenJDK, ensure `java` is in PATH
- **Linux**: `sudo apt install openjdk-17-jdk` or similar
- **Without Java**: Servers will fail to start with "java command not found"

### 2. Port Configuration
- Default panel port: `8080`
- Minecraft servers need unique ports (default: `25565`)
- **Firewall**: Open required ports on your system/VPS
- **VPS**: Configure security groups/firewall rules

### 3. File Permissions (Linux/VPS)
```bash
# Ensure proper permissions
chmod +x install.sh
chmod -R 755 servers/
```

## ⚠️ Known Issues & Limitations

### Backend Issues

#### 1. Server Process Management
- **Issue**: Server processes may not terminate gracefully
- **Impact**: Zombie processes, port conflicts
- **Workaround**: Manual process killing may be required
```bash
# Find and kill stuck processes
ps aux | grep java
kill -9 <process_id>
```

#### 2. File Upload Limitations
- **Current Limit**: 500MB per file
- **Issue**: Large modpacks may fail to upload
- **Solution**: Increase limit in `backend/file_manager.js`:
```javascript
const upload = multer({ 
  storage,
  limits: { fileSize: 2000 * 1024 * 1024 } // 2GB
});
```

#### 3. WebSocket Connection Issues
- **Issue**: WebSocket may disconnect on network changes
- **Impact**: Console output stops updating
- **Workaround**: Refresh page to reconnect

#### 4. Concurrent Server Operations
- **Issue**: Starting multiple servers simultaneously may cause conflicts
- **Impact**: Servers may fail to start
- **Workaround**: Start servers one at a time

### Frontend Issues

#### 1. Mobile File Manager
- **Issue**: Large file lists may cause performance issues
- **Impact**: Slow scrolling, UI lag
- **Workaround**: Implement pagination (not currently implemented)

#### 2. Console Buffer Overflow
- **Issue**: Long-running servers generate massive console output
- **Impact**: Memory usage increases, browser may slow down
- **Workaround**: Clear console regularly, implement output limiting

#### 3. Real-time Updates
- **Issue**: Server status may not update immediately
- **Impact**: UI shows incorrect server state
- **Workaround**: Manual page refresh

## 🔧 Missing Features (Not Implemented)

### 1. Server Backup System
```javascript
// TODO: Implement in backend/mc_control.js
router.post('/:id/backup', (req, res) => {
  // Create server backup
  // Compress server directory
  // Store with timestamp
});
```

### 2. Plugin Management
- No plugin upload/management interface
- No automatic plugin dependency resolution
- Manual file management required

### 3. Server Templates
- No pre-configured server templates
- Each server must be configured manually
- No bulk server creation

### 4. User Management
- Only single admin account supported
- No multi-user permissions
- No user roles or restrictions

### 5. Server Monitoring
- No resource usage monitoring (CPU, RAM, disk)
- No player count tracking
- No performance metrics

### 6. Scheduled Tasks
- No automatic backups
- No scheduled restarts
- No maintenance windows

### 7. Log Management
- No log rotation
- No log archiving
- Console output not persisted

## 🛠 Production Deployment Issues

### 1. Process Management
**Issue**: No process manager (PM2, systemd)
```bash
# Recommended: Use PM2 for production
npm install -g pm2
pm2 start backend/server.js --name mineshell
pm2 startup
pm2 save
```

### 2. Reverse Proxy
**Issue**: No HTTPS/SSL support built-in
```nginx
# Recommended: Nginx reverse proxy
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Database Storage
**Issue**: Currently uses JSON files for server configs
- **Problem**: Not suitable for high-concurrency
- **Solution**: Implement SQLite or PostgreSQL

### 4. Security Hardening
**Missing**:
- Rate limiting
- CSRF protection
- Input sanitization improvements
- File upload virus scanning

## 🔍 Debugging Common Issues

### Server Won't Start
1. Check Java installation: `java -version`
2. Verify JAR file exists in server directory
3. Check port availability: `netstat -tulpn | grep :25565`
4. Review console output for errors
5. Check file permissions

### Console Not Working
1. Verify WebSocket connection in browser dev tools
2. Check authentication token validity
3. Restart backend server
4. Clear browser cache

### File Manager Issues
1. Check file permissions on server directories
2. Verify path security (no directory traversal)
3. Check disk space availability
4. Review upload file size limits

### Performance Issues
1. Monitor server resource usage
2. Check for memory leaks in long-running processes
3. Clear console output regularly
4. Restart services periodically

## 📋 Recommended Improvements

### High Priority
1. **Process Management**: Implement proper server lifecycle management
2. **Error Handling**: Add comprehensive error handling and logging
3. **Security**: Implement rate limiting and additional security measures
4. **Performance**: Add output buffering and memory management

### Medium Priority
1. **Backup System**: Automated server backups
2. **Monitoring**: Resource usage tracking
3. **Templates**: Pre-configured server templates
4. **Logs**: Persistent log storage and rotation

### Low Priority
1. **Multi-user**: User management system
2. **Themes**: Additional UI themes
3. **Plugins**: Plugin management interface
4. **API**: REST API for external integrations

## 🚀 Quick Fixes

### Increase File Upload Limit
```javascript
// In backend/file_manager.js
const upload = multer({ 
  storage,
  limits: { fileSize: 1000 * 1024 * 1024 } // 1GB
});
```

### Add Process Cleanup
```javascript
// In backend/mc_control.js
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  stopAllServers();
  process.exit(0);
});
```

### Improve Error Messages
```javascript
// Add to all API endpoints
.catch(error => {
  console.error('Detailed error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Operation failed',
    details: error.message 
  });
});
```

## 📞 Support & Troubleshooting

### Log Locations
- Backend logs: Console output
- Server logs: `servers/{server-id}/logs/`
- System logs: Check system journal/event viewer

### Common Commands
```bash
# Check running processes
ps aux | grep node
ps aux | grep java

# Check port usage
netstat -tulpn | grep :8080
netstat -tulpn | grep :25565

# Check disk space
df -h

# Check memory usage
free -h
```

### Emergency Recovery
```bash
# Kill all Java processes (DANGEROUS)
pkill -f java

# Restart MineShell
cd mineshell
npm start

# Reset admin password
# Edit backend/config.yaml and restart
```

---

**Remember**: This is a development/hobby project. For production use, implement proper monitoring, backups, and security measures.