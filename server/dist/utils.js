"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOM_CODES = exports.assignPlayerColor = exports.BRIGHT_COLORS = void 0;
exports.shuffleArray = shuffleArray;
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
exports.BRIGHT_COLORS = [
    '#FF3366', // Neon Red/Pink
    '#00FF00', // Lime Green
    '#3399FF', // Sky Blue
    '#FFCC00', // Gold/Yellow
    '#9933CC', // Bright Purple
    '#FF9933', // Neon Orange
    '#00CCCC', // Cyan
    '#FF66CC', // Hot Pink
    '#CCFF00', // Chartreuse
    '#6666FF', // Periwinkle
    '#FF00CC', // Magenta
    '#00FFCC' // Turquoise
];
const assignPlayerColor = (room) => {
    const usedColors = new Set(room.players.map(p => p.color).filter(Boolean));
    for (const color of exports.BRIGHT_COLORS) {
        if (!usedColors.has(color))
            return color;
    }
    return exports.BRIGHT_COLORS[Math.floor(Math.random() * exports.BRIGHT_COLORS.length)];
};
exports.assignPlayerColor = assignPlayerColor;
exports.ROOM_CODES = [
    "PARIS", "TOKYO", "MARS", "VENUS", "ZEUS", "HERA", "APOLLO", "ROME", "LIMA", "OSLO",
    "CAIRO", "DELHI", "SEOUL", "DUBAI", "YORK", "LYON", "NICE", "BONN", "BERN", "KIEV",
    "RIGA", "BAKU", "DOHA", "MALE", "LOME", "SUVA", "AGRA", "PUNE", "GOA", "MAUI"
];
