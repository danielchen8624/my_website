import { useRef, useState, useCallback, useEffect } from 'react';
import { useOS } from '../context/OSContext';

export default function Window({ 
  id, 
  title, 
  icon, 
  children, 
  position, 
  size, 
  zIndex,
  isActive,
  // Menu handlers passed from parent
  onSave,
  onMenuAction,
  hideMenuBar = false,
  isMinimized = false,
}) {
  const { closeWindow, minimizeWindow, focusWindow, updateWindowPosition, maximizeWindow, windows } = useOS();
  const windowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Find if this window is maximized
  const windowState = windows.find(w => w.id === id);
  const isMaximized = windowState?.isMaximized || false;

  // Handle mouse down on header (start drag)
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.window-control-btn') || e.target.closest('.window-menubar')) return;
    if (isMaximized) return; // Don't drag when maximized
    
    focusWindow(id);
    setIsDragging(true);
    
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [focusWindow, id, isMaximized]);

  // Handle mouse move (dragging)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, e.clientX - dragOffset.x);
      const newY = Math.max(0, e.clientY - dragOffset.y);
      updateWindowPosition(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, updateWindowPosition]);

  // Handle window focus when clicking anywhere on window
  const handleWindowClick = useCallback(() => {
    focusWindow(id);
    setActiveMenu(null);
  }, [focusWindow, id]);

  // Double-click header to maximize
  const handleHeaderDoubleClick = useCallback(() => {
    maximizeWindow(id);
  }, [maximizeWindow, id]);

  // Menu handlers
  const handleMenuClick = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (action) => {
    setActiveMenu(null);
    
    switch (action) {
      case 'save':
        onSave?.();
        break;
      case 'close':
        closeWindow(id);
        break;
      case 'new':
      case 'cut':
      case 'copy':
      case 'paste':
      case 'undo':
      case 'selectAll':
      case 'about':
        onMenuAction?.(action);
        break;
      default:
        console.log('Menu action:', action);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.window-menubar')) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Compute window styles
  const windowStyle = {
    display: isMinimized ? 'none' : 'flex',
    left: isMaximized ? 0 : position.x,
    top: isMaximized ? 0 : position.y,
    width: isMaximized ? '100vw' : size.width,
    height: isMaximized ? 'calc(100vh - var(--taskbar-height))' : size.height,
    zIndex: zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`window ${isMaximized ? 'maximized' : ''}`}
      style={windowStyle}
      onClick={handleWindowClick}
    >
      {/* Title Bar */}
      <div 
        className={`window-header ${isActive ? '' : 'inactive'}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleHeaderDoubleClick}
      >
        <div className="window-title">
          <span className="window-title-icon">{icon}</span>
          <span>{title}</span>
        </div>
        
        <div className="window-controls">
          {/* Minimize Button */}
          <button 
            className="window-control-btn"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(id);
            }}
            aria-label="Minimize"
          >
            <span>_</span>
          </button>
          
          {/* Maximize Button */}
          <button 
            className="window-control-btn"
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(id);
            }}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            <span>{isMaximized ? '❐' : '□'}</span>
          </button>
          
          {/* Close Button */}
          <button 
            className="window-control-btn"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(id);
            }}
            aria-label="Close"
          >
            <span>×</span>
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      {!hideMenuBar && (
        <div className="window-menubar">
          {/* File Menu */}
          <div className="window-menu-container">
            <div 
              className={`window-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleMenuClick('file'); }}
            >
              File
            </div>
            {activeMenu === 'file' && (
              <div className="window-menu-dropdown">
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('new')}>
                  New
                </div>
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('save')}>
                  Save
                </div>
                <div className="window-menu-divider" />
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('close')}>
                  Exit
                </div>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="window-menu-container">
            <div 
              className={`window-menu-item ${activeMenu === 'edit' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleMenuClick('edit'); }}
            >
              Edit
            </div>
            {activeMenu === 'edit' && (
              <div className="window-menu-dropdown">
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('undo')}>
                  Undo
                </div>
                <div className="window-menu-divider" />
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('cut')}>
                  Cut
                </div>
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('copy')}>
                  Copy
                </div>
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('paste')}>
                  Paste
                </div>
                <div className="window-menu-divider" />
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('selectAll')}>
                  Select All
                </div>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="window-menu-container">
            <div 
              className={`window-menu-item ${activeMenu === 'view' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleMenuClick('view'); }}
            >
              View
            </div>
            {activeMenu === 'view' && (
              <div className="window-menu-dropdown">
                <div className="window-menu-dropdown-item">Large Icons</div>
                <div className="window-menu-dropdown-item">Small Icons</div>
                <div className="window-menu-dropdown-item">List</div>
                <div className="window-menu-dropdown-item">Details</div>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="window-menu-container">
            <div 
              className={`window-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleMenuClick('help'); }}
            >
              Help
            </div>
            {activeMenu === 'help' && (
              <div className="window-menu-dropdown">
                <div className="window-menu-dropdown-item" onClick={() => handleMenuItemClick('about')}>
                  About
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Window Body */}
      <div className="window-body">
        <div className="window-content">
          {children}
        </div>
      </div>
    </div>
  );
}
