import { Room } from '../types';

export const rooms: Record<string, Room> = {};
export const roomTimers: Record<string, NodeJS.Timeout[]> = {};

export function registerRoomTimer(roomCode: string, timer: NodeJS.Timeout) {
    if (!roomTimers[roomCode]) roomTimers[roomCode] = [];
    roomTimers[roomCode].push(timer);
}

export function clearRoomTimers(roomCode: string) {
    roomTimers[roomCode]?.forEach(t => clearInterval(t));
    delete roomTimers[roomCode];
}
