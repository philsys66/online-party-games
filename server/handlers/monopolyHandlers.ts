import { Server, Socket } from 'socket.io';
import { rooms, registerRoomTimer } from './timerRegistry';
import {
    initializeMonopolyGame, handleDiceRoll, purchaseProperty, endTurn, buyHouse,
    createTradeOffer, acceptTrade, rejectTrade, declareBankruptcy, checkTurnTimeout,
    mortgageProperty, unmortgageProperty
} from '../monopolyLogic';

export function registerMonopolyHandlers(socket: Socket, io: Server) {

    socket.on('monopoly_roll_dice', (roomCode: string) => {
        const room = rooms[roomCode];
        if (!room || !room.gameState.monopoly) return;

        handleDiceRoll(room, socket.id);
        io.to(roomCode).emit('room_update', room);
    });

    socket.on('monopoly_buy_property', (roomCode: string) => {
        const room = rooms[roomCode];
        if (!room || !room.gameState.monopoly) return;

        purchaseProperty(room, socket.id);
        io.to(roomCode).emit('room_update', room);
    });

    socket.on('monopoly_end_turn', (roomCode: string) => {
        const room = rooms[roomCode];
        if (!room || !room.gameState.monopoly) return;

        endTurn(room);
        io.to(roomCode).emit('room_update', room);
    });

    socket.on('monopoly_mortgage', (data: { roomCode: string, propertyId: number }) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            mortgageProperty(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_unmortgage', (data: { roomCode: string, propertyId: number }) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            unmortgageProperty(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_buy_house', (data: { roomCode: string, propertyId: number }) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            buyHouse(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_declare_bankruptcy', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            declareBankruptcy(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_create_trade', (data: {
        roomCode: string,
        receiverId: string,
        offer: { cash: number, properties: number[] },
        request: { cash: number, properties: number[] }
    }) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            createTradeOffer(room, socket.id, data.receiverId, data.offer, data.request);
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_accept_trade', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            acceptTrade(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_reject_trade', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            rejectTrade(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });

    socket.on('monopoly_dismiss_card', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            room.gameState.monopoly.currentCard = null;
            endTurn(room);
            io.to(roomCode).emit('room_update', room);
        }
    });
}

export function startMonopolyGameLoop(roomCode: string, io: Server) {
    const intervalId = setInterval(() => {
        const currentRoom = rooms[roomCode];
        if (!currentRoom || !currentRoom.gameState.monopoly) {
            clearInterval(intervalId);
            return;
        }

        const result = checkTurnTimeout(currentRoom);
        if (result === 'warn' || result === 'kick') {
            io.to(roomCode).emit('room_update', currentRoom);
        }
    }, 1000);
    registerRoomTimer(roomCode, intervalId);
}
