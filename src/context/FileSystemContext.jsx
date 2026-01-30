import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Create context
const FileSystemContext = createContext(null);

// Storage key for localStorage
const STORAGE_KEY = 'retro-os-filesystem';

// Default file system structure
const DEFAULT_FILES = {
  'desktop': {
    id: 'desktop',
    name: 'Desktop',
    type: 'folder',
    icon: '🖥️',
    children: ['about', 'projects', 'contact', 'skills', 'recycle-bin'],
  },
  'about': {
    id: 'about',
    name: 'About Me.txt',
    type: 'file',
    icon: '📝',
    position: { x: 20, y: 20 },
    content: `╔══════════════════════════════════════════════════════════╗
║                    ABOUT ME                                ║
╚══════════════════════════════════════════════════════════╝

Hello, World! 👋

I'm Daniel Chen, a passionate developer who loves building 
creative and interactive web experiences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 WHAT I DO
────────────────────────────────────────────────────────────
• Full-Stack Web Development
• Creative UI/UX Design
• Interactive Experiences
• Problem Solving

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thanks for visiting! Feel free to explore.

                                          - Daniel Chen`,
    appType: 'about',
  },
  'projects': {
    id: 'projects',
    name: 'My Projects',
    type: 'folder',
    icon: '📁',
    position: { x: 20, y: 120 },
    children: ['project-1', 'project-2', 'project-3'],
    appType: 'explorer',
  },
  'contact': {
    id: 'contact',
    name: 'Contact.txt',
    type: 'file',
    icon: '📧',
    position: { x: 20, y: 220 },
    content: `CONTACT INFORMATION
═══════════════════

📧 Email: hello@danielchen.dev
🐙 GitHub: github.com/danielchen
💼 LinkedIn: linkedin.com/in/danielchen
🐦 Twitter: @danielchen

Feel free to reach out!`,
    appType: 'contact',
  },
  'skills': {
    id: 'skills',
    name: 'My Computer',
    type: 'system',
    icon: '💻',
    position: { x: 20, y: 320 },
    appType: 'mycomputer',
  },
  'recycle-bin': {
    id: 'recycle-bin',
    name: 'Recycle Bin',
    type: 'system',
    icon: '🗑️',
    position: { x: 20, y: 420 },
    children: [],
    appType: 'recyclebin',
  },
  'internet-explorer': {
    id: 'internet-explorer',
    name: 'Internet Explorer',
    type: 'system',
    icon: '🌐',
    position: { x: 20, y: 520 },
    appType: 'browser',
  },
  'project-1': {
    id: 'project-1',
    name: 'Project Alpha',
    type: 'file',
    icon: '📄',
    content: 'A full-stack web application built with React and Node.js',
    link: 'https://github.com',
  },
  'project-2': {
    id: 'project-2',
    name: 'Project Beta',
    type: 'file',
    icon: '📄',
    content: 'An interactive data visualization dashboard',
    link: 'https://github.com',
  },
  'project-3': {
    id: 'project-3',
    name: 'Retro OS Website',
    type: 'file',
    icon: '💻',
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

  // Rename a file
  const renameFile = useCallback((id, newName) => {
    setFiles(prev => ({
      ...prev,
      [id]: { ...prev[id], name: newName }
    }));
  }, []);

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

  // Add a new file
  const addFile = useCallback((file, parentId = 'desktop') => {
    const newId = `file-${Date.now()}`;
    const newFile = {
      id: newId,
      ...file,
    };
    
    setFiles(prev => {
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
  }, []);

  // Delete a file
  const deleteFile = useCallback((id, parentId = 'desktop') => {
    setFiles(prev => {
      const { [id]: deleted, ...rest } = prev;
      const parent = rest[parentId];
      
      // Move to recycle bin instead of permanent delete
      const recycleBin = rest['recycle-bin'];
      
      return {
        ...rest,
        [parentId]: {
          ...parent,
          children: parent.children?.filter(childId => childId !== id) || []
        },
        [id]: deleted, // Keep the file
        'recycle-bin': {
          ...recycleBin,
          children: [...(recycleBin.children || []), id]
        }
      };
    });
  }, []);

  // Copy file to clipboard
  const copyFile = useCallback((id) => {
    setClipboard({ type: 'copy', fileId: id });
  }, []);

  // Cut file to clipboard
  const cutFile = useCallback((id) => {
    setClipboard({ type: 'cut', fileId: id });
  }, []);

  // Paste from clipboard
  const pasteFile = useCallback((targetFolderId = 'desktop') => {
    if (!clipboard) return;
    
    const sourceFile = files[clipboard.fileId];
    if (!sourceFile) return;
    
    if (clipboard.type === 'copy') {
      // Create a copy
      addFile({
        ...sourceFile,
        name: `${sourceFile.name} - Copy`,
        position: {
          x: (sourceFile.position?.x || 20) + 20,
          y: (sourceFile.position?.y || 20) + 20,
        }
      }, targetFolderId);
    } else if (clipboard.type === 'cut') {
      // Move the file
      setFiles(prev => {
        // Find current parent
        let currentParentId = null;
        for (const [key, file] of Object.entries(prev)) {
          if (file.children?.includes(clipboard.fileId)) {
            currentParentId = key;
            break;
          }
        }
        
        if (!currentParentId) return prev;
        
        const currentParent = prev[currentParentId];
        const targetParent = prev[targetFolderId];
        
        return {
          ...prev,
          [currentParentId]: {
            ...currentParent,
            children: currentParent.children.filter(id => id !== clipboard.fileId)
          },
          [targetFolderId]: {
            ...targetParent,
            children: [...(targetParent.children || []), clipboard.fileId]
          }
        };
      });
    }
    
    setClipboard(null);
  }, [clipboard, files, addFile]);

  // Create new folder
  const createFolder = useCallback((parentId = 'desktop') => {
    const newId = addFile({
      name: 'New Folder',
      type: 'folder',
      icon: '📁',
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
      icon: '📝',
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
          // Reset position when moving to folder
          position: targetFolderId === 'desktop' ? file.position : undefined
        }
      };
    });
  }, []);

  // Restore file from recycle bin
  const restoreFile = useCallback((fileId) => {
    moveFileToFolder(fileId, 'desktop');
  }, [moveFileToFolder]);

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
          icon: '🗑️' // Empty icon
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
    createFolder,
    createTextFile,
    resetFileSystem,
    restoreFile,
    permanentlyDelete,
    emptyRecycleBin,
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
