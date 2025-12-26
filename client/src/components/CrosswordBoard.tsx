import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

const CrosswordBoard: React.FC = () => {
    const { room, socket, player } = useGame();
    const [activeCell, setActiveCell] = useState<{ r: number, c: number } | null>(null);
    const [direction, setDirection] = useState<'across' | 'down'>('across');
    const inputRef = useRef<HTMLInputElement>(null);

    // Derived from room state
    const grid = room?.gameState.grid;
    const cursors = room?.gameState.cursors || {};

    // Focus input when active cell changes
    useEffect(() => {
        if (activeCell && inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [activeCell]);

    const moveCursor = (r: number, c: number) => {
        if (!grid) return;
        // Bounds check
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
        // Skip black cells? 
        if (grid[r][c].isBlack) return; // Simple skip

        setActiveCell({ r, c });
        socket.emit('cursor_move', { roomCode: room?.id, r, c });
    };

    const updateCell = (r: number, c: number, value: string) => {
        if (room) {
            socket.emit('update_cell', { roomCode: room.id, r, c, value });
        }
    };

    const handleCellClick = (r: number, c: number) => {
        if (grid && grid[r][c].isBlack) return;
        if (grid && grid[r][c].locked) return; // Cannot select locked cells

        if (activeCell?.r === r && activeCell?.c === c) {
            // Toggle direction if clicking same cell
            setDirection(prev => prev === 'across' ? 'down' : 'across');
        } else {
            setActiveCell({ r, c });
            socket.emit('cursor_move', { roomCode: room?.id, r, c });
        }
        inputRef.current?.focus({ preventScroll: true });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeCell || !grid) return;
        const val = e.target.value.slice(-1).toUpperCase(); // Take last char
        if (val.match(/[A-Z]/)) {
            updateCell(activeCell.r, activeCell.c, val);
            // Move forward
            if (direction === 'across') moveCursor(activeCell.r, activeCell.c + 1);
            else moveCursor(activeCell.r + 1, activeCell.c);
        }
        // Reset input to allow backspace detection on empty
        e.target.value = '';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!activeCell || !grid) return;
        const { r, c } = activeCell;

        // Arrow keys for navigation
        if (e.key === 'ArrowUp') { e.preventDefault(); moveCursor(r - 1, c); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); moveCursor(r + 1, c); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); moveCursor(r, c - 1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); moveCursor(r, c + 1); return; }

        // Backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            updateCell(r, c, '');
            // Move back
            if (direction === 'across') moveCursor(r, c - 1);
            else moveCursor(r - 1, c);
        }
    };

    if (!grid) return <div>Loading Grid...</div>;

    return (
        <div className="flex-center column" style={{ padding: '20px' }}>
            {/* Hidden Input for Mobile Keyboard */}
            <input
                ref={inputRef}
                type="text"
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    top: 0
                }}
                autoComplete="off"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                value=""
            />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${grid.length}, 50px)`,
                    gap: '2px',
                    padding: '10px',
                    background: 'var(--color-glass-border)',
                    borderRadius: '8px'
                }}
            >
                {grid.map((row, r) => (
                    row.map((cell, c) => {
                        const isSelected = activeCell?.r === r && activeCell?.c === c;

                        // Check if any other player is here
                        const otherPlayerId = Object.keys(cursors).find(pid =>
                            pid !== player?.id && cursors[pid].row === r && cursors[pid].col === c
                        );
                        const otherPlayerColor = otherPlayerId ? 'rgba(255, 100, 100, 0.5)' : null;

                        return (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    background: cell.isBlack ? 'black' :
                                        cell.locked ? 'var(--color-secondary)' :
                                            isSelected ? 'rgba(255, 255, 0, 0.3)' :
                                                otherPlayerColor || 'white',
                                    color: cell.locked ? 'white' : 'black',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.5rem',
                                    cursor: (cell.isBlack || cell.locked) ? 'default' : 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.3s ease'
                                }}
                            >
                                {cell.number && (
                                    <span style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '0.6rem', fontWeight: 'normal' }}>
                                        {cell.number}
                                    </span>
                                )}
                                {cell.value}

                                {/* Direction Arrow */}
                                {isSelected && !cell.value && (
                                    <span style={{
                                        position: 'absolute',
                                        fontSize: '1.2rem',
                                        opacity: 0.6,
                                        pointerEvents: 'none',
                                        color: 'rgba(0,0,0,0.5)',
                                        zIndex: 1
                                    }}>
                                        {direction === 'across' ? '→' : '↓'}
                                    </span>
                                )}
                            </div>
                        );
                    })
                ))}
            </div>

            {/* Clues Display */}
            <div className="glass-panel" style={{ marginTop: '20px', width: '100%', maxWidth: '600px', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                    <h4>Across</h4>
                    {room?.gameState.clues?.across && Object.entries(room.gameState.clues.across).map(([key, clue]) => (
                        <div key={key} style={{ fontSize: '0.9rem', marginBottom: '4px', opacity: 0.8 }}>
                            <b>{key}</b> {clue}
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1 }}>
                    <h4>Down</h4>
                    {room?.gameState.clues?.down && Object.entries(room.gameState.clues.down).map(([key, clue]) => (
                        <div key={key} style={{ fontSize: '0.9rem', marginBottom: '4px', opacity: 0.8 }}>
                            <b>{key}</b> {clue}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CrosswordBoard;
