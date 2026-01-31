import { useState, useEffect, useRef, useCallback } from 'react';

export default function ScreenSaver({ type = 'starfield', waitMinutes = 5, enabled = true }) {
  const [isActive, setIsActive] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset idle timer on any activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isActive) {
      setIsActive(false);
    }
  }, [isActive]);

  // Check for idle timeout
  useEffect(() => {
    if (!enabled || type === 'none') return;

    const checkIdle = () => {
      const idleTime = Date.now() - lastActivityRef.current;
      const waitMs = waitMinutes * 60 * 1000;

      if (idleTime >= waitMs && !isActive) {
        setIsActive(true);
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 1000);

    // Activity listeners
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    return () => {
      clearInterval(idleTimerRef.current);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [enabled, type, waitMinutes, isActive, resetIdleTimer]);

  // Starfield animation
  const runStarfield = useCallback((ctx, width, height) => {
    const stars = [];
    const numStars = 200;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width - centerX,
        y: Math.random() * height - centerY,
        z: Math.random() * width,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      for (let star of stars) {
        star.z -= 5;

        if (star.z <= 0) {
          star.x = Math.random() * width - centerX;
          star.y = Math.random() * height - centerY;
          star.z = width;
        }

        const sx = (star.x / star.z) * 100 + centerX;
        const sy = (star.y / star.z) * 100 + centerY;
        const size = (1 - star.z / width) * 3;

        ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.z / width})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Matrix animation
  const runMatrix = useCallback((ctx, width, height) => {
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops = Array(columns).fill(1);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0f0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Pipes animation (simplified 3D pipes)
  const runPipes = useCallback((ctx, width, height) => {
    const pipes = [];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    class Pipe {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.direction = Math.floor(Math.random() * 4); // 0=up, 1=right, 2=down, 3=left
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.length = 0;
        this.maxLength = 50 + Math.random() * 100;
      }

      update() {
        const speed = 3;
        const prevX = this.x;
        const prevY = this.y;

        switch (this.direction) {
          case 0: this.y -= speed; break;
          case 1: this.x += speed; break;
          case 2: this.y += speed; break;
          case 3: this.x -= speed; break;
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // Draw joint
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();

        this.length += speed;

        // Change direction or reset
        if (this.length > this.maxLength || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          if (Math.random() > 0.3) {
            this.direction = Math.floor(Math.random() * 4);
            this.length = 0;
            this.maxLength = 50 + Math.random() * 100;
          } else {
            this.reset();
          }
        }
      }
    }

    // Initialize pipes
    for (let i = 0; i < 5; i++) {
      pipes.push(new Pipe());
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    const animate = () => {
      // Slight fade for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
      ctx.fillRect(0, 0, width, height);

      pipes.forEach(pipe => pipe.update());

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Run the appropriate screensaver
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    switch (type) {
      case 'starfield':
        runStarfield(ctx, canvas.width, canvas.height);
        break;
      case 'matrix':
        runMatrix(ctx, canvas.width, canvas.height);
        break;
      case 'pipes':
        runPipes(ctx, canvas.width, canvas.height);
        break;
      case 'blank':
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      default:
        break;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, type, runStarfield, runMatrix, runPipes]);

  if (!isActive || type === 'none') return null;

  return (
    <div
      className="screensaver-overlay"
      onClick={resetIdleTimer}
      onMouseMove={resetIdleTimer}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        cursor: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
