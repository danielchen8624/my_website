import { useState, useCallback, useEffect } from 'react';

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

const THEMES = [
  {
    id: 'standard',
    name: 'Windows Standard',
    colors: {
      titleBarActive: '#000080',
      titleBarInactive: '#808080',
      titleTextActive: '#ffffff',
      titleTextInactive: '#c0c0c0',
      windowBg: '#c0c0c0',
      buttonFace: '#c0c0c0',
      buttonHighlight: '#ffffff',
      buttonShadow: '#808080',
      desktop: '#008080',
    }
  },
  {
    id: 'highContrastBlack',
    name: 'High Contrast Black',
    colors: {
      titleBarActive: '#000000',
      titleBarInactive: '#000000',
      titleTextActive: '#ffffff',
      titleTextInactive: '#00ff00',
      windowBg: '#000000',
      buttonFace: '#000000',
      buttonHighlight: '#ffffff',
      buttonShadow: '#808080',
      desktop: '#000000',
    }
  },
  {
    id: 'highContrastWhite',
    name: 'High Contrast White',
    colors: {
      titleBarActive: '#000080',
      titleBarInactive: '#ffffff',
      titleTextActive: '#ffffff',
      titleTextInactive: '#000000',
      windowBg: '#ffffff',
      buttonFace: '#ffffff',
      buttonHighlight: '#808080',
      buttonShadow: '#000000',
      desktop: '#ffffff',
    }
  },
  {
    id: 'rainyDay',
    name: 'Rainy Day',
    colors: {
      titleBarActive: '#4a5568',
      titleBarInactive: '#718096',
      titleTextActive: '#ffffff',
      titleTextInactive: '#e2e8f0',
      windowBg: '#cbd5e0',
      buttonFace: '#a0aec0',
      buttonHighlight: '#e2e8f0',
      buttonShadow: '#4a5568',
      desktop: '#2d3748',
    }
  },
  {
    id: 'desert',
    name: 'Desert',
    colors: {
      titleBarActive: '#b7791f',
      titleBarInactive: '#d69e2e',
      titleTextActive: '#ffffff',
      titleTextInactive: '#744210',
      windowBg: '#faf089',
      buttonFace: '#ecc94b',
      buttonHighlight: '#fefcbf',
      buttonShadow: '#b7791f',
      desktop: '#c05621',
    }
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      titleBarActive: '#97266d',
      titleBarInactive: '#b83280',
      titleTextActive: '#ffffff',
      titleTextInactive: '#fbb6ce',
      windowBg: '#fed7e2',
      buttonFace: '#fbb6ce',
      buttonHighlight: '#fff5f7',
      buttonShadow: '#97266d',
      desktop: '#702459',
    }
  },
];

// Apply theme to CSS variables
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--title-bar-active', theme.colors.titleBarActive);
  root.style.setProperty('--title-bar-inactive', theme.colors.titleBarInactive);
  root.style.setProperty('--title-text-active', theme.colors.titleTextActive);
  root.style.setProperty('--title-text-inactive', theme.colors.titleTextInactive);
  root.style.setProperty('--window-bg', theme.colors.windowBg);
  root.style.setProperty('--button-face', theme.colors.buttonFace);
  root.style.setProperty('--button-highlight', theme.colors.buttonHighlight);
  root.style.setProperty('--button-shadow', theme.colors.buttonShadow);

  // Apply desktop color from theme
  const desktop = document.querySelector('.desktop');
  if (desktop) {
    desktop.style.background = theme.colors.desktop;
  }

  // Save to localStorage
  localStorage.setItem('retroos-theme', theme.id);
  // Save theme's desktop color so it persists on reload
  localStorage.setItem('retroos-desktop-color', theme.colors.desktop);
}

// Load saved settings
function loadSettings() {
  return {
    wallpaper: localStorage.getItem('retroos-wallpaper') || 'teal',
    screensaver: localStorage.getItem('retroos-screensaver') || 'none',
    screensaverWait: parseInt(localStorage.getItem('retroos-screensaver-wait') || '5', 10),
    theme: localStorage.getItem('retroos-theme') || 'standard',
  };
}

export default function DisplayPropertiesApp({ onClose }) {
  const savedSettings = loadSettings();

  const [activeTab, setActiveTab] = useState('background');
  const [selectedWallpaper, setSelectedWallpaper] = useState(savedSettings.wallpaper);
  const [selectedScreensaver, setSelectedScreensaver] = useState(savedSettings.screensaver);
  const [screensaverWait, setScreensaverWait] = useState(savedSettings.screensaverWait);
  const [selectedTheme, setSelectedTheme] = useState(savedSettings.theme);
  const [previewScreensaver, setPreviewScreensaver] = useState(false);

  // Preview wallpaper in the mini monitor
  const getPreviewWallpaper = () => {
    return WALLPAPERS.find(w => w.id === selectedWallpaper)?.color || '#008080';
  };

  // Preview theme colors
  const getPreviewTheme = () => {
    return THEMES.find(t => t.id === selectedTheme) || THEMES[0];
  };

  // Apply all settings
  const applySettings = useCallback(() => {
    // Save screensaver settings
    localStorage.setItem('retroos-screensaver', selectedScreensaver);
    localStorage.setItem('retroos-screensaver-wait', String(screensaverWait));

    // Dispatch event to notify ScreenSaver component
    window.dispatchEvent(new CustomEvent('screensaverSettingsChanged', {
      detail: {
        type: selectedScreensaver,
        waitMinutes: screensaverWait,
      }
    }));

    // Apply theme (includes its desktop color)
    const theme = THEMES.find(t => t.id === selectedTheme);
    if (theme) {
      applyTheme(theme);
    }

    // Apply wallpaper only if on background tab (overrides theme desktop)
    // Otherwise, theme desktop color takes precedence
    if (activeTab === 'background') {
      const wallpaper = WALLPAPERS.find(w => w.id === selectedWallpaper);
      if (wallpaper) {
        const desktop = document.querySelector('.desktop');
        if (desktop) {
          desktop.style.background = wallpaper.color;
        }
        localStorage.setItem('retroos-wallpaper', selectedWallpaper);
        // Clear theme desktop color since user explicitly chose a wallpaper
        localStorage.removeItem('retroos-desktop-color');
      }
    } else {
      // When applying theme, clear wallpaper preference so theme desktop persists on reload
      localStorage.removeItem('retroos-wallpaper');
    }
  }, [selectedWallpaper, selectedScreensaver, screensaverWait, selectedTheme, activeTab]);

  // OK button - apply and close
  const handleOK = () => {
    applySettings();
    if (onClose) onClose();
  };

  // Cancel and close
  const handleCancel = () => {
    if (onClose) onClose();
  };

  // Preview screensaver
  const handlePreview = () => {
    if (selectedScreensaver !== 'none') {
      window.dispatchEvent(new CustomEvent('screensaverPreview', {
        detail: { type: selectedScreensaver }
      }));
    }
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
                style={{ background: getPreviewWallpaper() }}
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
              <div className="display-props-monitor screensaver-preview" style={{ background: '#000' }}>
                {selectedScreensaver === 'starfield' && (
                  <div className="ss-starfield">
                    {[...Array(20)].map((_, i) => (
                      <span key={i} style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        color: 'white',
                        fontSize: `${4 + Math.random() * 8}px`,
                        animation: `twinkle ${1 + Math.random() * 2}s infinite`,
                      }}>*</span>
                    ))}
                  </div>
                )}
                {selectedScreensaver === 'matrix' && (
                  <div className="ss-matrix" style={{
                    color: '#0f0',
                    fontFamily: 'monospace',
                    fontSize: '8px',
                    overflow: 'hidden',
                    height: '100%',
                  }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{ animation: `matrixFall ${2 + i * 0.5}s linear infinite` }}>
                        {'01101001'.repeat(3)}
                      </div>
                    ))}
                  </div>
                )}
                {selectedScreensaver === 'pipes' && (
                  <div style={{ color: '#0ff', textAlign: 'center', paddingTop: '30px', fontSize: '10px' }}>
                    3D Pipes Preview
                    <div style={{ marginTop: '10px', fontSize: '20px' }}>|===|</div>
                  </div>
                )}
                {selectedScreensaver === 'blank' && (
                  <div className="ss-blank" style={{ background: '#000', width: '100%', height: '100%' }}></div>
                )}
                {selectedScreensaver === 'none' && (
                  <div style={{ color: '#666', textAlign: 'center', paddingTop: '40px', fontSize: '10px' }}>
                    No screensaver
                  </div>
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
              <button
                className="win95-button"
                onClick={handlePreview}
                disabled={selectedScreensaver === 'none'}
                style={{ marginLeft: '8px' }}
              >
                Preview
              </button>
            </div>

            <div className="display-props-wait">
              <label>Wait:</label>
              <input
                type="number"
                value={screensaverWait}
                onChange={(e) => setScreensaverWait(Math.max(1, Math.min(60, Number(e.target.value))))}
                min="1"
                max="60"
                style={{ width: '50px' }}
              />
              <span>minutes</span>
            </div>

            <p style={{ fontSize: '11px', color: '#666', marginTop: '16px' }}>
              The screensaver will activate after {screensaverWait} minute(s) of inactivity.
              Move the mouse or press any key to dismiss it.
            </p>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="display-props-appearance">
            <div className="display-props-preview">
              <div
                className="display-props-monitor"
                style={{ background: getPreviewTheme().colors.desktop }}
              >
                <div
                  className="display-props-preview-window"
                  style={{ background: getPreviewTheme().colors.windowBg }}
                >
                  <div
                    className="display-props-preview-header"
                    style={{
                      background: getPreviewTheme().colors.titleBarActive,
                      color: getPreviewTheme().colors.titleTextActive,
                    }}
                  >
                    Active Window
                  </div>
                  <div
                    className="display-props-preview-body"
                    style={{ background: getPreviewTheme().colors.windowBg }}
                  >
                    <p style={{ margin: '4px', fontSize: '8px' }}>Window Text</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="display-props-scheme">
              <label>Scheme:</label>
              <select
                className="display-props-select"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
              >
                {THEMES.map(theme => (
                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                ))}
              </select>
            </div>

            {/* Color preview swatches */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Theme Colors:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '30px',
                    height: '20px',
                    background: getPreviewTheme().colors.titleBarActive,
                    border: '1px solid #000',
                  }} />
                  <span style={{ fontSize: '9px' }}>Title</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '30px',
                    height: '20px',
                    background: getPreviewTheme().colors.windowBg,
                    border: '1px solid #000',
                  }} />
                  <span style={{ fontSize: '9px' }}>Window</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '30px',
                    height: '20px',
                    background: getPreviewTheme().colors.buttonFace,
                    border: '1px solid #000',
                  }} />
                  <span style={{ fontSize: '9px' }}>Button</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '30px',
                    height: '20px',
                    background: getPreviewTheme().colors.desktop,
                    border: '1px solid #000',
                  }} />
                  <span style={{ fontSize: '9px' }}>Desktop</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="display-props-buttons">
        <button className="win95-button" onClick={handleOK}>OK</button>
        <button className="win95-button" onClick={handleCancel}>Cancel</button>
        <button className="win95-button" onClick={applySettings}>Apply</button>
      </div>
    </div>
  );
}
