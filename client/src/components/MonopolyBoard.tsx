import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { MONOPOLY_BOARD, PLAYER_COLORS, type BoardSpace } from '../data/monopolyData';
import PlayerHUD from './monopoly/PlayerHUD';
// import { MONOPOLY_BOARD, PLAYER_COLORS } from '../data/monopolyData'; // Removed duplicate
import Dice from './monopoly/Dice';
import ActionPanel from './monopoly/ActionPanel';
import TradeInterface from './monopoly/TradeInterface';
import BankerHUD from './monopoly/BankerHUD';
import { motion } from 'framer-motion';

const MonopolyBoard: React.FC = () => {
    const { room, player, socket } = useGame();
    // Local rolling state for animation
    const [isRolling, setIsRolling] = useState(false);

    if (!room || !room.gameState.monopoly) return <div>Loading Board...</div>;
    // If no player (spectator), simplified view? For now, we assume player is required for interaction.
    if (!player) return <div>Spectating Mode (Read Only)</div>;

    const gameState = room.gameState.monopoly;
    const isMyTurn = gameState.currentTurnPlayerId === player.id;

    // Trade UI State
    const [showTrade, setShowTrade] = React.useState(false);

    // Auto-open active trade if I am involved
    React.useEffect(() => {
        if (gameState.trade && (gameState.trade.receiverId === player.id || gameState.trade.proposerId === player.id)) {
            setShowTrade(true);
        }
    }, [gameState.trade, player.id]);

    // Grid Mapping Logic (1-11)
    const getGridPosition = (index: number) => {
        // Bottom Row: 0 -> 10 (Right to Left)
        if (index >= 0 && index <= 10) return { col: 11 - index, row: 11 };
        // Left Column: 11 -> 20 (Bottom to Top)
        if (index > 10 && index <= 20) return { col: 1, row: 11 - (index - 10) };
        // Top Row: 21 -> 30 (Left to Right)
        if (index > 20 && index <= 30) return { col: index - 20 + 1, row: 1 };
        // Right Column: 31 -> 39 (Top to Bottom)
        if (index > 30 && index < 40) return { col: 11, row: index - 30 + 1 };
        return { col: 1, row: 1 }; // Default
    };

    const handleRoll = () => {
        if (!isMyTurn || isRolling) return;
        setIsRolling(true);
        // Simulate roll delay then emit
        setTimeout(() => {
            setIsRolling(false);
            socket.emit('monopoly_roll_dice', room.id);
        }, 1000);
    };

    const renderSpace = (space: BoardSpace) => {
        const pos = getGridPosition(space.id);
        const playersHere = Object.values(gameState.players || {}).filter(p => p.position === space.id);
        const propState = gameState.properties?.[space.id];

        let backgroundColor = '#f0f0f0'; // Default board color
        let groupColor = 'transparent';

        // Color Logic
        if (space.group) {
            switch (space.group) {
                case 'brown': groupColor = '#8B4513'; break;
                case 'lightblue': groupColor = '#87CEEB'; break;
                case 'pink': groupColor = '#FF69B4'; break;
                case 'orange': groupColor = '#FFA500'; break;
                case 'red': groupColor = '#FF0000'; break;
                case 'yellow': groupColor = '#FFD700'; break;
                case 'green': groupColor = '#008000'; break;
                case 'darkblue': groupColor = '#00008B'; break;
                case 'utility': backgroundColor = '#f0f0f0'; break;
                case 'railroad': backgroundColor = '#f0f0f0'; break;
            }
        }

        // Special Corners
        if (space.id === 0) backgroundColor = '#cceeff'; // GO
        if (space.id === 10) backgroundColor = '#ffcccc'; // Jail
        if (space.id === 20) backgroundColor = '#ffffcc'; // Free Parking
        if (space.id === 30) backgroundColor = '#ffebcc'; // Go To

        return (
            <div
                key={space.id}
                style={{
                    gridColumn: pos.col,
                    gridRow: pos.row,
                    border: '1px solid #333',
                    background: backgroundColor,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.6rem',
                    color: 'black',
                    overflow: 'hidden'
                }}
            >
                {/* Color Bar */}
                {space.type === 'property' && (
                    <div style={{ height: '20%', background: groupColor, borderBottom: '1px solid #333' }}></div>
                )}

                {/* Content */}
                {(() => {
                    let backgroundStyle = {};
                    if (propState?.ownerId) {
                        const activePlayers = room.players.filter(p => p.role !== 'banker');
                        const ownerIdx = activePlayers.findIndex(p => p.id === propState.ownerId);
                        if (ownerIdx !== -1) {
                            const ownerColor = PLAYER_COLORS[ownerIdx % PLAYER_COLORS.length];
                            // Use a light wash for background to keep text readable, or solid with white text
                            // User asked for "color of the name label". 
                            // Let's make the name label explicitly colored.
                            backgroundStyle = {
                                backgroundColor: ownerColor,
                                color: 'white',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                width: '100%',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            };
                        }
                    }

                    return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2px' }}>
                            <div style={backgroundStyle}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', display: 'block' }}>{space.name}</span>
                            </div>
                            {/* Price shows below name label, only if not owned? Or always? Usually price is obscured by house tokens physically. Let's keep it. */}
                            {!propState?.ownerId && space.price && <span style={{ fontSize: '0.7rem' }}>${space.price}M</span>}

                            {/* Ownership/Houses */}
                            {propState?.ownerId && (
                                <div style={{ marginTop: '2px', fontSize: '0.6rem', color: '#333', fontWeight: 'bold' }}>
                                    {propState.houses > 0 ? `${'🏠'.repeat(propState.houses)}` : ''}
                                    {propState.houses === 5 && '🏨'}
                                    {/* Usually 5 is hotel. We use emojis simple. */}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Players */}
                <div style={{
                    position: 'absolute',
                    // For bottom row (0-10), align to top. For others, align to bottom.
                    bottom: space.id <= 10 ? 'auto' : '2px', // Bottom row avatars at top
                    top: space.id <= 10 ? '2px' : 'auto',    // Bottom row avatars at top
                    left: '0',
                    right: '0',
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '2px',
                    pointerEvents: 'none' // Click through to board
                }}>
                    {playersHere.map((p, i) => {
                        // Find player object to get avatar
                        const pInfo = room.players.find(rp => rp.id === Object.keys(gameState.players).find(key => gameState.players[key] === p));
                        const tokenPlayerId = pInfo?.id; // Extract player ID for key and color logic

                        // Color Match Logic: Find index in active players (excluding banker) to match BankerChart colors
                        const activePlayers = room.players.filter(p => p.role !== 'banker');
                        const colorIdx = activePlayers.findIndex(rp => rp.id === tokenPlayerId);

                        let borderColor = 'white';
                        if (colorIdx !== -1) {
                            // Standard Player: Match Chart
                            borderColor = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length];
                        } else if (pInfo?.role === 'banker') {
                            // Banker Fallback Logic
                            // If "All Bankers" bug is active, activePlayers is empty.
                            // We use the player's index in the full list to ensure differentiation.
                            // We offset by activePlayers.length so real bankers (if mixture exists) map to end of list.
                            const rawIndex = room.players.findIndex(p => p.id === tokenPlayerId);
                            borderColor = PLAYER_COLORS[(activePlayers.length + Math.max(0, rawIndex)) % PLAYER_COLORS.length];
                        }

                        // Debug Log (Temporary)
                        // console.log(`[AvatarRender] ID: ${tokenPlayerId}, Role: ${pInfo?.role}, ColorIdx: ${colorIdx}, Border: ${borderColor}`);

                        return (
                            <motion.img
                                key={tokenPlayerId || i} // Use tokenPlayerId as key if available, fallback to index
                                layoutId={`token-${pInfo?.id}`}
                                src={pInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                                alt={pInfo?.name || 'player token'}
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    border: `3px solid ${borderColor}`,
                                    background: 'white',
                                    zIndex: 20,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}
                                title={pInfo?.name}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    // Responsive Board Logic
    const [boardSize, setBoardSize] = useState('95vh');
    const [gridTemplate, setGridTemplate] = useState('1.5fr repeat(9, 1fr) 1.5fr');

    React.useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                // Mobile: Fit to width, reduce whitespace by increasing track size ratio
                setBoardSize('98vw');
                setGridTemplate('2.5fr repeat(9, 1fr) 2.5fr');
            } else {
                // Desktop: Fit to height, but account for header/padding
                // Container is 100vh - 80px (header) - 20px (padding) = ~100px buffer needed
                setBoardSize('min(95vw, calc(100vh - 110px))');
                setGridTemplate('1.5fr repeat(9, 1fr) 1.5fr');
            }
        };

        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // HUD State
    const [isHudMinimized, setIsHudMinimized] = useState(false);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 80px)', position: 'relative', overflow: 'hidden', background: '#2c3e50' }}>
            {/* HUDs */}
            {player.role !== 'banker' && (
                <PlayerHUD isMinimized={isHudMinimized} onToggleMinimize={setIsHudMinimized} />
            )}

            {/* Main Board Container */}
            <div
                // Clicking the background minimizes the HUD
                onClick={() => !isHudMinimized && setIsHudMinimized(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '10px' // Reduced padding
                }}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    gridTemplateRows: gridTemplate,
                    width: boardSize,
                    height: boardSize,
                    background: '#dde6ed',
                    border: '5px solid black',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease' // Smooth transition on resize
                }}>
                    {/* Center Area */}
                    <div style={{
                        gridColumn: '2 / 11',
                        gridRow: '2 / 11',
                        background: '#eef2f5',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative'
                    }}>
                        <h1 style={{ fontSize: '4rem', color: '#e74c3c', transform: 'rotate(-45deg)', opacity: 0.1, pointerEvents: 'none', position: 'absolute' }}>
                            {player.role === 'banker' ? 'BANKER MODE' : 'TECH CAPITALIST'}
                        </h1>

                        {/* Banker Dashboard (Center View) */}
                        {player.role === 'banker' && (
                            <BankerHUD />
                        )}

                        {/* Universal Card Display (Visible to All) */}
                        {gameState.currentCard && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass-panel"
                                style={{
                                    position: 'absolute',
                                    top: '20%',
                                    left: '50%',
                                    transform: 'translate(-50%, 0)', // Overridden by motion? No, x/y logic separates.
                                    // Use explicit centering wrapper if needed, or margin.
                                    marginLeft: '-125px', // Half width
                                    width: '250px',
                                    background: gameState.currentCard.type === 'chance' ? '#ff9f43' : '#54a0ff',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    border: '3px solid white',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    zIndex: 100, // Higher than tokens
                                    textAlign: 'center',
                                    pointerEvents: 'none' // Don't block clicks? Or maybe blocking is good?
                                }}
                            >
                                <strong style={{ display: 'block', color: 'white', marginBottom: '10px', textTransform: 'uppercase', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                    {gameState.currentCard.type === 'chest' ? 'Community Chest' : 'Chance'}
                                </strong>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontSize: '1.1rem', color: '#333', fontWeight: 'bold' }}>
                                    {gameState.currentCard.text}
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>
                                    For: {room.players.find(p => p.id === gameState.currentCard?.ownerId)?.name}
                                </div>
                            </motion.div>
                        )}

                        {/* Action Panel & Dice (Hidden for Banker) */}
                        {player.role !== 'banker' && (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '20px', zIndex: 10 }}>
                                    <ActionPanel />

                                    {/* Floating Trade Button (if not active) */}
                                    {!showTrade && !gameState.trade && (
                                        <button
                                            onClick={() => setShowTrade(true)}
                                            style={{
                                                marginTop: '10px',
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: 'black',
                                                padding: '5px 15px',
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            🤝 Propose Trade
                                        </button>
                                    )}
                                </div>

                                {/* Trade Interface Overlay */}
                                {showTrade && (
                                    <TradeInterface onClose={() => setShowTrade(false)} />
                                )}

                                {/* Dice */}
                                <Dice
                                    value={gameState.lastRoll || [1, 1]}
                                    rolling={isRolling}
                                    canRoll={isMyTurn && gameState.turnPhase === 'rolling'}
                                    onRoll={handleRoll}
                                />
                            </>
                        )}
                    </div>

                    {/* Spaces */}
                    {MONOPOLY_BOARD.map(space => renderSpace(space))}
                </div>
            </div>
        </div>
    );
};

export default MonopolyBoard;
