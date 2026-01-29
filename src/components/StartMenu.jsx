import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';

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
          icon: '🎵',
          appType: 'winamp',
        });
        break;
      case 'paint':
        openWindow('paint', {
          id: 'paint',
          name: 'Paint',
          icon: '🎨',
          appType: 'paint',
        });
        break;
      case 'terminal':
        openWindow('terminal', {
          id: 'terminal',
          name: 'MS-DOS Prompt',
          icon: '⬛',
          appType: 'terminal',
        });
        break;
      case 'display':
        openWindow('display', {
          id: 'display',
          name: 'Display Properties',
          icon: '🖥️',
          appType: 'properties',
        });
        break;
      case 'newfolder':
        createFolder();
        break;
      case 'newfile':
        createTextFile();
        break;
      case 'reset':
        handleReset();
        return; // Don't close start menu immediately (reload will happen)
      default:
        break;
    }
    closeStartMenu();
  };

  const menuItems = [
    { id: 'programs', label: 'Programs', icon: '📂', action: 'programs', hasSubmenu: true },
    { id: 'documents', label: 'Documents', icon: '📄', action: 'documents' },
    { type: 'divider' },
    { id: 'internet', label: 'Internet Explorer', icon: '🌐', action: 'internet' },
    { id: 'winamp', label: 'Winamp', icon: '🎵', action: 'winamp' },
    { id: 'paint', label: 'Paint', icon: '🎨', action: 'paint' },
    { id: 'terminal', label: 'MS-DOS Prompt', icon: '⬛', action: 'terminal' },
    { type: 'divider' },
    { id: 'mycomputer', label: 'My Computer', icon: '💻', action: 'mycomputer' },
    { id: 'display', label: 'Display Properties', icon: '🖥️', action: 'display' },
    { type: 'divider' },
    { id: 'newfolder', label: 'New Folder', icon: '📁', action: 'newfolder' },
    { id: 'newfile', label: 'New Text File', icon: '📝', action: 'newfile' },
    { type: 'divider' },
    { id: 'reset', label: 'Reset System...', icon: '⚠️', action: 'reset' },
    { id: 'shutdown', label: 'Shut Down...', icon: '🔌', action: null },
  ];

  const handleReset = () => {
    if (confirm('⚠️ WARNING: This will reset all files, settings, and changes to default.\n\nAre you sure you want to continue?')) {
      localStorage.removeItem('retro-os-filesystem');
      localStorage.removeItem('retroos-wallpaper');
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
                <span className="start-menu-item-icon">{item.icon}</span>
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
