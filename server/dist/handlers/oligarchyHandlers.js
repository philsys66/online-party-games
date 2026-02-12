"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOligarchyHandlers = registerOligarchyHandlers;
exports.startOligarchyGameLoop = startOligarchyGameLoop;
const timerRegistry_1 = require("./timerRegistry");
const oligarchyLogic_1 = require("../oligarchyLogic");
function registerOligarchyHandlers(socket, io) {
    socket.on('oligarchy_roll', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            const roll = (0, oligarchyLogic_1.handleOligarchyRoll)(room, socket.id);
            if (roll) {
                io.to(roomCode).emit('oligarchy_dice_rolled', {
                    die1: roll.die1,
                    die2: roll.die2,
                    playerId: socket.id
                });
            }
            setTimeout(() => {
                io.to(roomCode).emit('room_update', room);
            }, 3000);
        }
    });
    socket.on('oligarchy_buy', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            (0, oligarchyLogic_1.purchaseOligarchyCompany)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('oligarchy_end_turn', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            (0, oligarchyLogic_1.endOligarchyTurn)(room);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('oligarchy_start_auction', (roomCode, companyId) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            (0, oligarchyLogic_1.startOligarchyAuction)(room, companyId, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('oligarchy_bid', (roomCode, amount) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            (0, oligarchyLogic_1.handleOligarchyBid)(room, socket.id, amount);
            io.to(roomCode).emit('room_update', room);
        }
    });
}
function startOligarchyGameLoop(roomCode, io) {
    const intervalId = setInterval(() => {
        const currentRoom = timerRegistry_1.rooms[roomCode];
        if (!currentRoom || !currentRoom.gameState.oligarchy) {
            clearInterval(intervalId);
            return;
        }
        // Check Auction Timer
        if (currentRoom.gameState.oligarchy.turnPhase === 'auction') {
            (0, oligarchyLogic_1.checkOligarchyAuctionTick)(currentRoom);
        }
        // Auto-clear expired newsflash
        const newsflash = currentRoom.gameState.oligarchy.activeNewsflash;
        if ((newsflash === null || newsflash === void 0 ? void 0 : newsflash.expiresAt) && Date.now() > newsflash.expiresAt) {
            currentRoom.gameState.oligarchy.activeNewsflash = null;
        }
        io.to(roomCode).emit('room_update', currentRoom);
    }, 1000);
    (0, timerRegistry_1.registerRoomTimer)(roomCode, intervalId);
}
