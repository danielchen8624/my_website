import { useState, useEffect, useCallback } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';

export default function ContextMenu() {
  const { openWindow } = useOS();
  const { createFolder, createTextFile, deleteFile, copyFile, cutFile, pasteFile, clipboard, getFile } = useFileSystem();
  
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetType, setTargetType] = useState('desktop'); // 'desktop', 'file', 'folder', 'folder-background'
  const [targetId, setTargetId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('desktop');

  // Handle right-click
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    
    // Determine what was clicked
    const desktopIconElement = e.target.closest('.desktop-icon');
    const explorerItemElement = e.target.closest('.explorer-item');
    const explorerGridElement = e.target.closest('.explorer-grid');
    const windowElement = e.target.closest('.window');
    
    if (desktopIconElement) {
      // Right-clicked on a desktop icon
      const fileId = desktopIconElement.dataset.fileId;
      const file = getFile(fileId);
      
      if (file) {
        setTargetType(file.type === 'folder' ? 'folder' : 'file');
        setTargetId(fileId);
        setCurrentFolderId('desktop');
      }
    } else if (explorerItemElement) {
      // Right-clicked on an item inside an explorer window
      const fileId = explorerItemElement.dataset.fileId;
      const file = getFile(fileId);
      
      // Try to find the current folder from the window context
      const explorerGrid = explorerItemElement.closest('.explorer-grid');
      const folderId = explorerGrid?.dataset?.folderId || 'desktop';
      
      if (file) {
        setTargetType(file.type === 'folder' ? 'folder' : 'file');
        setTargetId(fileId);
        setCurrentFolderId(folderId);
      }
    } else if (explorerGridElement) {
      // Right-clicked on empty space inside an explorer window
      const folderId = explorerGridElement.dataset?.folderId || 'desktop';
      setTargetType('folder-background');
      setTargetId(null);
      setCurrentFolderId(folderId);
    } else if (e.target.closest('.desktop')) {
      setTargetType('desktop');
      setTargetId(null);
      setCurrentFolderId('desktop');
    } else {
      return; // Don't show menu for other areas
    }
    
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
  }, [getFile]);

  // Hide menu on click anywhere
  useEffect(() => {
    const handleClick = (e) => {
      // If clicked inside the menu, let the internal handlers manage it
      if (e.target.closest('.context-menu')) return;
      setIsVisible(false);
    };
    
    const handleScroll = () => setIsVisible(false);
    
    // Use capture phase to catch clicks even if stopPropagation is called (e.g., on icons)
    document.addEventListener('click', handleClick, true);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleContextMenu]);

  // Menu actions
  const handleAction = (action) => {
    switch (action) {
      case 'newFolder':
        createFolder(currentFolderId);
        break;
      case 'newTextFile':
        createTextFile(currentFolderId);
        break;
      case 'open':
        if (targetId) {
          const file = getFile(targetId);
          if (file) openWindow(targetId, file);
        }
        break;
      case 'delete':
        if (targetId) {
          deleteFile(targetId);
        }
        break;
      case 'copy':
        if (targetId) {
          copyFile(targetId);
        }
        break;
      case 'cut':
        if (targetId) {
          cutFile(targetId);
        }
        break;
      case 'paste':
        pasteFile();
        break;
      case 'rename':
        // Dispatch custom event to trigger rename mode
        if (targetId) {
          window.dispatchEvent(new CustomEvent('startRename', { detail: { fileId: targetId } }));
        }
        break;
      case 'properties':
        // Open system properties
        const propsFile = {
          id: 'properties',
          name: 'Properties',
          icon: '⚙️',
          appType: 'properties',
        };
        openWindow('properties', propsFile);
        break;
      default:
        break;
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Render different menus based on target
  const renderMenuItems = () => {
    if (targetType === 'desktop' || targetType === 'folder-background') {
      return (
        <>
          <div className="context-menu-item" onClick={() => handleAction('newFolder')}>
            <span className="context-menu-icon">📁</span>
            <span>New Folder</span>
          </div>
          <div className="context-menu-item" onClick={() => handleAction('newTextFile')}>
            <span className="context-menu-icon">📝</span>
            <span>New Text Document</span>
          </div>
          <div className="context-menu-divider" />
          {clipboard && (
            <div className="context-menu-item" onClick={() => handleAction('paste')}>
              <span className="context-menu-icon">📋</span>
              <span>Paste</span>
            </div>
          )}
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleAction('properties')}>
            <span className="context-menu-icon">⚙️</span>
            <span>Properties</span>
          </div>
        </>
      );
    }

    // File or Folder menu
    return (
      <>
        <div className="context-menu-item" onClick={() => handleAction('open')}>
          <span className="context-menu-icon">📂</span>
          <span>Open</span>
        </div>
        <div className="context-menu-divider" />
        <div className="context-menu-item" onClick={() => handleAction('cut')}>
          <span className="context-menu-icon">✂️</span>
          <span>Cut</span>
        </div>
        <div className="context-menu-item" onClick={() => handleAction('copy')}>
          <span className="context-menu-icon">📋</span>
          <span>Copy</span>
        </div>
        <div className="context-menu-divider" />
        <div className="context-menu-item" onClick={() => handleAction('rename')}>
          <span className="context-menu-icon">✏️</span>
          <span>Rename</span>
        </div>
        <div className="context-menu-item context-menu-item-danger" onClick={() => handleAction('delete')}>
          <span className="context-menu-icon">🗑️</span>
          <span>Delete</span>
        </div>
        <div className="context-menu-divider" />
        <div className="context-menu-item" onClick={() => handleAction('properties')}>
          <span className="context-menu-icon">⚙️</span>
          <span>Properties</span>
        </div>
      </>
    );
  };

  // Adjust position to keep menu on screen
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 180),
    y: Math.min(position.y, window.innerHeight - 250),
  };

  return (
    <div 
      className="context-menu"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {renderMenuItems()}
    </div>
  );
}
