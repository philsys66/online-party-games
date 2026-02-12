"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMonopolyHandlers = registerMonopolyHandlers;
exports.startMonopolyGameLoop = startMonopolyGameLoop;
const timerRegistry_1 = require("./timerRegistry");
const monopolyLogic_1 = require("../monopolyLogic");
function registerMonopolyHandlers(socket, io) {
    socket.on('monopoly_roll_dice', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (!room || !room.gameState.monopoly)
            return;
        (0, monopolyLogic_1.handleDiceRoll)(room, socket.id);
        io.to(roomCode).emit('room_update', room);
    });
    socket.on('monopoly_buy_property', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (!room || !room.gameState.monopoly)
            return;
        (0, monopolyLogic_1.purchaseProperty)(room, socket.id);
        io.to(roomCode).emit('room_update', room);
    });
    socket.on('monopoly_end_turn', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (!room || !room.gameState.monopoly)
            return;
        (0, monopolyLogic_1.endTurn)(room);
        io.to(roomCode).emit('room_update', room);
    });
    socket.on('monopoly_mortgage', (data) => {
        const room = timerRegistry_1.rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.mortgageProperty)(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_unmortgage', (data) => {
        const room = timerRegistry_1.rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.unmortgageProperty)(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_buy_house', (data) => {
        const room = timerRegistry_1.rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.buyHouse)(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_declare_bankruptcy', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.declareBankruptcy)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_create_trade', (data) => {
        const room = timerRegistry_1.rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.createTradeOffer)(room, socket.id, data.receiverId, data.offer, data.request);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_accept_trade', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.acceptTrade)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_reject_trade', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.rejectTrade)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_dismiss_card', (roomCode) => {
        const room = timerRegistry_1.rooms[roomCode];
        if (room && room.gameState.monopoly) {
            room.gameState.monopoly.currentCard = null;
            (0, monopolyLogic_1.endTurn)(room);
            io.to(roomCode).emit('room_update', room);
        }
    });
}
function startMonopolyGameLoop(roomCode, io) {
    const intervalId = setInterval(() => {
        const currentRoom = timerRegistry_1.rooms[roomCode];
        if (!currentRoom || !currentRoom.gameState.monopoly) {
            clearInterval(intervalId);
            return;
        }
        const result = (0, monopolyLogic_1.checkTurnTimeout)(currentRoom);
        if (result === 'warn' || result === 'kick') {
            io.to(roomCode).emit('room_update', currentRoom);
        }
    }, 1000);
    (0, timerRegistry_1.registerRoomTimer)(roomCode, intervalId);
}
