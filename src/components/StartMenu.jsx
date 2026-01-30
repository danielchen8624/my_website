import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';
import Icon from './Icon';

export default function StartMenu() {
  const { startMenuOpen, openWindow, closeStartMenu } = useOS();
  const { getFile, createFolder, createTextFile, addFile } = useFileSystem();

  if (!startMenuOpen) return null;

  const handleItemClick = (action) => {
    switch (action) {
      case 'programs':
        const projectsFile = getFile('projects');
        if (projectsFile) openWindow('projects', projectsFile);
        break;
      case 'documents':
        const aboutFile = getFile('about');
        if (aboutFile) openWindow('about', aboutFile);
        break;
      case 'internet':
        const ieFile = getFile('internet-explorer');
        if (ieFile) openWindow('internet-explorer', ieFile);
        break;
      case 'mycomputer':
        const skillsFile = getFile('skills');
        if (skillsFile) openWindow('skills', skillsFile);
        break;
      case 'winamp':
        openWindow('winamp', {
          id: 'winamp',
          name: 'Winamp',
          icon: 'winamp',
          appType: 'winamp',
        });
        break;
      case 'paint':
        openWindow('paint', {
          id: 'paint',
          name: 'Paint',
          icon: 'paint',
          appType: 'paint',
        });
        break;
      case 'terminal':
        openWindow('terminal', {
          id: 'terminal',
          name: 'MS-DOS Prompt',
          icon: 'terminal',
          appType: 'terminal',
        });
        break;
      case 'display':
        openWindow('display', {
          id: 'display',
          name: 'Display Properties',
          icon: 'display',
          appType: 'properties',
        });
        break;
      case 'newfolder':
        createFolder();
        break;
      case 'newfile':
        createTextFile();
        break;
      case 'run':
        openWindow('run', {
            id: 'run-dialog',
            name: 'Run',
            icon: 'run',
            appType: 'run',
            isDialog: true,
        });
        break;
      case 'reset':
        handleReset();
        return; // Don't close start menu immediately (reload will happen)
      case 'shutdown':
           // Just a visual action for now, or maybe show an alert
           alert('It is now safe to turn off your computer.');
           break;
      default:
        break;
    }
    closeStartMenu();
  };

  const menuItems = [
    { id: 'programs', label: 'Programs', icon: 'program', action: 'programs', hasSubmenu: true },
    { id: 'documents', label: 'Documents', icon: 'folder', action: 'documents' },
    { type: 'divider' },
    { id: 'internet', label: 'Internet Explorer', icon: 'internet-explorer', action: 'internet' },
    { id: 'winamp', label: 'Winamp', icon: 'winamp', action: 'winamp' },
    { id: 'paint', label: 'Paint', icon: 'paint', action: 'paint' },
    { id: 'terminal', label: 'MS-DOS Prompt', icon: 'terminal', action: 'terminal' },
    { type: 'divider' },
    { id: 'mycomputer', label: 'My Computer', icon: 'my-computer', action: 'mycomputer' },
    { id: 'display', label: 'Display Properties', icon: 'display', action: 'display' },
    { type: 'divider' },
    { id: 'newfolder', label: 'New Folder', icon: 'folder', action: 'newfolder' },
    { id: 'newfile', label: 'New Text File', icon: 'notepad', action: 'newfile' },
    { type: 'divider' },
    { type: 'divider' },
    { id: 'reset', label: 'Reset System...', icon: 'reset', action: 'reset' },
    { id: 'run', label: 'Run...', icon: 'run', action: 'run' },
    { type: 'divider' },
    { id: 'shutdown', label: 'Shut Down...', icon: 'shutdown', action: 'shutdown' },
  ];

  const handleReset = () => {
    if (confirm('⚠️ WARNING: This will reset all files, settings, and changes to default.\n\nAre you sure you want to continue?')) {
      // Remove ALL localStorage keys that start with 'retro' to ensure complete wipe
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('retro') || key.startsWith('retro-os'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
        onClick={closeStartMenu}
      />
      
      {/* Menu */}
      <div className="start-menu">
        {/* Windows 95 Sidebar */}
        <div className="start-menu-sidebar">
          <span className="start-menu-sidebar-text">Windows 95</span>
        </div>

        {/* Menu Items */}
        <div className="start-menu-items">
          {menuItems.map((item, index) => (
            item.type === 'divider' ? (
              <div key={index} className="start-menu-divider" />
            ) : (
              <div
                key={item.id}
                className="start-menu-item"
                onClick={() => item.action && handleItemClick(item.action)}
              >
                <div className="start-menu-item-icon">
                  <Icon icon={item.icon} size={24} />
                </div>
                <span>{item.label}</span>
                {item.hasSubmenu && <span style={{ marginLeft: 'auto' }}>▶</span>}
              </div>
            )
          ))}
        </div>
      </div>
    </>
  );
}
