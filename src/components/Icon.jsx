import React, { useState } from 'react';

const ICON_BASE_URL = 'https://win98icons.alexmeub.com/icons/png/';

const ICON_MAP = {
  // System
  'my-computer': 'computer_explorer-4.png',
  'recycle-bin-empty': 'recycle_bin_empty-4.png',
  'recycle-bin-full': 'recycle_bin_full-4.png',
  'bucket': 'recycle_bin_empty-4.png', // fallback
  'network': 'network_neighborhood-4.png',
  'folder': 'directory_closed-4.png',
  'directory_open': 'directory_open-4.png',
  'settings': 'settings_gear-4.png',
  'program': 'application_hourglass-4.png',
  
  // Drives
  'hard-drive': 'hard_disk_drive-4.png',
  'cd-drive': 'cd_drive-4.png',
  'floppy': 'floppy_drive_3_5-4.png',
  
  // Apps
  'notepad': 'notepad-4.png',
  'note': 'notepad-4.png', 
  'computer': 'computer_explorer-4.png', 
  'paint': 'paint_file-4.png', 
  'calculator': 'calculator-4.png',
  'minesweeper': 'mine_sweeper-4.png', 
  'winamp': 'cd_audio_cd-4.png', 
  'terminal': 'console_prompt-0.png', // Correct Black Box Icon
  'internet-explorer': 'msie1-4.png',
  'browser': 'msie1-4.png',
  'outlook': 'outlook_express-4.png',
  'contact': 'address_book-4.png',
  'resume': 'write_wordpad-4.png', 
  'briefcase': 'briefcase-4.png',
  'trash': 'recycle_bin_full-4.png',
  'logo': 'windows-4.png', 
  'desktop': 'desktop-4.png',
  'run': 'application_run-0.png', // Correct Run Icon
  'shutdown': 'shut_down_cool-4.png',
  'reset': 'msg_warning-0.png', // Correct Warning Icon
  'display': 'display_properties-4.png',
  'programs': 'directory_program_group_small-4.png', // Correct Programs Icon (Start Menu)
};

export default function Icon({ icon, size = 32, className = '', ...props }) {
  const [error, setError] = useState(false);

  // If icon is an object { type: 'image', src: '...' }
  if (typeof icon === 'object' && icon?.type === 'image') {
    return <img src={icon.src} width={size} height={size} className={className} {...props} alt="" />;
  }

  // If icon is a known key in our map
  const iconKey = ICON_MAP[icon] ? icon : null;
  
  // If we have a mapped image and no error
  if (iconKey && !error) {
    return (
      <img 
        src={`${ICON_BASE_URL}${ICON_MAP[iconKey]}`}
        width={size}
        height={size}
        className={`pixel-art-icon ${className}`}
        onError={() => setError(true)}
        draggable={false}
        alt={icon}
        {...props}
      />
    );
  }

  // Fallback to emoji rendering if not a key or if loading failed
  // If the icon key is a word (like 'logo' or 'desktop') but failed to load, don't show the text.
  // Show a generic emoji instead.
  let displayContent = icon;
  
  // Heuristic: if icon string is > 2 chars, it's likely a key name, not an emoji.
  // Unless it's explicitly one of our keys that failed.
  if (typeof icon === 'string' && icon.length > 2) {
      if (icon === 'logo') displayContent = '🪟';
      else if (icon === 'desktop') displayContent = '🖥️';
      else if (icon === 'winamp') displayContent = '🎵';
      else if (icon.includes('recycle')) displayContent = '🗑️';
      else if (icon.includes('folder')) displayContent = '📁';
      else if (icon.includes('computer')) displayContent = '💻';
      else if (icon.includes('drive')) displayContent = '🖴'; // Fallback for hard-drive
      else if (icon.includes('disk')) displayContent = '💾';
      else if (icon.includes('cd')) displayContent = '💿';
      else if (icon.includes('settings') || icon.includes('control')) displayContent = '⚙️';
      else displayContent = '📄';
  }

  return (
    <div 
      className={`emoji-icon ${className}`} 
      style={{ fontSize: `${size * 0.8}px`, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      {...props}
    >
      {displayContent}
    </div>
  );
}
