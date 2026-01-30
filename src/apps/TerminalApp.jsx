import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '../context/FileSystemContext';

// Available commands
const COMMANDS = {
  help: {
    description: 'Display available commands',
    execute: () => `
Available commands:
  help          - Display this help message
  dir / ls      - List files in current directory
  cd [folder]   - Change directory
  echo [text]   - Display text
  cls / clear   - Clear the screen
  date          - Display current date and time
  ver           - Display version information
  whoami        - Display current user
  color [code]  - Change text color (0-9, a-f)
  tree          - Display directory tree
  type [file]   - Display file contents
  mkdir [name]  - Create new folder
  del [file]    - Delete file
  format c:     - Format drive C: (just kidding!)
  exit          - Close terminal
`,
  },
  ver: {
    description: 'Display version',
    execute: () => `
Microsoft(R) Windows 95
   (C)Copyright Microsoft Corp 1981-1995.

RetroOS Terminal Emulator v1.0
Built with React and ❤️
`,
  },
  date: {
    description: 'Display date/time',
    execute: () => {
      const now = new Date();
      return `
Current date is: ${now.toLocaleDateString()}
Current time is: ${now.toLocaleTimeString()}
`;
    },
  },
  whoami: {
    description: 'Display user',
    execute: () => 'RETROOS\\Daniel',
  },
  cls: {
    description: 'Clear screen',
    execute: () => '__CLEAR__',
  },
  clear: {
    description: 'Clear screen',
    execute: () => '__CLEAR__',
  },
};

export default function TerminalApp() {
  const { 
    files, 
    getFolderContents, 
    addFile, 
    deleteFile, 
    findParent,
    getFilePath,
    findFileByPath
  } = useFileSystem();
  
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  
  const [history, setHistory] = useState([
    'Microsoft(R) Windows 95',
    '   (C)Copyright Microsoft Corp 1981-1995.',
    '',
    'C:\\Desktop>',
  ]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState('C:\\Desktop');
  const [currentFolderId, setCurrentFolderId] = useState('desktop');
  const [textColor, setTextColor] = useState('#c0c0c0');

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click
  const handleClick = () => {
    inputRef.current?.focus();
  };

  // Helper to resolve path and change directory
  const changeDirectory = useCallback((targetPath) => {
    if (!targetPath) return currentPath;
    
    // Handle "cd .."
    if (targetPath === '..') {
      if (currentFolderId === 'desktop') {
         // Already at root (C:\Desktop in our simulation)
         // Actually in our simplified FS, we treat Desktop as root of user space
         // But let's allow going to "C:\" for fun if we want, or just stay at desktop
         return 'Already at root directory';
      }
      
      const parent = findParent(currentFolderId);
      if (parent) {
        setCurrentFolderId(parent.id);
        const newPath = getFilePath(parent.id);
        setCurrentPath(newPath);
        return '';
      } else {
        // Must be at root
        return '';
      }
    }
    
    // Handle "cd ."
    if (targetPath === '.') return '';
    
    // Handle "cd \" or "cd /"
    if (targetPath === '\\' || targetPath === '/') {
        setCurrentFolderId('desktop');
        setCurrentPath('C:\\Desktop');
        return '';
    }

    // Resolve path relative to current folder
    let targetId = null;
    let targetFile = null;

    // Check children of current folder
    const contents = getFolderContents(currentFolderId);
    targetFile = contents.find(f => 
      f.name.toLowerCase() === targetPath.toLowerCase() && 
      f.type !== 'file' // Must be a folder or system folder
    );

    if (targetFile) {
        setCurrentFolderId(targetFile.id);
        
        // Build new path
        const newPath = currentPath.endsWith('\\') 
            ? `${currentPath}${targetFile.name}`
            : `${currentPath}\\${targetFile.name}`;
        setCurrentPath(newPath);
        return '';
    }

    return `System cannot find the path specified.`;
  }, [currentFolderId, currentPath, getFolderContents, findParent, getFilePath]);

  // Execute command
  const executeCommand = useCallback((cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return '';
    
    // Split preserving quotes logic could go here, but simple split for now
    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argString = args.join(' ');

    let output = '';

    switch (command) {
      case 'help':
        output = `
Available commands:
  help          - Display this help message
  dir / ls      - List files in current directory
  cd [folder]   - Change directory
  pwd           - Print working directory
  echo [text]   - Display text
  cls / clear   - Clear the screen
  date          - Display current date and time
  ver           - Display version information
  color [code]  - Change text color (0-9, a-f)
  tree          - Display directory tree
  type [file]   - Display file contents
  cat [file]    - Display file contents
  mkdir [name]  - Create new folder
  touch [name]  - Create new text file
  del [file]    - Delete file
  rm [file]     - Delete file
  nav [path]    - Navigate to absolute path (debug)
  exit          - Close terminal
`;
        break;

      case 'ver':
        output = `
Microsoft(R) Windows 95
   (C)Copyright Microsoft Corp 1981-1995.

RetroOS Terminal Emulator v1.0
Built with React and ❤️
`;
        break;

      case 'date':
        const now = new Date();
        output = `
Current date is: ${now.toLocaleDateString()}
Current time is: ${now.toLocaleTimeString()}
`;
        break;

      case 'cls':
      case 'clear':
        return '__CLEAR__';

      case 'echo':
        output = argString;
        break;

      case 'color':
         const colors = {
          '0': '#000000', '1': '#0000aa', '2': '#00aa00', '3': '#00aaaa',
          '4': '#aa0000', '5': '#aa00aa', '6': '#aa5500', '7': '#aaaaaa',
          '8': '#555555', '9': '#5555ff', 'a': '#55ff55', 'b': '#55ffff',
          'c': '#ff5555', 'd': '#ff55ff', 'e': '#ffff55', 'f': '#ffffff',
        };
        const newColor = colors[args[0]?.toLowerCase()];
        if (newColor) {
          setTextColor(newColor);
        } else {
          output = 'Invalid color code.';
        }
        break;

      case 'pwd':
        output = currentPath;
        break;

      case 'ls':
      case 'dir':
        const contents = getFolderContents(currentFolderId);
        output = `\n Directory of ${currentPath}\n\n`;
        
        if (contents.length === 0) {
            output += 'File Not Found\n';
        } else {
            contents.forEach(file => {
                const date = new Date().toLocaleDateString(); // Static date for now, ideally file has date
                const type = (file.type === 'folder' || file.type === 'system') ? '<DIR>' : '     ';
                // Pad name
                output += ` ${date}  ${type}    ${file.name}\n`;
            });
            output += `\n        ${contents.length} File(s)`;
        }
        break;

      case 'cd':
        output = changeDirectory(argString);
        break;

      case 'mkdir':
      case 'md':
        if (argString) {
           addFile({
             name: argString,
             type: 'folder',
             icon: '📁',
             position: { x: 50, y: 50 }, // Default position
             children: [],
             appType: 'explorer'
           }, currentFolderId);
           output = 'Directory created.';
        } else {
           output = 'The syntax of the command is incorrect.';
        }
        break;
        
      case 'touch':
        if (argString) {
           addFile({
             name: argString,
             type: 'file',
             icon: '📝',
             position: { x: 50, y: 50 },
             content: '',
             appType: 'notepad'
           }, currentFolderId);
           output = 'File created.';
        } else {
           output = 'The syntax of the command is incorrect.';
        }
        break;

      case 'del':
      case 'rm':
        if (argString) {
            const targetFile = getFolderContents(currentFolderId).find(f => 
                f.name.toLowerCase() === argString.toLowerCase()
            );
            
            if (targetFile) {
                if (targetFile.type === 'system') {
                    output = 'Access is denied.';
                } else {
                    deleteFile(targetFile.id, currentFolderId);
                    output = 'File deleted.';
                }
            } else {
                output = `Could Not Find ${argString}`;
            }
        } else {
            output = 'The syntax of the command is incorrect.';
        }
        break;

      case 'type':
      case 'cat':
        if (argString) {
            const targetFile = getFolderContents(currentFolderId).find(f => 
                f.name.toLowerCase() === argString.toLowerCase()
            );
            
            if (targetFile) {
                if (targetFile.type === 'folder' || targetFile.type === 'system') {
                    output = 'Access is denied.';
                } else if (targetFile.content) {
                    output = targetFile.content;
                } else {
                    output = ''; // Empty file
                }
            } else {
                output = 'The system cannot find the file specified.';
            }
        } else {
             output = 'The syntax of the command is incorrect.';
        }
        break;

      case 'exit':
        output = 'Type "exit" in real life to close this window.';
        break;

      default:
        output = `'${command}' is not recognized as an internal or external command,\noperable program or batch file.`;
    }

    return output;
  }, [currentFolderId, currentPath, getFolderContents, addFile, deleteFile, changeDirectory]);

  // Handle input submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
        setHistory(prev => [...prev, `${currentPath}>`]);
        setInputValue('');
        return;
    }

    const output = executeCommand(inputValue);
    
    if (output === '__CLEAR__') {
      setHistory([`${currentPath}>`]);
    } else {
      setHistory(prev => [
        ...prev,
        `${currentPath}>${inputValue}`,
        ...(output ? [output] : []),
        '',
        `${currentPath}>`,
      ]);
    }
    
    setCommandHistory(prev => [...prev, inputValue]);
    setHistoryIndex(-1);
    setInputValue('');
  };

  // Handle arrow keys for command history
  const handleKeyDown = (e) => {
    // Ctrl+C to clear input
    if (e.ctrlKey && e.key === 'c') {
       e.preventDefault();
       setHistory(prev => [...prev, `${currentPath}>${inputValue}^C`, '']);
       setInputValue('');
       return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  return (
    <div 
      className="terminal-app"
      onClick={handleClick}
      style={{ color: textColor }}
    >
      <div className="terminal-output" ref={outputRef}>
        {history.map((line, i) => (
          <div key={i} className="terminal-line">
            <pre>{line}</pre>
          </div>
        ))}
        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span>{currentPath}&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            autoFocus
            spellCheck={false}
            style={{ color: textColor }}
          />
        </form>
      </div>
    </div>
  );
}
