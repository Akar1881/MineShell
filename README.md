# MineShell 1.0.0

A modern web-based Minecraft server management panel.

## Features

- Web-based interface for managing Minecraft servers
- Real-time console output
- File management
- Server configuration
- Multiple server support
- Cross-platform (Windows & Linux)
- SQLite database for reliable server metadata storage
- Automatic EULA acceptance
- Server status tracking and history

## Requirements

- Node.js 16 or higher
- Java 17 or higher
- npm (comes with Node.js)
- SQLite3 (comes with Node.js)

## Quick Installation

### Windows
1. Download and install [Node.js](https://nodejs.org/)
2. Download and install [Java](https://adoptium.net/)
3. Run `install.bat`
4. Run `start.bat` to start the panel

### Linux
1. Install Node.js and Java:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm openjdk-17-jdk

# CentOS/RHEL
sudo yum install nodejs npm java-17-openjdk
```
2. Make scripts executable:
```bash
chmod +x install.sh start.sh
```
3. Run `./install.sh`
4. Run `./start.sh` to start the panel

## Configuration

### Environment Variables

MineShell uses environment variables for sensitive configuration. Copy the `example.env` file to `.env` and modify as needed:

```bash
# Copy example environment file
cp example.env .env

# Edit the .env file with your secure values
nano .env  # or use any text editor
```

Example `.env` file:
```
# Admin Credentials
ADMIN_USER=admin
ADMIN_PASS=mineshell123

# Security
JWT_SECRET=change_this_to_a_secure_random_string_at_least_32_chars_long
```

### Main Configuration

Edit `config.yaml` to configure:

```yaml
# Server Configuration
server:
  backend:
    port: 3000
    host: "0.0.0.0"  # Change to your domain or IP for production
  frontend:
    port: 8080
    host: "0.0.0.0"  # Change to your domain or IP for production

# API Configuration
api:
  base_url: "http://localhost:3000"  # Change to your domain or IP for production
  ws_url: "ws://localhost:3000"      # Change to your domain or IP for production

# Minecraft Server Defaults
minecraft:
  default_port: 25565
  min_ram: "1G"
  max_ram: "2G"
```

## Data Storage

MineShell uses SQLite for storing server metadata and configuration. The database file is located at:
```
data/mineshell.db
```

Server files (worlds, JAR files, etc.) are stored in:
```
servers/<server-id>/
```

## Default Access

The panel will be available at:
- Backend: http://localhost:3000 (or your configured port)
- Frontend: http://localhost:8080 (or your configured port)

## Security Notes

- Change default credentials in the `.env` file
- Use a strong, unique JWT secret in the `.env` file
- Never commit your `.env` file to version control
- Use HTTPS in production
- Keep your database file secure
- Regularly backup your database and server files

## Development

### Project Structure
```
mineshell/
├── backend/           # Backend server code
│   ├── config/       # Configuration files
│   ├── models/       # Database models
│   └── ...
├── frontend/         # Frontend React application
├── data/            # SQLite database
├── servers/         # Minecraft server files
└── config.yaml      # Main configuration file
```

### Database Schema
The main server table includes:
- Server ID
- Name
- Edition (Java/Bedrock)
- RAM settings
- Port
- Status
- Start/Stop timestamps
- Creation/Update timestamps

## Support

For issues and feature requests, please use the GitHub issue tracker.

## License

MIT License

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