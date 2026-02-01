import React, { useState } from 'react';

const ICON_BASE_URL = 'https://win98icons.alexmeub.com/icons/png/';

const ICON_MAP = {
  // System
  'my-computer': 'computer_explorer-4.png',
  'recycle-bin-empty': 'recycle_bin_empty-4.png',
  'recycle-bin-full': 'recycle_bin_full-4.png',
  'bucket': 'recycle_bin_empty-4.png',
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
  'notepad': 'notepad-2.png',
  'note': 'notepad-2.png',
  'computer': 'computer_explorer-4.png',
  'paint': 'paint_file-0.png',
  'calculator': 'calculator-0.png',
  'minesweeper': 'game_mine_1-0.png',
  'winamp': 'cd_audio_cd_a-0.png',
  'terminal': 'console_prompt-0.png',
  'internet-explorer': 'msie2-2.png',
  'browser': 'msie2-2.png',
  'outlook': 'outlook_express-0.png',
  'contact': 'address_book_user-0.png',
  'resume': 'write_wordpad-0.png',
  'document': 'write_wordpad-0.png',
  'briefcase': 'briefcase-0.png',
  'trash': 'recycle_bin_full-4.png',
  'logo': 'windows-0.png',
  'desktop': 'desktop-0.png',
  'run': 'application_hourglass-0.png',
  'shutdown': 'shut_down_normal-0.png',
  'reset': 'msg_warning-0.png',
  'display': 'display_properties-0.png',
  'programs': 'directory_program_group-0.png',

  // IE toolbar icons
  'refresh': 'refresh-0.png',
  'stop': 'close_button-0.png',
  'home': 'house-0.png',
  'back': 'back_arrow-0.png',
  'forward': 'forward_arrow-0.png',
  'search': 'search_file-0.png',
  'favorites': 'directory_favorites-0.png',
  'print': 'printer-0.png',
  'mail': 'msn3-0.png',
  'link': 'html-0.png',

  // File types
  'file': 'file_lines-0.png',
  'text': 'notepad-2.png',
  'image': 'kodak_imaging-0.png',
  'audio': 'cd_audio_cd_a-0.png',
  'video': 'mplayer-0.png',
  'help': 'help_book_big-0.png',
  'info': 'msg_information-0.png',
  'warning': 'msg_warning-0.png',
  'error': 'msg_error-0.png',
  'question': 'msg_question-0.png',

  // Generic fallback
  'generic': 'file_lines-0.png',
};

// Unicode/text fallbacks for icons that fail to load
const FALLBACK_SYMBOLS = {
  'my-computer': '🖥️',
  'computer': '🖥️',
  'folder': '📁',
  'directory_open': '📂',
  'notepad': '📝',
  'note': '📝',
  'recycle-bin-empty': '🗑️',
  'recycle-bin-full': '🗑️',
  'hard-drive': '💾',
  'cd-drive': '💿',
  'floppy': '💾',
  'settings': '⚙️',
  'paint': '🎨',
  'calculator': '🔢',
  'minesweeper': '💣',
  'winamp': '🎵',
  'terminal': '▪️',
  'internet-explorer': '🌐',
  'browser': '🌐',
  'outlook': '📧',
  'contact': '📇',
  'resume': '📄',
  'document': '📄',
  'briefcase': '💼',
  'trash': '🗑️',
  'logo': '🪟',
  'desktop': '🖥️',
  'run': '▶️',
  'shutdown': '⏻',
  'reset': '⚠️',
  'display': '🖼️',
  'programs': '📂',
  'network': '🌐',
  'help': '❓',
  'info': 'ℹ️',
  'warning': '⚠️',
  'error': '❌',
  'question': '❓',
  'file': '📄',
  'text': '📝',
  'image': '🖼️',
  'audio': '🎵',
  'video': '🎬',
  'link': '🔗',
  'home': '🏠',
  'back': '◀',
  'forward': '▶',
  'refresh': '🔄',
  'stop': '⏹️',
  'search': '🔍',
  'favorites': '⭐',
  'print': '🖨️',
  'mail': '📧',
  'generic': '📄',
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

  // Fallback to emoji/Unicode symbol
  const fallbackSymbol = FALLBACK_SYMBOLS[icon] || FALLBACK_SYMBOLS['generic'];

  return (
    <div
      className={`icon-fallback ${className}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.7}px`,
        lineHeight: 1,
      }}
      {...props}
    >
      {fallbackSymbol}
    </div>
  );
}
