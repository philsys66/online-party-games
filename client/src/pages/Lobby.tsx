import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GameMenu from '../components/GameMenu';

// Helper for consistent avatar colors
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const Lobby: React.FC = () => {
    const { room, startGame, player, updateSettings, error, isConnected } = useGame();
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
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isConnected ? '#4ade80' : '#ef4444',
                        boxShadow: isConnected ? '0 0 5px #4ade80' : 'none'
                    }} />
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        {isConnected ? 'Online' : 'Disconnected'}
                    </span>
                </div>
                <img
                    src="/favicon.png"
                    alt="Ayton's Arcade"
                    style={{
                        width: '60px',
                        height: '60px',
                        marginBottom: '10px',
                        filter: 'drop-shadow(0 0 10px var(--color-primary))'
                    }}
                />
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
                        {room.players.map((p) => {
                            const borderColor = p.color || stringToColor(p.name);
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="flex-center column"
                                >
                                    <img
                                        src={p.avatar}
                                        alt={p.name}
                                        className="avatar"
                                        style={{
                                            border: `3px solid ${borderColor}`,
                                            boxShadow: `0 0 10px ${borderColor}60`
                                        }}
                                    />
                                    <span style={{ fontSize: '0.9rem', marginTop: '8px' }}>{p.name}</span>
                                    {room.players[0].id === p.id && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>HOST</span>}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '20px', display: ['crossword', 'monopoly', 'oligarchy'].includes(room.gameType) ? 'none' : 'block' }}>
                <h3>Game Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                    {room.gameType !== 'charades' && room.gameType !== 'oligarchy' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-dim)' }}>Timer</label>
                            <select
                                value={room.gameConfig?.timerDuration || 60}
                                onChange={(e) => updateSettings({ timerDuration: Number(e.target.value) })}
                                disabled={!isHost}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <option value={60}>60s</option>
                                <option value={120}>2 mins</option>
                                <option value={180}>3 mins</option>
                                <option value={300}>5 mins</option>
                            </select>
                        </div>
                    )}
                    {(room.gameType === 'scattergories' || room.gameType === 'charades') && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-dim)' }}>
                                {room.gameType === 'charades' ? 'Rounds per Player' : 'Rounds'}
                            </label>
                            <select
                                value={room.gameConfig?.maxRounds || 3}
                                onChange={(e) => updateSettings({ maxRounds: Number(e.target.value) })}
                                disabled={!isHost}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <option value={1}>1 Round</option>
                                <option value={3}>3 Rounds</option>
                                <option value={5}>5 Rounds</option>
                                <option value={10}>10 Rounds</option>
                            </select>
                        </div>
                    )}

                    {/* Charades Category Selection */}
                    {room.gameType === 'charades' && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-dim)' }}>Word Category</label>
                            <select
                                value={room.gameConfig?.charadesCategory || 'Friends'}
                                onChange={(e) => updateSettings({ charadesCategory: e.target.value })}
                                disabled={!isHost}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <option value="Friends">Friends (TV Show)</option>
                                <option value="Movies">Movies</option>
                                <option value="Actions & Activities">Actions & Activities</option>
                                <option value="Famous People">Famous People</option>
                                <option value="Jobs & Occupations">Jobs & Occupations</option>
                            </select>
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
        </div >
    );
};

export default Lobby;
