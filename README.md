# MineShell - Minecraft Server Management Panel

A modern, mobile-first Minecraft server management panel built with Node.js and React. Designed to be lightweight, easy to setup, and focused specifically on Minecraft server management.

## ✨ Features

- 🔐 **Simple Authentication** - Single admin login with configurable credentials
- 🌐 **Mobile-First Design** - Responsive UI that works great on phones and tablets
- 🛠 **Server Management** - Create, start, stop, and delete Minecraft servers
- 📂 **File Manager** - Full file management with upload, edit, and download capabilities
- 🖥 **Real-time Console** - WebSocket-powered console with command execution
- ⚡ **Easy Setup** - One-command installation for Windows and Linux
- 🎨 **Dark Theme** - Modern dark UI optimized for long usage sessions

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Java (for running Minecraft servers)

### Installation

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
install.bat
```

### Running

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Access the panel at: `http://localhost:8080`

Default login: `admin` / `mineshell123`

## 📁 Project Structure

```
mineshell/
├── backend/                 # Node.js backend
│   ├── server.js           # Main server file
│   ├── auth.js             # Authentication handling
│   ├── mc_control.js       # Minecraft server control
│   ├── file_manager.js     # File management API
│   └── config.yaml         # Configuration file
├── frontend/               # React frontend
│   └── src/
│       ├── components/     # React components
│       ├── contexts/       # React contexts
│       └── ...
├── servers/                # Minecraft server instances (auto-created)
├── install.sh              # Linux installation script
├── install.bat             # Windows installation script
└── README.md
```

## ⚙️ Configuration

Edit `backend/config.yaml` to customize:

- Web panel name and port
- Admin credentials
- Trusted IPs for auto-login
- Default server settings
- File upload limits

## 🎮 Server Setup Workflow

1. **Login** to the admin panel
2. **Create** a new server instance with:
   - Server name
   - Edition (Java/Bedrock)
   - RAM allocation
   - Port number
   - JAR file name
3. **Upload** your server JAR file using the file manager
4. **Start** the server from the dashboard
5. **Manage** via console and file manager

## 🔧 Supported Server Types

- **Java Edition:**
  - Paper
  - Spigot
  - Purpur
  - Vanilla
  - Custom JARs

- **Bedrock Edition:**
  - Bedrock Dedicated Server

## 📱 Mobile Features

- Touch-optimized interface
- Responsive design for all screen sizes
- Mobile-friendly file manager
- Swipe gestures support
- Optimized console for mobile typing

## 🛡️ Security Features

- JWT-based authentication
- Path traversal protection
- File type restrictions
- Port conflict prevention
- Secure file operations

## 🔌 API Endpoints

- `POST /api/auth/login` - Admin login
- `GET /api/servers` - List all servers
- `POST /api/servers` - Create new server
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server
- `DELETE /api/servers/:id` - Delete server
- `GET /api/files/:serverId` - File manager operations
- WebSocket for real-time console

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check the console logs for error details
- Ensure Java is installed and accessible
- Verify server JAR files are uploaded correctly
- Check port availability before creating servers

## 🔄 Updates

To update MineShell:

1. Backup your `servers/` directory and `backend/config.yaml`
2. Pull the latest changes
3. Run the installation script again
4. Restore your configuration and servers

---

**MineShell** - Simple, powerful Minecraft server management for everyone! 🎮