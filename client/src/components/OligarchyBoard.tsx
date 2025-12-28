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
    const [activeRoll, setActiveRoll] = React.useState<{ die1: number, die2: number, playerId: string } | null>(null);
    const [mobileTab, setMobileTab] = React.useState<'board' | 'controls'>('board');
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Auto-switch to Market view on Mobile when turn starts
    React.useEffect(() => {
        if (isMyTurn && isMobile) {
            setMobileTab('controls');
            setActiveTab('market');
        }
    }, [isMyTurn, isMobile]);

    // Sound effects (placeholders)
    // const [playCash] = useSound('/sounds/cash.mp3');

    // Dice Roll Listener
    React.useEffect(() => {
        const handleRoll = (data: { die1: number, die2: number, playerId: string }) => {
            setActiveRoll(data);
            // Hide after 3 seconds
            setTimeout(() => setActiveRoll(null), 3000);
        };

        socket.on('oligarchy_dice_rolled', handleRoll);
        return () => {
            socket.off('oligarchy_dice_rolled', handleRoll);
        };
    }, [socket]);

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
            position: relative; /* Ensure absolute children are contained */
        }

        /* ... existing styles ... */

        /* Mobile Layout */
        @media (max-width: 768px) {
            .oligarchy-app {
                /* On mobile, we want to maximize space but respect the header */
                /* The GameRoom header is ~80px + padding */
                height: calc(100vh - 100px) !important; 
                border-radius: 0;
            }
            .oligarchy-main-layout {
                flex-direction: column;
                padding-bottom: 60px; /* Space for Nav Bar */
            }
            /* ... */
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
            .oligarchy-app {
                height: 100vh !important; /* Full screen on mobile */
                border-radius: 0;
            }
            .oligarchy-main-layout {
                flex-direction: column;
                padding-bottom: 60px; /* Space for Nav Bar */
            }
            .oligarchy-board-container {
                display: ${mobileTab === 'board' ? 'flex' : 'none'};
                height: 100%;
                overflow-y: auto; /* Allow scroll if screen is tiny */
                align-items: flex-start; /* Move board to top */
                justify-content: center;
                padding-top: 20px; /* Space from header */
                padding-bottom: 80px; /* Space for Nav Bar */
            }
            .oligarchy-grid-wrapper {
                max-width: 100%;
                width: 95%; /* Little padding */
            }
            .oligarchy-control-panel {
                display: ${mobileTab === 'controls' ? 'flex' : 'none'};
                width: 100%;
                height: 100%;
                border-left: none;
                border-top: none;
                padding-bottom: 20px;
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

                                const playersOnTile = room.players.filter(p => game.players[p.id]?.position === index);

                                // Resolve Colors
                                const ownerColor = owner?.color || (owner ? stringToColor(owner.name) : undefined);

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
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.1' }}>
                                            {company.name}
                                        </div>

                                        {/* Rent Indicator / Owner Name */}
                                        <div style={{ fontSize: '0.5rem', color: owner ? ownerColor : '#8b949e', textAlign: 'center', fontWeight: owner ? 'bold' : 'normal' }}>
                                            {owner ? owner.name.substring(0, 8) : SECTORS[company.sector].shortName}
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
                                                        border: `2px solid ${p.color || stringToColor(p.name)}`,
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
                                                    const company = OLIGARCHY_BOARD[pos];
                                                    if (!companyState.ownerId && playerState.cash >= companyState.currentValue) {
                                                        return (
                                                            <button
                                                                onClick={() => socket.emit('oligarchy_buy', room.id)}
                                                                style={btnStyle('#00d2d3')}
                                                            >
                                                                ACQUIRE {company.name.toUpperCase()} (${companyState.currentValue}M)
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

                        {/* Newsfeed Log (Oligarchy Times) */}
                        <div style={{
                            flex: 1,
                            marginTop: '10px',
                            background: '#fdfdfd',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            {/* BBC-style Header */}
                            <div style={{
                                background: '#b80000', // BBC Red
                                color: 'white',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                zIndex: 10,
                                flexShrink: 0
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        letterSpacing: '-0.5px',
                                        background: 'white',
                                        color: '#b80000',
                                        padding: '1px 4px',
                                        lineHeight: '1'
                                    }}>
                                        NEWS
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>OLIGARCHY TIMES</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>LIVE</div>
                            </div>

                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0',
                                background: '#fff'
                            }}>
                                {game.transactionLog.map((item: any, i: number) => {
                                    // Detect legacy string logs vs new objects
                                    const isLegacy = typeof item === 'string';
                                    const headline = isLegacy ? "Update" : item.headline;
                                    const body = isLegacy ? item : item.body;
                                    const category = isLegacy ? 'news' : item.imageCategory;
                                    const time = isLegacy ? '' : new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    // Thematic Cartoon/Illustration Assets
                                    let imgSrc = 'https://images.unsplash.com/photo-1541904845547-0eaf866de232?auto=format&fit=crop&w=150&q=80'; // Fallback (Abstract)
                                    // Categories
                                    if (category === 'finance') imgSrc = 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=150&q=80'; // 3D Coins
                                    if (category === 'rent') imgSrc = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80'; // Key/House (Updated)
                                    if (category === 'war') imgSrc = 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=150&q=80'; // Toy Soldiers
                                    if (category === 'bankruptcy') imgSrc = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=150&q=80'; // Broken Piggy Bank
                                    if (category === 'cycle') imgSrc = 'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&w=150&q=80'; // Globe
                                    if (category === 'bidding') imgSrc = 'https://images.unsplash.com/photo-1550534791-2677533605ab?auto=format&fit=crop&w=150&q=80'; // Gavel
                                    if (category === 'news') imgSrc = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=150&q=80'; // Newspaper
                                    // Sectors
                                    if (category === 'technology' || category === 'tech') imgSrc = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80'; // Chip/Tech (Updated)
                                    if (category === 'retail') imgSrc = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=150&q=80'; // Shopping Cart/Store
                                    if (category === 'energy') imgSrc = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=150&q=80'; // Lightbulb/Idea
                                    if (category === 'healthcare') imgSrc = 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=150&q=80'; // Medical (Updated)
                                    if (category === 'financial' || category === 'financials') imgSrc = 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=150&q=80'; // Market Chart (Verified)
                                    // Actually, let's swap Financial to be safe
                                    if (category === 'financial' || category === 'financials') imgSrc = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=150&q=80'; // Stocks/Candles
                                    if (category === 'communications') imgSrc = 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=150&q=80'; // Radio/Mic
                                    // Special
                                    if (category === 'pandemic') imgSrc = 'https://images.unsplash.com/photo-1584483766114-2cea6fac256d?auto=format&fit=crop&w=150&q=80'; // Biohazard/Virus Concept

                                    return (
                                        <div key={i} style={{
                                            borderBottom: '1px solid #e2e2e2',
                                            padding: '12px',
                                            display: 'flex',
                                            gap: '10px',
                                            background: i === 0 ? '#fff0f0' : 'white', // Highlight newest
                                            animation: i === 0 ? 'fadeIn 0.5s ease-out' : 'none'
                                        }}>
                                            {/* Thumbnail */}
                                            <div style={{
                                                width: '60px',
                                                height: '45px',
                                                background: '#eee',
                                                backgroundImage: `url(${imgSrc})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                flexShrink: 0,
                                                borderRadius: '2px'
                                            }} />

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    color: '#b80000',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem',
                                                    marginBottom: '2px'
                                                }}>
                                                    {category ? category.toUpperCase() : 'NEWS'}
                                                    <span style={{ color: '#666', fontWeight: 'normal', marginLeft: '6px', fontSize: '0.7rem' }}>{time}</span>
                                                </div>
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.9rem',
                                                    color: '#222',
                                                    marginBottom: '2px',
                                                    lineHeight: '1.2',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {headline}
                                                </div>
                                                <div style={{
                                                    color: '#555',
                                                    fontSize: '0.8rem',
                                                    lineHeight: '1.3',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {body}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Visual Dice Roll Overlay */}
                <AnimatePresence>
                    {activeRoll && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 150, // Below Rent Alert, Above Newsflash
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(2px)',
                                pointerEvents: 'none'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '80px' }}>
                                <Dice3D value={activeRoll.die1} />
                                <Dice3D value={activeRoll.die2} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Navigation Bar */}
                {isMobile && (
                    <div style={{
                        position: 'fixed', // Fixed to viewport to avoid scroll issues
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60px',
                        background: '#0d1117',
                        borderTop: '1px solid #30363d',
                        display: 'flex',
                        zIndex: 1000, // Very high z-index
                        boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
                    }}>
                        <button
                            onClick={() => setMobileTab('board')}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: mobileTab === 'board' ? '#2ecc71' : '#8b949e',
                                fontWeight: 'bold',
                                borderTop: mobileTab === 'board' ? '3px solid #2ecc71' : '3px solid transparent',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            TRADING FLOOR
                        </button>
                        <button
                            onClick={() => setMobileTab('controls')}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: mobileTab === 'controls' ? '#00d2d3' : '#8b949e',
                                fontWeight: 'bold',
                                borderTop: mobileTab === 'controls' ? '3px solid #00d2d3' : '3px solid transparent',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            MARKET & ASSETS
                        </button>
                    </div>
                )}
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

const Dice3D = ({ value }: { value: number }) => {
    // Simple 2D representation for now, styled to look nice
    // Dots configuration
    const dots: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
    };

    return (
        <motion.div
            initial={{ rotate: 180, scale: 0.5 }}
            animate={{ rotate: 360, scale: 1.5 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
                width: '80px',
                height: '80px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                padding: '10px',
                boxSizing: 'border-box'
            }}
        >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {dots[value]?.includes(i) && (
                        <div style={{
                            width: '12px',
                            height: '12px',
                            background: '#000',
                            borderRadius: '50%'
                        }} />
                    )}
                </div>
            ))}
        </motion.div>
    );
};
