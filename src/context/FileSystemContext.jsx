import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Create context
const FileSystemContext = createContext(null);

// Storage key for localStorage
const STORAGE_KEY = 'retro-os-filesystem-v4';

// Default file system structure - Windows 95 hierarchy
// Desktop is the root, contains My Computer, Recycle Bin, My Documents, and user files
const DEFAULT_FILES = {
  'desktop': {
    id: 'desktop',
    name: 'Desktop',
    type: 'folder',
    icon: 'desktop',
    // Desktop children: system items + user files
    children: ['my-computer', 'recycle-bin', 'my-documents', 'about', 'projects', 'skills-file', 'resume', 'contact', 'readme'],
  },
  // My Computer - contains drives and control panel
  'my-computer': {
    id: 'my-computer',
    name: 'My Computer',
    type: 'system',
    icon: 'my-computer',
    position: { x: 20, y: 10 },
    children: ['drive-c', 'drive-d', 'control-panel'],
    appType: 'mycomputer',
  },
  'drive-c': {
    id: 'drive-c',
    name: '(C:) Local Disk',
    type: 'drive',
    icon: 'hard-drive',
  },
  'drive-d': {
    id: 'drive-d',
    name: '(D:) CD Drive',
    type: 'drive',
    icon: 'cd-drive',
  },
  'control-panel': {
    id: 'control-panel',
    name: 'Control Panel',
    type: 'system-folder',
    icon: 'settings',
    children: ['display-settings', 'sound-settings', 'network-settings'],
  },
  'display-settings': {
    id: 'display-settings',
    name: 'Display',
    type: 'system',
    icon: 'settings',
    appType: 'properties',
  },
  'sound-settings': {
    id: 'sound-settings',
    name: 'Sound',
    type: 'system',
    icon: 'settings',
  },
  'network-settings': {
    id: 'network-settings',
    name: 'Network',
    type: 'system',
    icon: 'network',
  },
  // Recycle Bin
  'recycle-bin': {
    id: 'recycle-bin',
    name: 'Recycle Bin',
    type: 'system',
    icon: 'recycle-bin-empty',
    position: { x: 20, y: 85 },
    children: [],
    appType: 'recyclebin',
  },
  // My Documents folder
  'my-documents': {
    id: 'my-documents',
    name: 'My Documents',
    type: 'folder',
    icon: 'folder',
    position: { x: 20, y: 160 },
    children: [],
    appType: 'explorer',
  },
  'about': {
    id: 'about',
    name: 'About Me.txt',
    type: 'file',
    icon: 'notepad',
    position: { x: 20, y: 235 },
    content: `╔══════════════════════════════════════════════════════════╗
║                    ABOUT ME                                ║
╚══════════════════════════════════════════════════════════╝

Hello, World! <WAVE>

I'm Daniel Chen, a passionate developer who loves building
creative and interactive web experiences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[*] WHAT I DO
────────────────────────────────────────────────────────────
* Full-Stack Web Development
* Creative UI/UX Design
* Interactive Experiences
* Problem Solving

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thanks for visiting! Feel free to explore.

                                          - Daniel Chen`,
    appType: 'about',
  },
  'projects': {
    id: 'projects',
    name: 'My Projects',
    type: 'folder',
    icon: 'folder',
    position: { x: 20, y: 310 },
    children: ['project-1', 'project-2', 'project-3'],
    appType: 'explorer',
  },
  'skills-file': {
    id: 'skills-file',
    name: 'My Skills.txt',
    type: 'file',
    icon: 'notepad',
    position: { x: 20, y: 385 },
    content: `╔═══════════════════════════════════════════════════╗
║              MY SKILLS & TECHNOLOGIES             ║
╚═══════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROGRAMMING LANGUAGES
─────────────────────────────────────────────────────
* Python          * Java            * C
* C++             * JavaScript      * TypeScript
* SQL             * HTML/CSS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOOLS & FRAMEWORKS
─────────────────────────────────────────────────────
* React.js        * Next.js         * React Native
* Expo            * Node.js         * Express
* FastAPI         * PyTorch         * Flask
* Tailwind        * NativeWind      * Vite
* Git             * Vercel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLOUD & DATABASES
─────────────────────────────────────────────────────
* PostgreSQL      * MySQL           * Firebase
* SQLite          * SQLAlchemy      * AWS
* Google Cloud

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    Always learning more!`,
    appType: 'notepad',
  },
  'resume': {
    id: 'resume',
    name: 'Resume.doc',
    type: 'file',
    icon: 'resume',
    position: { x: 20, y: 460 },
    appType: 'resume',
  },
  'contact': {
    id: 'contact',
    name: 'Contact.txt',
    type: 'file',
    icon: 'contact',
    position: { x: 20, y: 535 },
    content: `CONTACT INFORMATION
═══════════════════

[EMAIL]    Email: hello@danielchen.dev
[GITHUB]   GitHub: github.com/danielchen
[WORK]     LinkedIn: linkedin.com/in/danielchen
[BIRD]     Twitter: @danielchen

Feel free to reach out!`,
    appType: 'contact',
  },
  'readme': {
    id: 'readme',
    name: 'README.txt',
    type: 'file',
    icon: 'notepad',
    position: { x: 20, y: 610 },
    content: `================================================================
                 WELCOME TO RETRO-OS v1.0
================================================================

Welcome to my interactive portfolio! This website is a fully
simulated Windows 95/98 styling Operating System running 
directly in your browser.

[ GETTING STARTED ]
----------------------------------------------------------------
* DOUBLE-CLICK icons to open them.
* RIGHT-CLICK anywhere (Desktop, Files, Taskbar) for context menus.
* DRAG & DROP files to move them into folders or the Recycle Bin.

[ PRO TIPS & HIDDEN FEATURES ]
----------------------------------------------------------------
1. KEYBOARD SHORTCUTS
   [Ctrl]+[C] / [Ctrl]+[V]  : Copy and Paste files or folders
   [Delete]                 : Delete selected file
   [Enter]                  : Open selected file
   [F2]                     : Rename selected file

2. WINDOW MANAGEMENT
   * Drag windows by their blue title bars to move them.
   * Resize windows by dragging the edges.
   * Click the taskbar items to minimize/restore windows.

3. INTERACTIVE APPS
   * Winamp       : Plays real music! Drag it around.
   * Paint        : Draw pixel art masterpieces.
   * Terminal     : A real working shell. Try commands like:
                     > mkdir "secret folder"
                     > cd "secret folder"
                     > echo "hello" > secret.txt
   * Minesweeper  : The classic game. Don't explode!

4. START -> RUN COMMANDS
   Open the Start Menu -> Run and try typing:
   * "minesweeper" -> Launches the game
   * "cmd"         -> Opens Terminal
   * "explorer"    -> Opens File Explorer
   * "www.google.com" -> Launches Web Browser

[ SYSTEM SECRETS ]
----------------------------------------------------------------
* Try right-clicking "My Computer" and selecting "Properties" 
  to see system specs.
* Deleted files go to the Recycle Bin first. Don't forget to 
  empty it!
* Look out for the "Blue Screen of Death"...

Enjoy exploring!
- Daniel`,
    appType: 'notepad',
  },
  'project-1': {
    id: 'project-1',
    name: 'Project Alpha',
    type: 'file',
    icon: 'browser',
    content: 'A full-stack web application built with React and Node.js',
    link: 'https://github.com',
  },
  'project-2': {
    id: 'project-2',
    name: 'Project Beta',
    type: 'file',
    icon: 'browser',
    content: 'An interactive data visualization dashboard',
    link: 'https://github.com',
  },
  'project-3': {
    id: 'project-3',
    name: 'Retro OS Website',
    type: 'file',
    icon: 'browser',
    content: 'This website! A Windows 95 themed portfolio.',
    link: '#',
  },
};

// Load from localStorage or use defaults
function loadFileSystem() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load file system:', e);
  }
  return DEFAULT_FILES;
}

// Provider component
export function FileSystemProvider({ children }) {
  const [files, setFiles] = useState(() => loadFileSystem());
  const [clipboard, setClipboard] = useState(null);

  // Undo/Redo history - stores snapshots of file state
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const maxHistorySize = 20;

  // Helper to save current state to undo stack before making changes
  const saveToUndoStack = useCallback((currentFiles) => {
    setUndoStack(prev => {
      const newStack = [...prev, JSON.parse(JSON.stringify(currentFiles))];
      // Limit stack size
      if (newStack.length > maxHistorySize) {
        newStack.shift();
      }
      return newStack;
    });
    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, []);

  // Undo - restore previous state
  const undo = useCallback(() => {
    if (undoStack.length === 0) return false;

    setUndoStack(prev => {
      const newStack = [...prev];
      const previousState = newStack.pop();

      // Save current state to redo stack
      setRedoStack(redoPrev => [...redoPrev, JSON.parse(JSON.stringify(files))]);

      // Restore previous state
      setFiles(previousState);

      return newStack;
    });

    return true;
  }, [undoStack, files]);

  // Redo - restore next state
  const redo = useCallback(() => {
    if (redoStack.length === 0) return false;

    setRedoStack(prev => {
      const newStack = [...prev];
      const nextState = newStack.pop();

      // Save current state to undo stack
      setUndoStack(undoPrev => [...undoPrev, JSON.parse(JSON.stringify(files))]);

      // Restore next state
      setFiles(nextState);

      return newStack;
    });

    return true;
  }, [redoStack, files]);

  // Save to localStorage whenever files change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.error('Failed to save file system:', e);
    }
  }, [files]);

  // Get a file by ID
  const getFile = useCallback((id) => {
    return files[id] || null;
  }, [files]);

  // Get all desktop files
  const getDesktopFiles = useCallback(() => {
    const desktop = files['desktop'];
    if (!desktop || !desktop.children) return [];
    return desktop.children.map(id => files[id]).filter(Boolean);
  }, [files]);

  // Get children of a folder
  const getFolderContents = useCallback((folderId) => {
    const folder = files[folderId];
    if (!folder || !folder.children) return [];
    return folder.children.map(id => files[id]).filter(Boolean);
  }, [files]);

  // Get all files in a folder (alias for getFolderContents, for consistency)
  const getFilesInFolder = useCallback((folderId) => {
    return getFolderContents(folderId);
  }, [getFolderContents]);

  // Get all folders for sidebar tree
  const getAllFolders = useCallback(() => {
    return Object.values(files).filter(f => f.type === 'folder' || f.id === 'desktop');
  }, [files]);

  // Find parent folder of a file
  const findParent = useCallback((fileId) => {
    for (const [key, file] of Object.entries(files)) {
      if (file.children && file.children.includes(fileId)) {
        return file;
      }
    }
    return null;
  }, [files]);

  // Get full path of a file (e.g., "C:\Desktop\Folder\File.txt")
  const getFilePath = useCallback((fileId) => {
    const parts = [];
    let current = files[fileId];
    
    while (current) {
      parts.unshift(current.name);
      current = findParent(current.id);
    }
    
    // Replace "Desktop" at root with "C:\Desktop"
    if (parts[0] === 'Desktop') {
      parts[0] = 'C:\\Desktop';
    }
    
    return parts.join('\\');
  }, [files, findParent]);

  // Find file by path (for address bar navigation)
  const findFileByPath = useCallback((path) => {
    // Normalize path separators
    const normalizedPath = path.replace(/\//g, '\\');
    const parts = normalizedPath.split('\\').filter(Boolean);
    
    // Handle "C:\Desktop" or just "Desktop"
    if (parts[0]?.toLowerCase() === 'c:') {
      parts.shift();
    }
    
    if (parts.length === 0 || (parts.length === 1 && parts[0].toLowerCase() === 'desktop')) {
      return files['desktop'];
    }
    
    // Skip "Desktop" if present
    if (parts[0]?.toLowerCase() === 'desktop') {
      parts.shift();
    }
    
    // Navigate through path
    let current = files['desktop'];
    for (const part of parts) {
      if (!current?.children) return null;
      
      const child = current.children
        .map(id => files[id])
        .find(f => f?.name?.toLowerCase() === part.toLowerCase());
      
      if (!child) return null;
      current = child;
    }
    
    return current;
  }, [files]);

  // Rename a file (but not system files)
  const renameFile = useCallback((id, newName) => {
    saveToUndoStack(files);
    setFiles(prev => {
      const file = prev[id];
      // Don't rename system files
      if (!file || file.type === 'system') return prev;
      
      // Find parent to check uniqueness
      let parentId = null;
      for (const [key, parent] of Object.entries(prev)) {
        if (parent.children && parent.children.includes(id)) {
          parentId = key;
          break;
        }
      }
      
      // If we can't find parent (shouldn't happen), just rename
      if (!parentId) {
         return {
          ...prev,
          [id]: { ...prev[id], name: newName }
        };
      }
      
      // Check uniqueness against siblings
      // We can reuse the logic, but we need access to the *current* state inside setFiles
      // Since getUniqueName depends on 'files' state which might be stale inside setFiles updater if checking *other* updates,
      // but here we are in a callback.
      // However, to be safe and simple, let's just do the check here with 'prev' state
      
      const parent = prev[parentId];
      const siblingNames = parent.children
        .filter(childId => childId !== id) // Exclude self
        .map(childId => prev[childId]?.name?.toLowerCase())
        .filter(Boolean);
        
      let finalName = newName;
      let counter = 2;
      
      while (siblingNames.includes(finalName.toLowerCase())) {
        const lastDotIndex = newName.lastIndexOf('.');
        if (lastDotIndex > 0) {
          const baseName = newName.substring(0, lastDotIndex);
          const extension = newName.substring(lastDotIndex);
          finalName = `${baseName} (${counter})${extension}`;
        } else {
          finalName = `${newName} (${counter})`;
        }
        counter++;
      }

      return {
        ...prev,
        [id]: { ...prev[id], name: finalName }
      };
    });
  }, [files, saveToUndoStack]);

  // Update file content
  const updateFileContent = useCallback((id, newContent) => {
    setFiles(prev => ({
      ...prev,
      [id]: { ...prev[id], content: newContent }
    }));
  }, []);

  // Move file (update position)
  const moveFile = useCallback((id, x, y) => {
    setFiles(prev => ({
      ...prev,
      [id]: { ...prev[id], position: { x, y } }
    }));
  }, []);

  // Pure helper to ensure unique file name within a state object
  const calculateUniqueName = (filesState, parentId, name, excludeId = null) => {
    const parent = filesState[parentId];
    if (!parent || !parent.children) return name;

    const siblingNames = parent.children
      .filter(id => id !== excludeId)
      .map(id => filesState[id]?.name?.toLowerCase())
      .filter(Boolean);

    let finalName = name;
    let counter = 2;
    
    while (siblingNames.includes(finalName.toLowerCase())) {
        const lastDotIndex = name.lastIndexOf('.');
        if (lastDotIndex > 0) {
          const baseName = name.substring(0, lastDotIndex);
          const extension = name.substring(lastDotIndex);
          finalName = `${baseName} (${counter})${extension}`;
        } else {
          finalName = `${name} (${counter})`;
        }
        counter++;
    }
    return finalName;
  };

  // Add a new file
  const addFile = useCallback((file, parentId = 'desktop') => {
    const newId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Destructure to exclude any existing id from the source file
    const { id: _ignoreId, ...fileWithoutId } = file;

    saveToUndoStack(files);
    setFiles(prev => {
      // Calculate unique name using the PREVIOUS state to ensure consistency
      // especially when multiple files are added in quick succession (like paste)
      const uniqueName = calculateUniqueName(prev, parentId, fileWithoutId.name);
      
      const newFile = {
        ...fileWithoutId,
        id: newId, // Ensure new ID is always used
        name: uniqueName, 
      };

      const parent = prev[parentId];
      return {
        ...prev,
        [newId]: newFile,
        [parentId]: {
          ...parent,
          children: [...(parent.children || []), newId]
        }
      };
    });

    return newId;
  }, [files, saveToUndoStack]);

  // Delete a file (move to recycle bin)
  const deleteFile = useCallback((id, parentId = null) => {
    saveToUndoStack(files);
    setFiles(prev => {
      const fileToDelete = prev[id];
      // Don't delete system files
      if (!fileToDelete || fileToDelete.type === 'system') return prev;
      
      // Find parent if not provided (for originalParentId)
      let actualParentId = parentId;
      if (!actualParentId) {
        for (const [key, file] of Object.entries(prev)) {
          if (file.children?.includes(id)) {
            actualParentId = key;
            break;
          }
        }
      }
      
      if (!actualParentId) return prev;
      
      const parent = prev[actualParentId];
      const recycleBin = prev['recycle-bin'];
      
      return {
        ...prev,
        [actualParentId]: {
          ...parent,
          children: parent.children?.filter(childId => childId !== id) || []
        },
        'recycle-bin': {
          ...recycleBin,
          children: [...(recycleBin.children || []), id]
        },
        [id]: {
            ...fileToDelete,
            originalParentId: actualParentId,
            originalPosition: fileToDelete.position || { x: 20, y: 20 }
        }
      };
    });
  }, [files, saveToUndoStack]);

  // Check if a file can be copied/cut (not a system file)
  const canModifyFile = useCallback((id) => {
    const file = files[id];
    return file && file.type !== 'system' && file.type !== 'drive';
  }, [files]);

  // Copy file(s) to clipboard - accepts single ID or array of IDs
  const copyFile = useCallback((ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const validIds = idArray.filter(id => canModifyFile(id));
    if (validIds.length === 0) return false;
    setClipboard({ type: 'copy', fileIds: validIds });
    return true;
  }, [canModifyFile]);

  // Cut file(s) to clipboard - accepts single ID or array of IDs
  const cutFile = useCallback((ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const validIds = idArray.filter(id => canModifyFile(id));
    if (validIds.length === 0) return false;
    setClipboard({ type: 'cut', fileIds: validIds });
    return true;
  }, [canModifyFile]);

  // Paste from clipboard - handles multiple files
  const pasteFile = useCallback((targetFolderId = 'desktop') => {
    if (!clipboard || !clipboard.fileIds || clipboard.fileIds.length === 0) return null;

    const clipboardData = clipboard;
    const pastedIds = [];

    if (clipboardData.type === 'copy') {
      // Create copies of all files
      let offsetX = 0;
      let offsetY = 0;

      clipboardData.fileIds.forEach((fileId, index) => {
        const sourceFile = files[fileId];
        if (!sourceFile) return;

        const { id: _id, children: _children, ...fileToCopy } = sourceFile;
        const newId = addFile({
          ...fileToCopy,
          name: clipboardData.fileIds.length > 1 ? sourceFile.name : `${sourceFile.name} - Copy`,
          position: {
            x: (sourceFile.position?.x || 20) + 20 + offsetX,
            y: (sourceFile.position?.y || 20) + 20 + offsetY,
          },
          ...(sourceFile.type === 'folder' ? { children: [] } : {})
        }, targetFolderId);

        pastedIds.push(newId);
        offsetX += 20;
        offsetY += 20;
      });

      // Don't clear clipboard after copy
      return pastedIds;
    } else if (clipboardData.type === 'cut') {
      // Clear clipboard first to prevent double-paste
      setClipboard(null);

      setFiles(prev => {
        let newState = { ...prev };

        clipboardData.fileIds.forEach(fileIdToMove => {
          const file = newState[fileIdToMove];
          if (!file) return;

          // Find current parent
          let currentParentId = null;
          for (const [key, f] of Object.entries(newState)) {
            if (f.children && Array.isArray(f.children) && f.children.includes(fileIdToMove)) {
              currentParentId = key;
              break;
            }
          }

          if (!currentParentId || currentParentId === targetFolderId) return;

          const currentParent = newState[currentParentId];
          const targetParent = newState[targetFolderId];

          if (!targetParent) return;
          if (targetParent.children && targetParent.children.includes(fileIdToMove)) return;

          // Ensure unique name in target folder
          const uniqueName = calculateUniqueName(newState, targetFolderId, file.name, fileIdToMove);

          newState = {
            ...newState,
            [currentParentId]: {
              ...currentParent,
              children: currentParent.children.filter(id => id !== fileIdToMove)
            },
            [targetFolderId]: {
              ...targetParent,
              children: [...(targetParent.children || []), fileIdToMove]
            },
            [fileIdToMove]: {
              ...file,
              name: uniqueName, // Update name
              position: targetFolderId === 'desktop'
                ? (file.position || { x: 100, y: 100 })
                : undefined
            }
          };

          pastedIds.push(fileIdToMove);
        });

        return newState;
      });

      return pastedIds;
    }
    return null;
  }, [clipboard, files, addFile]);

  // Create new folder
  const createFolder = useCallback((parentId = 'desktop') => {
    const newId = addFile({
      name: 'New Folder',
      type: 'folder',
      icon: 'folder',
      position: { x: 100, y: 100 },
      children: [],
      appType: 'explorer',
    }, parentId);
    
    // Dispatch auto-rename event after a short delay to let the DOM update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startRename', { detail: { fileId: newId } }));
    }, 50);
    
    return newId;
  }, [addFile]);

  // Create new text file
  const createTextFile = useCallback((parentId = 'desktop') => {
    const newId = addFile({
      name: 'New Text Document.txt',
      type: 'file',
      icon: 'notepad',
      position: { x: 120, y: 120 },
      content: '',
      appType: 'notepad',
    }, parentId);
    
    // Dispatch auto-rename event after a short delay to let the DOM update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startRename', { detail: { fileId: newId } }));
    }, 50);
    
    return newId;
  }, [addFile]);

  // Reset to defaults
  const resetFileSystem = useCallback(() => {
    setFiles(DEFAULT_FILES);
  }, []);

  // Move file to a folder (for drag-drop into folder/recycle bin)
  const moveFileToFolder = useCallback((fileId, targetFolderId) => {
    saveToUndoStack(files);
    setFiles(prev => {
      const file = prev[fileId];
      const targetFolder = prev[targetFolderId];
      
      if (!file || !targetFolder) return prev;
      
      // Don't move into itself
      if (fileId === targetFolderId) return prev;
      
      // Find current parent
      let currentParentId = null;
      for (const [key, f] of Object.entries(prev)) {
        if (f.children?.includes(fileId)) {
          currentParentId = key;
          break;
        }
      }
      
      if (!currentParentId || currentParentId === targetFolderId) return prev;
      
      const currentParent = prev[currentParentId];
      
      // Ensure unique name in target folder
      const uniqueName = calculateUniqueName(prev, targetFolderId, file.name, fileId);

      return {
        ...prev,
        [currentParentId]: {
          ...currentParent,
          children: currentParent.children.filter(id => id !== fileId)
        },
        [targetFolderId]: {
          ...targetFolder,
          children: [...(targetFolder.children || []), fileId]
        },
        [fileId]: {
          ...file,
          name: uniqueName, // Update name if needed
          // Reset position when moving to folder
          position: targetFolderId === 'desktop' ? file.position : undefined
        }
      };
    });
  }, [files, saveToUndoStack]);

  // Restore file from recycle bin
  const restoreFile = useCallback((fileId) => {
    setFiles(prev => {
        const file = prev[fileId];
        const recycleBin = prev['recycle-bin'];
        const targetParentId = file.originalParentId || 'desktop';
        const targetParent = prev[targetParentId] || prev['desktop']; // Fallback to desktop
        const targetId = targetParent.id;

        if (!recycleBin.children.includes(fileId)) return prev;

        return {
            ...prev,
            'recycle-bin': {
                ...recycleBin,
                children: recycleBin.children.filter(id => id !== fileId)
            },
            [targetId]: {
                ...targetParent,
                children: [...(targetParent.children || []), fileId]
            },
            [fileId]: {
                ...file,
                name: calculateUniqueName(prev, targetId, file.name, fileId), // Ensure unique upon restore
                position: file.originalPosition || { x: 20, y: 20 }, // Restore position logic
                originalParentId: undefined,
                originalPosition: undefined
            }
        };
    });
  }, []);

  // Permanently delete file from recycle bin
  const permanentlyDelete = useCallback((fileId) => {
    setFiles(prev => {
      const recycleBin = prev['recycle-bin'];
      const { [fileId]: deleted, ...rest } = prev;
      
      return {
        ...rest,
        'recycle-bin': {
          ...recycleBin,
          children: recycleBin.children?.filter(id => id !== fileId) || []
        }
      };
    });
  }, []);

  // Empty recycle bin
  const emptyRecycleBin = useCallback(() => {
    setFiles(prev => {
      const recycleBin = prev['recycle-bin'];
      const filesToDelete = recycleBin.children || [];
      
      // Remove all files in recycle bin
      const newFiles = { ...prev };
      filesToDelete.forEach(id => {
        delete newFiles[id];
      });
      
      return {
        ...newFiles,
        'recycle-bin': {
          ...recycleBin,
          children: [],
          icon: 'recycle-bin-empty' // Empty icon
        }
      };
    });
  }, []);

  const value = {
    files,
    getFile,
    getDesktopFiles,
    getFolderContents,
    getFilesInFolder,
    getAllFolders,
    findParent,
    getFilePath,
    findFileByPath,
    renameFile,
    updateFileContent,
    moveFile,
    moveFileToFolder,
    addFile,
    deleteFile,
    copyFile,
    cutFile,
    pasteFile,
    clipboard,
    canModifyFile,
    createFolder,
    createTextFile,
    resetFileSystem,
    restoreFile,
    permanentlyDelete,
    emptyRecycleBin,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}

// Custom hook
export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}
