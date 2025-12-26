import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

const CharadesBoard: React.FC = () => {
    const { room, player, socket } = useGame();
    const [penaltyTime, setPenaltyTime] = useState(0);
    const [processing, setProcessing] = useState(false);

    // Reset processing state when paused state changes
    useEffect(() => {
        setProcessing(false);
    }, [room?.gameState.isPaused, room?.gameState.actorId]);

    if (!room || !player) return null;

    const isActor = room.gameState.actorId === player.id;
    const actorName = room.players.find(p => p.id === room.gameState.actorId)?.name || 'Someone';
    const isPaused = room.gameState.isPaused;
    const guessingPlayerId = room.gameState.guessingPlayerId;
    const guesserName = room.players.find(p => p.id === guessingPlayerId)?.name || 'Someone';
    const penaltyEnd = room.gameState.penalties?.[player.id] || 0;
    const currentScene = room.gameState.currentScene;

    // Penalty Timer
    useEffect(() => {
        const checkPenalty = () => {
            const left = Math.max(0, Math.ceil((penaltyEnd - Date.now()) / 1000));
            setPenaltyTime(left);
        };
        const interval = setInterval(checkPenalty, 500);
        checkPenalty();
        return () => clearInterval(interval);
    }, [penaltyEnd]);

    // (Stopwatch Logic moved to GameRoom header)

    const handleBuzz = () => {
        if (!isActor && !isPaused && penaltyTime <= 0) {
            socket?.emit('buzz', room.id);
        }
    };

    const handleResolve = (correct: boolean) => {
        if (isActor && isPaused) {
            socket?.emit('resolve_guess', { roomCode: room.id, correct });
        }
    };

    return (
        <div className="flex-center column" style={{ width: '100%', height: '100%', position: 'relative' }}>

            {/* Header / Stats - REMOVED (Moved to GameRoom Header) */}

            {/* Penalty Overlay */}
            <AnimatePresence>
                {penaltyTime > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.85)',
                            zIndex: 100,
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <h2 style={{ fontSize: '2rem', margin: 0 }}>PENALTY</h2>
                        <div style={{ fontSize: '4rem', fontWeight: 'bold' }}>{penaltyTime}s</div>
                        <p>Wait before buzzing again!</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {isActor ? (
                // ACTOR VIEW
                <div className="flex-center column" style={{ flex: 1 }}>
                    <h2 style={{ color: 'var(--color-text-dim)', marginBottom: '10px' }}>YOU ARE ACTING</h2>
                    <div className="card" style={{
                        padding: '40px 60px',
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        marginBottom: '40px'
                    }}>
                        {currentScene}
                    </div>

                    {room.gameState.isPaused && (
                        <div className="glass-panel" style={{ padding: '20px', border: '2px solid var(--color-accent)' }}>
                            <h3>{guesserName} is guessing...</h3>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        if (processing) return;
                                        setProcessing(true);
                                        handleResolve(true);
                                    }}
                                    disabled={processing}
                                    style={{ background: '#4ade80', color: '#000', padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: processing ? 'default' : 'pointer', opacity: processing ? 0.7 : 1 }}
                                >
                                    ✅ RIGHT
                                </button>
                                <button
                                    onClick={() => {
                                        if (processing) return;
                                        setProcessing(true);
                                        handleResolve(false);
                                    }}
                                    disabled={processing}
                                    style={{ background: '#f87171', color: '#000', padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: processing ? 'default' : 'pointer', opacity: processing ? 0.7 : 1 }}
                                >
                                    ❌ WRONG
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // GUESSER VIEW
                <div className="flex-center column" style={{ flex: 1 }}>
                    <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                        <h2 style={{ margin: 0 }}>{actorName} is acting!</h2>
                        <p style={{ color: 'var(--color-text-dim)' }}>Watch closely and buzz in when you know it.</p>
                    </div>

                    <button
                        onClick={handleBuzz}
                        disabled={room.gameState.isPaused || penaltyTime > 0}
                        className={`buzz-button ${room.gameState.isPaused ? 'disabled' : ''}`}
                        style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: '50%',
                            border: 'none',
                            background: room.gameState.isPaused
                                ? 'var(--color-glass)'
                                : 'radial-gradient(circle at 30% 30%, #ff6b6b, #c92a2a)',
                            boxShadow: room.gameState.isPaused
                                ? 'none'
                                : '0 10px 30px rgba(220, 38, 38, 0.4), inset 0 5px 10px rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            cursor: room.gameState.isPaused || penaltyTime > 0 ? 'not-allowed' : 'pointer',
                            transform: room.gameState.isPaused ? 'scale(0.9)' : 'scale(1)',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        {room.gameState.isPaused
                            ? (room.gameState.guessingPlayerId === player?.id ? 'YOUR TURN' : 'PAUSED')
                            : 'GUESS!'}
                    </button>

                    {room.gameState.guessingPlayerId === player?.id && (
                        <div style={{ marginTop: '20px', color: '#4ade80', fontWeight: 'bold', fontSize: '1.5rem', animation: 'pulse 1s infinite' }}>
                            Say your guess out loud!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CharadesBoard;
