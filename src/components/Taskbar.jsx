import { useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';

export default function Taskbar() {
  const { windows, toggleStartMenu, startMenuOpen, focusWindow, minimizeWindow, openWindow } = useOS();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format time as HH:MM AM/PM
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Handle taskbar window button click
  const handleWindowClick = (windowId, isMinimized) => {
    if (isMinimized) {
      focusWindow(windowId);
    } else {
      minimizeWindow(windowId);
    }
  };

  return (
    <div className="taskbar">
      {/* Start Button */}
      <button 
        className={`start-button ${startMenuOpen ? 'active' : ''}`}
        onClick={toggleStartMenu}
      >
        <span className="start-button-logo">🪟</span>
        <span>Start</span>
      </button>

      {/* Divider */}
      <div className="taskbar-divider" />

      {/* Quick Launch */}
      <div className="quick-launch">
         <button 
           className="quick-launch-btn" 
           title="Show Desktop"
           onClick={() => {
             // Logic to minimize all? Or just focus desktop?
             // For now just a placeholder action or we can implement minimize all in OSContext
             alert("Show Desktop: TODO");
           }}
         >
           🖥️
         </button>
         <button 
           className="quick-launch-btn" 
           title="Internet Explorer"
           onClick={() => openWindow('browser', { id: 'browser', name: 'Internet Explorer', icon: '🌐', appType: 'browser' })}
         >
           🌐
         </button>
         <button 
           className="quick-launch-btn" 
           title="Winamp"
           onClick={() => openWindow('winamp', { id: 'winamp', name: 'Winamp', icon: '🎵', appType: 'winamp' })}
         >
           🎵
         </button>
      </div>
      
      <div className="taskbar-divider" />

      {/* Open Windows */}
      <div className="taskbar-windows">
        {windows.map((window) => (
          <button
            key={window.id}
            className={`taskbar-window-btn ${!window.isMinimized ? 'active' : ''}`}
            onClick={() => handleWindowClick(window.id, window.isMinimized)}
          >
            <span className="taskbar-window-btn-icon">{window.icon}</span>
            <span>{window.title}</span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="taskbar-tray">
        <span>🔊</span>
        <span className="taskbar-clock">{formattedTime}</span>
      </div>
    </div>
  );
}
