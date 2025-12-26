import React from 'react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';

const GameMenu: React.FC = () => {
    const { room, leaveRoom } = useGame();
    const navigate = useNavigate();

    const handleLeave = () => {
        if (window.confirm('Are you sure you want to exit the game?')) {
            leaveRoom();
            navigate('/');
        }
    };

    if (!room) return null;

    return (
        <button
            onClick={handleLeave}
            title="Exit Game"
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                color: 'rgba(255, 255, 255, 0.4)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 100
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff6b6b';
                e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
        </button>
    );
};

export default GameMenu;
