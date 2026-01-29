import { useState, useEffect, useCallback, useRef } from 'react';
import { useFileSystem } from '../context/FileSystemContext';

export default function NotepadApp({ fileId, onSaveStatusChange }) {
  const { getFile, updateFileContent } = useFileSystem();
  const file = getFile(fileId);
  
  const [content, setContent] = useState(file?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef(null);

  // Load content when file changes
  useEffect(() => {
    if (file) {
      setContent(file.content || '');
      setHasUnsavedChanges(false);
    }
  }, [file?.id]);

  // Notify parent of unsaved changes
  useEffect(() => {
    onSaveStatusChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onSaveStatusChange]);

  // Handle content change
  const handleChange = useCallback((e) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  // Save content
  const handleSave = useCallback(() => {
    if (fileId) {
      updateFileContent(fileId, content);
      setHasUnsavedChanges(false);
    }
  }, [fileId, content, updateFileContent]);

  // Handle menu actions from parent Window
  const handleMenuAction = useCallback((action) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    switch (action) {
      case 'save':
        handleSave();
        break;
      case 'selectAll':
        textarea.select();
        break;
      case 'cut':
        document.execCommand('cut');
        break;
      case 'copy':
        document.execCommand('copy');
        break;
      case 'paste':
        navigator.clipboard.readText().then(text => {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = content.substring(0, start) + text + content.substring(end);
          setContent(newContent);
          setHasUnsavedChanges(true);
        }).catch(() => {
          // Fallback for browsers that don't support clipboard API
          document.execCommand('paste');
        });
        break;
      case 'undo':
        document.execCommand('undo');
        break;
      default:
        break;
    }
  }, [content, handleSave]);

  // Expose save and menu handler for parent
  useEffect(() => {
    // Store handlers on window for parent to access
    window.__notepadHandlers = window.__notepadHandlers || {};
    window.__notepadHandlers[fileId] = {
      save: handleSave,
      menuAction: handleMenuAction,
    };
    
    return () => {
      if (window.__notepadHandlers) {
        delete window.__notepadHandlers[fileId];
      }
    };
  }, [fileId, handleSave, handleMenuAction]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!file) {
    return <div className="notepad-content">File not found</div>;
  }

  return (
    <div className="notepad-app">
      {hasUnsavedChanges && (
        <div className="notepad-status-bar">
          <span className="unsaved-indicator">● Unsaved changes</span>
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="notepad-textarea"
        value={content}
        onChange={handleChange}
        placeholder="Start typing..."
        spellCheck={false}
      />
    </div>
  );
}
