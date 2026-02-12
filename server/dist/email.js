"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyGameStarted = notifyGameStarted;
const resend_1 = require("resend");
const resend = process.env.RESEND_API_KEY
    ? new resend_1.Resend(process.env.RESEND_API_KEY)
    : null;
const NOTIFY_EMAIL = 'phil.ayton@sysero.com';
const GAME_NAMES = {
    scattergories: 'Scattergories',
    crossword: 'Crossword',
    charades: 'Charades',
    monopoly: 'Tech Capitalist',
    oligarchy: 'Oligarchy'
};
function notifyGameStarted(gameType, playerCount, roomCode, hostName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!resend) {
            console.log('[EMAIL] Resend not configured (missing RESEND_API_KEY), skipping notification');
            return;
        }
        const gameName = GAME_NAMES[gameType] || gameType;
        try {
            yield resend.emails.send({
                from: "Ayton's Arcade <onboarding@resend.dev>",
                to: NOTIFY_EMAIL,
                subject: `🎮 ${gameName} started!`,
                html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1;">🎮 Game Started!</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #666;">Game</td><td style="padding: 8px 0; font-weight: bold;">${gameName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Room</td><td style="padding: 8px 0; font-weight: bold;">${roomCode}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Host</td><td style="padding: 8px 0; font-weight: bold;">${hostName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Players</td><td style="padding: 8px 0; font-weight: bold;">${playerCount}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Time</td><td style="padding: 8px 0; font-weight: bold;">${new Date().toLocaleString('en-GB')}</td></tr>
                    </table>
                </div>
            `
            });
            console.log(`[EMAIL] Game start notification sent for ${gameName} in room ${roomCode}`);
        }
        catch (error) {
            console.error('[EMAIL] Failed to send notification:', error);
        }
    });
}
