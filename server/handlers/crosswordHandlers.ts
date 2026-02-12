import { Server, Socket } from 'socket.io';
import { Room } from '../types';
import { rooms } from './timerRegistry';

export function registerCrosswordHandlers(socket: Socket, io: Server) {

    socket.on('update_cell', (data: { roomCode: string, r: number, c: number, value: string }) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.grid) {
            const cell = room.gameState.grid[data.r][data.c];
            if (cell.locked) return;

            cell.value = data.value;
            checkWord(room, data.r, data.c, socket.id);
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('cursor_move', (data: { roomCode: string, r: number, c: number }) => {
        const room = rooms[data.roomCode];
        if (room) {
            if (!room.gameState.cursors) room.gameState.cursors = {};
            room.gameState.cursors[socket.id] = { row: data.r, col: data.c };
            io.to(data.roomCode).emit('room_update', room);
        }
    });
}

function checkWord(room: Room, r: number, c: number, activePlayerId: string) {
    if (!room.gameState.grid || !room.gameState.solution) return;
    const grid = room.gameState.grid;
    const solution = room.gameState.solution;

    // Check Across
    let cStart = c;
    while (cStart > 0 && !grid[r][cStart - 1].isBlack) cStart--;
    let cEnd = c;
    while (cEnd < grid[0].length - 1 && !grid[r][cEnd + 1].isBlack) cEnd++;

    let isAcrossCorrect = true;
    for (let k = cStart; k <= cEnd; k++) {
        if (grid[r][k].value !== solution[r][k]) {
            isAcrossCorrect = false;
            break;
        }
    }

    if (isAcrossCorrect) {
        let newLocks = false;
        for (let k = cStart; k <= cEnd; k++) {
            if (!grid[r][k].locked) {
                grid[r][k].locked = true;
                grid[r][k].ownerId = activePlayerId;
                newLocks = true;
            }
        }
        if (newLocks) {
            const player = room.players.find(p => p.id === activePlayerId);
            if (player) player.score += 1;
        }
    }

    // Check Down
    let rStart = r;
    while (rStart > 0 && !grid[rStart - 1][c].isBlack) rStart--;
    let rEnd = r;
    while (rEnd < grid.length - 1 && !grid[rEnd + 1][c].isBlack) rEnd++;

    let isDownCorrect = true;
    for (let k = rStart; k <= rEnd; k++) {
        if (grid[k][c].value !== solution[k][c]) {
            isDownCorrect = false;
            break;
        }
    }

    if (isDownCorrect) {
        let newLocks = false;
        for (let k = rStart; k <= rEnd; k++) {
            if (!grid[k][c].locked) {
                grid[k][c].locked = true;
                grid[k][c].ownerId = activePlayerId;
                newLocks = true;
            }
        }
        if (newLocks) {
            const player = room.players.find(p => p.id === activePlayerId);
            if (player) player.score += 1;
        }
    }
}
