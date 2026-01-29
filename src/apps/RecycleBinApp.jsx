import { useFileSystem } from '../context/FileSystemContext';
import { useOS } from '../context/OSContext';

export default function RecycleBinApp() {
  const { getFolderContents, restoreFile, permanentlyDelete, emptyRecycleBin } = useFileSystem();
  const { openWindow } = useOS();
  
  const recycleBinContents = getFolderContents('recycle-bin');

  const handleRestore = (fileId) => {
    restoreFile(fileId);
  };

  const handleDelete = (fileId) => {
    if (confirm('Are you sure you want to permanently delete this file?')) {
      permanentlyDelete(fileId);
    }
  };

  const handleEmptyBin = () => {
    if (confirm('Are you sure you want to permanently delete all items?')) {
      emptyRecycleBin();
    }
  };

  const handleOpen = (file) => {
    openWindow(file.id, file);
  };

  return (
    <div className="recyclebin-app">
      {/* Toolbar */}
      <div className="recyclebin-toolbar">
        <button 
          className="win95-button"
          onClick={handleEmptyBin}
          disabled={recycleBinContents.length === 0}
        >
          🗑️ Empty Recycle Bin
        </button>
      </div>

      {/* Content */}
      <div className="recyclebin-content">
        {recycleBinContents.length === 0 ? (
          <div className="recyclebin-empty">
            <div className="recyclebin-empty-icon">🗑️</div>
            <p>The Recycle Bin is empty.</p>
          </div>
        ) : (
          <div className="recyclebin-grid">
            {recycleBinContents.map((file) => (
              <div key={file.id} className="recyclebin-item">
                <div className="recyclebin-item-icon">{file.icon}</div>
                <div className="recyclebin-item-name">{file.name}</div>
                <div className="recyclebin-item-actions">
                  <button 
                    className="win95-button recyclebin-action-btn"
                    onClick={() => handleRestore(file.id)}
                    title="Restore"
                  >
                    ↩️
                  </button>
                  <button 
                    className="win95-button recyclebin-action-btn"
                    onClick={() => handleDelete(file.id)}
                    title="Delete Permanently"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="recyclebin-status">
        {recycleBinContents.length} item(s)
      </div>
    </div>
  );
}
