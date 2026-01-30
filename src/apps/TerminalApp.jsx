import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { Shell } from '../utils/Shell';

export default function TerminalApp() {
  const fileSystem = useFileSystem();

  const inputRef = useRef(null);
  const outputRef = useRef(null);

  // Create shell instance with memoization
  const shell = useMemo(() => {
    const sh = new Shell(fileSystem);
    return sh;
  }, [fileSystem]);

  const [history, setHistory] = useState([
    'Microsoft(R) Windows 95',
    '   (C)Copyright Microsoft Corp 1981-1995.',
    '',
    `${shell.getCwd()}>`,
  ]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [textColor, setTextColor] = useState('#c0c0c0');

  // Set up shell callbacks
  useEffect(() => {
    shell.onClear = () => {
      setHistory([`${shell.getCwd()}>`]);
    };

    shell.onExit = () => {
      setHistory(prev => [
        ...prev,
        'Type "exit" in real life to close this window.',
        '',
        `${shell.getCwd()}>`,
      ]);
    };

    shell.onColorChange = (color) => {
      setTextColor(color);
    };

    shell.onBsod = () => {
      window.dispatchEvent(new Event('trigger-bsod'));
    };

    return () => {
      shell.onClear = null;
      shell.onExit = null;
      shell.onColorChange = null;
      shell.onBsod = null;
    };
  }, [shell]);

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

  // Execute command using shell
  const executeCommand = useCallback((cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return { stdout: '', stderr: '', exitCode: 0 };

    return shell.execute(trimmedCmd);
  }, [shell]);

  // Handle input submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const currentPath = shell.getCwd();

    if (!inputValue.trim()) {
      setHistory(prev => [...prev, `${currentPath}>`]);
      setInputValue('');
      return;
    }

    const result = executeCommand(inputValue);

    // Check if clear was triggered (history would be reset by callback)
    const cmd = inputValue.trim().toLowerCase();
    const wasClear = result.stdout === '' && result.stderr === '' &&
                     (cmd === 'cls' || cmd === 'clear');

    if (!wasClear) {
      const newCwd = shell.getCwd();
      const lines = [];

      // Add command line
      lines.push(`${currentPath}>${inputValue}`);

      // Add stdout if present
      if (result.stdout) {
        lines.push(result.stdout);
      }

      // Add stderr if present (could style differently if needed)
      if (result.stderr) {
        lines.push(result.stderr);
      }

      // Add empty line and new prompt
      lines.push('');
      lines.push(`${newCwd}>`);

      setHistory(prev => [...prev, ...lines]);
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
      const currentPath = shell.getCwd();
      setHistory(prev => [...prev, `${currentPath}>${inputValue}^C`, '']);
      setInputValue('');
      return;
    }

    // Tab completion (basic implementation)
    if (e.key === 'Tab') {
      e.preventDefault();
      const parts = inputValue.split(' ');
      const lastPart = parts[parts.length - 1];

      if (lastPart) {
        // Try to find matching files/folders
        const contents = fileSystem.getFolderContents(shell.currentFolderId);
        const matches = contents.filter(f =>
          f.name.toLowerCase().startsWith(lastPart.toLowerCase())
        );

        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0].name;
          setInputValue(parts.join(' '));
        } else if (matches.length > 1) {
          // Show all matches
          const currentPath = shell.getCwd();
          setHistory(prev => [
            ...prev,
            `${currentPath}>${inputValue}`,
            matches.map(m => m.name).join('  '),
            '',
            `${currentPath}>`,
          ]);
        }
      }
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
          <span>{shell.getCwd()}&gt;</span>
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
