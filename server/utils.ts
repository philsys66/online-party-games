import { Room } from './types';

export function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export const BRIGHT_COLORS = [
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
    '#00FFCC'  // Turquoise
];

export const assignPlayerColor = (room: Room): string => {
    const usedColors = new Set(room.players.map(p => p.color).filter(Boolean));
    for (const color of BRIGHT_COLORS) {
        if (!usedColors.has(color)) return color;
    }
    return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)];
};

export const ROOM_CODES = [
    "PARIS", "TOKYO", "MARS", "VENUS", "ZEUS", "HERA", "APOLLO", "ROME", "LIMA", "OSLO",
    "CAIRO", "DELHI", "SEOUL", "DUBAI", "YORK", "LYON", "NICE", "BONN", "BERN", "KIEV",
    "RIGA", "BAKU", "DOHA", "MALE", "LOME", "SUVA", "AGRA", "PUNE", "GOA", "MAUI"
];
