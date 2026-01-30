import { useState, useCallback, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import './MinesweeperApp.css';

const DIFFICULTY = {
  beginner: { rows: 9, cols: 9, mines: 10, width: 210, height: 320 },
  intermediate: { rows: 16, cols: 16, mines: 40, width: 350, height: 470 },
  expert: { rows: 16, cols: 30, mines: 99, width: 630, height: 470 },
};

// ... createBoard function ... (KEEP THIS AS IS, do not include in replace chunk if possible, but tool requires contiguous block. I will just replace imports and component start)

function createBoard(rows, cols, mines) {
  // Create empty board
  const board = Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            count++;
          }
        }
      }
      board[r][c].neighborMines = count;
    }
  }

  return board;
}

export default function MinesweeperApp({ windowId }) {
  const { updateWindowSize } = useOS();
  const [difficulty, setDifficulty] = useState('beginner');
  const [board, setBoard] = useState(() => {
    const d = DIFFICULTY[difficulty];
    return createBoard(d.rows, d.cols, d.mines);
  });
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [flagCount, setFlagCount] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const { rows, cols, mines } = DIFFICULTY[difficulty];

  // Auto-resize window when difficulty changes
  useEffect(() => {
    if (windowId && updateWindowSize) {
      const d = DIFFICULTY[difficulty];
      updateWindowSize(windowId, { width: d.width, height: d.height });
    }
  }, [difficulty, windowId, updateWindowSize]);

  const resetGame = useCallback((newDifficulty = difficulty) => {
    const d = DIFFICULTY[newDifficulty];
    setBoard(createBoard(d.rows, d.cols, d.mines));
    setGameState('playing');
    setFlagCount(0);
    setDifficulty(newDifficulty);
  }, [difficulty]);

  const revealCell = useCallback((row, col) => {
    if (gameState !== 'playing') return;

    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];

      if (cell.isRevealed || cell.isFlagged) return prev;

      cell.isRevealed = true;

      if (cell.isMine) {
        // Game over - reveal all mines
        newBoard.forEach(r => r.forEach(c => {
          if (c.isMine) c.isRevealed = true;
        }));
        setGameState('lost');
        return newBoard;
      }

      // Flood fill for empty cells
      if (cell.neighborMines === 0) {
        const stack = [[row, col]];
        const visited = new Set();
        
        while (stack.length > 0) {
          const [r, c] = stack.pop();
          const key = `${r},${c}`;
          if (visited.has(key)) continue;
          visited.add(key);

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const neighbor = newBoard[nr][nc];
                if (!neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) {
                  neighbor.isRevealed = true;
                  if (neighbor.neighborMines === 0) {
                    stack.push([nr, nc]);
                  }
                }
              }
            }
          }
        }
      }

      // Check for win
      let unrevealedSafe = 0;
      newBoard.forEach(r => r.forEach(c => {
        if (!c.isMine && !c.isRevealed) unrevealedSafe++;
      }));
      if (unrevealedSafe === 0) {
        setGameState('won');
      }

      return newBoard;
    });
  }, [gameState, rows, cols]);

  const toggleFlag = useCallback((row, col, e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;

    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];

      if (cell.isRevealed) return prev;

      cell.isFlagged = !cell.isFlagged;
      setFlagCount(f => cell.isFlagged ? f + 1 : f - 1);
      return newBoard;
    });
  }, [gameState]);

  const getFaceEmoji = () => {
    if (gameState === 'won') return '😎';
    if (gameState === 'lost') return '😵';
    if (isMouseDown) return '😮';
    return '🙂';
  };

  const getCellContent = (cell) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborMines === 0) return '';
    return cell.neighborMines;
  };

  const getNumberColor = (num) => {
    const colors = ['', '#0000FF', '#008000', '#FF0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[num] || '#000';
  };

  return (
    <div className="minesweeper-app">
      {/* Menu Bar */}
      <div className="minesweeper-menu">
        <div className="minesweeper-menu-item">
          Game
          <div className="minesweeper-menu-dropdown">
            <div onClick={() => resetGame('beginner')}>Beginner</div>
            <div onClick={() => resetGame('intermediate')}>Intermediate</div>
            <div onClick={() => resetGame('expert')}>Expert</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="minesweeper-header">
        <div className="minesweeper-counter">{String(mines - flagCount).padStart(3, '0')}</div>
        <button 
          className="minesweeper-face"
          onClick={() => resetGame()}
        >
          {getFaceEmoji()}
        </button>
        <div className="minesweeper-counter">000</div>
      </div>

      {/* Board */}
      <div 
        className="minesweeper-board"
        style={{
          gridTemplateColumns: `repeat(${cols}, 20px)`,
          gridTemplateRows: `repeat(${rows}, 20px)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`minesweeper-cell ${cell.isRevealed ? 'revealed' : ''} ${cell.isMine && cell.isRevealed ? 'mine' : ''}`}
              onClick={() => revealCell(r, c)}
              onContextMenu={(e) => toggleFlag(r, c, e)}
              onMouseDown={() => setIsMouseDown(true)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
              disabled={gameState !== 'playing' && !cell.isRevealed}
              style={{ color: getNumberColor(cell.neighborMines) }}
            >
              {getCellContent(cell)}
            </button>
          ))
        )}
      </div>

      {/* Status */}
      {gameState !== 'playing' && (
        <div className="minesweeper-status">
          {gameState === 'won' ? '🎉 You Win!' : '💥 Game Over!'}
        </div>
      )}
    </div>
  );
}
