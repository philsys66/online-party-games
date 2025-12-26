import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import type { GameType } from '../types';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const { setPlayerName: setContextPlayerName, setPlayerAvatar, createRoom, joinRoom, error, setError, room } = useGame();

    // Initialize from LocalStorage
    const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');

    const navigate = useNavigate();

    useEffect(() => {
        if (room) {
            navigate('/lobby');
        }
    }, [room, navigate]);
    const [roomCode, setRoomCode] = useState('');
    const [mode, setMode] = useState<'menu' | 'join' | 'create'>('menu');
    const [selectedGame, setSelectedGame] = useState<GameType>('scattergories');

    // Dicebear avatars
    const avatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Cal',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow'
    ];

    const [selectedAvatar, setSelectedAvatar] = useState(localStorage.getItem('playerAvatar') || avatars[0]);

    const handleCreateGame = () => {
        if (!playerName.trim()) {
            setError('Please enter a name');
            return;
        }
        setContextPlayerName(playerName);
        setPlayerAvatar(selectedAvatar);
        createRoom(selectedGame, playerName, selectedAvatar);
        // Navigation is handled by room_joined event in context
    };

    const [isBanker, setIsBanker] = useState(false);

    const handleJoinGame = () => {
        if (!playerName.trim()) {
            setError('Please enter a name');
            return;
        }
        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }
        console.log('Join Game clicked', { playerName, roomCode, isBanker });
        setContextPlayerName(playerName);
        setPlayerAvatar(selectedAvatar);
        joinRoom(roomCode.toUpperCase(), playerName, selectedAvatar, isBanker ? 'banker' : 'player');
    };

    return (
        <div className="container flex-center column">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: '20px' }}
            >
                <img
                    src="/favicon.png"
                    alt="Ayton's Arcade Logo"
                    style={{
                        width: '100px',
                        height: '100px',
                        filter: 'drop-shadow(0 0 15px var(--color-primary))'
                    }}
                />
            </motion.div>

            <motion.h1
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="neon-text"
                style={{ fontSize: '4rem', marginBottom: '40px', textAlign: 'center' }}
            >
                AYTON'S<br /><span style={{ fontSize: '2rem', letterSpacing: '10px' }}>ARCADE</span>
            </motion.h1>

            {error && (
                <div style={{ color: 'var(--color-error)', marginBottom: '20px', padding: '10px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            {mode === 'menu' && (
                <div className="glass-panel column" style={{ gap: '20px', minWidth: '300px' }}>
                    <button onClick={() => setMode('create')} style={{ background: 'var(--color-primary)' }}>New Game</button>
                    <button onClick={() => setMode('join')} style={{ background: 'var(--color-secondary)' }}>Join Game</button>
                    <div className="flex-center" style={{ gap: '10px', marginTop: '10px', opacity: 0.7 }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', borderRadius: '50%' }}></div>
                        <div style={{ width: '40px', height: '40px', background: 'var(--color-secondary)', borderRadius: '50%' }}></div>
                    </div>
                </div>
            )}

            {mode === 'create' && (
                <div className="column" style={{ width: '100%', maxWidth: '800px' }}>
                    {/* Game Selection */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div
                            onClick={() => setSelectedGame('scattergories')}
                            className="glass-panel flex-center column"
                            style={{
                                width: '100px',
                                height: '125px',
                                cursor: 'pointer',
                                border: selectedGame === 'scattergories' ? '2px solid var(--color-primary)' : '1px solid transparent',
                                transform: selectedGame === 'scattergories' ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ fontSize: '2.5rem', color: 'var(--color-primary)', textShadow: '0 0 10px var(--color-primary)' }}>S</div>
                            <h3 style={{ marginTop: '10px', fontSize: '1rem' }}>Scattergories</h3>
                        </div>

                        <div
                            onClick={() => setSelectedGame('crossword')}
                            className="glass-panel flex-center column"
                            style={{
                                width: '100px',
                                height: '125px',
                                cursor: 'pointer',
                                border: selectedGame === 'crossword' ? '2px solid var(--color-secondary)' : '1px solid transparent',
                                transform: selectedGame === 'crossword' ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', width: '30px', height: '30px' }}>
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} style={{ background: i % 2 === 0 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                ))}
                            </div>
                            <h3 style={{ marginTop: '10px', fontSize: '1rem', textAlign: 'center' }}>Mini Crossword</h3>
                        </div>

                        <div
                            onClick={() => setSelectedGame('charades')}
                            className="glass-panel flex-center column"
                            style={{
                                width: '100px',
                                height: '125px',
                                cursor: 'pointer',
                                border: selectedGame === 'charades' ? '2px solid var(--color-accent)' : '1px solid transparent',
                                transform: selectedGame === 'charades' ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>🎭</div>
                            <h3 style={{ marginTop: '10px', fontSize: '1rem' }}>Charades</h3>
                        </div>

                        <div
                            onClick={() => setSelectedGame('monopoly')}
                            className="glass-panel flex-center column"
                            style={{
                                width: '100px',
                                height: '125px',
                                cursor: 'pointer',
                                border: selectedGame === 'monopoly' ? '2px solid #ef4444' : '1px solid transparent',
                                transform: selectedGame === 'monopoly' ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ fontSize: '2rem', color: '#ef4444' }}>🏠</div>
                            <h3 style={{ marginTop: '10px', fontSize: '1rem' }}>Monopoly</h3>
                        </div>
                    </div>

                    <div className="glass-panel column" style={{ gap: '20px', alignSelf: 'center', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ textAlign: 'center' }}>Player Setup</h3>
                        <input
                            placeholder="Enter your name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-glass-border)',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white'
                            }}
                        />

                        <div className="flex-center" style={{ gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {avatars.map((av, i) => (
                                <img
                                    key={i}
                                    src={av}
                                    onClick={() => setSelectedAvatar(av)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        border: selectedAvatar === av ? '2px solid var(--color-primary)' : '2px solid transparent'
                                    }}
                                />
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setMode('menu')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Back</button>
                            <button onClick={handleCreateGame} style={{ flex: 1, background: 'var(--color-primary)' }}>
                                Start {selectedGame === 'scattergories' ? 'Scattergories' : selectedGame === 'crossword' ? 'Crossword' : selectedGame === 'charades' ? 'Charades' : 'Monopoly'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'join' && (
                <div className="glass-panel column" style={{ gap: '20px', minWidth: '350px' }}>
                    <h3>Join Game</h3>
                    <input
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-glass-border)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white'
                        }}
                    />
                    <div className="flex-center" style={{ gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {avatars.map((av, i) => (
                            <img
                                key={i}
                                src={av}
                                onClick={() => setSelectedAvatar(av)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    border: selectedAvatar === av ? '2px solid var(--color-primary)' : '2px solid transparent'
                                }}
                            />
                        ))}
                    </div>
                    <input
                        placeholder="Room Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-glass-border)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            textAlign: 'center',
                            letterSpacing: '2px',
                            fontWeight: 'bold'
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                        <input
                            type="checkbox"
                            id="bankerMode"
                            checked={isBanker}
                            onChange={(e) => setIsBanker(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <label htmlFor="bankerMode" style={{ cursor: 'pointer', userSelect: 'none' }}>Join as Banker (Spectator)</label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setMode('menu')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Back</button>
                        <button onClick={handleJoinGame} style={{ flex: 1, background: 'var(--color-secondary)' }}>Join Room</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Home;
