import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import useSound from 'use-sound';
import { OLIGARCHY_BOARD, SECTORS, OligarchyCompany } from '../data/oligarchyData';

// Types
interface Player {
    id: string;
    name: string;
    avatar: string;
    score: number;
    role?: 'player' | 'banker';
}

interface Room {
    id: string;
    players: Player[];
    gameState: {
        status: string;
        oligarchy?: {
            players: Record<string, {
                cash: number;
                position: number;
                companies: number[];
                isBankrupt: boolean;
            }>;
            companies: Record<number, {
                ownerId?: string;
            }>;
            turnPhase: 'rolling' | 'acting';
            currentTurnPlayerId: string;
            activeNewsflash?: { title: string, description: string, type: string } | null;
            lastRoll?: number[];
            transactionLog: string[];
        };
    };
}

interface OligarchyBoardProps {
    room: Room;
    socket: any;
    userId: string;
}

export const OligarchyBoard: React.FC<OligarchyBoardProps> = ({ room, socket, userId }) => {
    const game = room.gameState.oligarchy!;
    const player = room.players.find(p => p.id === socket.id)!;
    const playerState = game.players[socket.id];
    const isMyTurn = game.currentTurnPlayerId === socket.id;

    const [showBuyModal, setShowBuyModal] = useState(false);

    // Sound effects (placeholders)
    // const [playCash] = useSound('/sounds/cash.mp3');

    // 6x6 Grid Layout
    // We map the 36 items directly to grid cells.

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#0d1117', // Dark GitHub/Bloomberg bg
            color: '#e6edf3',
            fontFamily: "'JetBrains Mono', monospace", // Mono font for terminal feel
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header / Ticker */}
            <div style={{
                height: '50px',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                background: '#161b22',
                justifyContent: 'space-between'
            }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>OLIGARCHY <span style={{ color: '#00d2d3' }}>TERMINAL</span></div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {room.players.map(p => {
                        const pData = game.players[p.id];
                        const isTurn = game.currentTurnPlayerId === p.id;
                        return (
                            <div key={p.id} style={{
                                opacity: pData.isBankrupt ? 0.5 : 1,
                                borderBottom: isTurn ? '2px solid #00d2d3' : 'none',
                                paddingBottom: '2px',
                                color: isTurn ? 'white' : '#8b949e'
                            }}>
                                {p.name}: <span style={{ color: '#2ecc71' }}>${pData.cash}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content: Grid + Dashboard */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* 6x6 Grid Board */}
                <div style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridTemplateRows: 'repeat(6, 1fr)',
                    gap: '4px',
                    padding: '10px',
                    maxWidth: '100vh', // Keep it somewhat square-ish relative to height
                    aspectRatio: '1/1',
                    margin: '0 auto'
                }}>
                    {OLIGARCHY_BOARD.map((company, index) => {
                        const companyState = game.companies[company.id];
                        const owner = companyState.ownerId ? room.players.find(p => p.id === companyState.ownerId) : null;
                        const sectorColor = SECTORS[company.sector].color;

                        // Players on this tile
                        const playersOnTile = room.players.filter(p => game.players[p.id]?.position === index);

                        return (
                            <div key={company.id} style={{
                                background: '#161b22',
                                border: `1px solid ${sectorColor}`,
                                borderRadius: '4px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: '4px',
                                boxShadow: owner ? `inset 0 0 10px ${sectorColor}20` : 'none'
                            }}>
                                {/* Header: Value & Name */}
                                <div style={{ fontSize: '0.6rem', color: sectorColor, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>${company.value}</span>
                                    {owner && <span>👑 {owner.name.substring(0, 3)}</span>}
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.1' }}>
                                    {company.name}
                                </div>

                                {/* Rent Indicator */}
                                <div style={{ fontSize: '0.5rem', color: '#8b949e', textAlign: 'center' }}>
                                    Base: ${company.baseRent}
                                </div>

                                {/* Player Tokens */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
                                    {playersOnTile.map(p => (
                                        <motion.div
                                            key={p.id}
                                            layoutId={`token-${p.id}`}
                                            title={p.name}
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: `repeating-linear-gradient(45deg, ${stringToColor(p.name)}, ${stringToColor(p.name)} 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px)`,
                                                border: '1px solid white',
                                                boxShadow: '0 0 4pxblack'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Panel: Controls & Logs (Desktop) */}
                <div style={{ width: '300px', background: '#0d1117', borderLeft: '1px solid #30363d', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    {/* Active Player Status */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>CURRENT MARKET MOVER</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {room.players.find(p => p.id === game.currentTurnPlayerId)?.name}
                        </div>
                        {isMyTurn && <div style={{ color: '#2ecc71', fontSize: '0.9rem' }}>YOUR TURN</div>}
                    </div>

                    {/* Controls */}
                    {isMyTurn && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {game.turnPhase === 'rolling' && (
                                <button
                                    onClick={() => socket.emit('oligarchy_roll', room.id)}
                                    style={btnStyle('#2ecc71')}
                                >
                                    EXECUTE MOVEMENT (ROLL)
                                </button>
                            )}

                            {game.turnPhase === 'acting' && (
                                <>
                                    {/* Check if current tile is unowned and buyable */}
                                    {(() => {
                                        const pos = playerState.position;
                                        const companyState = game.companies[pos];
                                        const company = OLIGARCHY_BOARD[pos];
                                        if (!companyState.ownerId && playerState.cash >= company.value) {
                                            return (
                                                <button
                                                    onClick={() => socket.emit('oligarchy_buy', room.id)}
                                                    style={btnStyle('#00d2d3')}
                                                >
                                                    ACQUIRE ASSET (${company.value})
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <button
                                        onClick={() => socket.emit('oligarchy_end_turn', room.id)}
                                        style={btnStyle('#ff6b6b')}
                                    >
                                        END FISCAL PERIOD
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Newsfeed Log */}
                    <div style={{ flex: 1, background: '#000', borderRadius: '4px', padding: '10px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {game.transactionLog.map((log, i) => (
                            <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                                <span style={{ color: '#00d2d3' }}>{'>'}</span> {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Newsflash Overlay */}
            <AnimatePresence>
                {game.activeNewsflash && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '80%',
                            maxWidth: '600px',
                            background: '#e74c3c', // Urgent Red
                            color: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            textAlign: 'center'
                        }}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase' }}>🔔 GLOBAL NEWSFLASH</h2>
                        <h3 style={{ margin: '10px 0', fontSize: '1.2rem' }}>{game.activeNewsflash.title}</h3>
                        <p style={{ fontSize: '1rem' }}>{game.activeNewsflash.description}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper for consistent avatar colors
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const btnStyle = (color: string) => ({
    background: color,
    color: '#000',
    border: 'none',
    padding: '12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase' as const
});
