import React from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ResultsView: React.FC = () => {
    const { room, player, socket } = useGame();
    const navigate = useNavigate();

    if (!room) return null;

    // Sort Logic
    const sortedPlayers = [...room.players].sort((a, b) => {
        if (room.gameType === 'charades') {
            const timeA = room.gameState.actingTimes?.[a.id] || Infinity;
            const timeB = room.gameState.actingTimes?.[b.id] || Infinity;
            return timeA - timeB;
        }
        return b.score - a.score;
    });
    const winner = sortedPlayers[0];
    const isHost = room.players[0].id === player?.id;

    const handleNewGame = () => {
        // Basic restart logic: Create new room? Or just reset?
        // For MVP, simple redirect to home to start fresh or just create new room directly
        // Ideally, server should support "restart_game" event.
        // Let's just go home for now.
        navigate('/');
    };

    const canStartNextRound = isHost && room.gameState.round < room.gameConfig.maxRounds && room.gameType !== 'charades';

    const formatTime = (ms: number | undefined) => {
        if (ms === undefined || ms === Infinity) return "DNF";
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container column flex-center" style={{ paddingTop: '40px', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
                {room.gameType !== 'charades' && (
                    <span style={{ background: 'var(--color-glass)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        Round {room.gameState.round} / {room.gameConfig.maxRounds}
                    </span>
                )}
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
            >
                {room.gameType === 'charades' ? (
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>SPEED RUN COMPLETE</h1>
                        <div style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)' }}>Who was the fastest actor?</div>
                    </div>
                ) : (
                    <>
                        <h3 style={{ color: 'var(--color-text-dim)' }}>WINNER</h3>
                        <div style={{ position: 'relative', display: 'inline-block', margin: '20px 0' }}>
                            <img
                                src={winner.avatar}
                                alt={winner.name}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    border: '4px solid var(--color-accent)',
                                    boxShadow: '0 0 30px var(--color-accent)'
                                }}
                            />
                            <div style={{ fontSize: '3rem', marginTop: '10px' }}>{winner.name}</div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{winner.score} pts</div>
                        </div>
                    </>
                )}
            </motion.div>

            <div className="glass-panel" style={{ marginTop: '20px', padding: '0', width: '100%', maxWidth: '600px' }}>
                {sortedPlayers.map((p, index) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px 24px',
                            borderBottom: index < sortedPlayers.length - 1 ? '1px solid var(--color-glass-border)' : 'none',
                            background: p.id === player?.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '30px', color: 'var(--color-text-dim)' }}>
                                #{index + 1}
                            </span>
                            <img src={p.avatar} alt={p.name} className="avatar" style={{ width: '40px', height: '40px', margin: '0 15px' }} />
                            <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                        </div>

                        <span style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {room.gameType === 'charades' ? formatTime(room.gameState.actingTimes?.[p.id]) : p.score}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div style={{ marginTop: '40px', marginBottom: '40px' }}>
                {canStartNextRound ? (
                    <button
                        onClick={() => {
                            if (socket) {
                                socket.emit('start_next_round', room.id);
                            }
                        }}
                        style={{ background: 'var(--color-primary)', marginRight: '20px', fontSize: '1.2rem', padding: '15px 30px' }}
                    >
                        Start Round {room.gameState.round + 1}
                    </button>
                ) : (
                    <button
                        onClick={handleNewGame}
                        style={{ background: 'var(--color-secondary)' }}
                    >
                        Back to Home
                    </button>
                )}
            </div>
        </div>
    );
};

export default ResultsView;
