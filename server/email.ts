import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const NOTIFY_EMAIL = 'phil.ayton@sysero.com';

const GAME_NAMES: Record<string, string> = {
    scattergories: 'Scattergories',
    crossword: 'Crossword',
    charades: 'Charades',
    monopoly: 'Tech Capitalist',
    oligarchy: 'Oligarchy'
};

export async function notifyGameStarted(gameType: string, playerCount: number, roomCode: string, hostName: string) {
    if (!resend) {
        console.log('[EMAIL] Resend not configured (missing RESEND_API_KEY), skipping notification');
        return;
    }

    const gameName = GAME_NAMES[gameType] || gameType;

    try {
        await resend.emails.send({
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
    } catch (error) {
        console.error('[EMAIL] Failed to send notification:', error);
    }
}
