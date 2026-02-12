import React from 'react';
import { useGame } from '../../context/GameContext';
import { MONOPOLY_BOARD, PROPERTY_GROUPS } from '../../data/monopolyData';

interface PlayerHUDProps {
    isMinimized: boolean;
    onToggleMinimize: (minimized: boolean) => void;
}

const PlayerHUD: React.FC<PlayerHUDProps> = ({ isMinimized, onToggleMinimize }) => {
    const { room, player, socket } = useGame();
    if (!room || !player || !room.gameState.monopoly) return null;

    const myState = room.gameState.monopoly!.players[player.id];
    const [selectedPropertyId, setSelectedPropertyId] = React.useState<number | null>(null);
    // If not found (e.g. spectator), handle gracefully
    if (!myState) return null;

    // Helper to get color for group
    const getGroupColor = (group: string) => {
        switch (group) {
            case 'brown': return '#8B4513';
            case 'lightblue': return '#87CEEB';
            case 'pink': return '#FF69B4';
            case 'orange': return '#FFA500';
            case 'red': return '#FF0000';
            case 'yellow': return '#FFD700';
            case 'green': return '#008000';
            case 'darkblue': return '#00008B';
            case 'railroad': return '#000';
            case 'utility': return '#555';
            default: return '#fff';
        }
    };

    if (isMinimized) {
        return (
            <div
                onClick={(e) => { e.stopPropagation(); onToggleMinimize(false); }}
                style={{
                    position: 'fixed',
                    left: '20px',
                    top: '100px', // Higher up, less likely to conflict with hand
                    zIndex: 100,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
                    padding: '12px',
                    borderRadius: '50%',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60px',
                    height: '60px'
                }}
            >
                <span style={{ fontSize: '1.8rem' }}>💼</span>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{
            background: 'rgba(20, 20, 35, 0.85)', // Darker background for contrast
            position: 'fixed',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '280px',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '20px',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Dashboard</h3>
                <button
                    onClick={() => onToggleMinimize(true)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        cursor: 'pointer',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem'
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)' }}>CASH</span>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>${myState.cash}M</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '10px' }}>ASSETS & SETS</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(PROPERTY_GROUPS).map(([group, indices]) => {
                        const ownedCount = myState.colorSets[group] || 0;
                        const totalCount = indices.length;
                        const isComplete = ownedCount === totalCount;

                        return (
                            <div key={group} style={{
                                width: '30px',
                                height: '30px',
                                background: getGroupColor(group),
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: isComplete ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                                opacity: ownedCount > 0 ? 1 : 0.3,
                                position: 'relative'
                            }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 1px 2px black' }}>
                                    {ownedCount}/{totalCount}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '10px' }}>COMPANIES (Click to Manage)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {myState.properties.map(id => {
                        const space = MONOPOLY_BOARD.find(s => s.id === id);
                        if (!space) return null;
                        const propState = room.gameState.monopoly?.properties[id];

                        return (
                            <div key={id}
                                onClick={() => setSelectedPropertyId(id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    borderLeft: `4px solid ${getGroupColor(space.group || '')}`,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <span style={{ flex: 1, fontSize: '0.9rem' }}>{space.name}</span>
                                {propState && propState.isMortgaged && (
                                    <span style={{ color: '#e74c3c', marginRight: '5px', fontWeight: 'bold' }}>[M]</span>
                                )}
                                {propState && propState.houses > 0 && !propState.isMortgaged && (
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[...Array(propState.houses)].map((_, i) => (
                                            <div key={i} style={{
                                                width: '8px',
                                                height: '8px',
                                                background: propState.houses === 5 ? 'red' : '#4ade80',
                                                borderRadius: '50%'
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {myState.properties.length === 0 && (
                        <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>No companies owned</span>
                    )}
                </div>
            </div>

            {/* Property Management Modal */}
            {selectedPropertyId !== null && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '110%',
                    transform: 'translate(0, -50%)',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    color: 'white',
                    zIndex: 1000,
                    minWidth: '250px'
                }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{MONOPOLY_BOARD[selectedPropertyId]?.name}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        {room.gameState.monopoly!.properties[selectedPropertyId].isMortgaged ? (
                            <button
                                onClick={() => {
                                    socket?.emit('monopoly_unmortgage', { roomCode: room.id, propertyId: selectedPropertyId });
                                    setSelectedPropertyId(null);
                                }}
                                style={{ padding: '8px', background: '#2ecc71', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                            >
                                Unmortgage (-${Math.floor((MONOPOLY_BOARD[selectedPropertyId].mortgageValue || 0) * 1.1)}M)
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        socket?.emit('monopoly_mortgage', { roomCode: room.id, propertyId: selectedPropertyId });
                                        setSelectedPropertyId(null);
                                    }}
                                    style={{ padding: '8px', background: '#e74c3c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                                >
                                    Mortgage (+${MONOPOLY_BOARD[selectedPropertyId].mortgageValue}M)
                                </button>

                                {MONOPOLY_BOARD[selectedPropertyId].houseCost && (
                                    <button
                                        onClick={() => {
                                            socket?.emit('monopoly_buy_house', { roomCode: room.id, propertyId: selectedPropertyId });
                                        }}
                                        style={{ padding: '8px', background: '#3498db', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                                    >
                                        Buy House (-${MONOPOLY_BOARD[selectedPropertyId].houseCost}M)
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setSelectedPropertyId(null)}
                        style={{ marginTop: '20px', background: '#555', border: 'none', padding: '5px 10px', borderRadius: '5px', color: 'white', cursor: 'pointer', width: '100%' }}
                    >
                        Close
                    </button>
                </div>
            )}

            {myState.getOutOfJailCards > 0 && (
                <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,165,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                    🎟️ Get Out of Jail Free x{myState.getOutOfJailCards}
                </div>
            )}
        </div>
    );
};

export default PlayerHUD;
