import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OLIGARCHY_BOARD, SECTORS } from '../data/oligarchyData';

import type { Room } from '../types';

interface OligarchyBoardProps {
    room: Room;
    socket: any;
    userId: string;
}

export const OligarchyBoard: React.FC<OligarchyBoardProps> = ({ room, socket }) => {
    // Safety check
    if (!room.gameState.oligarchy) {
        return <div style={{ color: 'white', padding: '20px' }}>Loading Oligarchy State...</div>;
    }
    const game = room.gameState.oligarchy;
    const playerState = game.players[socket.id];
    const isMyTurn = game.currentTurnPlayerId === socket.id;

    // const [showBuyModal, setShowBuyModal] = useState(false);

    // Sound effects (placeholders)
    // const [playCash] = useSound('/sounds/cash.mp3');

    // 6x6 Grid Layout
    // We map the 36 items directly to grid cells.

    // CSS Styles
    const styles = `
        .oligarchy-app {
            width: 100vw;
            height: 100vh;
            background: #0d1117;
            color: #e6edf3;
            font-family: 'JetBrains Mono', monospace;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-sizing: border-box;
        }

        .oligarchy-main-layout {
            flex: 1;
            display: flex;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
        }

        .oligarchy-board-container {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: auto;
            position: relative;
        }

        .oligarchy-grid-wrapper {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: repeat(6, 1fr);
            gap: 4px;
            width: 100%;
            max-width: 800px;
            aspect-ratio: 1/1;
        }

        .oligarchy-control-panel {
            background: #0d1117;
            border-left: 1px solid #30363d;
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            overflow-y: auto;
            box-sizing: border-box;
        }

        /* Desktop Layout */
        @media (min-width: 769px) {
            .oligarchy-main-layout {
                flex-direction: row;
            }
            .oligarchy-control-panel {
                width: 300px;
                height: 100%;
                border-left: 1px solid #30363d;
                border-top: none;
            }
        }

        /* Mobile Layout */
        @media (max-width: 768px) {
            .oligarchy-main-layout {
                flex-direction: column;
            }
            .oligarchy-board-container {
                flex: 1; /* Board takes upper part */
                overflow: hidden; /* Prevent body scroll */
            }
            .oligarchy-grid-wrapper {
                max-width: 100%; /* Use full width */
                max-height: 100%;
            }
            .oligarchy-control-panel {
                width: 100%;
                height: 40%; /* Panel takes bottom 40% */
                min-height: 200px;
                border-left: none;
                border-top: 1px solid #30363d;
            }
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="oligarchy-app">
                {/* Header / Ticker */}
                <div style={{
                    height: '50px',
                    borderBottom: '1px solid #30363d',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    background: '#161b22',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>

                    {/* Header Left: Room Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
                            <span style={{ fontSize: '0.6rem', color: '#8b949e' }}>ROOM</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', color: '#e6edf3' }}>{room.id}</span>
                        </div>
                        <div style={{ height: '30px', width: '1px', background: '#30363d' }}></div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>OLIGARCHY <span style={{ color: '#00d2d3' }}>TERMINAL</span></div>
                    </div>

                    {/* Header Right: Exit & Ticker */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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

                        <button
                            onClick={() => window.location.reload()}
                            title="Exit Game"
                            style={{
                                background: 'transparent',
                                border: '1px solid #e74c3c',
                                color: '#e74c3c',
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                fontFamily: "'JetBrains Mono', monospace",
                                marginLeft: '10px'
                            }}
                        >
                            CLOSE_SESSION
                        </button>
                    </div>
                </div>

                {/* Main Content: Grid + Dashboard */}
                <div className="oligarchy-main-layout">

                    {/* 6x6 Grid Board - Container */}
                    <div className="oligarchy-board-container">
                        <div className="oligarchy-grid-wrapper">
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
                    </div>

                    {/* Right Panel: Controls & Logs */}
                    <div className="oligarchy-control-panel">
                        {/* Active Player Status */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>CURRENT MARKET MOVER</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {room.players.find(p => p.id === game.currentTurnPlayerId)?.name}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#333', marginTop: '5px' }}>
                                DEBUG: Me={socket.id.substring(0, 4)}... Turn={game.currentTurnPlayerId.substring(0, 4)}... Match={isMyTurn ? 'YES' : 'NO'} Phase={game.turnPhase}
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
        </>
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
