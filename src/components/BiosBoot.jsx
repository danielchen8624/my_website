import { useState, useEffect } from 'react';

export default function BiosBoot({ onComplete }) {
  const [memoryCount, setMemoryCount] = useState(0);
  const [showDetection, setShowDetection] = useState(false);
  const [detectionLines, setDetectionLines] = useState([]);

  // Memory counting animation
  useEffect(() => {
    const targetMemory = 32768;
    const interval = setInterval(() => {
      setMemoryCount(prev => {
        const next = prev + 1024;
        if (next >= targetMemory) {
          clearInterval(interval);
          setTimeout(() => setShowDetection(true), 300);
          return targetMemory;
        }
        return next;
      });
    }, 15);
    return () => clearInterval(interval);
  }, []);

  // Hardware detection sequence
  useEffect(() => {
    if (!showDetection) return;
    
    const lines = [
      'Award Plug and Play BIOS Extension v1.0A',
      'Copyright (C) 1995, Award Software, Inc.',
      '',
      'Detecting Primary Master ... WDC AC22100H',
      'Detecting Primary Slave  ... None',
      'Detecting Secondary Master ... ATAPI CD-ROM',
      'Detecting Secondary Slave  ... None',
      '',
      'Press DEL to enter SETUP',
    ];

    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < lines.length) {
        setDetectionLines(prev => [...prev, lines[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1500);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [showDetection, onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      color: '#aaa',
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      padding: '20px',
      boxSizing: 'border-box',
      zIndex: 99999,
      overflow: 'hidden',
    }}>
      {/* Top section */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff' }}>Award Modular BIOS v4.51PG, An Energy Star Ally</div>
          <div>Copyright (C) 1984-95, Award Software, Inc.</div>
          <br />
          <div style={{ color: '#fff' }}>PENTIUM-S CPU at 133MHz</div>
          <br />
          <div>Memory Test: <span style={{ color: '#0f0' }}>{memoryCount}K OK</span></div>
        </div>
        
        {/* Energy Star Logo */}
        <pre style={{ color: '#0f0', fontSize: '12px', lineHeight: 1.1 }}>
{`    EPA POLLUTION
      PREVENTER
   ╔═══════════╗
   ║ ★ ENERGY  ║
   ║   STAR    ║
   ╚═══════════╝`}
        </pre>
      </div>

      {/* Detection lines */}
      <div style={{ marginTop: '20px' }}>
        {detectionLines.map((line, i) => (
          <div key={i} style={{ minHeight: '20px' }}>{line}</div>
        ))}
      </div>

      {/* Bottom info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: '#888',
      }}>
        06/15/95-i430FX-2A59CF54C-00
      </div>
    </div>
  );
}
