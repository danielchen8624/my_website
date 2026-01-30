import { useState, useRef, useCallback, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';

export default function DesktopIcon({ file }) {
  const { openWindow } = useOS();
  const { renameFile, moveFile, moveFileToFolder, getDesktopFiles } = useFileSystem();
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const iconRef = useRef(null);
  const inputRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const DRAG_THRESHOLD = 5; // pixels

  // Focus input when renaming
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Listen for rename events from context menu
  useEffect(() => {
    const handleStartRename = (e) => {
      if (e.detail.fileId === file.id) {
        setIsRenaming(true);
        setNewName(file.name);
      }
    };
    
    window.addEventListener('startRename', handleStartRename);
    return () => window.removeEventListener('startRename', handleStartRename);
  }, [file.id, file.name]);

  // Handle double-click to open
  const handleDoubleClick = useCallback(() => {
    openWindow(file.id, file);
  }, [openWindow, file]);

  // Handle single click to select, slow double-click to rename
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    
    // If we just dragged, don't process as click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    if (isSelected && timeSinceLastClick > 500 && timeSinceLastClick < 1500) {
      // Slow double-click - start renaming (but not for system files)
      if (file.type !== 'system') {
        setIsRenaming(true);
        setNewName(file.name);
      }
    } else {
      setIsSelected(true);
    }
    
    lastClickTimeRef.current = now;
  }, [isSelected, file.name, file.type]);

  // Handle rename submit
  const handleRenameSubmit = useCallback(() => {
    if (newName.trim() && newName !== file.name) {
      renameFile(file.id, newName.trim());
    }
    setIsRenaming(false);
  }, [newName, file.id, file.name, renameFile]);

  // Handle rename key press
  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(file.name);
    }
  }, [handleRenameSubmit, file.name]);

  // Check collision with other icons
  const checkDropTarget = useCallback((mouseX, mouseY) => {
    const desktopFiles = getDesktopFiles();
    const iconElements = document.querySelectorAll('.desktop-icon[data-file-id]');
    
    for (const element of iconElements) {
      const targetId = element.dataset.fileId;
      if (targetId === file.id) continue; // Skip self
      
      const targetFile = desktopFiles.find(f => f.id === targetId);
      if (!targetFile) continue;
      
      // Only allow dropping into folders or recycle bin
      if (targetFile.type !== 'folder' && targetFile.id !== 'recycle-bin') continue;
      
      const rect = element.getBoundingClientRect();
      if (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
      ) {
        return targetId;
      }
    }
    return null;
  }, [file.id, getDesktopFiles]);

  // Drag start
  const handleMouseDown = useCallback((e) => {
    if (isRenaming) return;
    if (e.button !== 0) return; // Only left click
    
    setIsSelected(true);
    
    // Record start position for threshold check
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    
    // Set dragging state (but actual visual dragging starts after threshold)
    setIsDragging(true);
    
    // Emit for cross-window drop
    window.__draggingFileId = file.id;
    
    const rect = iconRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [isRenaming, file.id]);

  // Drag move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      // Check if we've exceeded drag threshold
      const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
      const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
      
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return; // Haven't moved enough to be a drag
      }
      
      hasDraggedRef.current = true;
      
      const desktop = document.querySelector('.desktop');
      if (!desktop) return;
      
      const desktopRect = desktop.getBoundingClientRect();
      let newX = e.clientX - desktopRect.left - dragOffset.x;
      let newY = e.clientY - desktopRect.top - dragOffset.y;
      
      // Constrain to desktop bounds
      newX = Math.max(0, Math.min(newX, desktopRect.width - 80));
      newY = Math.max(0, Math.min(newY, desktopRect.height - 80));
      
      // Update position in real-time
      if (iconRef.current) {
        iconRef.current.style.left = `${newX}px`;
        iconRef.current.style.top = `${newY}px`;
      }
      
      // Check for drop targets (desktop icons and open explorer windows)
      const targetId = checkDropTarget(e.clientX, e.clientY);
      
      // Highlight drop target
      document.querySelectorAll('.desktop-icon').forEach(el => {
        el.classList.remove('drop-target');
      });
      
      if (targetId) {
        const targetElement = document.querySelector(`[data-file-id="${targetId}"]`);
        if (targetElement) {
          targetElement.classList.add('drop-target');
        }
      }
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      
      // Clear global drag state
      window.__draggingFileId = null;
      
      // Clear drop target highlights
      document.querySelectorAll('.desktop-icon').forEach(el => {
        el.classList.remove('drop-target');
      });
      
      // If we didn't actually drag, don't update position
      if (!hasDraggedRef.current) {
        return;
      }
      
      // Check if dropped on a folder/recycle bin
      const targetId = checkDropTarget(e.clientX, e.clientY);
      
      if (targetId) {
        // Move file to the target folder/bin
        moveFileToFolder(file.id, targetId);
      } else {
        // Regular position update
        const desktop = document.querySelector('.desktop');
        if (!desktop) return;
        
        const desktopRect = desktop.getBoundingClientRect();
        let newX = e.clientX - desktopRect.left - dragOffset.x;
        let newY = e.clientY - desktopRect.top - dragOffset.y;
        
        newX = Math.max(0, Math.min(newX, desktopRect.width - 80));
        newY = Math.max(0, Math.min(newY, desktopRect.height - 80));
        
        moveFile(file.id, newX, newY);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, file.id, moveFile, moveFileToFolder, checkDropTarget]);

  // Deselect when clicking elsewhere
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!iconRef.current?.contains(e.target)) {
        setIsSelected(false);
        if (isRenaming) {
          handleRenameSubmit();
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isRenaming, handleRenameSubmit]);

  const position = file.position || { x: 20, y: 20 };

  return (
    <div 
      ref={iconRef}
      className={`desktop-icon ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
      data-file-id={file.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="desktop-icon-image">
        {file.icon}
      </div>
      
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          className="desktop-icon-rename-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="desktop-icon-label">
          {file.name}
        </div>
      )}
    </div>
  );
}
