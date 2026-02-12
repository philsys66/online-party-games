import { Server, Socket } from 'socket.io';
import { Room } from '../types';
import { rooms, registerRoomTimer } from './timerRegistry';

export function registerScattergoriesHandlers(socket: Socket, io: Server) {

    socket.on('submit_answers', (data: { roomCode: string, answers: Record<number, string> }) => {
        const room = rooms[data.roomCode];
        if (room) {
            room.answers[socket.id] = data.answers;
            console.log(`Answers received from ${socket.id} for room ${data.roomCode}`);
            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('submit_vote', (data: { roomCode: string, targetPlayerId: string, categoryIndex: number }) => {
        const room = rooms[data.roomCode];
        if (room) {
            if (socket.id === data.targetPlayerId) return;

            if (!room.rejections[data.targetPlayerId]) {
                room.rejections[data.targetPlayerId] = {};
            }

            if (!room.rejections[data.targetPlayerId][data.categoryIndex]) {
                room.rejections[data.targetPlayerId][data.categoryIndex] = [];
            }

            const voters = room.rejections[data.targetPlayerId][data.categoryIndex];
            const voterIndex = voters.indexOf(socket.id);

            if (voterIndex > -1) {
                voters.splice(voterIndex, 1);
            } else {
                voters.push(socket.id);
            }

            io.to(data.roomCode).emit('room_update', room);
        }
    });

    socket.on('next_category', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room && room.gameState.status === 'voting') {
            room.gameState.currentVotingCategory++;

            if (room.gameState.currentVotingCategory >= 12) {
                // Calculate scores
                room.players.forEach(p => {
                    const pAnswers = room.answers[p.id] || {};
                    let roundScore = 0;
                    const otherPlayersCount = room.players.length - 1;

                    Object.entries(pAnswers).forEach(([catIdxStr, ans]) => {
                        const catIdx = Number(catIdxStr);
                        if (typeof ans === 'string' && ans.trim().length > 0) {
                            const rejections = room.rejections[p.id]?.[catIdx] || [];

                            let isRejected = false;
                            if (otherPlayersCount > 0) {
                                if (rejections.length / otherPlayersCount >= 0.5) {
                                    isRejected = true;
                                }
                            }

                            if (!isRejected) {
                                roundScore++;
                            }
                        }
                    });
                    p.score += roundScore;
                });

                if (room.gameState.round >= room.gameConfig.maxRounds) {
                    room.gameState.status = 'results';
                    io.to(roomCode).emit('game_over', room);
                } else {
                    room.gameState.status = 'results';
                    io.to(roomCode).emit('round_over', room);
                }
            } else {
                io.to(roomCode).emit('update_voting_category', room.gameState.currentVotingCategory);
            }
        }
    });

    socket.on('start_next_round', (roomCode: string) => {
        const room = rooms[roomCode];
        if (room) {
            room.gameState.round++;
            if (room.gameState.round > room.gameConfig.maxRounds) {
                room.gameState.status = 'results';
                io.to(roomCode).emit('game_over', room);
            } else {
                room.gameState.status = 'playing';
                startRound(roomCode, io);
            }
        }
    });
}

export function startRound(roomCode: string, io: Server) {
    const room = rooms[roomCode];
    if (!room) return;

    const alphabet = "ABCDEFGHILMNOPRSTUWY";
    room.gameState.letter = alphabet[Math.floor(Math.random() * alphabet.length)];
    room.answers = {};
    room.rejections = {};

    io.to(roomCode).emit('game_started', room);

    let timeLeft = room.gameConfig.timerDuration;
    room.gameState.timer = timeLeft;
    io.to(roomCode).emit('timer_update', timeLeft);

    const timerInterval = setInterval(() => {
        // Charades pause logic (shared timer)
        if (room.gameType === 'charades' && room.gameState.isPaused) {
            return;
        }

        timeLeft--;
        room.gameState.timer = timeLeft;
        io.to(roomCode).emit('timer_update', timeLeft);

        if (timeLeft % 10 === 0 || timeLeft <= 0) {
            console.log(`Room ${roomCode} timer: ${timeLeft}`);
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            console.log(`Timer finished for Room ${roomCode}. Starting voting.`);

            if (room.gameType === 'charades') {
                // Import dynamically to avoid circular dependency
                const { startCharadesRound } = require('./charadesHandlers');
                startCharadesRound(roomCode, io);
            } else {
                room.gameState.status = 'voting';
                room.gameState.currentVotingCategory = 0;
                io.to(roomCode).emit('start_voting', room);
            }
        }
    }, 1000);
    registerRoomTimer(roomCode, timerInterval);
}
