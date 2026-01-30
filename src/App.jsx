import { useState, useEffect, useCallback, useRef } from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import Window from './components/Window';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import DesktopIcon from './components/DesktopIcon';
import ContextMenu from './components/ContextMenu';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import BiosBoot from './components/BiosBoot';
import SplashScreen from './components/SplashScreen';
import BSOD from './components/BSOD';
import RunDialog from './components/RunDialog';

// App Components
import NotepadApp from './apps/NotepadApp';
import AboutApp from './apps/AboutApp';
import ExplorerApp from './apps/ExplorerApp';
import ContactApp from './apps/ContactApp';
import SkillsApp from './apps/SkillsApp';
import InternetExplorerApp from './apps/InternetExplorerApp';
import WinampApp from './apps/WinampApp';
import PaintApp from './apps/PaintApp';
import TerminalApp from './apps/TerminalApp';
import DisplayPropertiesApp from './apps/DisplayPropertiesApp';
import RecycleBinApp from './apps/RecycleBinApp';
import ResumeApp from './apps/ResumeApp';
import MinesweeperApp from './apps/MinesweeperApp';
import SystemPropertiesApp from './apps/SystemPropertiesApp';

// Render the appropriate app based on type
function AppRenderer({ appType, fileId, onClose, windowId }) {
  switch (appType) {
    case 'notepad':
      return <NotepadApp fileId={fileId} />;
    case 'about':
      return <AboutApp />;
    case 'explorer':
      return <ExplorerApp folderId={fileId} />;
    case 'mycomputer':
      return <ExplorerApp folderId="my-computer" />;
    case 'browser':
      return <InternetExplorerApp />;
    case 'recyclebin':
      return <RecycleBinApp />;
    case 'winamp':
      return <WinampApp />;
    case 'paint':
      return <PaintApp />;
    case 'terminal':
      return <TerminalApp />;
    case 'contact':
      return <ContactApp />;
    case 'properties':
      return <DisplayPropertiesApp onClose={onClose} />;
    case 'resume':
      return <ResumeApp />;
    case 'minesweeper':
      return <MinesweeperApp windowId={windowId} />;
    case 'system-properties':
      return <SystemPropertiesApp />;
    case 'run':
        return <RunDialog onClose={onClose} />;
    default:
      return <div style={{ padding: 16 }}>Unknown app type: {appType}</div>;
  }
}

function Desktop() {
  const { windows, getFocusedWindowId, closeWindow } = useOS();
  const { getDesktopFiles, getFile, moveFileToFolder, moveFile } = useFileSystem();
  const focusedWindowId = getFocusedWindowId();
  const desktopFiles = getDesktopFiles();
  const desktopRef = useRef(null);

  // Marquee selection state - use refs to avoid stale closures
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null); // { left, top, width, height } or null
  const isSelectingRef = useRef(false);
  const justFinishedSelectingRef = useRef(false); // Prevent click from clearing selection
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const selectionCurrentRef = useRef({ x: 0, y: 0 });

  // Store selected file IDs globally for multi-icon dragging
  useEffect(() => {
    window.__selectedFileIds = selectedFileIds;
  }, [selectedFileIds]);

  // Check if two rectangles intersect
  const rectsIntersect = (rect1, rect2) => {
    return !(
      rect1.left + rect1.width < rect2.left ||
      rect2.left + rect2.width < rect1.left ||
      rect1.top + rect1.height < rect2.top ||
      rect2.top + rect2.height < rect1.top
    );
  };

  // Handle mouse down on desktop background (start selection)
  const handleSelectionStart = (e) => {
    // Don't start selection if clicking on an icon, window, or taskbar
    if (e.target.closest('.desktop-icon') ||
        e.target.closest('.window') ||
        e.target.closest('.taskbar') ||
        e.target.closest('.start-menu') ||
        e.target.closest('.context-menu')) {
      return;
    }

    const desktop = desktopRef.current;
    if (!desktop) return;

    const rect = desktop.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isSelectingRef.current = true;
    selectionStartRef.current = { x, y };
    selectionCurrentRef.current = { x, y };
    setSelectionBox(null);
  };

  // Global mouse event listeners for selection
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isSelectingRef.current) return;

      const desktop = desktopRef.current;
      if (!desktop) return;

      const rect = desktop.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 40));

      selectionCurrentRef.current = { x, y };

      const start = selectionStartRef.current;
      const current = selectionCurrentRef.current;

      setSelectionBox({
        left: Math.min(start.x, current.x),
        top: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y)
      });
    };

    const handleMouseUp = (e) => {
      if (!isSelectingRef.current) {
        return;
      }

      isSelectingRef.current = false;

      const desktop = desktopRef.current;
      if (!desktop) {
        setSelectionBox(null);
        return;
      }

      const start = selectionStartRef.current;
      const current = selectionCurrentRef.current;
      const box = {
        left: Math.min(start.x, current.x),
        top: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y)
      };

      // Only process if selection box has some size (was a drag, not just a click)
      if (box.width > 5 && box.height > 5) {
        const selectedIds = [];
        const desktopRect = desktop.getBoundingClientRect();

        // Check each desktop icon for intersection using DOM query
        const iconElements = document.querySelectorAll('.desktop-icon[data-file-id]');
        iconElements.forEach(iconEl => {
          const fileId = iconEl.getAttribute('data-file-id');
          const iconRect = iconEl.getBoundingClientRect();

          // Convert icon rect to desktop-relative coordinates
          const iconBox = {
            left: iconRect.left - desktopRect.left,
            top: iconRect.top - desktopRect.top,
            width: iconRect.width,
            height: iconRect.height
          };

          if (rectsIntersect(box, iconBox)) {
            selectedIds.push(fileId);
          }
        });

        setSelectedFileIds(selectedIds);
        window.dispatchEvent(new CustomEvent('desktopSelection', {
          detail: { selectedIds }
        }));

        // Mark that we just finished selecting (prevent click from clearing)
        if (selectedIds.length > 0) {
          justFinishedSelectingRef.current = true;
          setTimeout(() => { justFinishedSelectingRef.current = false; }, 100);
        }
      } else {
        // It was just a click, clear selection
        setSelectedFileIds([]);
        window.dispatchEvent(new CustomEvent('desktopSelection', {
          detail: { selectedIds: [] }
        }));
      }

      // Clear the visual selection box
      setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []); // Empty deps - handlers use refs for state

  // Clear selection when clicking on empty desktop area
  const handleDesktopClick = (e) => {
    // Don't clear if we just finished a marquee selection
    if (justFinishedSelectingRef.current) return;

    if (!e.target.closest('.desktop-icon') &&
        !e.target.closest('.window')) {
      setSelectedFileIds([]);
      window.dispatchEvent(new CustomEvent('desktopSelection', {
        detail: { selectedIds: [] }
      }));
    }
  };

  // Apply saved wallpaper on load
  useEffect(() => {
    const savedWallpaper = localStorage.getItem('retroos-wallpaper');
    if (savedWallpaper) {
      const WALLPAPERS = {
        'teal': '#008080',
        'black': '#000000',
        'blue': '#000080',
        'green': '#006400',
        'purple': '#4B0082',
        'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'clouds': 'linear-gradient(180deg, #87ceeb 0%, #e0f6ff 100%)',
        'sunset': 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 100%)',
      };
      const desktop = document.querySelector('.desktop');
      if (desktop && WALLPAPERS[savedWallpaper]) {
        desktop.style.background = WALLPAPERS[savedWallpaper];
      }
    }
  }, []);

  // Handle save for notepad
  const handleSave = (fileId) => {
    const handlers = window.__notepadHandlers?.[fileId];
    if (handlers?.save) {
      handlers.save();
    }
  };

  // Handle menu actions
  const handleMenuAction = (fileId, action) => {
    const handlers = window.__notepadHandlers?.[fileId];
    if (handlers?.menuAction) {
      handlers.menuAction(action);
    }
  };

  // Handle drop on desktop (from explorer windows)
  const handleDesktopDrop = (e) => {
    // Only handle if dropped directly on desktop, not on a window
    if (e.target.closest('.window')) return;
    
    const draggedFileId = window.__draggingFileId;
    if (draggedFileId) {
      // Calculate drop position relative to desktop
      const desktop = document.querySelector('.desktop');
      const rect = desktop.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - 40, rect.width - 80));
      const y = Math.max(0, Math.min(e.clientY - rect.top - 40, rect.height - 80));
      
      // Move file to desktop and set position
      moveFileToFolder(draggedFileId, 'desktop');
      moveFile(draggedFileId, x, y);
      
      window.__draggingFileId = null;
    }
  };

  const handleDesktopDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      ref={desktopRef}
      className="desktop"
      onDrop={handleDesktopDrop}
      onDragOver={handleDesktopDragOver}
      onMouseDown={handleSelectionStart}
      onClick={handleDesktopClick}
    >
      {/* Marquee Selection Box */}
      {selectionBox && selectionBox.width > 2 && selectionBox.height > 2 && (
        <div
          className="selection-box"
          style={{
            left: selectionBox.left,
            top: selectionBox.top,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}

      {/* Desktop Icons from File System */}
      {desktopFiles.map((file) => (
        <DesktopIcon key={file.id} file={file} isSelected={selectedFileIds.includes(file.id)} />
      ))}

      {/* Windows */}
      {windows.map((window) => {
        const file = getFile(window.fileId);

        return (
          <Window
            key={window.id}
            id={window.id}
            title={file?.name || window.title}
            icon={window.icon}
            position={window.position}
            size={window.size}
            zIndex={window.zIndex}
            isActive={focusedWindowId === window.id}
            isMinimized={window.isMinimized}
            allowMaximize={window.allowMaximize}
            onSave={() => handleSave(window.fileId)}
            onMenuAction={(action) => handleMenuAction(window.fileId, action)}
          >
            <AppRenderer 
              appType={window.appType} 
              fileId={window.fileId}
              windowId={window.id}
              onClose={() => closeWindow(window.id)}
            />
          </Window>
        );
      })}

      {/* Context Menu */}
      <ContextMenu />
      <KeyboardShortcuts />

      {/* Taskbar */}
      <Taskbar />

      {/* Start Menu */}
      <StartMenu />
    </div>
  );
}

function App() {
  const [systemState, setSystemState] = useState('bios'); // 'bios', 'splash', 'desktop', 'bsod'

  useEffect(() => {
    // Listen for BSOD trigger
    const handleBSOD = () => setSystemState('bsod');
    window.addEventListener('trigger-bsod', handleBSOD);
    return () => window.removeEventListener('trigger-bsod', handleBSOD);
  }, []);

  // Handle reboot from BSOD
  const handleReboot = () => {
    setSystemState('bios');
  };

  return (
    <FileSystemProvider>
      <OSProvider>
        {systemState === 'bios' && (
            <BiosBoot onComplete={() => setSystemState('splash')} />
        )}
        
        {systemState === 'splash' && (
            <SplashScreen onComplete={() => setSystemState('desktop')} />
        )}

        {systemState === 'bsod' && (
            <BSOD onDismiss={handleReboot} />
        )}

        {/* Always render desktop structure but hide it when booting/crashed to keep state? 
            Actually, real OS would re-mount. Let's conditionally render. */}
        {systemState === 'desktop' && (
            <Desktop />
        )}
      </OSProvider>
    </FileSystemProvider>
  );
}

export default App;
