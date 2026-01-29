import { useState, useCallback } from 'react';

const WALLPAPERS = [
  { id: 'teal', name: 'Classic Teal', color: '#008080' },
  { id: 'black', name: 'Black', color: '#000000' },
  { id: 'blue', name: 'Navy Blue', color: '#000080' },
  { id: 'green', name: 'Forest Green', color: '#006400' },
  { id: 'purple', name: 'Purple', color: '#4B0082' },
  { id: 'gradient', name: 'Gradient', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'clouds', name: 'Clouds', color: 'linear-gradient(180deg, #87ceeb 0%, #e0f6ff 100%)' },
  { id: 'sunset', name: 'Sunset', color: 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 100%)' },
];

const SCREENSAVERS = [
  { id: 'none', name: '(None)' },
  { id: 'starfield', name: 'Starfield' },
  { id: 'pipes', name: '3D Pipes' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'blank', name: 'Blank' },
];

export default function DisplayPropertiesApp({ onClose }) {
  const [activeTab, setActiveTab] = useState('background');
  const [selectedWallpaper, setSelectedWallpaper] = useState('teal');
  const [selectedScreensaver, setSelectedScreensaver] = useState('none');
  const [screensaverWait, setScreensaverWait] = useState(5);

  // Apply wallpaper
  const applySettings = useCallback(() => {
    const wallpaper = WALLPAPERS.find(w => w.id === selectedWallpaper);
    if (wallpaper) {
      const desktop = document.querySelector('.desktop');
      if (desktop) {
        if (wallpaper.color.startsWith('linear-gradient')) {
          desktop.style.background = wallpaper.color;
        } else {
          desktop.style.background = wallpaper.color;
        }
      }
      // Save to localStorage
      localStorage.setItem('retroos-wallpaper', selectedWallpaper);
    }
    alert('✅ Settings applied!');
  }, [selectedWallpaper]);

  // Cancel and close
  const handleCancel = () => {
    if (onClose) onClose();
  };

  return (
    <div className="display-props-app">
      {/* Tabs */}
      <div className="display-props-tabs">
        <button 
          className={`display-props-tab ${activeTab === 'background' ? 'active' : ''}`}
          onClick={() => setActiveTab('background')}
        >
          Background
        </button>
        <button 
          className={`display-props-tab ${activeTab === 'screensaver' ? 'active' : ''}`}
          onClick={() => setActiveTab('screensaver')}
        >
          Screen Saver
        </button>
        <button 
          className={`display-props-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
      </div>

      {/* Tab Content */}
      <div className="display-props-content">
        {activeTab === 'background' && (
          <div className="display-props-background">
            {/* Preview */}
            <div className="display-props-preview">
              <div 
                className="display-props-monitor"
                style={{ 
                  background: WALLPAPERS.find(w => w.id === selectedWallpaper)?.color 
                }}
              >
                <div className="display-props-preview-window">
                  <div className="display-props-preview-header"></div>
                  <div className="display-props-preview-body"></div>
                </div>
              </div>
            </div>

            {/* Wallpaper List */}
            <div className="display-props-list-container">
              <label>Wallpaper:</label>
              <div className="display-props-list">
                {WALLPAPERS.map(wp => (
                  <div
                    key={wp.id}
                    className={`display-props-list-item ${selectedWallpaper === wp.id ? 'selected' : ''}`}
                    onClick={() => setSelectedWallpaper(wp.id)}
                  >
                    <div 
                      className="display-props-color-preview"
                      style={{ background: wp.color }}
                    />
                    <span>{wp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'screensaver' && (
          <div className="display-props-screensaver">
            {/* Preview */}
            <div className="display-props-preview">
              <div className="display-props-monitor screensaver-preview">
                {selectedScreensaver === 'starfield' && (
                  <div className="ss-starfield">✨ ⭐ ✨</div>
                )}
                {selectedScreensaver === 'matrix' && (
                  <div className="ss-matrix">01101001</div>
                )}
                {selectedScreensaver === 'blank' && (
                  <div className="ss-blank"></div>
                )}
              </div>
            </div>

            {/* Screensaver Select */}
            <div className="display-props-select-container">
              <label>Screen Saver:</label>
              <select 
                value={selectedScreensaver}
                onChange={(e) => setSelectedScreensaver(e.target.value)}
                className="display-props-select"
              >
                {SCREENSAVERS.map(ss => (
                  <option key={ss.id} value={ss.id}>{ss.name}</option>
                ))}
              </select>
            </div>

            <div className="display-props-wait">
              <label>Wait:</label>
              <input
                type="number"
                value={screensaverWait}
                onChange={(e) => setScreensaverWait(Number(e.target.value))}
                min="1"
                max="60"
              />
              <span>minutes</span>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="display-props-appearance">
            <div className="display-props-preview">
              <div className="display-props-monitor">
                <div className="display-props-preview-window">
                  <div className="display-props-preview-header">Active Window</div>
                  <div className="display-props-preview-body">
                    <p>Window Text</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="display-props-scheme">
              <label>Scheme:</label>
              <select className="display-props-select">
                <option>Windows Standard</option>
                <option>High Contrast Black</option>
                <option>High Contrast White</option>
                <option>Rainy Day</option>
                <option>Desert</option>
              </select>
            </div>

            <p className="display-props-note">
              Note: Theme switching is cosmetic in this demo.
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="display-props-buttons">
        <button className="win95-button" onClick={applySettings}>OK</button>
        <button className="win95-button" onClick={handleCancel}>Cancel</button>
        <button className="win95-button" onClick={applySettings}>Apply</button>
      </div>
    </div>
  );
}
