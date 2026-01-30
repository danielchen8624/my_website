import { useState, useCallback, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';

export default function ExplorerApp({ folderId = 'desktop' }) {
  const { openWindow } = useOS();
  const { getFilesInFolder, getFile, moveFileToFolder, renameFile } = useFileSystem();
  
  const [selectedId, setSelectedId] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isDropTarget, setIsDropTarget] = useState(false);
  
  const folder = getFile(folderId);
  const files = getFilesInFolder(folderId);
  
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

  // Handle double-click to open
  const handleDoubleClick = useCallback((file) => {
    openWindow(file.id, file);
  }, [openWindow]);

  // Track clicks for slow double-click rename
  const lastClickTimeRef = { current: 0 };
  const lastClickIdRef = { current: null };

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
    if (draggedFileId && draggedFileId !== folderId) {
      // Move the file into this folder
      moveFileToFolder(draggedFileId, folderId);
    }
    window.__draggingFileId = null;
  }, [folderId, moveFileToFolder]);

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
      const explorerEl = document.querySelector(`[data-folder-id="${folderId}"]`);
      if (!explorerEl) return;
      
      const rect = explorerEl.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        // Dropped inside this explorer!
        if (draggedFileId !== folderId) {
          moveFileToFolder(draggedFileId, folderId);
          window.__draggingFileId = null;
        }
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [folderId, moveFileToFolder]);

  // Build path for address bar
  const getPath = () => {
    if (folderId === 'desktop') return 'C:\\Desktop';
    const folderName = folder?.name || 'Folder';
    return `C:\\Desktop\\${folderName}`;
  };

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onClick={handleBackgroundClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Address Bar */}
      <div className="explorer-address-bar">
        <span>Address:</span>
        <input 
          className="explorer-address-input" 
          value={getPath()} 
          readOnly 
        />
      </div>
      
      {/* File Grid */}
      <div 
        className={`explorer-grid ${isDropTarget ? 'drop-target' : ''}`} 
        style={{ flex: 1 }}
        data-folder-id={folderId}
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
