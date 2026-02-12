import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameContextType, Room, Player, GameConfig, GameType } from '../types';

// GameContextType imported from types
const GameContext = createContext<GameContextType | undefined>(undefined);

// In production, use env var. Localhost fallback for dev.
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Local temporary state before joining
    const [localName, setLocalName] = useState<string>(localStorage.getItem('playerName') || '');
    const [localAvatar, setLocalAvatar] = useState<string>(localStorage.getItem('playerAvatar') || '');

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('room_joined', (roomData: Room) => {
            setRoom(roomData);
        });

        newSocket.on('room_update', (roomData: Room) => {
            setRoom(roomData);
        });

        newSocket.on('game_started', (roomData: Room) => {
            setRoom(roomData);
        });

        newSocket.on('timer_update', (timeLeft: number) => {
            setRoom(prev => prev ? {
                ...prev,
                gameState: {
                    ...prev.gameState,
                    timer: timeLeft
                }
            } : null);
        });

        newSocket.on('game_over', (roomData: Room) => {
            setRoom(roomData);
        });

        newSocket.on('round_over', (roomData: Room) => {
            setRoom(roomData);
        });

        newSocket.on('error', (msg: string) => {
            setError(msg);
        });

        newSocket.on('start_voting', (roomData: Room) => {
            setRoom(roomData);
        });

        newSocket.on('update_voting_category', (catIndex: number) => {
            setRoom(prev => prev ? {
                ...prev,
                gameState: {
                    ...prev.gameState,
                    currentVotingCategory: catIndex
                }
            } : null);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const setPlayerName = (name: string) => {
        setLocalName(name);
        localStorage.setItem('playerName', name);
    };

    // Initialize userId
    useEffect(() => {
        let uid = localStorage.getItem('userId');
        if (!uid) {
            // Safer UUID generation (crypto.randomUUID can throw in insecure contexts)
            uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('userId', uid);
        }
    }, []);

    // Helper to get current userId
    const getUserId = () => localStorage.getItem('userId') || '';

    // Auto-Rejoin Logic
    useEffect(() => {
        const lastRoomCode = localStorage.getItem('lastRoomCode');
        const lastRole = localStorage.getItem('lastRole') || 'player';

        // Only attempt rejoin if we have a room code, name, and we are NOT already in a room
        // And we have a socket connection
        if (socket && isConnected && !room && lastRoomCode && localName) {
            console.log(`Auto-rejoining room ${lastRoomCode} as ${localName}...`);
            joinRoom(lastRoomCode, localName, localAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', lastRole as 'player' | 'banker');
        }
    }, [socket, isConnected, room]); // Run when socket connects


    const setPlayerAvatar = (avatar: string) => {
        setLocalAvatar(avatar);
        localStorage.setItem('playerAvatar', avatar);
    };

    const createRoom = (gameType: GameType, name: string, avatar: string) => {
        if (socket) {
            // Also set local state
            setLocalName(name);
            setLocalAvatar(avatar);
            localStorage.setItem('playerName', name);
            localStorage.setItem('playerAvatar', avatar);

            const userId = getUserId();
            socket.emit('create_room', {
                playerName: name,
                avatar: avatar,
                gameType,
                userId
            });
        }
    };

    const joinRoom = (roomCode: string, name: string, avatar: string, role: 'player' | 'banker' = 'player') => {
        console.log('Attempting to join room:', roomCode);
        if (socket) {
            // Check if name changed -> New Identity needed?
            const storedName = localStorage.getItem('playerName');
            let currentUserId = getUserId();

            if (storedName && storedName !== name) {
                console.log('Name changed, regenerating UserID for new identity.');
                // Generate new UUID
                currentUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                localStorage.setItem('userId', currentUserId);
            }

            // Also set local state
            setLocalName(name);
            setLocalAvatar(avatar);
            localStorage.setItem('playerName', name);
            localStorage.setItem('playerAvatar', avatar);
            localStorage.setItem('lastRoomCode', roomCode); // Save for rejoin
            localStorage.setItem('lastRole', role);

            console.log('Socket available, emitting join_room event with userId:', currentUserId);
            socket.emit('join_room', {
                roomCode,
                playerName: name,
                avatar: avatar,
                role,
                userId: currentUserId
            });
        } else {
            console.error('Cannot join room: Socket missing', { socket: !!socket });
            setError('Connection error. Please try again.');
        }
    };

    const leaveRoom = () => {
        if (socket && room) {
            socket.emit('leave_room', room.id);
            setRoom(null);
            localStorage.removeItem('lastRoomCode'); // Clear rejoin
            localStorage.removeItem('lastRole'); // Clear persistent role
            localStorage.removeItem('userId'); // Clear persistent ID on manual leave to allow new identity? 
            // Actually, if they leave, they probably want to be a "new person" next time they join?
            // Or if they are just leaving a room to join another?
            // If we clear userId, we break "Host Persistence" if the host accidentally leaves?
            // No, "Leave Room" is an explicit action. If they leave, they forfeit host.
            // So clearing userId is safe and FIXES the "sticky identity" issue for local testing.
        }
    };

    const startGame = () => {
        console.log('startGame called', { socket: !!socket, room: !!room, roomId: room?.id });
        if (socket && room) {
            socket.emit('start_game', room.id);
            console.log('Emitted start_game event');
        } else {
            console.error('Cannot start game: missing socket or room');
        }
    };

    const nextCategory = () => {
        if (socket && room) {
            socket.emit('next_category', room.id);
        }
    };

    const updateSettings = (settings: Partial<GameConfig>) => {
        if (socket && room) {
            socket.emit('update_settings', { roomCode: room.id, settings });
        }
    };

    const submitVote = (targetPlayerId: string, categoryIndex: number) => {
        if (socket && room) {
            socket.emit('submit_vote', { roomCode: room.id, targetPlayerId, categoryIndex });
        }
    };

    const startNextRound = () => {
        if (socket && room) {
            socket.emit('start_next_round', room.id);
        }
    };

    const currentPlayer: Player | null = localName ? (
        // Try to match with room players to get role and server info
        (room?.players.find(p => p.id === socket?.id) || {
            id: socket?.id || '',
            name: localName,
            avatar: localAvatar || '',
            score: 0,
            role: 'player' as const
        })
    ) : null;

    return (
        <GameContext.Provider value={{
            socket,
            room,
            player: currentPlayer,
            setPlayerName,
            setPlayerAvatar,
            createRoom,
            joinRoom,
            leaveRoom,
            startGame,
            startNextRound,
            updateSettings,
            submitVote,
            nextCategory,
            isConnected,
            error,
            setError
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
