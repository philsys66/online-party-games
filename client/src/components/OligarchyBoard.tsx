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

    const [activeTab, setActiveTab] = React.useState<'market' | 'assets'>('market');
    // const [bidAmount, setBidAmount] = React.useState<string>(''); // For manual entry if needed, or just visual


    // Sound effects (placeholders)
    // const [playCash] = useSound('/sounds/cash.mp3');

    // 6x6 Grid Layout
    // We map the 36 items directly to grid cells.

    // CSS Styles
    const styles = `
        .oligarchy-app {
            height: calc(100vh - 140px); /* Fit within standard layout (Head + padding) */
            width: 100%;
            background: #0d1117;
            color: #e6edf3;
            font-family: 'JetBrains Mono', monospace;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-sizing: border-box;
            border-radius: 8px; /* Slight rounding to match theme */
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
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
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(6, 1fr);
            gap: 4px;
            width: 100%;
            max-width: 800px;
            aspect-ratio: 1/1;
            position: relative; /* Anchor for Newsflash */
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
                height: 50%; /* Panel takes bottom 50% */
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
                                            <span>${companyState.currentValue}M</span>
                                            {owner && <span>👑 {owner.name.substring(0, 3)}</span>}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.1' }}>
                                            {company.name}
                                        </div>

                                        {/* Rent Indicator */}
                                        <div style={{ fontSize: '0.5rem', color: '#8b949e', textAlign: 'center' }}>
                                            {SECTORS[company.sector].shortName}
                                        </div>

                                        {/* Player Tokens */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
                                            {playersOnTile.map(p => (
                                                <motion.img
                                                    key={p.id}
                                                    layoutId={`token-${p.id}`}
                                                    src={p.avatar}
                                                    alt={p.name}
                                                    title={p.name}
                                                    style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        border: `2px solid ${stringToColor(p.name)}`,
                                                        boxShadow: '0 0 4px black',
                                                        objectFit: 'cover',
                                                        zIndex: 10
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Newsflash Overlay - Inside Grid now */}
                            <AnimatePresence>
                                {game.activeNewsflash && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 100,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '90%',
                                            maxWidth: '400px',
                                            background: 'rgba(231, 76, 60, 0.95)', // Urgent Red with slight transparency
                                            backdropFilter: 'blur(5px)',
                                            color: 'white',
                                            padding: '20px',
                                            borderRadius: '8px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                                            textAlign: 'center',
                                            border: '2px solid white',
                                            pointerEvents: 'auto'
                                        }}>
                                            <h2 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase' }}>🔔 NEWSFLASH</h2>
                                            <h3 style={{ margin: '10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{game.activeNewsflash.title}</h3>
                                            <p style={{ fontSize: '1rem' }}>{game.activeNewsflash.description}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Auction Overlay */}
                            <AnimatePresence>
                                {game.turnPhase === 'auction' && game.auction && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, backdropFilter: 'blur(8px)' }}
                                    >
                                        <h2 style={{ color: '#f1c40f', fontSize: '2rem', margin: '0 0 10px 0', textShadow: '0 0 10px #f1c40f' }}>🔨 LIVE AUCTION</h2>
                                        <div style={{ background: '#161b22', border: '1px solid #30363d', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '400px', textAlign: 'center' }}>
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                                                {OLIGARCHY_BOARD.find(c => c.id === game.auction!.companyId)?.name}
                                            </h3>
                                            <div style={{ color: '#8b949e', marginBottom: '20px' }}>
                                                Seller: {room.players.find(p => p.id === game.auction!.sellerId)?.name}
                                            </div>

                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2ecc71', marginBottom: '10px' }}>
                                                ${game.auction.currentBid}M
                                            </div>
                                            <div style={{ color: '#8b949e', marginBottom: '20px' }}>
                                                Highest Bidder: {game.auction.highestBidderId ? room.players.find(p => p.id === game.auction!.highestBidderId)?.name : 'No Bids'}
                                            </div>

                                            {/* Bidding Controls */}
                                            {socket.id !== game.auction.sellerId && (
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    {[1, 5, 10, 50].map(inc => (
                                                        <button
                                                            key={inc}
                                                            onClick={() => socket.emit('oligarchy_bid', room.id, game.auction!.currentBid + inc)}
                                                            disabled={playerState.cash < game.auction!.currentBid + inc}
                                                            style={{
                                                                background: '#238636', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                                                                opacity: playerState.cash < game.auction!.currentBid + inc ? 0.5 : 1
                                                            }}
                                                        >
                                                            +${inc}M
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {socket.id === game.auction.sellerId && (
                                                <div style={{ marginTop: '10px', color: '#8b949e', fontStyle: 'italic' }}>
                                                    You cannot bid on your own auction.
                                                </div>
                                            )}
                                            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#8b949e' }}>
                                                Closing in {game.auction.timeLeft}s...
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Panel: Controls & Logs */}
                    <div className="oligarchy-control-panel">
                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #30363d', marginBottom: '20px' }}>
                            <div
                                onClick={() => setActiveTab('market')}
                                style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', borderBottom: activeTab === 'market' ? '2px solid #f78166' : 'none', color: activeTab === 'market' ? '#e6edf3' : '#8b949e', fontWeight: 'bold' }}
                            >
                                MARKET
                            </div>
                            <div
                                onClick={() => setActiveTab('assets')}
                                style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', borderBottom: activeTab === 'assets' ? '2px solid #f78166' : 'none', color: activeTab === 'assets' ? '#e6edf3' : '#8b949e', fontWeight: 'bold' }}
                            >
                                ASSETS
                            </div>
                        </div>

                        {activeTab === 'market' ? (
                            <>
                                {/* Active Player Status */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>CURRENT MARKET MOVER</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e6edf3' }}>
                                        {room.players.find(p => p.id === game.currentTurnPlayerId)?.name}
                                    </div>
                                    <div style={{
                                        fontSize: '1.2rem',
                                        color: '#2ecc71',
                                        marginTop: '5px',
                                        border: '1px solid #2ecc71',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                        background: 'rgba(46, 204, 113, 0.1)'
                                    }}>
                                        LIQUIDITY: ${game.players[game.currentTurnPlayerId]?.cash || 0}M
                                    </div>

                                    {/* Portfolio Visualization */}
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                                        {game.players[game.currentTurnPlayerId]?.companies.map(cId => {
                                            const c = OLIGARCHY_BOARD.find(b => b.id === cId);
                                            if (!c) return null;
                                            return (
                                                <div key={cId} style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    background: SECTORS[c.sector].color,
                                                    border: '1px solid #000'
                                                }} title={c.name} />
                                            );
                                        })}
                                    </div>

                                    {isMyTurn && <div style={{ color: '#2ecc71', fontSize: '0.9rem', marginTop: '10px' }}>YOUR TURN</div>}
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
                                                    // const company = OLIGARCHY_BOARD[pos];
                                                    if (!companyState.ownerId && playerState.cash >= companyState.currentValue) {
                                                        return (
                                                            <button
                                                                onClick={() => socket.emit('oligarchy_buy', room.id)}
                                                                style={btnStyle('#00d2d3')}
                                                            >
                                                                ACQUIRE ASSET (${companyState.currentValue}M)
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
                            </>
                        ) : (
                            /* Assets Tab View */
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#161b22', borderRadius: '6px' }}>
                                    <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>NET WORTH</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        ${playerState.cash + playerState.companies.reduce((sum, id) => sum + game.companies[id].currentValue, 0)}M
                                    </div>
                                    <div style={{ color: '#2ecc71', fontSize: '0.9rem' }}>CASH: ${playerState.cash}M</div>
                                </div>

                                <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#8b949e' }}>PORTFOLIO</div>
                                {playerState.companies.length === 0 && <div style={{ color: '#8b949e', fontStyle: 'italic' }}>No assets owned.</div>}
                                {playerState.companies.map(cId => {
                                    const c = OLIGARCHY_BOARD.find(b => b.id === cId)!;
                                    const val = game.companies[cId].currentValue;
                                    return (
                                        <div key={cId} style={{ background: '#161b22', padding: '10px', borderRadius: '6px', marginBottom: '8px', borderLeft: `4px solid ${SECTORS[c.sector].color}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                                                <span style={{ color: '#2ecc71' }}>${val}M</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>{SECTORS[c.sector].name}</span>
                                                <button
                                                    onClick={() => {
                                                        if (game.turnPhase !== 'auction') {
                                                            socket.emit('oligarchy_start_auction', room.id, c.id);
                                                        }
                                                    }}
                                                    disabled={game.turnPhase === 'auction'}
                                                    style={{ background: '#d35400', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}
                                                >
                                                    SELL (AUCTION)
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Newsfeed Log */}
                        <div style={{ height: '25%', minHeight: '100px', maxHeight: '150px', marginTop: '10px', background: '#000', borderRadius: '4px', padding: '10px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', borderTop: '1px solid #333' }}>
                            {game.transactionLog.map((log, i) => (
                                <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                                    <span style={{ color: '#00d2d3' }}>{'>'}</span> {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Rent Alert Overlay */}
                <AnimatePresence>
                    {game.activeAlert && game.activeAlert.playerId === socket.id && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100,
                                pointerEvents: 'none'
                            }}
                        >
                            <div style={{
                                width: '90%',
                                maxWidth: '400px',
                                background: 'rgba(220, 38, 38, 0.95)', // Strong Red
                                backdropFilter: 'blur(5px)',
                                color: 'white',
                                padding: '30px 40px',
                                borderRadius: '8px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                                textAlign: 'center',
                                border: '2px solid white',
                                pointerEvents: 'auto'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💸</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '10px', textTransform: 'uppercase' }}>PENALTY PAID</div>
                                <div style={{ fontSize: '1.2rem', lineHeight: '1.5' }}>
                                    {game.activeAlert.message}
                                </div>
                                <div style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.8 }}>
                                    (Use your funds wisely to recover!)
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div >
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
