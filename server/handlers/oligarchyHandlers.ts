import { Server, Socket } from 'socket.io';
import { rooms, registerRoomTimer } from './timerRegistry';
import {
    initializeOligarchyGame, handleOligarchyRoll, purchaseOligarchyCompany, endOligarchyTurn,
    startOligarchyAuction, handleOligarchyBid, checkOligarchyAuctionTick
} from '../oligarchyLogic';

export function registerOligarchyHandlers(socket: Socket, io: Server) {

    socket.on('oligarchy_roll', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            const roll = handleOligarchyRoll(room, socket.id);

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

    socket.on('oligarchy_buy', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            purchaseOligarchyCompany(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });

    socket.on('oligarchy_end_turn', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            endOligarchyTurn(room);
            io.to(roomCode).emit('room_update', room);
        }
    });

    socket.on('oligarchy_start_auction', (roomCode: string, companyId: number) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            startOligarchyAuction(room, companyId, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });

    socket.on('oligarchy_bid', (roomCode: string, amount: number) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            handleOligarchyBid(room, socket.id, amount);
            io.to(roomCode).emit('room_update', room);
        }
    });
}

export function startOligarchyGameLoop(roomCode: string, io: Server) {
    const intervalId = setInterval(() => {
        const currentRoom = rooms[roomCode];
        if (!currentRoom || !currentRoom.gameState.oligarchy) {
            clearInterval(intervalId);
            return;
        }

        // Check Auction Timer
        if (currentRoom.gameState.oligarchy.turnPhase === 'auction') {
            checkOligarchyAuctionTick(currentRoom);
        }

        // Auto-clear expired newsflash
        const newsflash = currentRoom.gameState.oligarchy.activeNewsflash;
        if (newsflash?.expiresAt && Date.now() > newsflash.expiresAt) {
            currentRoom.gameState.oligarchy.activeNewsflash = null;
        }

        io.to(roomCode).emit('room_update', currentRoom);
    }, 1000);
    registerRoomTimer(roomCode, intervalId);
}
