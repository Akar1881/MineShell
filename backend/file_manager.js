const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const extractZip = require('extract-zip');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const serverId = req.params.serverId;
    const uploadPath = req.body.path || '';
    const fullPath = path.join(__dirname, '../servers', serverId, uploadPath);
    
    // Ensure directory exists
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Get file tree for server
router.get('/:serverId', (req, res) => {
  try {
    const serverId = req.params.serverId;
    const requestedPath = req.query.path || '';
    const serverDir = path.join(__dirname, '../servers', serverId);
    const fullPath = path.join(serverDir, requestedPath);
    
    // Security check - ensure path is within server directory
    if (!fullPath.startsWith(serverDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'Path not found' });
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile()) {
      // Return file content for text files
      const ext = path.extname(fullPath).toLowerCase();
      const textExtensions = ['.txt', '.yml', '.yaml', '.json', '.properties', '.log', '.md'];
      
      if (textExtensions.includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        res.json({
          success: true,
          type: 'file',
          content,
          name: path.basename(fullPath),
          size: stats.size,
          modified: stats.mtime
        });
      } else {
        res.json({
          success: true,
          type: 'file',
          name: path.basename(fullPath),
          size: stats.size,
          modified: stats.mtime,
          binary: true
        });
      }
    } else {
      // Return directory listing
      const items = fs.readdirSync(fullPath).map(item => {
        const itemPath = path.join(fullPath, item);
        const itemStats = fs.statSync(itemPath);
        
        return {
          name: item,
          type: itemStats.isDirectory() ? 'directory' : 'file',
          size: itemStats.size,
          modified: itemStats.mtime,
          path: path.join(requestedPath, item).replace(/\\/g, '/')
        };
      });
      
      res.json({
        success: true,
        type: 'directory',
        items,
        path: requestedPath
      });
    }
  } catch (error) {
    console.error('Error reading file/directory:', error);
    res.status(500).json({ success: false, message: 'Failed to read file/directory' });
  }
});

// Save file content
router.put('/:serverId', (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { path: filePath, content } = req.body;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const fullPath = path.join(serverDir, filePath);
    
    // Security check
    if (!fullPath.startsWith(serverDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    
    res.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, message: 'Failed to save file' });
  }
});

// Upload file
router.post('/:serverId/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: req.file.filename,
        size: req.file.size,
        path: req.body.path || ''
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// Create directory
router.post('/:serverId/mkdir', (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { path: dirPath, name } = req.body;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const fullPath = path.join(serverDir, dirPath, name);
    
    // Security check
    if (!fullPath.startsWith(serverDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    fs.mkdirSync(fullPath, { recursive: true });
    
    res.json({ success: true, message: 'Directory created successfully' });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ success: false, message: 'Failed to create directory' });
  }
});

// Rename file/directory
router.post('/:serverId/rename', (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { oldPath, newName } = req.body;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const oldFullPath = path.join(serverDir, oldPath);
    const newFullPath = path.join(path.dirname(oldFullPath), newName);
    
    // Security check
    if (!oldFullPath.startsWith(serverDir) || !newFullPath.startsWith(serverDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    fs.renameSync(oldFullPath, newFullPath);
    
    res.json({ success: true, message: 'Item renamed successfully' });
  } catch (error) {
    console.error('Error renaming item:', error);
    res.status(500).json({ success: false, message: 'Failed to rename item' });
  }
});

// Delete file/directory
router.delete('/:serverId', (req, res) => {
  try {
    const serverId = req.params.serverId;
    const filePath = req.query.path;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const fullPath = path.join(serverDir, filePath);
    
    // Security check
    if (!fullPath.startsWith(serverDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

// Create ZIP archive
router.post('/:serverId/zip', (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { paths, archiveName } = req.body;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const archivePath = path.join(serverDir, archiveName);
    
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      res.json({
        success: true,
        message: 'Archive created successfully',
        size: archive.pointer()
      });
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    paths.forEach(filePath => {
      const fullPath = path.join(serverDir, filePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          archive.directory(fullPath, path.basename(filePath));
        } else {
          archive.file(fullPath, { name: path.basename(filePath) });
        }
      }
    });
    
    archive.finalize();
  } catch (error) {
    console.error('Error creating archive:', error);
    res.status(500).json({ success: false, message: 'Failed to create archive' });
  }
});

// Extract ZIP archive
router.post('/:serverId/unzip', async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const { zipPath, extractPath } = req.body;
    const serverDir = path.join(__dirname, '../servers', serverId);
    const fullZipPath = path.join(serverDir, zipPath);
    const fullExtractPath = path.join(serverDir, extractPath || '');
    
    // Security check
    if (!fullZipPath.startsWith(serverDir) || !fullExtractPath.startsWith(serverDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    await extractZip(fullZipPath, { dir: fullExtractPath });
    
    res.json({ success: true, message: 'Archive extracted successfully' });
  } catch (error) {
    console.error('Error extracting archive:', error);
    res.status(500).json({ success: false, message: 'Failed to extract archive' });
  }
});

module.exports = { router };