import React, { useEffect, useRef } from 'react';
import { MoreVertical, Trash2, FileEdit, Download, Archive, FileUp, FolderPlus } from 'lucide-react';

const FileContextMenu = ({ 
  isOpen, 
  position, 
  onClose, 
  onDelete, 
  onRename, 
  onDownload, 
  onArchive, 
  onUpload, 
  onCreateFolder,
  isDirectory,
  isMobile,
  anchorElement
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current && anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      
      // Calculate position to ensure menu stays within viewport
      let left = rect.left - menuRect.width - 10; // 10px offset from the anchor
      let top = rect.top;
      
      // Ensure menu doesn't go off screen
      if (left < 0) {
        left = rect.right + 10; // Show on right side if not enough space on left
      }
      
      if (top + menuRect.height > window.innerHeight) {
        top = window.innerHeight - menuRect.height - 10;
      }
      
      menuRef.current.style.left = `${left}px`;
      menuRef.current.style.top = `${top}px`;
    }
  }, [isOpen, anchorElement]);

  if (!isOpen) return null;

  const menuStyle = {
    position: 'fixed',
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '0.5rem',
    minWidth: '200px'
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: '#374151',
    transition: 'background-color 0.2s',
    borderRadius: '0.25rem',
    gap: '0.5rem'
  };

  const handleClick = (action) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={onClose}
        />
      )}
      
      <div ref={menuRef} style={menuStyle} onClick={(e) => e.stopPropagation()}>
        {!isDirectory && (
          <>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onDownload)}
              className="hover:bg-gray-100"
            >
              <Download size={16} />
              <span>Download</span>
            </div>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onRename)}
              className="hover:bg-gray-100"
            >
              <FileEdit size={16} />
              <span>Rename</span>
            </div>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onArchive)}
              className="hover:bg-gray-100"
            >
              <Archive size={16} />
              <span>Archive</span>
            </div>
          </>
        )}
        
        {isDirectory && (
          <>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onUpload)}
              className="hover:bg-gray-100"
            >
              <FileUp size={16} />
              <span>Upload Here</span>
            </div>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onCreateFolder)}
              className="hover:bg-gray-100"
            >
              <FolderPlus size={16} />
              <span>New Folder</span>
            </div>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onRename)}
              className="hover:bg-gray-100"
            >
              <FileEdit size={16} />
              <span>Rename</span>
            </div>
            <div 
              style={menuItemStyle} 
              onClick={() => handleClick(onArchive)}
              className="hover:bg-gray-100"
            >
              <Archive size={16} />
              <span>Archive</span>
            </div>
          </>
        )}
        
        <div 
          style={menuItemStyle} 
          onClick={() => handleClick(onDelete)}
          className="hover:bg-red-50 text-red-600"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </div>
      </div>
    </>
  );
};

export default FileContextMenu; 