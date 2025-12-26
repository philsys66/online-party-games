import React from 'react';
import { useGame } from '../../context/GameContext';
import { MONOPOLY_BOARD } from '../../data/monopolyData';

const ActionPanel: React.FC = () => {
    const { room, player, socket } = useGame();

    if (!room || !room.gameState.monopoly || !player) return null;

    const game = room.gameState.monopoly;
    const isMyTurn = game.currentTurnPlayerId === player.id;
    const myState = game.players[player.id];

    // Banker / Spectator check
    if (!myState) {
        return (
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', color: 'white', marginTop: '20px' }}>
                <h3>Banker Mode</h3>
                <p>Monitoring game...</p>
            </div>
        );
    }

    const currentSpace = MONOPOLY_BOARD[myState.position];
    const propState = game.properties[currentSpace.id];

    if (!isMyTurn) return (
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', color: 'white', marginTop: '20px' }}>
            Waiting for {room.players.find(p => p.id === game.currentTurnPlayerId)?.name}...
        </div>
    );

    if (game.turnPhase === 'rolling') {
        return (
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', color: 'white', marginTop: '20px' }}>
                <h3>It's your turn!</h3>
                <p>Click the dice to move.</p>
            </div>
        );
    }

    // Acting Phase
    const canBuy = propState && !propState.ownerId && currentSpace.price && myState.cash >= currentSpace.price;
    const isOwner = propState?.ownerId === player.id;
    const isOwnedByOther = propState?.ownerId && propState.ownerId !== player.id;

    // Rent is auto-paid in our logic for now, so we just show status
    // But if we wanted manual: check isOwnedByOther

    return (
        <div style={{ padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', marginTop: '20px', minWidth: '300px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{currentSpace.name}</h3>

            {canBuy && (
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ color: '#666' }}>Price: ${currentSpace.price}M</p>
                    <button
                        onClick={() => socket.emit('monopoly_buy_property', room.id)}
                        style={{
                            background: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            fontSize: '1.2rem',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        Buy Company
                    </button>
                </div>
            )}

            {isOwner && (
                <div style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '10px' }}>
                    You own this company.
                </div>
            )}

            {isOwnedByOther && (
                <div style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '10px' }}>
                    Owned by {room.players.find(p => p.id === propState.ownerId)?.name}
                    <br />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>(Rent Auto-Paid)</span>
                </div>
            )}

            <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button
                    onClick={() => socket.emit('monopoly_end_turn', room.id)}
                    style={{
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        fontSize: '1rem',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    {game.doublesCount > 0 ? "Roll Again (Doubles!)" : "End Turn"}
                </button>
            </div>
        </div>
    );
};

export default ActionPanel;
