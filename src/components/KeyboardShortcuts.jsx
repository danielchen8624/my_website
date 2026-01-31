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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Get selected files and filter out system files
      const selectedIds = window.__selectedFileIds || [];
      const nonSystemIds = selectedIds.filter(id => {
        const file = getFile(id);
        return file && file.type !== 'system';
      });

      if (modKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            // Copy (not for system files)
            if (nonSystemIds.length > 0) {
              e.preventDefault();
              copyFile(nonSystemIds);
            }
            break;
          case 'x':
            // Cut (not for system files)
            if (nonSystemIds.length > 0) {
              e.preventDefault();
              cutFile(nonSystemIds);
            }
            break;
          case 'v':
            // Paste
            if (clipboard) {
              e.preventDefault();
              pasteFile(window.__currentFolderId || 'desktop');
            }
            break;
          case 'z':
            // Undo
            e.preventDefault();
            undo();
            break;
          case 'y':
            // Redo
            e.preventDefault();
            redo();
            break;
          default:
            break;
        }
      }

      // Delete key (not for system files)
      if (e.key === 'Delete' && nonSystemIds.length > 0) {
        e.preventDefault();
        nonSystemIds.forEach(id => deleteFile(id));
        window.__selectedFileIds = [];
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copyFile, cutFile, pasteFile, deleteFile, clipboard, getFile, undo, redo]);

  return null; // This component doesn't render anything
}

