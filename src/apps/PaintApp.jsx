import { useState, useRef, useCallback, useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';

const COLORS = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
];

const TOOLS = [
  { id: 'pencil', icon: '/', name: 'Pencil' },
  { id: 'brush', icon: '~', name: 'Brush' },
  { id: 'eraser', icon: '#', name: 'Eraser' },
  { id: 'fill', icon: '%', name: 'Fill' },
  { id: 'line', icon: '\\', name: 'Line' },
  { id: 'rect', icon: '[]', name: 'Rectangle' },
  { id: 'circle', icon: 'O', name: 'Circle' },
];

export default function PaintApp() {
  const { addFile } = useFileSystem();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [fileName, setFileName] = useState('untitled');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Start drawing
  const handleMouseDown = useCallback((e) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPos(coords);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (currentTool === 'fill') {
      // Simple fill (just fills with color for now)
      ctx.fillStyle = currentColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [getCanvasCoords, currentTool, currentColor]);

  // Draw
  const handleMouseMove = useCallback((e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
    ctx.lineWidth = currentTool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    setLastPos(coords);
  }, [isDrawing, lastPos, getCanvasCoords, currentColor, currentTool, brushSize]);

  // Stop drawing
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Save to virtual desktop
  const saveToDesktop = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    addFile({
      name: `${fileName}.png`,
      type: 'file',
      icon: 'notepad',
      position: { x: 150 + Math.random() * 50, y: 150 + Math.random() * 50 },
      content: dataUrl,
      appType: 'image',
    });
    
    alert(`"${fileName}.png" saved to Desktop!`);
  };

  // Save as real file
  const saveAsFile = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="paint-app">
      {/* Menu Bar */}
      <div className="paint-menu">
        <div className="paint-menu-item">
          File
          <div className="paint-menu-dropdown">
            <div onClick={clearCanvas}>New</div>
            <div onClick={saveToDesktop}>Save to Desktop</div>
            <div onClick={saveAsFile}>Save As...</div>
          </div>
        </div>
        <div className="paint-menu-item">
          Edit
          <div className="paint-menu-dropdown">
            <div onClick={clearCanvas}>Clear All</div>
          </div>
        </div>
      </div>

      <div className="paint-workspace">
        {/* Toolbox */}
        <div className="paint-toolbox">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`paint-tool ${currentTool === tool.id ? 'active' : ''}`}
              onClick={() => setCurrentTool(tool.id)}
              title={tool.name}
            >
              {tool.icon}
            </button>
          ))}
          
          <div className="paint-brush-size">
            <label>Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <span>{brushSize}px</span>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="paint-canvas-container">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="paint-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      {/* Color Palette */}
      <div className="paint-palette">
        <div className="paint-current-colors">
          <div 
            className="paint-current-color"
            style={{ backgroundColor: currentColor }}
            title="Current Color"
          />
        </div>
        <div className="paint-color-grid">
          {COLORS.map(color => (
            <button
              key={color}
              className={`paint-color ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="paint-status">
        <span>Tool: {TOOLS.find(t => t.id === currentTool)?.name}</span>
        <span>|</span>
        <span>Size: {brushSize}px</span>
        <span>|</span>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="paint-filename"
          placeholder="filename"
        />
      </div>
    </div>
  );
}
