"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCharadesHandlers = registerCharadesHandlers;
exports.startCharadesRound = startCharadesRound;
const timerRegistry_1 = require("./timerRegistry");
const charadesData_1 = require("../charadesData");
function registerCharadesHandlers(socket, io) {
    socket.on('start_charades_round', (roomCode) => {
        startCharadesRound(roomCode, io);
    });
    socket.on('buzz', (roomCode) => {
        var _a;
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.status === 'playing' && !room.gameState.isPaused) {
            const now = Date.now();
            const penaltyEnd = ((_a = room.gameState.penalties) === null || _a === void 0 ? void 0 : _a[socket.id]) || 0;
            if (now < penaltyEnd)
                return;
            room.gameState.isPaused = true;
            room.gameState.guessingPlayerId = socket.id;
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('resolve_guess', (data) => {
        const room = timerRegistry_1.rooms[data.roomCode];
        if (room && room.gameState.isPaused && room.gameState.guessingPlayerId) {
            if (data.correct) {
                const actorId = room.gameState.actorId;
                const guesserId = room.gameState.guessingPlayerId;
                if (actorId && room.gameState.roundStartTime) {
                    const timeTaken = Date.now() - room.gameState.roundStartTime;
                    if (!room.gameState.actingTimes)
                        room.gameState.actingTimes = {};
                    room.gameState.actingTimes[actorId] = timeTaken;
                    console.log(`[Charades] Room ${data.roomCode}: Actor ${actorId} time ${timeTaken}ms.`);
                }
                const guesser = room.players.find(p => p.id === guesserId);
                if (guesser)
                    guesser.score++;
                startCharadesRound(data.roomCode, io, guesserId);
            }
            else {
                const guesserId = room.gameState.guessingPlayerId;
                room.gameState.isPaused = false;
                room.gameState.guessingPlayerId = undefined;
                if (!room.gameState.penalties)
                    room.gameState.penalties = {};
                room.gameState.penalties[guesserId] = Date.now() + 20000;
                io.to(data.roomCode).emit('room_update', room);
            }
        }
    });
}
function startCharadesRound(roomCode, io, nextActorId) {
    const room = timerRegistry_1.rooms[roomCode];
    if (!room)
        return;
    // Check win condition
    if (room.gameState.actingTimes && Object.keys(room.gameState.actingTimes).length === room.players.length) {
        room.gameState.status = 'results';
        io.to(roomCode).emit('room_update', room);
        return;
    }
    room.gameState.status = 'playing';
    room.gameState.isPaused = false;
    room.gameState.guessingPlayerId = undefined;
    if (nextActorId) {
        room.gameState.actorId = nextActorId;
    }
    else {
        if (!room.gameState.actingTimes)
            room.gameState.actingTimes = {};
        room.gameState.actorId = room.players[0].id;
    }
    const category = room.gameConfig.charadesCategory || 'Friends';
    const sceneList = charadesData_1.CHARADES_DATA[category] || charadesData_1.CHARADES_DATA['Friends'];
    room.gameState.currentScene = sceneList[Math.floor(Math.random() * sceneList.length)];
    room.gameState.roundStartTime = Date.now();
    io.to(roomCode).emit('room_update', room);
}
