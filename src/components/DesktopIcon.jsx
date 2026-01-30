import { useState, useRef, useCallback, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';
import { setSelectedFile } from './KeyboardShortcuts';
import Icon from './Icon';

export default function DesktopIcon({ file, isSelected: isSelectedProp = false }) {
  const { openWindow } = useOS();
  const { renameFile, moveFile, moveFileToFolder, getDesktopFiles, getFile } = useFileSystem();

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [isSelectedLocal, setIsSelectedLocal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Combine local selection with prop-based selection (marquee)
  const isSelected = isSelectedLocal || isSelectedProp;

  const iconRef = useRef(null);
  const inputRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const isGroupDragRef = useRef(false);
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

  // Listen for desktop selection events (marquee selection)
  useEffect(() => {
    const handleDesktopSelection = (e) => {
      const { selectedIds } = e.detail;
      // Clear local selection if marquee selection is happening
      if (selectedIds.length > 0 && !selectedIds.includes(file.id)) {
        setIsSelectedLocal(false);
      }
    };

    window.addEventListener('desktopSelection', handleDesktopSelection);
    return () => window.removeEventListener('desktopSelection', handleDesktopSelection);
  }, [file.id]);

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
      // Dispatch event to clear other icons' selections (exclusive select)
      window.dispatchEvent(new CustomEvent('desktopSelection', {
        detail: { selectedIds: [file.id] }
      }));
      setIsSelectedLocal(true);
      setSelectedFile(file.id, 'desktop');
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
    
    // If not already selected, select this one
    // But don't immediately clear others if we are about to drag a group.
    // The safest bet is: if we click an unselected icon, we select it (and others clear via click handler).
    // If we click a selected icon, we DO NOT clear selection, in case we are about to drag the group.
    // However, the click handler runs AFTER drag end if no drag occurred.
    
    if (!isSelected) {
       setIsSelectedLocal(true);
    }
    
    // Record start position for threshold check
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    
    // Check if we are part of a group drag
    // We check the DOM for simplicity to see who is currently selected
    // Note: React state updates might be pending, but classnames 'selected' should be reliable if rendered
    const selectedIds = Array.from(document.querySelectorAll('.desktop-icon.selected')).map(el => el.dataset.fileId);
    
    // If WE are selected, and there are multiple selected, it's a group drag
    // If we weren't selected before mouse down, we just selected ourselves locally, so we should be included effectively.
    
    const effectiveSelectedIds = isSelected ? selectedIds : [...selectedIds, file.id];
    const isGroup = effectiveSelectedIds.includes(file.id) && effectiveSelectedIds.length > 1;
    
    isGroupDragRef.current = isGroup;

    // Emit for cross-window drop (only single file support for now in other apps)
    window.__draggingFileId = file.id;
    
    const rect = iconRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setIsDragging(true);
  }, [isRenaming, file.id, isSelected]);

  // Drag move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      // Check dragging threshold first
      if (!hasDraggedRef.current) {
        const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
        const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        hasDraggedRef.current = true;
      }
      
      // Calculate delta from last frame
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      const desktop = document.querySelector('.desktop');
      if (!desktop) return;
      
      const desktopRect = desktop.getBoundingClientRect();
      
      // Helper to move an element visually
      const moveIconElement = (element) => {
        // We use style.left/top directly. 
        // Note: element.style.left might be set from React, so we need consistent units (px)
        // Parsing current computed style is safer
        const rect = element.getBoundingClientRect();
        const currentLeft = rect.left - desktopRect.left;
        const currentTop = rect.top - desktopRect.top;
        
        const newLeft = currentLeft + deltaX;
        const newTop = currentTop + deltaY;
        
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
      };

      if (isGroupDragRef.current) {
         // Move ALL selected icons
         document.querySelectorAll('.desktop-icon.selected').forEach(el => {
            moveIconElement(el);
         });
         // Also move self if not yet marked selected in DOM (corner case)
         if (!isSelectedLocal && !isSelectedProp) {
            if (iconRef.current) moveIconElement(iconRef.current);
         }
      } else {
         // Move just this one
         if (iconRef.current) moveIconElement(iconRef.current);
      }
      
      // Check drop target
      const targetId = checkDropTarget(e.clientX, e.clientY);
      document.querySelectorAll('.desktop-icon').forEach(el => el.classList.remove('drop-target'));
      if (targetId) {
        const targetElement = document.querySelector(`[data-file-id="${targetId}"]`);
        if (targetElement) targetElement.classList.add('drop-target');
      }
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      window.__draggingFileId = null;
      document.querySelectorAll('.desktop-icon').forEach(el => el.classList.remove('drop-target'));
      
      if (!hasDraggedRef.current) return;
      
      const targetId = checkDropTarget(e.clientX, e.clientY);
      
      if (targetId) {
        // Move to folder logic
        if (isGroupDragRef.current) {
           document.querySelectorAll('.desktop-icon.selected').forEach(el => {
              moveFileToFolder(el.dataset.fileId, targetId);
           });
           // Also move self if needed
           if (!isSelectedLocal && !isSelectedProp) moveFileToFolder(file.id, targetId);
        } else {
           moveFileToFolder(file.id, targetId);
        }
      } else {
        // Finalize positions in state
        const finalizePosition = (element, id) => {
           const rect = element.getBoundingClientRect();
           const desktop = document.querySelector('.desktop');
           const desktopRect = desktop.getBoundingClientRect();
           
           let x = rect.left - desktopRect.left;
           let y = rect.top - desktopRect.top;
           
           // Constrain locally
           x = Math.max(0, Math.min(x, desktopRect.width - 84));
           y = Math.max(0, Math.min(y, desktopRect.height - 80));
           
           moveFile(id, x, y);
        };

        if (isGroupDragRef.current) {
            document.querySelectorAll('.desktop-icon.selected').forEach(el => {
                finalizePosition(el, el.dataset.fileId);
            });
            if (!isSelectedLocal && !isSelectedProp) finalizePosition(iconRef.current, file.id);
        } else {
            finalizePosition(iconRef.current, file.id);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, file.id, moveFile, moveFileToFolder, checkDropTarget, isSelectedLocal, isSelectedProp]);

  // Deselect when clicking elsewhere
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!iconRef.current?.contains(e.target)) {
        setIsSelectedLocal(false);
        if (isRenaming) {
          handleRenameSubmit();
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isRenaming, handleRenameSubmit]);

  const position = file.position || { x: 20, y: 20 };
  
  // Resolve icon for the Icon component
  let iconKey = file.icon;
  if (file.id === 'recycle-bin') {
      iconKey = (file.children && file.children.length > 0) ? 'recycle-bin-full' : 'recycle-bin-empty';
  }

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
         <Icon icon={iconKey} size={32} />
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
