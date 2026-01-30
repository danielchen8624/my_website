import { useState, useEffect } from 'react';
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
function AppRenderer({ appType, fileId, onClose }) {
  switch (appType) {
    case 'notepad':
      return <NotepadApp fileId={fileId} />;
    case 'about':
      return <AboutApp />;
    case 'explorer':
      return <ExplorerApp folderId={fileId} />;
    case 'mycomputer':
      return <ExplorerApp folderId="desktop" />;
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
      return <MinesweeperApp />;
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
      className="desktop"
      onDrop={handleDesktopDrop}
      onDragOver={handleDesktopDragOver}
    >
      {/* Desktop Icons from File System */}
      {desktopFiles.map((file) => (
        <DesktopIcon key={file.id} file={file} />
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
            onSave={() => handleSave(window.fileId)}
            onMenuAction={(action) => handleMenuAction(window.fileId, action)}
          >
            <AppRenderer 
              appType={window.appType} 
              fileId={window.fileId}
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
