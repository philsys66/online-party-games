import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CATEGORIES_LIST } from '../data/categories';
import { motion } from 'framer-motion';
import VotingView from '../components/VotingView';
import ResultsView from '../components/ResultsView';
import CrosswordBoard from '../components/CrosswordBoard';
import CharadesBoard from '../components/CharadesBoard';
import MonopolyBoard from '../components/MonopolyBoard';
import { OligarchyBoard } from '../components/OligarchyBoard';
import GameMenu from '../components/GameMenu';

const GameRoom: React.FC = () => {
    const { room, socket } = useGame();
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // In a real implementation, we would listen for timer updates from socket
    // For now, we'll just show what the room state has

    useEffect(() => {
        if (room?.gameState.status === 'voting' && !hasSubmitted) {
            console.log('Auto-submitting answers:', answers);
            setHasSubmitted(true);
            socket.emit('submit_answers', { roomCode: room.id, answers });
        }
    }, [room?.gameState.status, hasSubmitted, answers, room?.id, socket]);

    // Reset for new round/game
    useEffect(() => {
        if (room?.gameState.status === 'playing') {
            setHasSubmitted(false);
            setAnswers({}); // Clear local answers
        }
    }, [room?.gameState.round, room?.gameState.status]);

    // Stopwatch Logic for Charades
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (room?.gameType !== 'charades' || !room.gameState.roundStartTime || room.gameState.isPaused) return;

        const interval = setInterval(() => {
            setElapsedTime(Date.now() - (room.gameState.roundStartTime || Date.now()));
        }, 100);

        return () => clearInterval(interval);
    }, [room?.gameType, room?.gameState.roundStartTime, room?.gameState.isPaused]);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Scroll to top on mount and when game type changes
    useEffect(() => {
        window.scrollTo(0, 0);
        // Fallback for async rendering
        const t = setTimeout(() => window.scrollTo(0, 0), 100);
        return () => clearTimeout(t);
    }, [room?.id, room?.gameType, room?.gameState.status]);

    if (!room) return <div>Loading...</div>;

    // If showing results or voting, we might still want the header or a different view
    // For now, keep voting/results as full screen replacements for simplicity, 
    // OR unify them too. But request was specifically for Crossword menu.

    // Let's handle Voting and Results as "Content" inside the layout if possible?
    // Actually, user only complained about Crossword menu. 

    // We will render Crossword board as content if gameType is crossword.

    const handleInputChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    const renderContent = () => {
        if (room.gameState.status === 'voting') return <VotingView />;
        if (room.gameState.status === 'results') return <ResultsView />;

        if (room.gameType === 'crossword') return <CrosswordBoard />;
        if (room.gameType === 'charades') return <CharadesBoard />;
        if (room.gameType === 'monopoly') return <MonopolyBoard />;
        if (room.gameType === 'oligarchy') return <OligarchyBoard room={room} socket={socket} userId={socket.id} />;

        // Use server categories if available, else default list
        const categories = room.gameState.categories || CATEGORIES_LIST;

        // Scattergories Playing
        return (
            <div className="column" style={{ marginTop: '20px' }}>
                {categories.map((cat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-panel"
                        style={{ padding: '16px' }}
                    >
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            {index + 1}. {cat}
                        </label>
                        <input
                            value={answers[index] || ''}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            disabled={hasSubmitted}
                            placeholder={`Starts with ${room.gameState.letter}...`}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                borderBottom: '1px solid var(--color-glass-border)',
                                borderRadius: '4px 4px 0 0'
                            }}
                        />
                    </motion.div>
                ))}

            </div>
        );
    };


    // Full Screen Overrides:
    // Oligarchy needs full width/height but uses the standard header now.
    // We will adjust the container style dynamically.
    const isFullWidthGame = room.gameType === 'oligarchy';

    return (
        <div
            className={`container column ${isFullWidthGame ? 'full-width-game' : ''}`}
            style={{
                paddingBottom: isFullWidthGame ? '0' : '100px',
                paddingTop: isFullWidthGame ? '0' : '80px',
                width: isFullWidthGame ? '100vw' : '100%',
                maxWidth: isFullWidthGame ? 'none' : undefined,
                height: isFullWidthGame ? '100vh' : 'auto',
                overflow: isFullWidthGame ? 'hidden' : 'visible'
            }}
        >
            <header
                className="glass-panel column"
                style={{
                    position: isFullWidthGame ? 'relative' : 'sticky',
                    top: isFullWidthGame ? '0' : '10px',
                    zIndex: 10,
                    padding: '10px 20px',
                    margin: isFullWidthGame ? '0' : undefined,
                    borderRadius: isFullWidthGame ? '0' : undefined,
                    borderLeft: isFullWidthGame ? 'none' : undefined,
                    borderRight: isFullWidthGame ? 'none' : undefined,
                    borderTop: isFullWidthGame ? 'none' : undefined,
                }}
            >
                <GameMenu />
                <div className="flex-center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    {/* Left Side (Letter or Charades Counter) */}
                    <div className="flex-center column" style={{ width: '140px' }}>
                        {room.gameType === 'scattergories' && (
                            <>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>LETTER</span>
                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    {room.gameState.letter}
                                </span>
                            </>
                        )}
                        {room.gameType === 'charades' && (
                            <>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>REMAINING</span>
                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                    {room.players.length - (room.gameState.actingTimes ? Object.keys(room.gameState.actingTimes).length : 0)}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Center (Room Code) */}
                    <div className="flex-center column">
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>ROOM</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                            {room.id}
                        </span>
                    </div>

                    {/* Timer/Round Info - Hide for Crossword & Monopoly which don't use the standard header timer */}
                    {(room.gameType === 'scattergories') && (
                        <div style={{ textAlign: 'center', marginTop: '5px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f39c12' }}>
                                {Math.floor(room.gameState.timer / 60)}:{(room.gameState.timer % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    )}
                    {/* Right Side (Timer / Stopwatch) */}
                    <div className="flex-center column" style={{ width: '140px' }}>
                        {room.gameType === 'charades' ? (
                            <>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>TIME</span>
                                <span style={{ fontSize: '2rem', fontFamily: 'monospace', color: room.gameState.isPaused ? 'red' : 'white' }}>
                                    {formatTime(elapsedTime)}
                                </span>
                            </>
                        ) : room.gameType === 'oligarchy' ? (
                            // Oligarchy shows nothing here or maybe net worth? For now, keep it clean.
                            <span style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', opacity: 0.5 }}>-</span>
                        ) : (
                            <span style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', opacity: 0.5 }}>-</span>
                        )}
                    </div>
                </div>

                {/* Crossword Scores Header */}
                {room.gameType === 'crossword' && (
                    <div style={{
                        borderTop: '1px solid var(--color-glass-border)',
                        marginTop: '10px',
                        paddingTop: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}>
                        {room.players.map(p => (
                            <div key={p.id} className="flex-center" style={{ gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                                <img src={p.avatar} alt={p.name} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>{p.name}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-accent)', fontSize: '1.1rem' }}>{p.score}</span>
                            </div>
                        ))}
                    </div>
                )}
            </header>

            {renderContent()}
        </div>
    );
};

export default GameRoom;
