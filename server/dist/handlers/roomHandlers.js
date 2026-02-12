"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoomHandlers = registerRoomHandlers;
const timerRegistry_1 = require("./timerRegistry");
const britishCategories_1 = require("../britishCategories");
const crosswordData_1 = __importDefault(require("../crosswordData"));
const utils_1 = require("../utils");
const monopolyLogic_1 = require("../monopolyLogic");
const oligarchyLogic_1 = require("../oligarchyLogic");
function registerRoomHandlers(socket, io) {
    socket.on('create_room', (data) => {
        console.log(`[DEBUG] create_room request. GameType: ${data.gameType}`);
        let roomCode = "";
        let attempts = 0;
        do {
            roomCode = utils_1.ROOM_CODES[Math.floor(Math.random() * utils_1.ROOM_CODES.length)];
            attempts++;
        } while (timerRegistry_1.rooms[roomCode] && attempts < 100);
        if (timerRegistry_1.rooms[roomCode]) {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        let gameState;
        if (data.gameType === 'crossword') {
            const puzzleIndex = Math.floor(Math.random() * crosswordData_1.default.length);
            const puzzle = crosswordData_1.default[puzzleIndex];
            const grid = puzzle.rows.map((rowStr) => rowStr.split('').map((char) => {
                return {
                    value: '',
                    isBlack: char === ' ',
                    number: undefined,
                    locked: false,
                    ownerId: undefined
                };
            }));
            let n = 1;
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[0].length; c++) {
                    if (grid[r][c].isBlack)
                        continue;
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
        }
        else {
            const shuffled = (0, utils_1.shuffleArray)(britishCategories_1.BRITISH_CATEGORIES);
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
        const hostPlayer = {
            id: socket.id,
            userId: data.userId,
            name: data.playerName,
            avatar: data.avatar,
            score: 0,
            role: 'player',
            isConnected: true,
            color: utils_1.BRIGHT_COLORS[Math.floor(Math.random() * utils_1.BRIGHT_COLORS.length)]
        };
        timerRegistry_1.rooms[roomCode] = {
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
            (0, monopolyLogic_1.initializeMonopolyGame)(timerRegistry_1.rooms[roomCode]);
        }
        else if (data.gameType === 'oligarchy') {
            (0, oligarchyLogic_1.initializeOligarchyGame)(timerRegistry_1.rooms[roomCode]);
        }
        socket.join(roomCode);
        socket.emit('room_joined', timerRegistry_1.rooms[roomCode]);
        console.log(`Room ${roomCode} created by ${data.playerName}`);
    });
    socket.on('join_room', (data) => {
        console.log(`Join attempt: ${data.playerName} trying to join ${data.roomCode} as ${data.role || 'player'} (UserId: ${data.userId})`);
        const room = timerRegistry_1.rooms[data.roomCode];
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
                            if (c.ownerId === oldSocketId)
                                c.ownerId = socket.id;
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
            const newPlayer = {
                id: socket.id,
                userId: data.userId,
                name: data.playerName,
                avatar: data.avatar,
                score: 0,
                role: requestedRole,
                isConnected: true,
                color: (0, utils_1.assignPlayerColor)(room)
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
                }
                else if (room.gameState.monopoly) {
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
        }
        else {
            console.log(`Join failed: Room ${data.roomCode} not found.`);
            socket.emit('error', 'Room not found');
        }
    });
    socket.on('leave_room', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            socket.leave(roomCode);
            if (room.players.length === 0) {
                (0, timerRegistry_1.clearRoomTimers)(roomCode);
                delete timerRegistry_1.rooms[roomCode];
                console.log(`Room ${roomCode} deleted (empty)`);
            }
            else {
                io.to(roomCode).emit('room_update', room);
                console.log(`User ${socket.id} left room ${roomCode}`);
            }
        }
    });
    socket.on('update_settings', (data) => {
        const room = timerRegistry_1.rooms[data.roomCode];
        if (room) {
            room.gameConfig = Object.assign(Object.assign({}, room.gameConfig), data.settings);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [roomCode, room] of Object.entries(timerRegistry_1.rooms)) {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.isConnected = false;
                if (room.players.every(p => !p.isConnected)) {
                    (0, timerRegistry_1.clearRoomTimers)(roomCode);
                    delete timerRegistry_1.rooms[roomCode];
                    console.log(`Room ${roomCode} deleted (all disconnected)`);
                }
                else {
                    io.to(roomCode).emit('room_update', room);
                }
                break;
            }
        }
    });
}
