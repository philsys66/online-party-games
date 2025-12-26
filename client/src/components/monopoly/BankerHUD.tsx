import React from 'react';
import { useGame } from '../../context/GameContext';
import { MONOPOLY_BOARD, PLAYER_COLORS } from '../../data/monopolyData';

// const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

const BankerHUD: React.FC = () => {
    const { room } = useGame();

    if (!room || !room.gameState.monopoly) return null;

    const game = room.gameState.monopoly;
    // Sort players by total wealth descending? Or static order? Default static for stability.
    const players = room.players.filter(p => p.role !== 'banker');

    // Calculate Wealth Logic
    const getWealth = (pid: string) => {
        const cash = game.players[pid]?.cash || 0;
        const props = game.players[pid]?.properties || [];
        const assetValue = props.reduce((acc, propId) => {
            const prop = MONOPOLY_BOARD[propId];
            // Value = Mortgage Value (liquid value)
            return acc + (prop.mortgageValue || 0);
        }, 0);
        return { cash, assetValue, total: cash + assetValue };
    };

    const wealthData = players.map(p => ({ ...p, ...getWealth(p.id) }));
    // const maxWealth = Math.max(...wealthData.map(d => d.total), 2000); // Scale unused now

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '10px 10px 30px 10px', // Added bottom padding to lift it up
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 20
        }}>
            {/* Top Area: Ticker */}
            <div style={{
                width: '60%',
                margin: '0 auto',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '0 0 10px 10px',
                padding: '10px',
                pointerEvents: 'auto',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                maxHeight: '150px',
                overflowY: 'auto'
            }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#ffd700', textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>Live Transactions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {game.transactionLog?.slice(0, 10).map((log, i) => (
                        <div key={i} style={{
                            fontSize: '0.85rem',
                            color: log.startsWith('[RENT]') ? '#ff9999' :
                                log.startsWith('[BUY]') ? '#99ff99' :
                                    log.startsWith('[GO]') ? '#99ccff' :
                                        log.startsWith('[BANKRUPT]') ? 'red' : 'white'
                        }}>
                            {log}
                        </div>
                    ))}
                    {(!game.transactionLog || game.transactionLog.length === 0) && (
                        <div style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>No transactions yet...</div>
                    )}
                </div>
            </div>



            {/* Bottom Area: Stacked Chart */}
            <div className="glass-panel" style={{
                flex: 1,
                marginTop: '10px',
                padding: '15px',
                background: 'rgba(20, 20, 35, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                maxHeight: '50%',
                marginBottom: '40px',
                width: '85%', // Reduced width
                alignSelf: 'center' // Center it
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Player Assets</h3>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: 'white' }}></div> Cash</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: 'white', opacity: 0.5 }}></div> Props (Count)</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', flex: 1, gap: '15px' }}>
                    {wealthData.map((p, i) => {
                        // Logic: show visual bar relative to maxWealth still?
                        // Or custom scale? Using maxWealth for height is still safest.
                        // But now asset part is COUNT, not VALUE.
                        // Scaling count to fit: 1 property ~= £100 visual height?
                        // Let's use a synthetic total score for visual height: Cash + (Count * 200)

                        const propCount = game.players[p.id]?.properties.length || 0;
                        const syntheticTotal = p.cash + (propCount * 200);
                        const visualMax = Math.max(2000, ...wealthData.map(d => d.cash + (game.players[d.id]?.properties.length || 0) * 200));

                        const heightPercent = Math.min((syntheticTotal / visualMax) * 100, 100);
                        const cashHeight = (p.cash / syntheticTotal) * 100;
                        const propHeight = ((propCount * 200) / syntheticTotal) * 100;

                        const color = PLAYER_COLORS[i % PLAYER_COLORS.length];

                        return (
                            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%', justifyContent: 'flex-end' }}>
                                {/* Label ABOVE removed as requested */}

                                {/* Bar Container */}
                                <div style={{
                                    width: '100%',
                                    height: `${heightPercent}%`,
                                    display: 'flex',
                                    flexDirection: 'column-reverse', // Stack from bottom
                                    borderRadius: '4px 4px 0 0',
                                    overflow: 'hidden',
                                    transition: 'height 0.5s ease',
                                    background: 'rgba(255,255,255,0.1)' // Empty track
                                }}>
                                    {/* Cash Part - Solid */}
                                    <div style={{
                                        height: `${cashHeight}%`,
                                        background: color,
                                        transition: 'height 0.5s ease',
                                        borderTop: propHeight > 0 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'rgba(0,0,0,0.7)',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }} title={`Cash: $${p.cash}M`}>
                                        {/* Show Cash Value INSIDE if fits */}
                                        {cashHeight > 15 && `$${p.cash}M`}
                                    </div>

                                    {/* Asset Part (Count) - Semi-transparent */}
                                    <div style={{
                                        height: `${propHeight}%`,
                                        background: color,
                                        opacity: 0.6,
                                        transition: 'height 0.5s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        textShadow: '0 1px 2px black'
                                    }} title={`Properties: ${propCount}`}>
                                        {/* Show Count INSIDE if fits */}
                                        {propHeight > 10 && propCount}
                                    </div>
                                </div>

                                {/* Player Label */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                                    <img src={p.avatar} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${color}` }} />
                                    <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50px', color: 'white' }}>{p.name}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BankerHUD;
