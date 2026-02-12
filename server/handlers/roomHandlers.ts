import { Server, Socket } from 'socket.io';
import { Room, Player, GameState, GameType, GameConfig } from '../types';
import { rooms, clearRoomTimers } from './timerRegistry';
import { BRITISH_CATEGORIES } from '../britishCategories';
import PUZZLES from '../crosswordData';
import { shuffleArray, BRIGHT_COLORS, assignPlayerColor, ROOM_CODES } from '../utils';
import { initializeMonopolyGame } from '../monopolyLogic';
import { initializeOligarchyGame } from '../oligarchyLogic';

export function registerRoomHandlers(socket: Socket, io: Server) {

    socket.on('create_room', (data: { playerName: string, avatar: string, gameType: GameType, userId?: string }) => {
        console.log(`[DEBUG] create_room request. GameType: ${data.gameType}`);
        let roomCode = "";
        let attempts = 0;
        do {
            roomCode = ROOM_CODES[Math.floor(Math.random() * ROOM_CODES.length)];
            attempts++;
        } while (rooms[roomCode] && attempts < 100);

        if (rooms[roomCode]) {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        let gameState: GameState;
        if (data.gameType === 'crossword') {
            const puzzleIndex = Math.floor(Math.random() * PUZZLES.length);
            const puzzle = PUZZLES[puzzleIndex];

            const grid = puzzle.rows.map((rowStr) =>
                rowStr.split('').map((char) => {
                    return {
                        value: '',
                        isBlack: char === ' ',
                        number: undefined as number | undefined,
                        locked: false,
                        ownerId: undefined
                    };
                })
            );

            let n = 1;
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[0].length; c++) {
                    if (grid[r][c].isBlack) continue;
                    const isAcrossStart = (c === 0 || grid[r][c - 1].isBlack) && (c + 1 < grid[0].length && !grid[r][c + 1].isBlack);
                    const isDownStart = (r === 0 || grid[r - 1][c].isBlack) && (r + 1 < grid.length && !grid[r + 1][c].isBlack);

                    if (isAcrossStart || isDownStart) {
                        grid[r][c].number = n++;
                    }
                }
            }

            const solution = puzzle.rows.map(r => r.split(''));

            gameState = {
                status: 'waiting',
                round: 0,
                letter: '',
                timer: 0,
                currentVotingCategory: 0,
                grid: grid,
                clues: puzzle.clues,
                cursors: {},
                solution: solution
            };
        } else {
            const shuffled = shuffleArray(BRITISH_CATEGORIES);
            const selectedCategories = shuffled.slice(0, 12);

            gameState = {
                status: 'waiting',
                round: 0,
                letter: '',
                timer: 0,
                currentVotingCategory: 0,
                categories: selectedCategories
            };
        }

        const hostPlayer: Player = {
            id: socket.id,
            userId: data.userId,
            name: data.playerName,
            avatar: data.avatar,
            score: 0,
            role: 'player',
            isConnected: true,
            color: BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)]
        };

        rooms[roomCode] = {
            id: roomCode,
            gameType: data.gameType || 'scattergories',
            players: [hostPlayer],
            gameState: gameState,
            gameConfig: {
                timerDuration: 180,
                maxRounds: data.gameType === 'charades' ? 1 : 3,
                charadesCategory: 'Friends'
            },
            answers: {},
            rejections: {},
            votes: {}
        };

        if (data.gameType === 'monopoly') {
            initializeMonopolyGame(rooms[roomCode]);
        } else if (data.gameType === 'oligarchy') {
            initializeOligarchyGame(rooms[roomCode]);
        }

        socket.join(roomCode);
        socket.emit('room_joined', rooms[roomCode]);
        console.log(`Room ${roomCode} created by ${data.playerName}`);
    });

    socket.on('join_room', (data: { roomCode: string, playerName: string, avatar: string, role?: 'player' | 'banker', userId?: string }) => {
        console.log(`Join attempt: ${data.playerName} trying to join ${data.roomCode} as ${data.role || 'player'} (UserId: ${data.userId})`);
        const room = rooms[data.roomCode];

        if (room) {
            // Rejoin logic
            const existingPlayer = room.players.find(p => p.name === data.playerName || (data.userId && p.userId === data.userId));

            if (existingPlayer) {
                console.log(`Rejoin: Updating socket ID for ${existingPlayer.name} from ${existingPlayer.id} to ${socket.id}`);
                const oldSocketId = existingPlayer.id;

                existingPlayer.id = socket.id;
                existingPlayer.isConnected = true;

                if (room.gameState.oligarchy) {
                    const oldState = room.gameState.oligarchy.players[oldSocketId];
                    if (oldState) {
                        room.gameState.oligarchy.players[socket.id] = oldState;
                        delete room.gameState.oligarchy.players[oldSocketId];

                        Object.values(room.gameState.oligarchy.companies).forEach(c => {
                            if (c.ownerId === oldSocketId) c.ownerId = socket.id;
                        });

                        if (room.gameState.oligarchy.currentTurnPlayerId === oldSocketId) {
                            room.gameState.oligarchy.currentTurnPlayerId = socket.id;
                        }
                    }
                }

                socket.join(data.roomCode);
                socket.emit('room_joined', room);
                io.to(data.roomCode).emit('room_update', room);
                console.log(`${existingPlayer.name} rejoined room ${data.roomCode}`);
                return;
            }

            // New join
            let requestedRole = data.role || 'player';
            if (requestedRole === 'banker' && room.players.some(p => p.role === 'banker')) {
                requestedRole = 'player';
            }

            const newPlayer: Player = {
                id: socket.id,
                userId: data.userId,
                name: data.playerName,
                avatar: data.avatar,
                score: 0,
                role: requestedRole,
                isConnected: true,
                color: assignPlayerColor(room)
            };

            room.players.push(newPlayer);
            socket.join(data.roomCode);

            // Mid-game join initialization
            if (room.gameState.status === 'playing') {
                console.log(`Mid-Game Join: Initializing state for ${newPlayer.name}`);
                if (room.gameState.oligarchy) {
                    room.gameState.oligarchy.players[socket.id] = {
                        cash: 1500,
                        position: 0,
                        isBankrupt: false,
                        companies: [],
                        isAfk: false
                    };
                } else if (room.gameState.monopoly) {
                    room.gameState.monopoly.players[socket.id] = {
                        position: 0,
                        cash: 1500,
                        isBankrupt: false,
                        isAfk: false,
                        properties: [],
                        jailTurns: 0,
                        getOutOfJailCards: 0,
                        colorSets: {}
                    };
                }
            }
            socket.emit('room_joined', room);
            io.to(data.roomCode).emit('room_update', room);
            console.log(`${data.playerName} joined room ${data.roomCode} as ${requestedRole}`);

        } else {
            console.log(`Join failed: Room ${data.roomCode} not found.`);
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('leave_room', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            socket.leave(roomCode);
            if (room.players.length === 0) {
                clearRoomTimers(roomCode);
                delete rooms[roomCode];
                console.log(`Room ${roomCode} deleted (empty)`);
            } else {
                io.to(roomCode).emit('room_update', room);
                console.log(`User ${socket.id} left room ${roomCode}`);
            }
        }
    });

    socket.on('update_settings', (data: { roomCode: string, settings: Partial<GameConfig> }) => {
        const room = rooms[data.roomCode];
        if (room) {
            room.gameConfig = { ...room.gameConfig, ...data.settings };
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [roomCode, room] of Object.entries(rooms)) {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.isConnected = false;
                if (room.players.every(p => !p.isConnected)) {
                    clearRoomTimers(roomCode);
                    delete rooms[roomCode];
                    console.log(`Room ${roomCode} deleted (all disconnected)`);
                } else {
                    io.to(roomCode).emit('room_update', room);
                }
                break;
            }
        }
    });
}
