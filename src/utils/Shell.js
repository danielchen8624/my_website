/**
 * Shell.js - A Unix-like shell engine for the Windows 95 terminal emulator
 *
 * Features:
 * - Pipes (|)
 * - Redirection (>, >>)
 * - Command chaining (&&, ;)
 * - Advanced commands with flags
 */

// Token types for the lexer
const TokenType = {
  WORD: 'WORD',
  PIPE: 'PIPE',           // |
  REDIRECT: 'REDIRECT',   // >
  APPEND: 'APPEND',       // >>
  AND: 'AND',             // &&
  SEMICOLON: 'SEMICOLON', // ;
  EOF: 'EOF',
};

/**
 * Tokenizer - Breaks input into tokens, respecting quotes and operators
 */
function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    // Skip whitespace
    if (/\s/.test(input[i])) {
      i++;
      continue;
    }

    // Check for operators (order matters: >> before >)
    if (input.slice(i, i + 2) === '>>') {
      tokens.push({ type: TokenType.APPEND, value: '>>' });
      i += 2;
      continue;
    }
    if (input.slice(i, i + 2) === '&&') {
      tokens.push({ type: TokenType.AND, value: '&&' });
      i += 2;
      continue;
    }
    if (input[i] === '|') {
      tokens.push({ type: TokenType.PIPE, value: '|' });
      i++;
      continue;
    }
    if (input[i] === '>') {
      tokens.push({ type: TokenType.REDIRECT, value: '>' });
      i++;
      continue;
    }
    if (input[i] === ';') {
      tokens.push({ type: TokenType.SEMICOLON, value: ';' });
      i++;
      continue;
    }

    // Handle quoted strings
    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i];
      i++;
      let word = '';
      while (i < input.length && input[i] !== quote) {
        // Handle escape sequences
        if (input[i] === '\\' && i + 1 < input.length) {
          i++;
          word += input[i];
        } else {
          word += input[i];
        }
        i++;
      }
      i++; // Skip closing quote
      tokens.push({ type: TokenType.WORD, value: word });
      continue;
    }

    // Regular word (no spaces, no operators)
    let word = '';
    while (i < input.length && !/[\s|><;&]/.test(input[i])) {
      // Handle escape sequences outside quotes
      if (input[i] === '\\' && i + 1 < input.length) {
        i++;
        word += input[i];
      } else {
        word += input[i];
      }
      i++;
    }
    if (word) {
      tokens.push({ type: TokenType.WORD, value: word });
    }
  }

  tokens.push({ type: TokenType.EOF, value: '' });
  return tokens;
}

/**
 * Parser - Builds an AST from tokens
 *
 * Grammar:
 *   pipeline_list := pipeline ((AND | SEMICOLON) pipeline)*
 *   pipeline := command (PIPE command)*
 *   command := WORD+ (REDIRECT WORD | APPEND WORD)?
 */
function parse(tokens) {
  let pos = 0;

  function current() {
    return tokens[pos] || { type: TokenType.EOF, value: '' };
  }

  function advance() {
    return tokens[pos++];
  }

  function parseCommand() {
    const words = [];
    let redirect = null;

    // Collect words until we hit an operator
    while (current().type === TokenType.WORD) {
      words.push(advance().value);
    }

    // Check for redirection
    if (current().type === TokenType.REDIRECT) {
      advance();
      if (current().type === TokenType.WORD) {
        redirect = { type: 'overwrite', file: advance().value };
      }
    } else if (current().type === TokenType.APPEND) {
      advance();
      if (current().type === TokenType.WORD) {
        redirect = { type: 'append', file: advance().value };
      }
    }

    if (words.length === 0) {
      return null;
    }

    return {
      type: 'command',
      name: words[0],
      args: words.slice(1),
      redirect,
    };
  }

  function parsePipeline() {
    const commands = [];
    const first = parseCommand();
    if (!first) return null;
    commands.push(first);

    while (current().type === TokenType.PIPE) {
      advance();
      const next = parseCommand();
      if (next) {
        commands.push(next);
      }
    }

    return {
      type: 'pipeline',
      commands,
    };
  }

  function parsePipelineList() {
    const pipelines = [];
    const operators = [];

    const first = parsePipeline();
    if (!first) return { type: 'list', pipelines: [], operators: [] };
    pipelines.push(first);

    while (current().type === TokenType.AND || current().type === TokenType.SEMICOLON) {
      operators.push(advance().value);
      const next = parsePipeline();
      if (next) {
        pipelines.push(next);
      }
    }

    return {
      type: 'list',
      pipelines,
      operators,
    };
  }

  return parsePipelineList();
}

/**
 * Parse command-line flags/options
 */
function parseArgs(args) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      // Long flag: --recursive or --name=value
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value !== undefined ? value : true;
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short flags: -r, -la, -n 5
      const shortFlags = arg.slice(1);
      for (const char of shortFlags) {
        // Check if next arg is a value for this flag (e.g., -n 5)
        if (i + 1 < args.length && !args[i + 1].startsWith('-') && shortFlags.length === 1) {
          // This might be a value - check if flag typically takes values
          const valueTakingFlags = ['n', 'c'];
          if (valueTakingFlags.includes(char)) {
            flags[char] = args[++i];
            continue;
          }
        }
        flags[char] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

/**
 * Shell class - Main shell engine
 */
export class Shell {
  constructor(fileSystemContext) {
    this.fs = fileSystemContext;
    this.currentPath = 'C:\\Desktop';
    this.currentFolderId = 'desktop';
    this.env = {
      USER: 'Daniel',
      HOME: 'C:\\Desktop',
      SHELL: '/bin/bash',
    };
    this.lastExitCode = 0;

    // Callbacks for special operations
    this.onClear = null;
    this.onExit = null;
    this.onColorChange = null;
    this.onBsod = null;
  }

  /**
   * Get current working directory
   */
  getCwd() {
    return this.currentPath;
  }

  /**
   * Resolve a path relative to current directory
   * Returns { id, path } or null if not found
   */
  resolvePath(targetPath) {
    if (!targetPath) return { id: this.currentFolderId, path: this.currentPath };

    // Normalize separators
    targetPath = targetPath.replace(/\//g, '\\');

    // Handle absolute paths
    if (targetPath.startsWith('C:\\') || targetPath.startsWith('\\')) {
      const file = this.fs.findFileByPath(targetPath);
      if (file) {
        return { id: file.id, path: this.fs.getFilePath(file.id) };
      }
      return null;
    }

    // Handle relative paths
    const parts = targetPath.split('\\').filter(Boolean);
    let currentId = this.currentFolderId;
    let currentPathParts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        const parent = this.fs.findParent(currentId);
        if (parent) {
          currentId = parent.id;
          currentPathParts.pop();
        }
      } else {
        const contents = this.fs.getFolderContents(currentId);
        const child = contents.find(f => f.name.toLowerCase() === part.toLowerCase());
        if (child) {
          currentId = child.id;
          currentPathParts.push(child.name);
        } else {
          return null;
        }
      }
    }

    return { id: currentId, path: currentPathParts.join('\\') };
  }

  /**
   * Execute a command string
   * Returns { stdout, stderr, exitCode }
   */
  execute(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    try {
      const tokens = tokenize(trimmed);
      const ast = parse(tokens);
      return this.executeAST(ast, '');
    } catch (err) {
      return { stdout: '', stderr: `Error: ${err.message}`, exitCode: 1 };
    }
  }

  /**
   * Execute parsed AST
   */
  executeAST(ast, stdin) {
    if (ast.type === 'list') {
      return this.executeList(ast, stdin);
    } else if (ast.type === 'pipeline') {
      return this.executePipeline(ast, stdin);
    } else if (ast.type === 'command') {
      return this.executeCommand(ast, stdin);
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  /**
   * Execute a list of pipelines with && or ;
   */
  executeList(ast, stdin) {
    let result = { stdout: '', stderr: '', exitCode: 0 };
    let allStdout = [];
    let allStderr = [];

    for (let i = 0; i < ast.pipelines.length; i++) {
      // Check if we should continue based on previous result and operator
      if (i > 0) {
        const operator = ast.operators[i - 1];
        if (operator === '&&' && result.exitCode !== 0) {
          // Short-circuit: && fails if previous failed
          break;
        }
        // ; always continues
      }

      result = this.executePipeline(ast.pipelines[i], stdin);
      if (result.stdout) allStdout.push(result.stdout);
      if (result.stderr) allStderr.push(result.stderr);
    }

    this.lastExitCode = result.exitCode;
    return {
      stdout: allStdout.join('\n'),
      stderr: allStderr.join('\n'),
      exitCode: result.exitCode,
    };
  }

  /**
   * Execute a pipeline (commands connected by |)
   */
  executePipeline(ast, stdin) {
    let currentStdin = stdin;
    let result = { stdout: '', stderr: '', exitCode: 0 };
    let allStderr = [];

    for (const cmd of ast.commands) {
      result = this.executeCommand(cmd, currentStdin);
      if (result.stderr) allStderr.push(result.stderr);
      currentStdin = result.stdout;
    }

    return {
      stdout: result.stdout,
      stderr: allStderr.join('\n'),
      exitCode: result.exitCode,
    };
  }

  /**
   * Execute a single command
   */
  executeCommand(cmd, stdin) {
    const { name, args, redirect } = cmd;
    const lowerName = name.toLowerCase();

    // Get the command handler
    const handler = this.commands[lowerName];
    if (!handler) {
      return {
        stdout: '',
        stderr: `'${name}' is not recognized as an internal or external command,\noperable program or batch file.`,
        exitCode: 127,
      };
    }

    // Execute the command
    let result;
    try {
      result = handler.call(this, args, stdin);
    } catch (err) {
      return { stdout: '', stderr: `Error: ${err.message}`, exitCode: 1 };
    }

    // Handle special return values
    if (result === '__CLEAR__') {
      this.onClear?.();
      return { stdout: '', stderr: '', exitCode: 0 };
    }
    if (result === '__EXIT__') {
      this.onExit?.();
      return { stdout: '', stderr: '', exitCode: 0 };
    }
    if (result === '__BSOD__') {
      this.onBsod?.();
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // Normalize result
    if (typeof result === 'string') {
      result = { stdout: result, stderr: '', exitCode: 0 };
    }

    // Handle redirection
    if (redirect && result.stdout) {
      const resolved = this.resolvePath(redirect.file);

      if (resolved) {
        // File exists - update it
        const file = this.fs.getFile(resolved.id);
        if (file && file.type === 'file') {
          const newContent = redirect.type === 'append'
            ? (file.content || '') + result.stdout
            : result.stdout;
          this.fs.updateFileContent(resolved.id, newContent);
          return { stdout: '', stderr: '', exitCode: 0 };
        } else if (file) {
          return { stdout: '', stderr: `Cannot redirect to directory: ${redirect.file}`, exitCode: 1 };
        }
      }

      // File doesn't exist - create it
      const pathParts = redirect.file.replace(/\//g, '\\').split('\\');
      const fileName = pathParts.pop();
      const parentPath = pathParts.length > 0 ? pathParts.join('\\') : null;

      let parentId = this.currentFolderId;
      if (parentPath) {
        const parentResolved = this.resolvePath(parentPath);
        if (!parentResolved) {
          return { stdout: '', stderr: `No such directory: ${parentPath}`, exitCode: 1 };
        }
        parentId = parentResolved.id;
      }

      this.fs.addFile({
        name: fileName,
        type: 'file',
        icon: 'notepad',
        content: result.stdout,
        appType: 'notepad',
      }, parentId);

      return { stdout: '', stderr: '', exitCode: 0 };
    }

    return result;
  }

  /**
   * Built-in commands
   */
  commands = {
    // Help
    help: () => {
      return `
Available commands:
  help              - Display this help message
  ls / dir [-la]    - List files in directory
  cd [path]         - Change directory
  pwd               - Print working directory
  cat [files...]    - Display file contents
  type [file]       - Display file contents (alias for cat)
  head [-n N] file  - Display first N lines (default 10)
  tail [-n N] file  - Display last N lines (default 10)
  grep pattern file - Search for pattern in file
  echo [text]       - Display text
  mkdir [name]      - Create directory
  touch [name]      - Create empty file
  cp [-r] src dst   - Copy file or directory
  mv src dst        - Move/rename file or directory
  rm [-r] path      - Remove file or directory
  cls / clear       - Clear screen
  date              - Display date and time
  ver               - Display version
  whoami            - Display current user
  color [0-f]       - Change text color
  env               - Display environment variables
  exit              - Close terminal

Operators:
  cmd1 | cmd2       - Pipe output of cmd1 to cmd2
  cmd > file        - Redirect output to file (overwrite)
  cmd >> file       - Redirect output to file (append)
  cmd1 && cmd2      - Run cmd2 only if cmd1 succeeds
  cmd1 ; cmd2       - Run cmd2 after cmd1
`;
    },

    // Version
    ver: () => `
Microsoft(R) Windows 95
   (C)Copyright Microsoft Corp 1981-1995.

RetroOS Terminal Emulator v2.0
Now with pipes and redirections!
`,

    // Date
    date: () => {
      const now = new Date();
      return `
Current date is: ${now.toLocaleDateString()}
Current time is: ${now.toLocaleTimeString()}
`;
    },

    // Whoami
    whoami: () => `RETROOS\\${this.env.USER}`,

    // Clear
    cls: () => '__CLEAR__',
    clear: () => '__CLEAR__',

    // Exit
    exit: () => '__EXIT__',

    // Echo
    echo: (args) => args.join(' '),

    // Print working directory
    pwd: () => this.currentPath,

    // Environment variables
    env: () => {
      return Object.entries(this.env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
    },

    // Color
    color: (args) => {
      const colors = {
        '0': '#000000', '1': '#0000aa', '2': '#00aa00', '3': '#00aaaa',
        '4': '#aa0000', '5': '#aa00aa', '6': '#aa5500', '7': '#aaaaaa',
        '8': '#555555', '9': '#5555ff', 'a': '#55ff55', 'b': '#55ffff',
        'c': '#ff5555', 'd': '#ff55ff', 'e': '#ffff55', 'f': '#ffffff',
      };
      const colorCode = args[0]?.toLowerCase();
      if (colors[colorCode]) {
        this.onColorChange?.(colors[colorCode]);
        return { stdout: '', stderr: '', exitCode: 0 };
      }
      return { stdout: '', stderr: 'Invalid color code. Use 0-9 or a-f.', exitCode: 1 };
    },

    // List directory
    ls: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const showAll = flags.a || flags.l?.includes?.('a');
      const longFormat = flags.l;

      const targetPath = positional[0];
      let folderId = this.currentFolderId;
      let displayPath = this.currentPath;

      if (targetPath) {
        const resolved = this.resolvePath(targetPath);
        if (!resolved) {
          return { stdout: '', stderr: `ls: cannot access '${targetPath}': No such file or directory`, exitCode: 1 };
        }
        folderId = resolved.id;
        displayPath = resolved.path;
      }

      const contents = this.fs.getFolderContents(folderId);

      if (contents.length === 0) {
        return '';
      }

      let output = '';

      if (longFormat) {
        output += `total ${contents.length}\n`;
        for (const file of contents) {
          const isDir = file.type === 'folder' || file.type === 'system' || file.type === 'system-folder';
          const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = file.content?.length || 0;
          const date = 'Jan 30 12:00';
          output += `${perms}  1 ${this.env.USER}  ${String(size).padStart(6)}  ${date}  ${file.name}\n`;
        }
      } else {
        output = contents.map(f => f.name).join('  ');
      }

      return output;
    },

    // Alias for ls
    dir: function(args, stdin) {
      // Windows-style dir output
      const { flags, positional } = parseArgs(args);

      const targetPath = positional[0];
      let folderId = this.currentFolderId;
      let displayPath = this.currentPath;

      if (targetPath) {
        const resolved = this.resolvePath(targetPath);
        if (!resolved) {
          return { stdout: '', stderr: `The system cannot find the path specified.`, exitCode: 1 };
        }
        folderId = resolved.id;
        displayPath = resolved.path;
      }

      const contents = this.fs.getFolderContents(folderId);

      let output = `\n Directory of ${displayPath}\n\n`;

      if (contents.length === 0) {
        output += 'File Not Found\n';
      } else {
        for (const file of contents) {
          const date = new Date().toLocaleDateString();
          const isDir = file.type === 'folder' || file.type === 'system' || file.type === 'system-folder';
          const type = isDir ? '<DIR>' : '     ';
          output += ` ${date}  ${type}    ${file.name}\n`;
        }
        output += `\n        ${contents.length} File(s)`;
      }

      return output;
    },

    // Change directory
    cd: (args) => {
      const targetPath = args.join(' ');

      if (!targetPath) {
        return this.currentPath;
      }

      // Handle special cases
      if (targetPath === '\\' || targetPath === '/') {
        this.currentFolderId = 'desktop';
        this.currentPath = 'C:\\Desktop';
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      if (targetPath === '.') {
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      if (targetPath === '..') {
        if (this.currentFolderId === 'desktop') {
          return { stdout: '', stderr: 'Already at root directory', exitCode: 0 };
        }
        const parent = this.fs.findParent(this.currentFolderId);
        if (parent) {
          this.currentFolderId = parent.id;
          this.currentPath = this.fs.getFilePath(parent.id);
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      const resolved = this.resolvePath(targetPath);
      if (!resolved) {
        return { stdout: '', stderr: 'The system cannot find the path specified.', exitCode: 1 };
      }

      const file = this.fs.getFile(resolved.id);
      if (file.type === 'file') {
        return { stdout: '', stderr: 'The directory name is invalid.', exitCode: 1 };
      }

      this.currentFolderId = resolved.id;
      this.currentPath = resolved.path;
      return { stdout: '', stderr: '', exitCode: 0 };
    },

    // Create directory
    mkdir: (args) => {
      const { positional } = parseArgs(args);

      if (positional.length === 0) {
        return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 };
      }

      for (const dirName of positional) {
        // Check if it's a path or just a name
        const pathParts = dirName.replace(/\//g, '\\').split('\\');
        const name = pathParts.pop();
        let parentId = this.currentFolderId;

        if (pathParts.length > 0) {
          const parentResolved = this.resolvePath(pathParts.join('\\'));
          if (!parentResolved) {
            return { stdout: '', stderr: `mkdir: cannot create directory '${dirName}': No such file or directory`, exitCode: 1 };
          }
          parentId = parentResolved.id;
        }

        // Check if already exists
        const contents = this.fs.getFolderContents(parentId);
        if (contents.some(f => f.name.toLowerCase() === name.toLowerCase())) {
          return { stdout: '', stderr: `mkdir: cannot create directory '${name}': File exists`, exitCode: 1 };
        }

        this.fs.addFile({
          name: name,
          type: 'folder',
          icon: 'folder',
          position: { x: 50, y: 50 },
          children: [],
          appType: 'explorer',
        }, parentId);
      }

      return { stdout: '', stderr: '', exitCode: 0 };
    },

    // Alias for mkdir
    md: function(args) {
      return this.commands.mkdir.call(this, args);
    },

    // Create file
    touch: (args) => {
      const { positional } = parseArgs(args);

      if (positional.length === 0) {
        return { stdout: '', stderr: 'touch: missing file operand', exitCode: 1 };
      }

      for (const fileName of positional) {
        const pathParts = fileName.replace(/\//g, '\\').split('\\');
        const name = pathParts.pop();
        let parentId = this.currentFolderId;

        if (pathParts.length > 0) {
          const parentResolved = this.resolvePath(pathParts.join('\\'));
          if (!parentResolved) {
            return { stdout: '', stderr: `touch: cannot touch '${fileName}': No such file or directory`, exitCode: 1 };
          }
          parentId = parentResolved.id;
        }

        // Check if already exists - if so, just "update" it (no-op for us)
        const contents = this.fs.getFolderContents(parentId);
        if (contents.some(f => f.name.toLowerCase() === name.toLowerCase())) {
          continue; // File exists, skip (in real touch, this updates timestamp)
        }

        this.fs.addFile({
          name: name,
          type: 'file',
          icon: 'notepad',
          position: { x: 50, y: 50 },
          content: '',
          appType: 'notepad',
        }, parentId);
      }

      return { stdout: '', stderr: '', exitCode: 0 };
    },

    // Cat - display file contents
    cat: (args, stdin) => {
      const { positional } = parseArgs(args);

      // If no files specified, return stdin (for piping)
      if (positional.length === 0) {
        return stdin || '';
      }

      let output = '';

      for (const filePath of positional) {
        const resolved = this.resolvePath(filePath);
        if (!resolved) {
          return { stdout: '', stderr: `cat: ${filePath}: No such file or directory`, exitCode: 1 };
        }

        const file = this.fs.getFile(resolved.id);
        if (file.type === 'folder' || file.type === 'system' || file.type === 'system-folder') {
          return { stdout: '', stderr: `cat: ${filePath}: Is a directory`, exitCode: 1 };
        }

        output += file.content || '';
      }

      return output;
    },

    // Type - alias for cat
    type: function(args, stdin) {
      return this.commands.cat.call(this, args, stdin);
    },

    // Head - show first N lines
    head: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const numLines = parseInt(flags.n) || 10;

      let content = '';

      if (positional.length === 0) {
        content = stdin || '';
      } else {
        const resolved = this.resolvePath(positional[0]);
        if (!resolved) {
          return { stdout: '', stderr: `head: ${positional[0]}: No such file or directory`, exitCode: 1 };
        }
        const file = this.fs.getFile(resolved.id);
        if (file.type !== 'file') {
          return { stdout: '', stderr: `head: ${positional[0]}: Is a directory`, exitCode: 1 };
        }
        content = file.content || '';
      }

      const lines = content.split('\n');
      return lines.slice(0, numLines).join('\n');
    },

    // Tail - show last N lines
    tail: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const numLines = parseInt(flags.n) || 10;

      let content = '';

      if (positional.length === 0) {
        content = stdin || '';
      } else {
        const resolved = this.resolvePath(positional[0]);
        if (!resolved) {
          return { stdout: '', stderr: `tail: ${positional[0]}: No such file or directory`, exitCode: 1 };
        }
        const file = this.fs.getFile(resolved.id);
        if (file.type !== 'file') {
          return { stdout: '', stderr: `tail: ${positional[0]}: Is a directory`, exitCode: 1 };
        }
        content = file.content || '';
      }

      const lines = content.split('\n');
      return lines.slice(-numLines).join('\n');
    },

    // Grep - search for pattern
    grep: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const ignoreCase = flags.i;
      const showLineNumbers = flags.n;
      const invertMatch = flags.v;

      if (positional.length === 0) {
        return { stdout: '', stderr: 'grep: missing pattern', exitCode: 1 };
      }

      const pattern = positional[0];
      let content = '';

      if (positional.length === 1) {
        // Read from stdin
        content = stdin || '';
      } else {
        // Read from file
        const resolved = this.resolvePath(positional[1]);
        if (!resolved) {
          return { stdout: '', stderr: `grep: ${positional[1]}: No such file or directory`, exitCode: 1 };
        }
        const file = this.fs.getFile(resolved.id);
        if (file.type !== 'file') {
          return { stdout: '', stderr: `grep: ${positional[1]}: Is a directory`, exitCode: 1 };
        }
        content = file.content || '';
      }

      const lines = content.split('\n');
      const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
      const matches = [];

      lines.forEach((line, index) => {
        const matches_pattern = regex.test(line);
        if (invertMatch ? !matches_pattern : matches_pattern) {
          if (showLineNumbers) {
            matches.push(`${index + 1}:${line}`);
          } else {
            matches.push(line);
          }
        }
      });

      if (matches.length === 0) {
        return { stdout: '', stderr: '', exitCode: 1 }; // grep returns 1 if no matches
      }

      return matches.join('\n');
    },

    // Copy file/directory
    cp: (args) => {
      const { flags, positional } = parseArgs(args);
      const recursive = flags.r || flags.R;

      if (positional.length < 2) {
        return { stdout: '', stderr: 'cp: missing destination file operand', exitCode: 1 };
      }

      const srcPath = positional[0];
      const dstPath = positional[1];

      const srcResolved = this.resolvePath(srcPath);
      if (!srcResolved) {
        return { stdout: '', stderr: `cp: cannot stat '${srcPath}': No such file or directory`, exitCode: 1 };
      }

      const srcFile = this.fs.getFile(srcResolved.id);
      const isDir = srcFile.type === 'folder' || srcFile.type === 'system-folder';

      if (isDir && !recursive) {
        return { stdout: '', stderr: `cp: -r not specified; omitting directory '${srcPath}'`, exitCode: 1 };
      }

      if (srcFile.type === 'system') {
        return { stdout: '', stderr: `cp: cannot copy '${srcPath}': Permission denied`, exitCode: 1 };
      }

      // Determine destination
      const dstResolved = this.resolvePath(dstPath);
      let dstParentId, dstName;

      if (dstResolved) {
        const dstFile = this.fs.getFile(dstResolved.id);
        if (dstFile.type === 'folder' || dstFile.type === 'system-folder') {
          // Copying into a directory
          dstParentId = dstResolved.id;
          dstName = srcFile.name;
        } else {
          // Overwriting a file
          dstParentId = this.fs.findParent(dstResolved.id)?.id || this.currentFolderId;
          dstName = dstFile.name;
          // Delete existing file first
          this.fs.permanentlyDelete(dstResolved.id);
        }
      } else {
        // New file/folder
        const pathParts = dstPath.replace(/\//g, '\\').split('\\');
        dstName = pathParts.pop();

        if (pathParts.length > 0) {
          const parentResolved = this.resolvePath(pathParts.join('\\'));
          if (!parentResolved) {
            return { stdout: '', stderr: `cp: cannot create '${dstPath}': No such file or directory`, exitCode: 1 };
          }
          dstParentId = parentResolved.id;
        } else {
          dstParentId = this.currentFolderId;
        }
      }

      // Recursive copy helper
      const copyRecursive = (fileId, parentId, newName) => {
        const file = this.fs.getFile(fileId);
        const isFolder = file.type === 'folder' || file.type === 'system-folder';

        const newFile = {
          name: newName || file.name,
          type: file.type === 'system-folder' ? 'folder' : file.type,
          icon: file.icon,
          position: { x: 50, y: 50 },
          content: file.content,
          appType: file.appType,
          children: isFolder ? [] : undefined,
        };

        const newId = this.fs.addFile(newFile, parentId);

        if (isFolder && file.children) {
          for (const childId of file.children) {
            copyRecursive(childId, newId);
          }
        }

        return newId;
      };

      copyRecursive(srcResolved.id, dstParentId, dstName);
      return { stdout: '', stderr: '', exitCode: 0 };
    },

    // Move/rename file
    mv: (args) => {
      const { positional } = parseArgs(args);

      if (positional.length < 2) {
        return { stdout: '', stderr: 'mv: missing destination file operand', exitCode: 1 };
      }

      const srcPath = positional[0];
      const dstPath = positional[1];

      const srcResolved = this.resolvePath(srcPath);
      if (!srcResolved) {
        return { stdout: '', stderr: `mv: cannot stat '${srcPath}': No such file or directory`, exitCode: 1 };
      }

      const srcFile = this.fs.getFile(srcResolved.id);

      if (srcFile.type === 'system') {
        return { stdout: '', stderr: `mv: cannot move '${srcPath}': Permission denied`, exitCode: 1 };
      }

      const dstResolved = this.resolvePath(dstPath);

      if (dstResolved) {
        const dstFile = this.fs.getFile(dstResolved.id);
        if (dstFile.type === 'folder' || dstFile.type === 'system-folder') {
          // Move into directory
          this.fs.moveFileToFolder(srcResolved.id, dstResolved.id);
          return { stdout: '', stderr: '', exitCode: 0 };
        }
      }

      // Rename or move to new location
      const pathParts = dstPath.replace(/\//g, '\\').split('\\');
      const newName = pathParts.pop();

      if (pathParts.length > 0) {
        const parentResolved = this.resolvePath(pathParts.join('\\'));
        if (!parentResolved) {
          return { stdout: '', stderr: `mv: cannot move '${srcPath}' to '${dstPath}': No such file or directory`, exitCode: 1 };
        }
        this.fs.moveFileToFolder(srcResolved.id, parentResolved.id);
      }

      // Rename
      this.fs.renameFile(srcResolved.id, newName);
      return { stdout: '', stderr: '', exitCode: 0 };
    },

    // Remove file/directory
    rm: (args) => {
      const { flags, positional } = parseArgs(args);
      const recursive = flags.r || flags.R || flags.f;
      const force = flags.f;

      // Easter egg: rm -rf / or similar dangerous commands
      const fullArg = args.join(' ').toLowerCase();
      if (
        (fullArg.includes('system32')) ||
        ((fullArg.includes('-rf') || fullArg.includes('-r')) &&
         (fullArg.includes('/') || fullArg.includes('\\')))
      ) {
        return '__BSOD__';
      }

      if (positional.length === 0) {
        return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 };
      }

      for (const path of positional) {
        const resolved = this.resolvePath(path);
        if (!resolved) {
          if (force) continue;
          return { stdout: '', stderr: `rm: cannot remove '${path}': No such file or directory`, exitCode: 1 };
        }

        const file = this.fs.getFile(resolved.id);

        if (file.type === 'system') {
          return { stdout: '', stderr: `rm: cannot remove '${path}': Permission denied`, exitCode: 1 };
        }

        const isDir = file.type === 'folder' || file.type === 'system-folder';

        if (isDir && !recursive) {
          return { stdout: '', stderr: `rm: cannot remove '${path}': Is a directory`, exitCode: 1 };
        }

        // Find parent and remove from it
        const parent = this.fs.findParent(resolved.id);
        if (parent) {
          this.fs.deleteFile(resolved.id, parent.id);
        }
      }

      return { stdout: '', stderr: '', exitCode: 0 };
    },

    // Alias for rm
    del: function(args) {
      return this.commands.rm.call(this, args);
    },

    // Wc - word/line/character count
    wc: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const showLines = flags.l;
      const showWords = flags.w;
      const showChars = flags.c || flags.m;

      let content = '';

      if (positional.length === 0) {
        content = stdin || '';
      } else {
        const resolved = this.resolvePath(positional[0]);
        if (!resolved) {
          return { stdout: '', stderr: `wc: ${positional[0]}: No such file or directory`, exitCode: 1 };
        }
        const file = this.fs.getFile(resolved.id);
        if (file.type !== 'file') {
          return { stdout: '', stderr: `wc: ${positional[0]}: Is a directory`, exitCode: 1 };
        }
        content = file.content || '';
      }

      const lines = content.split('\n').length;
      const words = content.split(/\s+/).filter(Boolean).length;
      const chars = content.length;

      // If no flags, show all
      if (!showLines && !showWords && !showChars) {
        return `  ${lines}  ${words}  ${chars}`;
      }

      const parts = [];
      if (showLines) parts.push(lines);
      if (showWords) parts.push(words);
      if (showChars) parts.push(chars);
      return parts.join('  ');
    },

    // Sort lines
    sort: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const reverse = flags.r;
      const numeric = flags.n;

      let content = '';

      if (positional.length === 0) {
        content = stdin || '';
      } else {
        const resolved = this.resolvePath(positional[0]);
        if (!resolved) {
          return { stdout: '', stderr: `sort: ${positional[0]}: No such file or directory`, exitCode: 1 };
        }
        const file = this.fs.getFile(resolved.id);
        content = file.content || '';
      }

      let lines = content.split('\n');

      if (numeric) {
        lines.sort((a, b) => parseFloat(a) - parseFloat(b));
      } else {
        lines.sort();
      }

      if (reverse) {
        lines.reverse();
      }

      return lines.join('\n');
    },

    // Unique lines
    uniq: (args, stdin) => {
      const { flags, positional } = parseArgs(args);
      const count = flags.c;

      let content = '';

      if (positional.length === 0) {
        content = stdin || '';
      } else {
        const resolved = this.resolvePath(positional[0]);
        if (!resolved) {
          return { stdout: '', stderr: `uniq: ${positional[0]}: No such file or directory`, exitCode: 1 };
        }
        const file = this.fs.getFile(resolved.id);
        content = file.content || '';
      }

      const lines = content.split('\n');
      const result = [];
      let lastLine = null;
      let lineCount = 0;

      for (const line of lines) {
        if (line === lastLine) {
          lineCount++;
        } else {
          if (lastLine !== null) {
            if (count) {
              result.push(`${String(lineCount).padStart(4)} ${lastLine}`);
            } else {
              result.push(lastLine);
            }
          }
          lastLine = line;
          lineCount = 1;
        }
      }

      // Don't forget the last line
      if (lastLine !== null) {
        if (count) {
          result.push(`${String(lineCount).padStart(4)} ${lastLine}`);
        } else {
          result.push(lastLine);
        }
      }

      return result.join('\n');
    },

    // Find files
    find: (args) => {
      const { flags, positional } = parseArgs(args);
      const namePattern = flags.name;
      const typeFilter = flags.type;

      const startPath = positional[0] || '.';
      const resolved = this.resolvePath(startPath);

      if (!resolved) {
        return { stdout: '', stderr: `find: '${startPath}': No such file or directory`, exitCode: 1 };
      }

      const results = [];

      const searchRecursive = (folderId, currentPath) => {
        const contents = this.fs.getFolderContents(folderId);

        for (const file of contents) {
          const filePath = `${currentPath}/${file.name}`;
          const isDir = file.type === 'folder' || file.type === 'system-folder';

          let matches = true;

          if (namePattern) {
            const regex = new RegExp(namePattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            matches = regex.test(file.name);
          }

          if (typeFilter) {
            if (typeFilter === 'd' && !isDir) matches = false;
            if (typeFilter === 'f' && isDir) matches = false;
          }

          if (matches) {
            results.push(filePath);
          }

          if (isDir) {
            searchRecursive(file.id, filePath);
          }
        }
      };

      searchRecursive(resolved.id, startPath === '.' ? '.' : startPath);
      return results.join('\n');
    },

    // Tree structure
    tree: (args) => {
      const { positional } = parseArgs(args);
      const startPath = positional[0] || '.';
      const resolved = this.resolvePath(startPath);

      if (!resolved) {
        return { stdout: '', stderr: `tree: '${startPath}': No such file or directory`, exitCode: 1 };
      }

      const file = this.fs.getFile(resolved.id);
      let output = file.name + '\n';
      let dirs = 0;
      let files = 0;

      const drawTree = (folderId, prefix = '') => {
        const contents = this.fs.getFolderContents(folderId);

        contents.forEach((item, index) => {
          const isLast = index === contents.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const isDir = item.type === 'folder' || item.type === 'system-folder';

          output += prefix + connector + item.name + '\n';

          if (isDir) {
            dirs++;
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            drawTree(item.id, newPrefix);
          } else {
            files++;
          }
        });
      };

      drawTree(resolved.id);
      output += `\n${dirs} directories, ${files} files`;

      return output;
    },
  };
}

export default Shell;
