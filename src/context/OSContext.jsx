import { createContext, useContext, useState, useCallback } from 'react';

// Create context
const OSContext = createContext(null);

// Default window sizes for different app types
const DEFAULT_WINDOW_SIZES = {
  notepad: { width: 500, height: 400 },
  explorer: { width: 600, height: 450 },
  browser: { width: 800, height: 600 },
  mycomputer: { width: 550, height: 400 },
  default: { width: 500, height: 400 },
};

// Provider component
export function OSProvider({ children }) {
  // Track open windows with their state
  const [windows, setWindows] = useState([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // Open a window (now accepts file data from FileSystem)
  const openWindow = useCallback((windowId, fileData = null) => {
    setWindows((prev) => {
      // Check if window already exists
      const existingIndex = prev.findIndex((w) => w.id === windowId);
      
      if (existingIndex !== -1) {
        // Window exists - restore if minimized and focus
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isMinimized: false,
          isMaximized: false,
          zIndex: nextZIndex,
        };
        setNextZIndex((z) => z + 1);
        return updated;
      }
      
      // Determine window properties from file data
      const appType = fileData?.appType || 'default';
      const defaultSize = DEFAULT_WINDOW_SIZES[appType] || DEFAULT_WINDOW_SIZES.default;
      
      // Calculate position with offset for multiple windows
      const offset = prev.length * 30;
      
      const newWindow = {
        id: windowId,
        title: fileData?.name || windowId,
        icon: fileData?.icon || '📄',
        appType: appType,
        fileId: fileData?.id || windowId,
        isMinimized: false,
        isMaximized: false,
        zIndex: nextZIndex,
        position: { 
          x: 100 + offset, 
          y: 50 + offset 
        },
        size: { ...defaultSize },
        // Store original size/position for restore after maximize
        preMaximizeState: null,
      };
      
      setNextZIndex((z) => z + 1);
      return [...prev, newWindow];
    });
    
    setStartMenuOpen(false);
  }, [nextZIndex]);

  // Close a window
  const closeWindow = useCallback((windowId) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  // Minimize a window
  const minimizeWindow = useCallback((windowId) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, isMinimized: true } : w
      )
    );
  }, []);

  // Maximize or restore a window
  const maximizeWindow = useCallback((windowId) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== windowId) return w;
        
        if (w.isMaximized) {
          // Restore to previous state
          return {
            ...w,
            isMaximized: false,
            position: w.preMaximizeState?.position || w.position,
            size: w.preMaximizeState?.size || w.size,
            preMaximizeState: null,
          };
        } else {
          // Maximize and save current state
          return {
            ...w,
            isMaximized: true,
            preMaximizeState: {
              position: { ...w.position },
              size: { ...w.size },
            },
          };
        }
      })
    );
  }, []);

  // Focus a window (bring to front)
  const focusWindow = useCallback((windowId) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
      )
    );
    setNextZIndex((z) => z + 1);
  }, [nextZIndex]);

  // Update window position (for dragging)
  const updateWindowPosition = useCallback((windowId, position) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, position } : w
      )
    );
  }, []);

  // Update window size
  const updateWindowSize = useCallback((windowId, size) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, size } : w
      )
    );
  }, []);

  // Update window title
  const updateWindowTitle = useCallback((windowId, title) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, title } : w
      )
    );
  }, []);

  // Toggle start menu
  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen((prev) => !prev);
  }, []);

  // Close start menu
  const closeStartMenu = useCallback(() => {
    setStartMenuOpen(false);
  }, []);

  // Get the currently focused window
  const getFocusedWindowId = useCallback(() => {
    const visibleWindows = windows.filter((w) => !w.isMinimized);
    if (visibleWindows.length === 0) return null;
    
    return visibleWindows.reduce((prev, current) =>
      prev.zIndex > current.zIndex ? prev : current
    ).id;
  }, [windows]);

  const value = {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    updateWindowTitle,
    getFocusedWindowId,
    startMenuOpen,
    toggleStartMenu,
    closeStartMenu,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

// Custom hook
export function useOS() {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
}
