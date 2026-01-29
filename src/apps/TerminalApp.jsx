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
  const { getDesktopFiles, getFolderContents, getFile, createFolder, deleteFile } = useFileSystem();
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  
  const [history, setHistory] = useState([
    'Microsoft(R) Windows 95',
    '   (C)Copyright Microsoft Corp 1981-1995.',
    '',
    'C:\\>',
  ]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState('C:\\');
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

  // Execute command
  const executeCommand = useCallback((cmd) => {
    const trimmedCmd = cmd.trim();
    const [command, ...args] = trimmedCmd.split(' ');
    const lowerCmd = command.toLowerCase();

    let output = '';

    // Built-in commands
    if (COMMANDS[lowerCmd]) {
      output = COMMANDS[lowerCmd].execute(args);
    } else if (lowerCmd === 'dir' || lowerCmd === 'ls') {
      const files = getDesktopFiles();
      output = `
 Directory of ${currentPath}

`;
      files.forEach(file => {
        const date = new Date().toLocaleDateString();
        const type = file.type === 'folder' ? '<DIR>' : '     ';
        output += ` ${date}  ${type}    ${file.name}\n`;
      });
      output += `\n        ${files.length} File(s)`;
    } else if (lowerCmd === 'echo') {
      output = args.join(' ');
    } else if (lowerCmd === 'color' && args[0]) {
      const colors = {
        '0': '#000000', '1': '#0000aa', '2': '#00aa00', '3': '#00aaaa',
        '4': '#aa0000', '5': '#aa00aa', '6': '#aa5500', '7': '#aaaaaa',
        '8': '#555555', '9': '#5555ff', 'a': '#55ff55', 'b': '#55ffff',
        'c': '#ff5555', 'd': '#ff55ff', 'e': '#ffff55', 'f': '#ffffff',
      };
      const newColor = colors[args[0].toLowerCase()];
      if (newColor) {
        setTextColor(newColor);
        output = '';
      } else {
        output = 'Invalid color code.';
      }
    } else if (lowerCmd === 'tree') {
      const files = getDesktopFiles();
      output = `${currentPath}\n`;
      files.forEach((file, i) => {
        const isLast = i === files.length - 1;
        const prefix = isLast ? '└──' : '├──';
        output += `${prefix} ${file.icon} ${file.name}\n`;
      });
    } else if (lowerCmd === 'type' && args[0]) {
      const fileName = args.join(' ');
      const files = getDesktopFiles();
      const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      if (file && file.content) {
        output = file.content;
      } else {
        output = `The system cannot find the file specified.`;
      }
    } else if (lowerCmd === 'mkdir' && args[0]) {
      createFolder();
      output = `Directory created.`;
    } else if (lowerCmd === 'del' && args[0]) {
      const fileName = args.join(' ');
      const files = getDesktopFiles();
      const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      if (file) {
        deleteFile(file.id);
        output = `File deleted.`;
      } else {
        output = `Could Not Find ${fileName}`;
      }
    } else if (lowerCmd === 'cd' && args[0]) {
      output = `${args[0]}`;
      // Simplified - just show the folder name
    } else if (lowerCmd === 'format' && args[0]?.toLowerCase() === 'c:') {
      output = `
WARNING: ALL DATA ON NON-REMOVABLE DISK
DRIVE C: WILL BE LOST!
Proceed with Format (Y/N)?

...Just kidding! Nice try though 😈
`;
    } else if (lowerCmd === 'exit') {
      output = 'Type "exit" in real life to close this window.';
    } else if (trimmedCmd === '') {
      output = '';
    } else {
      output = `'${command}' is not recognized as an internal or external command,
operable program or batch file.`;
    }

    return output;
  }, [getDesktopFiles, currentPath, createFolder, deleteFile]);

  // Handle input submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const output = executeCommand(inputValue);
    
    if (output === '__CLEAR__') {
      setHistory([`${currentPath}>`]);
    } else {
      setHistory(prev => [
        ...prev,
        `${currentPath}>${inputValue}`,
        output,
        '',
        `${currentPath}>`,
      ]);
    }
    
    if (inputValue.trim()) {
      setCommandHistory(prev => [...prev, inputValue]);
    }
    setHistoryIndex(-1);
    setInputValue('');
  };

  // Handle arrow keys for command history
  const handleKeyDown = (e) => {
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
