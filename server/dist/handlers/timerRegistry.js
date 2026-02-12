"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomTimers = exports.rooms = void 0;
exports.registerRoomTimer = registerRoomTimer;
exports.clearRoomTimers = clearRoomTimers;
exports.rooms = {};
exports.roomTimers = {};
function registerRoomTimer(roomCode, timer) {
    if (!exports.roomTimers[roomCode])
        exports.roomTimers[roomCode] = [];
    exports.roomTimers[roomCode].push(timer);
}
function clearRoomTimers(roomCode) {
    var _a;
    (_a = exports.roomTimers[roomCode]) === null || _a === void 0 ? void 0 : _a.forEach(t => clearInterval(t));
    delete exports.roomTimers[roomCode];
}
