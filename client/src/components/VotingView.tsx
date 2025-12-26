import React from 'react';
import { useGame } from '../context/GameContext';
import { CATEGORIES_LIST } from '../data/categories';
import { motion, AnimatePresence } from 'framer-motion';

const VotingView: React.FC = () => {
    const { room, nextCategory, player, submitVote } = useGame();

    if (!room || room.gameState.currentVotingCategory === undefined) return null;

    const currentCatIndex = room.gameState.currentVotingCategory;
    // Use server categories first, else fallback
    const categories = room.gameState.categories || CATEGORIES_LIST;
    const categoryName = categories[currentCatIndex];
    const isHost = room.players[0].id === player?.id;

    return (
        <div className="container column" style={{ paddingTop: '20px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ textAlign: 'center', marginBottom: '20px' }}
            >
                <h3 style={{ color: 'var(--color-accent)' }}>VOTING ROUND</h3>
                <h1 style={{ fontSize: '2rem', margin: '10px 0' }}>{categoryName}</h1>
                <p style={{ color: 'var(--color-text-dim)' }}>
                    Starts with <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{room.gameState.letter}</span>
                </p>
            </motion.div>

            <div className="column" style={{ paddingBottom: '100px' }}>
                <AnimatePresence mode="popLayout">
                    {room.players.map((p) => {
                        const answer = room.answers?.[p.id]?.[currentCatIndex];
                        const isSelf = p.id === player?.id;
                        const rejections = room.rejections?.[p.id]?.[currentCatIndex] || [];
                        const rejectionCount = rejections.length;
                        const hasVoted = player ? rejections.includes(player.id) : false;
                        const otherPlayersCount = room.players.length - 1;
                        // Calculate if currently rejected (preview)
                        const isRejected = otherPlayersCount > 0 && (rejectionCount / otherPlayersCount >= 0.5);

                        return (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-panel"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    padding: '12px 16px',
                                    borderLeft: `4px solid ${!answer ? 'var(--color-error)' : isRejected ? 'var(--color-error)' : 'var(--color-success)'}`,
                                    background: isSelf ? 'rgba(255,255,255,0.08)' : 'rgba(255, 255, 255, 0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <img src={p.avatar} alt={p.name} className="avatar" style={{ width: '40px', height: '40px', marginRight: '12px' }} />
                                    <span style={{ fontWeight: 'bold', marginRight: '16px' }}>{p.name}</span>
                                    <div style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>
                                        {answer || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>No Answer</span>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {/* Status Indicator */}
                                    <div style={{ marginRight: '10px', fontSize: '0.9rem', color: isRejected ? 'var(--color-error)' : 'var(--color-text-dim)' }}>
                                        {rejectionCount > 0 && (
                                            <span>{rejectionCount} reject{rejectionCount !== 1 && 's'}</span>
                                        )}
                                    </div>

                                    {!isSelf && answer && (
                                        <button
                                            onClick={() => submitVote(p.id, currentCatIndex)}
                                            style={{
                                                background: hasVoted ? 'var(--color-error)' : 'rgba(255,255,255,0.1)',
                                                border: '1px solid var(--color-error)',
                                                color: 'white',
                                                padding: '8px 16px',
                                                minWidth: '80px'
                                            }}
                                        >
                                            {hasVoted ? 'REJECTED' : 'REJECT'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {isHost && (
                <div style={{ position: 'fixed', bottom: '20px', left: '0', right: '0', padding: '0 20px', zIndex: 100 }}>
                    <button
                        onClick={nextCategory}
                        className="container"
                        style={{
                            background: 'var(--color-primary)',
                            width: '100%',
                            maxWidth: '800px',
                            display: 'block',
                            margin: '0 auto',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                        }}
                    >
                        {currentCatIndex >= categories.length - 1 ? 'Finish Voting' : 'Next Category'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default VotingView;
