import { useEffect } from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import Window from './components/Window';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import DesktopIcon from './components/DesktopIcon';
import ContextMenu from './components/ContextMenu';

// App Components
import NotepadApp from './apps/NotepadApp';
import AboutApp from './apps/AboutApp';
import ProjectsApp from './apps/ProjectsApp';
import ContactApp from './apps/ContactApp';
import SkillsApp from './apps/SkillsApp';
import InternetExplorerApp from './apps/InternetExplorerApp';
import WinampApp from './apps/WinampApp';
import PaintApp from './apps/PaintApp';
import TerminalApp from './apps/TerminalApp';
import DisplayPropertiesApp from './apps/DisplayPropertiesApp';
import RecycleBinApp from './apps/RecycleBinApp';

// Render the appropriate app based on type
function AppRenderer({ appType, fileId, onClose }) {
  switch (appType) {
    case 'notepad':
      return <NotepadApp fileId={fileId} />;
    case 'about':
      return <AboutApp />;
    case 'explorer':
      return <ProjectsApp folderId={fileId} />;
    case 'mycomputer':
      return <SkillsApp />;
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
    default:
      return <div style={{ padding: 16 }}>Unknown app type: {appType}</div>;
  }
}

function Desktop() {
  const { windows, getFocusedWindowId, closeWindow } = useOS();
  const { getDesktopFiles, getFile } = useFileSystem();
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

  return (
    <div className="desktop">
      {/* Desktop Icons from File System */}
      {desktopFiles.map((file) => (
        <DesktopIcon key={file.id} file={file} />
      ))}

      {/* Windows */}
      {windows.map((window) => {
        if (window.isMinimized) return null;
        
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

      {/* Taskbar */}
      <Taskbar />

      {/* Start Menu */}
      <StartMenu />
    </div>
  );
}

function App() {
  return (
    <FileSystemProvider>
      <OSProvider>
        <Desktop />
      </OSProvider>
    </FileSystemProvider>
  );
}

export default App;
