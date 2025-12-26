import React from 'react';
import { motion } from 'framer-motion';

interface DiceProps {
    value: number[]; // Array of 2 numbers
    rolling: boolean;
    onRoll?: () => void;
    canRoll?: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, canRoll }) => {
    return (
        <div
            onClick={() => canRoll && !rolling && onRoll?.()}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                cursor: canRoll ? 'pointer' : 'default',
                opacity: canRoll ? 1 : 0.8,
                transition: 'transform 0.2s',
                transform: canRoll ? 'scale(1.05)' : 'scale(1)'
            }}
        >
            <div style={{ display: 'flex', gap: '20px' }}>
                {value.map((v, i) => (
                    <motion.div
                        key={i}
                        animate={rolling ? {
                            rotateX: [0, 360, 720, 1080],
                            rotateY: [0, 360, 720, 1080],
                            scale: [1, 1.2, 1]
                        } : {
                            rotateX: 0,
                            rotateY: 0,
                            scale: 1
                        }}
                        whileHover={canRoll ? { scale: 1.1, rotate: 5 } : {}}
                        transition={rolling ? { duration: 1, ease: "easeInOut", repeat: Infinity } : { duration: 0.2 }}
                        style={{
                            width: '60px',
                            height: '60px',
                            background: 'white',
                            borderRadius: '10px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: 'black',
                            boxShadow: canRoll ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 4px 10px rgba(0,0,0,0.5)',
                            border: canRoll ? '2px solid #4ade80' : '1px solid #ddd'
                        }}
                    >
                        {rolling ? '?' : v}
                    </motion.div>
                ))}
            </div>
            {canRoll && (
                <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    borderRadius: '10px',
                    boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
                    animation: 'pulse 2s infinite',
                    pointerEvents: 'none'
                }} />
            )}
        </div>
    );
};

export default Dice;
