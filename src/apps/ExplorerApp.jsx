import { useState, useCallback, useEffect, useRef } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';
import { setSelectedFile } from '../components/KeyboardShortcuts';
import Icon from '../components/Icon';

export default function ExplorerApp({ folderId = 'desktop', windowId }) {
  const { openWindow, updateWindowTitle } = useOS();
  const {
    getFilesInFolder,
    getFile,
    moveFileToFolder,
    renameFile,
    getFilePath,
    findFileByPath,
    getFolderContents,
    findParent
  } = useFileSystem();
  
  // Current folder ID (can change via navigation)
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [selectedId, setSelectedId] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [addressValue, setAddressValue] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(['desktop', 'my-computer']);
  
  const lastClickTimeRef = useRef(0);
  const lastClickIdRef = useRef(null);
  
  const folder = getFile(currentFolderId);
  const files = getFilesInFolder(currentFolderId);

  // Sync window title with current folder
  useEffect(() => {
    if (windowId && folder) {
      updateWindowTitle(windowId, folder.name);
    }
  }, [windowId, folder, updateWindowTitle]);
  
  // Update address bar when folder changes
  useEffect(() => {
    // Special paths for system folders
    if (currentFolderId === 'my-computer') {
      setAddressValue('My Computer');
    } else if (currentFolderId === 'control-panel') {
      setAddressValue('My Computer\\Control Panel');
    } else {
      const path = getFilePath(currentFolderId);
      setAddressValue(path);
    }
  }, [currentFolderId, getFilePath]);

  // Navigation history for back button
  const [history, setHistory] = useState([folderId]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Listen for rename events
  useEffect(() => {
    const handleStartRename = (e) => {
      const targetId = e.detail.fileId;
      // Check if this file is in our folder
      if (files.some(f => f.id === targetId)) {
        const file = getFile(targetId);
        setSelectedId(targetId);
        setIsRenaming(true);
        setRenameValue(file?.name || '');
      }
    };
    
    window.addEventListener('startRename', handleStartRename);
    return () => window.removeEventListener('startRename', handleStartRename);
  }, [files, getFile]);

  // Navigate to a folder
  const navigateTo = useCallback((targetFolderId) => {
    setCurrentFolderId(targetFolderId);
    setSelectedId(null);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(targetFolderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Go back in history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentFolderId(history[historyIndex - 1]);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentFolderId(history[historyIndex + 1]);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  // Go up to parent folder
  const goUp = useCallback(() => {
    if (currentFolderId !== 'desktop') {
      // Special handling for system folders
      if (currentFolderId === 'control-panel') {
        navigateTo('my-computer'); // Go back to My Computer
      } else if (currentFolderId === 'my-computer') {
        navigateTo('desktop'); // Go back to Desktop from My Computer
      } else {
        // Find parent for regular folders
        const parent = findParent(currentFolderId);
        if (parent) {
          navigateTo(parent.id);
        } else {
          navigateTo('desktop');
        }
      }
    }
  }, [currentFolderId, navigateTo, findParent]);

  // Handle double-click to open
  const handleDoubleClick = useCallback((file) => {
    if (file.type === 'folder') {
      navigateTo(file.id);
    } else if (file.type === 'drive') {
      // Drive C: navigates to desktop (root file system) - logic per requirements
      if (file.id === 'drive-c') {
        navigateTo('desktop');
      } else if (file.id === 'drive-d') {
        alert('Please insert a disc');
      }
    } else if (file.type === 'system-folder') {
      navigateTo(file.id);
    } else if (file.type === 'system' && file.children) {
      navigateTo(file.id);
    } else {
      openWindow(file.id, file);
    }
  }, [openWindow, navigateTo]);

  // Handle single click to select, slow double-click to rename
  const handleClick = useCallback((file, e) => {
    e.stopPropagation();
    
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    const sameFile = lastClickIdRef.current === file.id;
    
    if (selectedId === file.id && sameFile && timeSinceLastClick > 500 && timeSinceLastClick < 1500) {
      // Slow double-click - start renaming (but not for system files)
      if (file.type !== 'system' && file.type !== 'drive') {
        setIsRenaming(true);
        setRenameValue(file.name);
      }
    } else {
      setSelectedId(file.id);
      setSelectedFile(file.id, currentFolderId);
    }
    
    lastClickTimeRef.current = now;
    lastClickIdRef.current = file.id;
  }, [selectedId, currentFolderId]);

  // Handle rename submit
  const handleRenameSubmit = useCallback(() => {
    if (selectedId && renameValue.trim()) {
      renameFile(selectedId, renameValue.trim());
    }
    setIsRenaming(false);
    setRenameValue('');
  }, [selectedId, renameValue, renameFile]);

  // Handle rename key press
  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue('');
    }
  }, [handleRenameSubmit]);

  // Handle address bar submit
  const handleAddressSubmit = useCallback(() => {
    const targetFile = findFileByPath(addressValue);
    if (targetFile && (targetFile.type === 'folder' || targetFile.id === 'desktop')) {
      navigateTo(targetFile.id);
    } else if (targetFile) {
      // It's a file, open it
      openWindow(targetFile.id, targetFile);
    } else {
      // Invalid path, reset to current
      setAddressValue(getFilePath(currentFolderId));
    }
    setIsEditingAddress(false);
  }, [addressValue, findFileByPath, navigateTo, openWindow, currentFolderId, getFilePath]);

  // Handle address bar key press
  const handleAddressKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAddressSubmit();
    } else if (e.key === 'Escape') {
      setAddressValue(getFilePath(currentFolderId));
      setIsEditingAddress(false);
    }
  }, [handleAddressSubmit, currentFolderId, getFilePath]);

  // Deselect when clicking empty area
  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
    if (isRenaming) {
      handleRenameSubmit();
    }
  }, [isRenaming, handleRenameSubmit]);

  // Drag and Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDropTarget(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDropTarget(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);

    const draggedFileId = window.__draggingFileId;
    if (draggedFileId && draggedFileId !== currentFolderId) {
      // Move the file into this folder
      moveFileToFolder(draggedFileId, currentFolderId);
    }
    window.__draggingFileId = null;
  }, [currentFolderId, moveFileToFolder]);

  // Handle drag start from items inside this explorer
  const handleItemDragStart = useCallback((file) => {
    window.__draggingFileId = file.id;
  }, []);

  const handleItemDragEnd = useCallback(() => {
    window.__draggingFileId = null;
  }, []);

  // Handle mouseup for desktop icon drops (they use custom drag, not HTML5)
  useEffect(() => {
    const handleMouseUp = (e) => {
      const draggedFileId = window.__draggingFileId;
      if (!draggedFileId) return;
      
      // Check if mouse is over this explorer window
      const explorerEl = document.querySelector(`[data-folder-id="${currentFolderId}"]`);
      if (!explorerEl) return;
      
      const rect = explorerEl.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        // Dropped inside this explorer!
        if (draggedFileId !== currentFolderId) {
          moveFileToFolder(draggedFileId, currentFolderId);
          window.__draggingFileId = null;
        }
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [currentFolderId, moveFileToFolder]);

  // Toggle folder expansion in sidebar
  const toggleFolderExpansion = useCallback((folderId) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  }, []);

  // Render folder tree recursively for sidebar
  const renderFolderTree = useCallback((parentId, depth = 0) => {
    const folder = getFile(parentId);
    if (!folder) return null;

    // Get navigable children (folders, system folders, drives)
    const childFolders = (folder.children || [])
      .map(id => getFile(id))
      .filter(f => f && (f.type === 'folder' || f.type === 'system-folder' || (f.type === 'system' && f.children)));

    const isExpanded = expandedFolders.includes(parentId);
    const isCurrentFolder = parentId === currentFolderId;

    // Resolve icon
    let iconKey = folder.icon;
    if (parentId === 'recycle-bin') {
      iconKey = (folder.children && folder.children.length > 0) ? 'recycle-bin-full' : 'recycle-bin-empty';
    }

    return (
      <div key={parentId}>
        <div
          className={`sidebar-folder ${isCurrentFolder ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 18 + 4}px` }}
          onClick={() => navigateTo(parentId)}
        >
          {childFolders.length > 0 && (
            <span
              className="folder-toggle"
              onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(parentId); }}
            >
              {isExpanded ? '-' : '+'}
            </span>
          )}
          {childFolders.length === 0 && <span className="folder-toggle-spacer" />}
          <span className="folder-icon"><Icon icon={iconKey} size={16} /></span>
          <span className="folder-name">{folder.name}</span>
        </div>
        
        {/* Render children only if expanded */}
        {isExpanded && childFolders.map(child => (
             renderFolderTree(child.id, depth + 1)
        ))}
      </div>
    );
  }, [getFile, expandedFolders, currentFolderId, navigateTo, toggleFolderExpansion]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div className="explorer-toolbar">
        <button 
          className="explorer-toolbar-btn" 
          onClick={goBack} 
          disabled={historyIndex === 0}
          title="Back"
        >
          <Icon icon="directory_open" size={16} style={{transform: 'scaleX(-1)'}} /> Back
        </button>
        <button 
          className="explorer-toolbar-btn" 
          onClick={goForward} 
          disabled={historyIndex >= history.length - 1}
          title="Forward"
        >
           Next <Icon icon="directory_open" size={16} />
        </button>
        <div className="vertical-separator" />
        <button 
          className="explorer-toolbar-btn" 
          onClick={goUp}
          disabled={currentFolderId === 'desktop'}
          title="Up One Level"
        >
          <Icon icon="directory_open" size={16} />
        </button>
      </div>

      {/* Address Bar */}
      <div className="explorer-address-bar">
        <span>Address:</span>
        <div style={{ flex: 1, display: 'flex', border: '1px solid #7f9db9', background: 'white' }}>
            <div style={{ padding: '2px' }}><Icon icon="folder" size={16} /></div>
            <input 
              className="explorer-address-input" 
              value={addressValue} 
              onChange={(e) => setAddressValue(e.target.value)}
              onFocus={() => setIsEditingAddress(true)}
              onBlur={handleAddressSubmit}
              onKeyDown={handleAddressKeyDown}
              style={{ border: 'none', width: '100%' }}
            />
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderTop: '1px solid #808080' }}>
        {/* Sidebar Tree */}
        <div className="explorer-sidebar">
          <div className="sidebar-header">Folders</div>
          <div className="sidebar-content">
             {/* STRICT ROOT: Desktop */}
            {renderFolderTree('desktop')}
          </div>
        </div>

        {/* File Grid */}
        <div 
          className={`explorer-content-area`} 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header row hidden for icon view 
            <div className="explorer-header-row">
                <div style={{width: '200px'}}>Name</div>
                <div style={{width: '100px'}}>Size</div>
                <div style={{flex: 1}}>Type</div>
            </div>
            */}
            
            <div 
              className={`explorer-grid ${isDropTarget ? 'drop-target' : ''}`}
              style={{ flex: 1, overflowY: 'auto' }}
              data-folder-id={currentFolderId}
              onClick={handleBackgroundClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <div style={{ padding: '16px', color: '#808080', fontStyle: 'italic' }}>
                  This folder is empty
                </div>
              ) : (
                files.map((file) => {
                    let iconKey = file.icon;
                    if (file.id === 'recycle-bin') {
                        iconKey = (file.children && file.children.length > 0) ? 'recycle-bin-full' : 'recycle-bin-empty';
                    }
                    return (
                  <div
                    key={file.id}
                    className={`explorer-item ${selectedId === file.id ? 'selected' : ''}`}
                    onClick={(e) => handleClick(file, e)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    draggable
                    onDragStart={() => handleItemDragStart(file)}
                    onDragEnd={handleItemDragEnd}
                    data-file-id={file.id}
                  >
                    <div className="explorer-item-icon">
                        <Icon icon={iconKey} size={32} />
                    </div>
                    {isRenaming && selectedId === file.id ? (
                      <input
                        type="text"
                        className="explorer-rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameSubmit}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <div className="explorer-item-label">{file.name}</div>
                    )}
                  </div>
                )})
              )}
            </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="explorer-status-bar">
        <div style={{ width: '200px' }}>{files.length} object(s)</div>
        <div style={{ flex: 1 }}></div>
        <div style={{ width: '150px' }}>My Computer</div>
      </div>
    </div>
  );
}
