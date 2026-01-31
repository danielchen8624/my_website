import { useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';

// Global selection state for keyboard shortcuts
// This tracks the currently selected file(s) across desktop and explorer
window.__selectedFileIds = [];
window.__currentFolderId = 'desktop';

export function setSelectedFile(fileId, folderId = 'desktop') {
  // For single selection, replace the array
  window.__selectedFileIds = fileId ? [fileId] : [];
  window.__currentFolderId = folderId;
}

export function setSelectedFiles(fileIds, folderId = 'desktop') {
  window.__selectedFileIds = fileIds || [];
  window.__currentFolderId = folderId;
}

export function getSelectedFile() {
  return window.__selectedFileIds[0] || null;
}

export function getSelectedFiles() {
  return window.__selectedFileIds;
}

export function getCurrentFolder() {
  return window.__currentFolderId;
}

export default function KeyboardShortcuts() {
  const { copyFile, cutFile, pasteFile, deleteFile, clipboard, getFile, undo, redo } = useFileSystem();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Support both Ctrl and Cmd for cross-platform compatibility
      const modKey = e.ctrlKey || e.metaKey;

      // Get selected files and filter out system files
      const selectedIds = window.__selectedFileIds || [];
      const nonSystemIds = selectedIds.filter(id => {
        const file = getFile(id);
        return file && file.type !== 'system';
      });

      if (modKey) {
        const key = e.key.toLowerCase();

        if (key === 'c' && nonSystemIds.length > 0) {
          // Copy (not for system files)
          e.preventDefault();
          e.stopPropagation();
          copyFile(nonSystemIds);
        } else if (key === 'x' && nonSystemIds.length > 0) {
          // Cut (not for system files)
          e.preventDefault();
          e.stopPropagation();
          cutFile(nonSystemIds);
        } else if (key === 'v' && clipboard) {
          // Paste
          e.preventDefault();
          e.stopPropagation();
          pasteFile(window.__currentFolderId || 'desktop');
        } else if (key === 'z') {
          // Undo
          e.preventDefault();
          e.stopPropagation();
          undo();
        } else if (key === 'y') {
          // Redo
          e.preventDefault();
          e.stopPropagation();
          redo();
        }
      }

      // Delete key (not for system files)
      if (e.key === 'Delete' && nonSystemIds.length > 0) {
        e.preventDefault();
        nonSystemIds.forEach(id => deleteFile(id));
        window.__selectedFileIds = [];
      }
    };

    // Use capture phase to catch events before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [copyFile, cutFile, pasteFile, deleteFile, clipboard, getFile, undo, redo]);

  return null; // This component doesn't render anything
}

