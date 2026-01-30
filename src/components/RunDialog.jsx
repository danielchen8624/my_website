import { useState, useEffect, useRef } from 'react';
import { useOS } from '../context/OSContext';
import { useFileSystem } from '../context/FileSystemContext';

export default function RunDialog({ onClose }) {
  const { openWindow } = useOS();
  const { files } = useFileSystem();
  const [command, setCommand] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleRun = (e) => {
    e.preventDefault();
    const cmd = command.trim().toLowerCase();

    if (!cmd) return;

    switch (cmd) {
      case 'cmd':
      case 'command':
        openWindow('terminal', {
          id: 'terminal',
          name: 'MS-DOS Prompt',
          icon: '⬛',
          appType: 'terminal',
        });
        break;
      case 'notepad':
        openWindow('notepad', {
          id: `notepad-${Date.now()}`,
          name: 'Untitled - Notepad',
          icon: '📝',
          appType: 'notepad',
        });
        break;
      case 'explorer':
        openWindow('mycomputer', {
          id: 'mycomputer',
          name: 'My Computer',
          icon: '💻',
          appType: 'mycomputer',
        });
        break;
      case 'calc':
      case 'calculator':
        alert('Calculator not installed (yet!)');
        break;
      case 'winamp':
        openWindow('winamp', {
            id: 'winamp',
            name: 'Winamp',
            icon: '🎵',
            appType: 'winamp',
        });
        break;
      case 'minesweeper':
      case 'winmine':
        openWindow('minesweeper', {
            id: 'minesweeper',
            name: 'Minesweeper',
            icon: '💣',
            appType: 'minesweeper',
        });
        break;
      case 'crash':
      case 'bsod':
        // Trigger BSOD event
        window.dispatchEvent(new Event('trigger-bsod'));
        break;
      case 'www.google.com':
      case 'google':
        openWindow('browser', {
            id: 'browser',
            name: 'Internet Explorer',
            icon: '🌐',
            appType: 'browser',
        });
        break;
      default:
        // Try to find a file path? For now just show error
        alert(`Cannot find the file '${command}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`);
        return; 
    }
    
    onClose();
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ fontSize: '32px', marginRight: '16px' }}>🏃</div>
        <div style={{ fontSize: '12px' }}>
          Type the name of a program, folder, or document, and<br/>
          Windows will open it for you.
        </div>
      </div>

      <form onSubmit={handleRun}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <label style={{ width: '40px', fontSize: '12px' }}>Open:</label>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            style={{ flex: 1 }}
            className="inset-border"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="submit" className="win95-btn">OK</button>
          <button type="button" onClick={onClose} className="win95-btn">Cancel</button>
          <button type="button" className="win95-btn" disabled>Browse...</button>
        </div>
      </form>
    </div>
  );
}
