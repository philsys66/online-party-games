import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GameMenu from '../components/GameMenu';

const Lobby: React.FC = () => {
    const { room, startGame, player, updateSettings, error } = useGame();
    const navigate = useNavigate();

    useEffect(() => {
        if (room?.gameState.status === 'playing') {
            navigate('/game');
        }
    }, [room?.gameState.status, navigate]);

    if (!room) {
        return (
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="glass-panel">
                    <h2>Room not found</h2>
                    <button onClick={() => navigate('/')}>Back Home</button>
                </div>
            </div>
        );
    }

    const isHost = room.players[0].id === player?.id;

    return (
        <div className="container column" style={{ paddingTop: '40px' }}>
            <header style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                <GameMenu />
                <h3 style={{ color: 'var(--color-text-dim)' }}>Room Code</h3>
                <h1 style={{ fontSize: '3rem', letterSpacing: '8px', color: 'var(--color-accent)' }}>
                    {room.id}
                </h1>
                {error && (
                    <div style={{
                        background: 'rgba(255, 0, 0, 0.2)',
                        border: '1px solid red',
                        color: '#ff6b6b',
                        padding: '10px',
                        borderRadius: '8px',
                        marginTop: '15px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
            </header>

            <div className="glass-panel">
                <h3>Players ({room.players.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <AnimatePresence>
                        {room.players.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="flex-center column"
                            >
                                <img src={p.avatar} alt={p.name} className="avatar" />
                                <span style={{ fontSize: '0.9rem', marginTop: '8px' }}>{p.name}</span>
                                {room.players[0].id === p.id && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>HOST</span>}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '20px', display: room.gameType === 'crossword' || room.gameType === 'monopoly' ? 'none' : 'block' }}>
                <h3>Game Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                    {room.gameType !== 'charades' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-dim)' }}>Timer</label>
                            {isHost ? (
                                <select
                                    value={room.gameConfig?.timerDuration || 60}
                                    onChange={(e) => updateSettings({ timerDuration: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--color-glass-border)' }}
                                >
                                    {[15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 240, 300].map(t => (
                                        <option key={t} value={t}>{t} seconds</option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{room.gameConfig?.timerDuration || 60}s</div>
                            )}
                        </div>
                    )}
                    {room.gameType !== 'charades' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-dim)' }}>Rounds</label>
                            {isHost ? (
                                <select
                                    value={room.gameConfig?.maxRounds || 3}
                                    onChange={(e) => updateSettings({ maxRounds: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--color-glass-border)' }}
                                >
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <option key={r} value={r}>{r} Rounds</option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{room.gameConfig?.maxRounds || 3}</div>
                            )}
                        </div>
                    )}

                    {/* Charades Category Selection */}
                    {room.gameType === 'charades' && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-dim)' }}>Word Category</label>
                            {isHost ? (
                                <select
                                    value={room.gameConfig?.charadesCategory || 'Friends'}
                                    onChange={(e) => updateSettings({ charadesCategory: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--color-glass-border)' }}
                                >
                                    <option value="Friends">Friends (TV Show)</option>
                                    <option value="Movies">Movies</option>
                                    <option value="Actions & Activities">Actions & Activities</option>
                                    <option value="Famous People">Famous People</option>
                                    <option value="Jobs & Occupations">Jobs & Occupations</option>
                                </select>
                            ) : (
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{room.gameConfig?.charadesCategory || 'Friends'}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: '40px' }}>
                {isHost ? (
                    <button
                        onClick={startGame}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(45deg, var(--color-primary), var(--color-secondary))',
                            fontSize: '1.2rem',
                            padding: '20px'
                        }}
                    >
                        Start Game
                    </button>
                ) : (
                    <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-dim)' }}>
                        Waiting for host to start...
                    </p>
                )}
            </div>
        </div>
    );
};

export default Lobby;
