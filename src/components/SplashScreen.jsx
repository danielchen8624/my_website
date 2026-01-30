import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #000033 0%, #000066 50%, #000033 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
    }}>
      {/* Windows 95 Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '60px',
      }}>
        {/* Windows Flag */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 40px)',
          gridTemplateRows: 'repeat(2, 40px)',
          gap: '4px',
          transform: 'perspective(200px) rotateY(-15deg)',
        }}>
          <div style={{ background: '#ff0000', borderRadius: '2px' }} />
          <div style={{ background: '#00ff00', borderRadius: '2px' }} />
          <div style={{ background: '#0000ff', borderRadius: '2px' }} />
          <div style={{ background: '#ffff00', borderRadius: '2px' }} />
        </div>
        
        {/* Text */}
        <div style={{ color: '#fff', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', letterSpacing: '-2px' }}>
            Microsoft<sup style={{ fontSize: '16px' }}>®</sup>
          </div>
          <div style={{ 
            fontSize: '72px', 
            fontWeight: 'bold', 
            letterSpacing: '-3px',
            background: 'linear-gradient(180deg, #fff 0%, #ccc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Windows<span style={{ fontSize: '36px', verticalAlign: 'super' }}>95</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '300px',
        height: '20px',
        border: '2px solid #808080',
        background: '#000',
        padding: '2px',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #000080 0%, #0000ff 50%, #000080 100%)',
          transition: 'width 0.1s',
        }} />
      </div>

      {/* Loading text */}
      <div style={{
        marginTop: '20px',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      }}>
        Starting Windows 95...
      </div>
    </div>
  );
}
