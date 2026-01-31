import { useState, useEffect, useCallback } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';
import Icon from './Icon';

export default function ContextMenu() {
  const { openWindow, windows, minimizeWindow } = useOS();
  const { createFolder, createTextFile, deleteFile, copyFile, cutFile, pasteFile, clipboard, getFile, resetFileSystem } = useFileSystem();

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetType, setTargetType] = useState('desktop'); // 'desktop', 'file', 'folder', 'folder-background', 'taskbar'
  const [targetId, setTargetId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('desktop');
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  // Listen for desktop selection changes
  useEffect(() => {
    const handleDesktopSelection = (e) => {
      setSelectedFileIds(e.detail.selectedIds || []);
    };
    window.addEventListener('desktopSelection', handleDesktopSelection);
    return () => window.removeEventListener('desktopSelection', handleDesktopSelection);
  }, []);

  // Handle right-click
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();

    // Determine what was clicked
    const desktopIconElement = e.target.closest('.desktop-icon');
    const explorerItemElement = e.target.closest('.explorer-item');
    const sidebarFolderElement = e.target.closest('.sidebar-folder');
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
    } else if (sidebarFolderElement) {
      // Right-clicked on a sidebar folder
      const fileId = sidebarFolderElement.dataset.fileId;
      const file = getFile(fileId);

      if (file) {
        setTargetType(file.type === 'folder' ? 'folder' : 'file');
        setTargetId(fileId);
        // For sidebar items, the "current folder" context is the parent of the clicked folder
        // But for operations like delete/rename, we need the parent
        // Find the parent folder
        let parentId = 'desktop';
        for (const [key, f] of Object.entries(getFile('desktop') || {})) {
          // This is a simplified approach - just use desktop as context
        }
        setCurrentFolderId('desktop');
      }
    } else if (explorerGridElement) {
      // Right-clicked on empty space inside an explorer window
      const folderId = explorerGridElement.dataset?.folderId || 'desktop';
      setTargetType('folder-background');
      setTargetId(null);
      setCurrentFolderId(folderId);
    } else if (e.target.closest('.taskbar') && !e.target.closest('.start-button')) {
      setTargetType('taskbar');
      setTargetId(null);
      setCurrentFolderId('desktop');
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
        // If multiple files are selected, copy all of them
        // Use window.__selectedFileIds as source of truth for marquee selection
        const copySelection = window.__selectedFileIds || selectedFileIds || [];
        if (copySelection.length > 1 && copySelection.includes(targetId)) {
          copyFile(copySelection);
        } else if (targetId) {
          copyFile([targetId]);
        }
        break;
      case 'cut':
        // If multiple files are selected, cut all of them
        // Use window.__selectedFileIds as source of truth for marquee selection
        const cutSelection = window.__selectedFileIds || selectedFileIds || [];
        if (cutSelection.length > 1 && cutSelection.includes(targetId)) {
          cutFile(cutSelection);
        } else if (targetId) {
          cutFile([targetId]);
        }
        break;
      case 'paste':
        pasteFile(currentFolderId);
        break;
      case 'rename':
        // Dispatch custom event to trigger rename mode after a small delay
        if (targetId) {
          const fileIdToRename = targetId;
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('startRename', { detail: { fileId: fileIdToRename } }));
          }, 50);
        }
        break;
      case 'properties':
        if (targetId === 'my-computer') {
          openWindow('system-properties', {
             id: 'system-properties',
             name: 'System Properties',
             icon: 'my-computer',
             appType: 'system-properties',
             width: 400,
             height: 480,
          });
        } else if (targetType === 'desktop' || targetType === 'folder-background' || targetType === 'taskbar') {
             openWindow('display', {
              id: 'display',
              name: 'Display Properties',
              icon: 'settings',
              appType: 'properties',
            });
        } else {
             // Default file properties (placeholder)
             alert('Properties not available for this item.');
        }
        break;
      case 'refresh':
        // Force re-render by triggering a state update
        window.dispatchEvent(new CustomEvent('refreshDesktop'));
        break;
      case 'minimizeAll':
        // Minimize all open windows
        windows.forEach(w => {
          if (!w.isMinimized) {
            minimizeWindow(w.id);
          }
        });
        break;
      default:
        break;
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Render different menus based on target
  const renderMenuItems = () => {
    // Taskbar context menu
    if (targetType === 'taskbar') {
      return (
        <>
          <div className="context-menu-item" onClick={() => handleAction('minimizeAll')}>
            <span className="context-menu-icon"><Icon icon="🗕" size={16} /></span>
            <span>Minimize All Windows</span>
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleAction('properties')}>
            <span className="context-menu-icon"><Icon icon="settings" size={16} /></span>
            <span>Properties</span>
          </div>
        </>
      );
    }

    // Desktop and folder background context menu
    if (targetType === 'desktop' || targetType === 'folder-background') {
      return (
        <>
          <div className="context-menu-item" onClick={() => handleAction('newFolder')}>
            <span className="context-menu-icon"><Icon icon="folder" size={16} /></span>
            <span>New Folder</span>
          </div>
          <div className="context-menu-item" onClick={() => handleAction('newTextFile')}>
            <span className="context-menu-icon"><Icon icon="notepad" size={16} /></span>
            <span>New Text Document</span>
          </div>
          <div className="context-menu-divider" />
          {clipboard && (
            <div className="context-menu-item" onClick={() => handleAction('paste')}>
              <span className="context-menu-icon"><Icon icon="📋" size={16} /></span>
              <span>Paste</span>
            </div>
          )}
          <div className="context-menu-item" onClick={() => handleAction('refresh')}>
            <span className="context-menu-icon"><Icon icon="directory_open" size={16} /></span>
            <span>Refresh</span>
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleAction('properties')}>
            <span className="context-menu-icon"><Icon icon="settings" size={16} /></span>
            <span>Properties</span>
          </div>
        </>
      );
    }

    // File or Folder menu
    const targetFile = targetId ? getFile(targetId) : null;
    const isSystemFile = targetFile?.type === 'system';
    const isDrive = targetFile?.type === 'drive';
    
    return (
      <>
        <div className="context-menu-item" onClick={() => handleAction('open')}>
          <span className="context-menu-icon"><Icon icon="folder" size={16} /></span>
          <span>Open</span>
        </div>
        {!isSystemFile && !isDrive && (
          <>
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={() => handleAction('cut')}>
              <span className="context-menu-icon"><Icon icon="✂️" size={16} /></span>
              <span>Cut</span>
            </div>
            <div className="context-menu-item" onClick={() => handleAction('copy')}>
              <span className="context-menu-icon"><Icon icon="📋" size={16} /></span>
              <span>Copy</span>
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={() => handleAction('rename')}>
              <span className="context-menu-icon"><Icon icon="note" size={16} /></span>
              <span>Rename</span>
            </div>
            <div className="context-menu-item context-menu-item-danger" onClick={() => handleAction('delete')}>
              <span className="context-menu-icon"><Icon icon="trash" size={16} /></span>
              <span>Delete</span>
            </div>
          </>
        )}
        <div className="context-menu-divider" />
        <div className="context-menu-item" onClick={() => handleAction('properties')}>
          <span className="context-menu-icon"><Icon icon="settings" size={16} /></span>
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
        zIndex: 9999,
      }}
    >
      {renderMenuItems()}
    </div>
  );
}
