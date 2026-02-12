"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGameStartHandlers = registerGameStartHandlers;
const timerRegistry_1 = require("./timerRegistry");
const monopolyLogic_1 = require("../monopolyLogic");
const oligarchyLogic_1 = require("../oligarchyLogic");
const monopolyHandlers_1 = require("./monopolyHandlers");
const oligarchyHandlers_1 = require("./oligarchyHandlers");
const charadesHandlers_1 = require("./charadesHandlers");
const scattergoriesHandlers_1 = require("./scattergoriesHandlers");
const email_1 = require("../email");
function registerGameStartHandlers(socket, io) {
    socket.on('start_game', (roomCode) => {
        var _a;
        console.log(`[DEBUG] Received start_game request for room: ${roomCode} from socket ${socket.id}`);
        const room = timerRegistry_1.rooms[roomCode];
        if (room) {
            console.log(`[DEBUG] Starting Game. Type: ${room.gameType}`);
            room.gameState.status = 'playing';
            room.gameState.round = 1;
            room.players.forEach(p => p.score = 0);
            // Send email notification (fire and forget)
            const hostName = ((_a = room.players[0]) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown';
            (0, email_1.notifyGameStarted)(room.gameType, room.players.length, roomCode, hostName);
            if (room.gameType === 'crossword') {
                io.to(roomCode).emit('game_started', room);
            }
            else if (room.gameType === 'charades') {
                room.gameState.actingTimes = {};
                room.gameState.penalties = {};
                (0, charadesHandlers_1.startCharadesRound)(roomCode, io);
                return;
            }
            else if (room.gameType === 'monopoly') {
                console.log(`Starting Monopoly for room ${roomCode}.`);
                try {
                    (0, monopolyLogic_1.initializeMonopolyGame)(room);
                    (0, monopolyHandlers_1.startMonopolyGameLoop)(roomCode, io);
                    io.to(roomCode).emit('game_started', room);
                }
                catch (error) {
                    console.error('Error initializing Monopoly game:', error);
                    socket.emit('error', 'Failed to start game: ' + (error instanceof Error ? error.message : String(error)));
                }
            }
            else if (room.gameType === 'oligarchy') {
                console.log(`[DEBUG] Initializing Oligarchy for room ${roomCode}`);
                try {
                    (0, oligarchyLogic_1.initializeOligarchyGame)(room);
                    io.to(roomCode).emit('game_started', room);
                }
                catch (e) {
                    console.error(`[DEBUG] Error starting Oligarchy:`, e);
                    socket.emit('error', 'Failed to init Oligarchy');
                }
                (0, oligarchyHandlers_1.startOligarchyGameLoop)(roomCode, io);
            }
            else {
                // Scattergories
                (0, scattergoriesHandlers_1.startRound)(roomCode, io);
            }
        }
        else {
            console.error(`[DEBUG] start_game failed: Room ${roomCode} not found.`);
            socket.emit('error', 'Room not found (expired?)');
        }
    });
}
