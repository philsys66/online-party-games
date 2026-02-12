import { Server, Socket } from 'socket.io';
import { rooms } from './timerRegistry';
import { initializeMonopolyGame } from '../monopolyLogic';
import { initializeOligarchyGame } from '../oligarchyLogic';
import { startMonopolyGameLoop } from './monopolyHandlers';
import { startOligarchyGameLoop } from './oligarchyHandlers';
import { startCharadesRound } from './charadesHandlers';
import { startRound } from './scattergoriesHandlers';

export function registerGameStartHandlers(socket: Socket, io: Server) {

    socket.on('start_game', (roomCode: string) => {
        console.log(`[DEBUG] Received start_game request for room: ${roomCode} from socket ${socket.id}`);
        const room = rooms[roomCode];
        if (room) {
            console.log(`[DEBUG] Starting Game. Type: ${room.gameType}`);
            room.gameState.status = 'playing';
            room.gameState.round = 1;
            room.players.forEach(p => p.score = 0);

            if (room.gameType === 'crossword') {
                io.to(roomCode).emit('game_started', room);
            } else if (room.gameType === 'charades') {
                room.gameState.actingTimes = {};
                room.gameState.penalties = {};
                startCharadesRound(roomCode, io);
                return;
            } else if (room.gameType === 'monopoly') {
                console.log(`Starting Monopoly for room ${roomCode}.`);
                try {
                    initializeMonopolyGame(room);
                    startMonopolyGameLoop(roomCode, io);
                    io.to(roomCode).emit('game_started', room);
                } catch (error) {
                    console.error('Error initializing Monopoly game:', error);
                    socket.emit('error', 'Failed to start game: ' + (error instanceof Error ? error.message : String(error)));
                }
            } else if (room.gameType === 'oligarchy') {
                console.log(`[DEBUG] Initializing Oligarchy for room ${roomCode}`);
                try {
                    initializeOligarchyGame(room);
                    io.to(roomCode).emit('game_started', room);
                } catch (e) {
                    console.error(`[DEBUG] Error starting Oligarchy:`, e);
                    socket.emit('error', 'Failed to init Oligarchy');
                }
                startOligarchyGameLoop(roomCode, io);
            } else {
                // Scattergories
                startRound(roomCode, io);
            }
        } else {
            console.error(`[DEBUG] start_game failed: Room ${roomCode} not found.`);
            socket.emit('error', 'Room not found (expired?)');
        }
    });
}
