import { useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';

// Global selection state for keyboard shortcuts
// This tracks the currently selected file across desktop and explorer
window.__selectedFileId = null;
window.__currentFolderId = 'desktop';

export function setSelectedFile(fileId, folderId = 'desktop') {
  window.__selectedFileId = fileId;
  window.__currentFolderId = folderId;
}

export function getSelectedFile() {
  return window.__selectedFileId;
}

export function getCurrentFolder() {
  return window.__currentFolderId;
}

export default function KeyboardShortcuts() {
  const { copyFile, cutFile, pasteFile, deleteFile, clipboard } = useFileSystem();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            // Copy
            if (window.__selectedFileId) {
              e.preventDefault();
              copyFile(window.__selectedFileId);
              console.log('Copied:', window.__selectedFileId);
            }
            break;
          case 'x':
            // Cut
            if (window.__selectedFileId) {
              e.preventDefault();
              cutFile(window.__selectedFileId);
              console.log('Cut:', window.__selectedFileId);
            }
            break;
          case 'v':
            // Paste
            if (clipboard) {
              e.preventDefault();
              pasteFile(window.__currentFolderId || 'desktop');
              console.log('Pasted to:', window.__currentFolderId);
            }
            break;
          default:
            break;
        }
      }

      // Delete key
      if (e.key === 'Delete' && window.__selectedFileId) {
        e.preventDefault();
        deleteFile(window.__selectedFileId);
        window.__selectedFileId = null;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copyFile, cutFile, pasteFile, deleteFile, clipboard]);

  return null; // This component doesn't render anything
}
