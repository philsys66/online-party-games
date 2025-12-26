"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monopolyData_1 = require("./monopolyData");
const checkBankruptcy = (room, playerId) => {
    var _a;
    if (!room.gameState.monopoly)
        return;
    const game = room.gameState.monopoly;
    const player = game.players[playerId];
    // Auto-liquidate if cash is negative
    while (player.cash < 0) {
        // Find unmortgaged properties
        const ownedProps = player.properties.filter(pid => !game.properties[pid].isMortgaged);
        if (ownedProps.length === 0) {
            // No more assets to sell -> BANKRUPT
            eliminatePlayer(room, playerId);
            return;
        }
        // Sell/Mortgage the first one found (simple logic)
        // In real game user chooses, but request said "make them sell"
        // We'll Mortgage it for now to get cash
        const propId = ownedProps[0];
        const prop = monopolyData_1.MONOPOLY_BOARD[propId];
        const mortgageValue = prop.mortgageValue || 0;
        game.properties[propId].isMortgaged = true;
        player.cash += mortgageValue;
        game.transactionLog.unshift(`[FORCED SALE] ${(_a = room.players.find(p => p.id === playerId)) === null || _a === void 0 ? void 0 : _a.name} mortgaged ${prop.name} for £${mortgageValue} to cover debt.`);
    }
};
const eliminatePlayer = (room, playerId) => {
    var _a;
    const game = room.gameState.monopoly;
    const playerStore = game.players[playerId];
    game.transactionLog.unshift(`[BANKRUPT] ${(_a = room.players.find(p => p.id === playerId)) === null || _a === void 0 ? void 0 : _a.name} is out of the game!`);
    // Return all properties to Bank
    playerStore.properties.forEach(pid => {
        game.properties[pid].ownerId = undefined;
        game.properties[pid].isMortgaged = false;
        game.properties[pid].houses = 0;
    });
    // Remove player from game state? Or Mark as bankrupt?
    // Marking as bankrupt is safer for turn logic iteration
    playerStore.isBankrupt = true;
    playerStore.cash = 0;
    playerStore.properties = [];
    // Check Win Condition
    const activePlayers = room.players.filter(p => { var _a; return p.role !== 'banker' && !((_a = game.players[p.id]) === null || _a === void 0 ? void 0 : _a.isBankrupt); });
    if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        game.transactionLog.unshift(`[GAME OVER] ${winner.name} WINS THE GAME!`);
        // We could set a 'winner' state or just leave it logged
    }
};
