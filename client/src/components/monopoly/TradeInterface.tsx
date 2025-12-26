import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { MONOPOLY_BOARD } from '../../data/monopolyData';

const TradeInterface: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { room, player, socket } = useGame();
    const [targetPlayerId, setTargetPlayerId] = useState<string>('');
    const [offerCash, setOfferCash] = useState(0);
    const [offerProps, setOfferProps] = useState<number[]>([]);
    const [requestCash, setRequestCash] = useState(0);
    const [requestProps, setRequestProps] = useState<number[]>([]);

    if (!room || !player || !room.gameState.monopoly) return null;
    const game = room.gameState.monopoly;
    const myState = game.players[player.id];

    // Check for active trade
    const activeTrade = game.trade;

    useEffect(() => {
        if (!activeTrade) return;
        // If trade exists, we don't need local state for creation
    }, [activeTrade]);

    // --- Active Trade View ---
    if (activeTrade) {
        const isProposer = activeTrade.proposerId === player.id;
        const isReceiver = activeTrade.receiverId === player.id;

        if (!isProposer && !isReceiver) return null; // Don't show to others

        const proposerName = room.players.find(p => p.id === activeTrade.proposerId)?.name;
        const receiverName = room.players.find(p => p.id === activeTrade.receiverId)?.name;

        return (
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: '#1a1a1a', padding: '20px', borderRadius: '10px', width: '400px',
                zIndex: 2000, boxShadow: '0 0 20px rgba(0,0,0,0.8)', color: 'white', border: '1px solid #444'
            }}>
                <h2 style={{ textAlign: 'center', color: '#f39c12' }}>Trade Request</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '45%' }}>
                        <h4 style={{ borderBottom: '1px solid #555' }}>{proposerName} Offers:</h4>
                        <div>Cash: ${activeTrade.offer.cash}M</div>
                        {activeTrade.offer.properties.map(pid => (
                            <div key={pid} style={{ fontSize: '0.9rem' }}>• {MONOPOLY_BOARD[pid].name}</div>
                        ))}
                    </div>
                    <div style={{ width: '45%' }}>
                        <h4 style={{ borderBottom: '1px solid #555' }}>{receiverName} Gives:</h4>
                        <div>Cash: ${activeTrade.request.cash}M</div>
                        {activeTrade.request.properties.map(pid => (
                            <div key={pid} style={{ fontSize: '0.9rem' }}>• {MONOPOLY_BOARD[pid].name}</div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {isReceiver ? (
                        <>
                            <button
                                onClick={() => socket.emit('monopoly_accept_trade', room.id)}
                                style={{ background: '#2ecc71', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => socket.emit('monopoly_reject_trade', room.id)}
                                style={{ background: '#e74c3c', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                            >
                                Reject
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => socket.emit('monopoly_reject_trade', room.id)} // Rejecting as proposer = cancel
                            style={{ background: '#e74c3c', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                        >
                            Cancel Offer
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- Create Trade View ---
    const otherPlayers = room.players.filter(p => p.id !== player.id);

    const handleCreateOffer = () => {
        if (!targetPlayerId) return;
        socket.emit('monopoly_create_trade', {
            roomCode: room.id,
            receiverId: targetPlayerId,
            offer: { cash: offerCash, properties: offerProps },
            request: { cash: requestCash, properties: requestProps }
        });
        onClose();
    };

    const toggleOfferProp = (id: number) => {
        setOfferProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleRequestProp = (id: number) => {
        setRequestProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#2c3e50', padding: '20px', borderRadius: '10px',
            width: '90vw', maxWidth: '600px', // Responsive container
            zIndex: 2000, boxShadow: '0 0 20px rgba(0,0,0,0.8)', color: 'white', maxHeight: '85vh', overflowY: 'auto'
        }}>
            <h2 style={{ borderBottom: '1px solid #555', paddingBottom: '10px' }}>Propose Trade</h2>

            <div style={{ marginBottom: '15px' }}>
                <label>Trade with: </label>
                <select
                    value={targetPlayerId}
                    onChange={e => setTargetPlayerId(e.target.value)}
                    style={{ padding: '8px', marginLeft: '10px', background: '#34495e', color: 'white', border: '1px solid #555', borderRadius: '4px', maxWidth: '200px' }}
                >
                    <option value="">Select Player...</option>
                    {otherPlayers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {targetPlayerId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {/* My Offer */}
                        <div style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '5px' }}>
                            <h4>You Offer:</h4>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Cash: $</label>
                                <input
                                    type="number"
                                    value={offerCash}
                                    onChange={e => setOfferCash(Math.min(Number(e.target.value), myState.cash))}
                                    max={myState.cash}
                                    style={{ width: '80px', background: '#34495e', border: '1px solid #555', color: 'white', padding: '4px' }}
                                />
                                <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>(Max: ${myState.cash}M)</span>
                            </div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {myState.properties.map(pid => (
                                    <div key={pid} style={{ padding: '2px 0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input
                                                type="checkbox"
                                                checked={offerProps.includes(pid)}
                                                onChange={() => toggleOfferProp(pid)}
                                            />
                                            {MONOPOLY_BOARD[pid].name}
                                        </label>
                                    </div>
                                ))}
                                {myState.properties.length === 0 && <span style={{ fontStyle: 'italic', color: '#aaa' }}>No companies</span>}
                            </div>
                        </div>

                        {/* Their Request */}
                        <div style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '5px' }}>
                            <h4>You Request:</h4>
                            {(() => {
                                const targetState = game.players[targetPlayerId];
                                if (!targetState) return null;
                                return (
                                    <>
                                        <div style={{ marginBottom: '10px' }}>
                                            <label>Cash: $</label>
                                            <input
                                                type="number"
                                                value={requestCash}
                                                onChange={e => setRequestCash(Math.min(Number(e.target.value), targetState.cash))}
                                                max={targetState.cash}
                                                style={{ width: '80px', background: '#34495e', border: '1px solid #555', color: 'white', padding: '4px' }}
                                            />
                                            <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>(Max: ${targetState.cash}M)</span>
                                        </div>
                                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                            {targetState.properties.map(pid => (
                                                <div key={pid} style={{ padding: '2px 0' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={requestProps.includes(pid)}
                                                            onChange={() => toggleRequestProp(pid)}
                                                        />
                                                        {MONOPOLY_BOARD[pid].name}
                                                    </label>
                                                </div>
                                            ))}
                                            {targetState.properties.length === 0 && <span style={{ fontStyle: 'italic', color: '#aaa' }}>No companies</span>}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={onClose}
                    style={{ background: '#95a5a6', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreateOffer}
                    disabled={!targetPlayerId}
                    style={{ background: !targetPlayerId ? '#555' : '#2ecc71', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                >
                    Send Offer
                </button>
            </div>
        </div>
    );
};

export default TradeInterface;
