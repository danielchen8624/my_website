import { useEffect } from 'react';

export default function BSOD({ onDismiss }) {
  useEffect(() => {
    const handleKeyPress = () => {
      if (onDismiss) {
        onDismiss();
      } else {
        window.location.reload();
      }
    };

    const handleClick = handleKeyPress;

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0000AA',
      color: '#FFFFFF',
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '16px',
      padding: '40px',
      boxSizing: 'border-box',
      zIndex: 999999,
      cursor: 'default',
      userSelect: 'none',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: '#AAA', 
          color: '#0000AA', 
          padding: '2px 8px',
          display: 'inline-block',
          marginBottom: '20px',
        }}>
          Windows
        </div>

        <br /><br />

        <p>
          A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) +
          00010E36. The current application will be terminated.
        </p>

        <br />

        <p>
          *  Press any key to terminate the current application.
        </p>
        <p>
          *  Press CTRL+ALT+DEL again to restart your computer. You will
        </p>
        <p style={{ paddingLeft: '20px' }}>
          lose any unsaved information in all applications.
        </p>

        <br /><br />

        <p style={{ textAlign: 'center' }}>
          Press any key to continue _
        </p>

        <br /><br /><br />

        <div style={{ 
          fontSize: '12px', 
          color: '#888',
          textAlign: 'center',
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          RETROOS_CRASH_HANDLER v1.0 - Click or press any key to reboot
        </div>
      </div>
    </div>
  );
}
