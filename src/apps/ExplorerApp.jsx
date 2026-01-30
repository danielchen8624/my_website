import { useState, useCallback, useEffect, useRef } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';
import { setSelectedFile } from '../components/KeyboardShortcuts';

export default function ExplorerApp({ folderId = 'desktop' }) {
  const { openWindow } = useOS();
  const { 
    getFilesInFolder, 
    getFile, 
    moveFileToFolder, 
    renameFile, 
    getFilePath,
    findFileByPath,
    getFolderContents 
  } = useFileSystem();
  
  // Current folder ID (can change via navigation)
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [selectedId, setSelectedId] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [addressValue, setAddressValue] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(['desktop']);
  
  const lastClickTimeRef = useRef(0);
  const lastClickIdRef = useRef(null);
  
  const folder = getFile(currentFolderId);
  const files = getFilesInFolder(currentFolderId);
  
  // Update address bar when folder changes
  useEffect(() => {
    const path = getFilePath(currentFolderId);
    setAddressValue(path);
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
      // Find parent
      const file = getFile(currentFolderId);
      // Simple approach: navigate to desktop (could be enhanced)
      navigateTo('desktop');
    }
  }, [currentFolderId, getFile, navigateTo]);

  // Handle double-click to open
  const handleDoubleClick = useCallback((file) => {
    if (file.type === 'folder') {
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
      if (file.type !== 'system') {
        setIsRenaming(true);
        setRenameValue(file.name);
      }
    } else {
      setSelectedId(file.id);
      setSelectedFile(file.id, currentFolderId);
    }
    
    lastClickTimeRef.current = now;
    lastClickIdRef.current = file.id;
  }, [selectedId]);

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
    
    const childFolders = (folder.children || [])
      .map(id => getFile(id))
      .filter(f => f && (f.type === 'folder'));
    
    const isExpanded = expandedFolders.includes(parentId);
    const isCurrentFolder = parentId === currentFolderId;
    
    return (
      <div key={parentId}>
        <div 
          className={`sidebar-folder ${isCurrentFolder ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => navigateTo(parentId)}
        >
          {childFolders.length > 0 && (
            <span 
              className="folder-toggle"
              onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(parentId); }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {childFolders.length === 0 && <span className="folder-toggle-spacer" />}
          <span className="folder-icon">{folder.icon || '📁'}</span>
          <span className="folder-name">{folder.name}</span>
        </div>
        {isExpanded && childFolders.map(child => renderFolderTree(child.id, depth + 1))}
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
          ◀
        </button>
        <button 
          className="explorer-toolbar-btn" 
          onClick={goForward} 
          disabled={historyIndex >= history.length - 1}
          title="Forward"
        >
          ▶
        </button>
        <button 
          className="explorer-toolbar-btn" 
          onClick={goUp}
          disabled={currentFolderId === 'desktop'}
          title="Up"
        >
          ⬆
        </button>
      </div>

      {/* Address Bar */}
      <div className="explorer-address-bar">
        <span>Address:</span>
        <input 
          className="explorer-address-input" 
          value={addressValue} 
          onChange={(e) => setAddressValue(e.target.value)}
          onFocus={() => setIsEditingAddress(true)}
          onBlur={handleAddressSubmit}
          onKeyDown={handleAddressKeyDown}
        />
        <button 
          className="explorer-toolbar-btn"
          onClick={handleAddressSubmit}
          title="Go"
        >
          ➜
        </button>
      </div>

      {/* Main content area with sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar Tree */}
        <div className="explorer-sidebar">
          <div className="sidebar-header">All Folders</div>
          <div className="sidebar-content">
            {renderFolderTree('desktop')}
          </div>
        </div>

        {/* File Grid */}
        <div 
          className={`explorer-grid ${isDropTarget ? 'drop-target' : ''}`} 
          style={{ flex: 1 }}
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
            files.map((file) => (
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
                <div className="explorer-item-icon">{file.icon}</div>
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
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ 
        padding: '4px 8px', 
        borderTop: '2px solid #808080',
        backgroundColor: '#c0c0c0',
        fontSize: '11px'
      }}>
        {files.length} object(s)
      </div>
    </div>
  );
}
