import { Room, GameState, Player } from './types';
import { OLIGARCHY_BOARD, SECTORS, NEWSFLASH_EVENTS, type OligarchyCompany } from './oligarchyData';

export const initializeOligarchyGame = (room: Room) => {
    room.gameState.oligarchy = {
        players: {},
        companies: {},
        turnPhase: 'rolling',
        currentTurnPlayerId: '', // Set below
        roundCount: 1,
        activeNewsflash: null,
        transactionLog: [],
        lastActionTime: Date.now()
    };

    console.log(`Initializing Oligarchy for ${room.players.length} players.`);

    // Only add active players
    const activePlayers = room.players.filter(p => p.role !== 'banker');
    room.gameState.oligarchy.currentTurnPlayerId = activePlayers[0]?.id || '';

    activePlayers.forEach(p => {
        if (room.gameState.oligarchy) {
            room.gameState.oligarchy.players[p.id] = {
                cash: 1500,
                position: 0,
                companies: [],
                isBankrupt: false,
                isAfk: false
            };
        }
    });

    // Initialize companies
    OLIGARCHY_BOARD.forEach(company => {
        if (room.gameState.oligarchy) {
            room.gameState.oligarchy.companies[company.id] = {
                ownerId: undefined
            };
        }
    });
};

export const handleOligarchyRoll = (room: Room, playerId: string) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;

    if (game.currentTurnPlayerId !== playerId) return;
    if (game.turnPhase !== 'rolling') return;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;

    const playerState = game.players[playerId];
    if (!playerState) return;

    // Movement
    const oldPos = playerState.position;
    playerState.position = (playerState.position + total) % 36;
    game.lastRoll = [die1, die2];

    // Pass Start Bonus? (Not explicitly in rules, but standard "Loop" usually implies it)
    // "Players start with $1,500. Roll 2 dice to move through the board."
    // Assuming standard Monopoly-style GO bonus for now ($200 like typical?). Let's say $200.
    if (playerState.position < oldPos) {
        playerState.cash += 200;
        game.transactionLog.unshift(`[CYCLE] ${room.players.find(p => p.id === playerId)?.name} completed a global cycle. Income +$200.`);
        if (game.transactionLog.length > 50) game.transactionLog.pop();
    }

    game.turnPhase = 'acting';

    // Handle Tile Actions
    handleTileArrival(room, playerId);
};

const handleTileArrival = (room: Room, playerId: string) => {
    const game = room.gameState.oligarchy!;
    const player = game.players[playerId];
    const company = OLIGARCHY_BOARD[player.position];
    const companyState = game.companies[company.id];

    if (!companyState) return; // Should not happen

    if (companyState.ownerId && companyState.ownerId !== playerId) {
        // OWNED: Pay Subscription Fee
        const owner = game.players[companyState.ownerId];
        if (!owner || owner.isBankrupt) return;

        let rent = calculateSubscriptionFee(room, company.id);

        // Check Newsflash Effects
        if (game.activeNewsflash) {
            if (game.activeNewsflash.type === 'crash' && game.activeNewsflash.sectors.includes(company.sector)) {
                // "Subscription fees cannot be collected" or reduced
                if (game.activeNewsflash.description.includes('cannot be collected')) {
                    rent = 0;
                    game.transactionLog.unshift(`[NEWS] Fees suspended for ${company.name} due to ${game.activeNewsflash.title}!`);
                }
            }
            if (game.activeNewsflash.type === 'crisis' && game.activeNewsflash.sectors.includes(company.sector)) {
                if (company.sector === 'energy') {
                    rent = Math.floor(rent * 1.5); // +50%
                }
                if (company.sector === 'retail') {
                    rent = Math.floor(rent * 0.9); // -10%
                }
            }
        }

        if (rent > 0) {
            player.cash -= rent;
            owner.cash += rent;

            const payerName = room.players.find(p => p.id === playerId)?.name;
            const ownerName = room.players.find(p => p.id === companyState.ownerId)?.name;
            game.transactionLog.unshift(`[SUB] ${payerName} paid $${rent} fee to ${ownerName} for ${company.name}.`);
        }
    } else if (!companyState.ownerId) {
        // UNOWNED: Can buy
        // Handled by UI showing Buy button
    }
};

export const calculateSubscriptionFee = (room: Room, companyId: number): number => {
    const game = room.gameState.oligarchy!;
    const company = OLIGARCHY_BOARD[companyId];
    const companyState = game.companies[companyId];

    if (!companyState.ownerId) return 0;

    const ownerId = companyState.ownerId;
    const owner = game.players[ownerId];

    // Count companies owned in this sector
    const sectorCompanies = OLIGARCHY_BOARD.filter(c => c.sector === company.sector);
    const ownedInSector = sectorCompanies.filter(c => game.companies[c.id].ownerId === ownerId).length;

    // Rules:
    // 1 Stock: 10%
    // 3 Stocks: 30%
    // 6 Stocks: 100%
    // What about 2, 4, 5?
    // "The more companies... the more locked-in"
    // Interpolating: 1=10%, 2=10%?, 3=30%, 4=30%?, 5=30%?, 6=100%
    // Or linear?
    // Let's implement steps as defined (thresholds).

    let percentage = 0.10;
    if (ownedInSector >= 6) percentage = 1.0;
    else if (ownedInSector >= 3) percentage = 0.30;

    return Math.floor(company.value * percentage);
};

export const purchaseOligarchyCompany = (room: Room, playerId: string) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;
    const player = game.players[playerId];
    const company = OLIGARCHY_BOARD[player.position];
    const companyState = game.companies[company.id];

    if (companyState.ownerId) return; // Already owned
    if (player.cash < company.value) return;

    player.cash -= company.value;
    companyState.ownerId = playerId;

    if (!player.companies.includes(company.id)) {
        player.companies.push(company.id);
    }

    game.transactionLog.unshift(`[BUY] ${room.players.find(p => p.id === playerId)?.name} acquired ${company.name} for $${company.value}.`);

    checkOligarchVictory(room, playerId);
};

export const endOligarchyTurn = (room: Room) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;

    const activePlayers = room.players
        .filter(p => !game.players[p.id]?.isBankrupt && p.role !== 'banker')
        .map(p => p.id);

    if (activePlayers.length < 1) return;

    const currentIdx = activePlayers.indexOf(game.currentTurnPlayerId);

    // Check if round finished (last player just acted)
    if (currentIdx === activePlayers.length - 1) {
        // End of Round -> TRIGGER NEWSFLASH
        triggerNewsflash(room);
        game.roundCount++;
    }

    const nextIdx = (currentIdx + 1) % activePlayers.length;
    game.currentTurnPlayerId = activePlayers[nextIdx];
    game.turnPhase = 'rolling';
    game.lastActionTime = Date.now();
};

const triggerNewsflash = (room: Room) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;

    // Pick random newsflash
    const event = NEWSFLASH_EVENTS[Math.floor(Math.random() * NEWSFLASH_EVENTS.length)];

    game.activeNewsflash = {
        title: event.title,
        description: event.description,
        type: event.type,
        sectors: event.sectors as string[]
    };

    game.transactionLog.unshift(`[NEWSFLASH] ${event.title.toUpperCase()}: ${event.description}`);
};

const checkOligarchVictory = (room: Room, playerId: string) => {
    const game = room.gameState.oligarchy!;
    const player = game.players[playerId];

    // Check for "Controlling Interest": Own 3 complete sectors
    // Sectors are: retail, energy, healthcare, financial, communications, technology
    const sectors = Object.keys(SECTORS) as Array<keyof typeof SECTORS>;
    let completedSectors = 0;

    sectors.forEach(sector => {
        const sectorCompanies = OLIGARCHY_BOARD.filter(c => c.sector === sector);
        const owned = sectorCompanies.every(c => player.companies.includes(c.id));
        if (owned) completedSectors++;
    });

    if (completedSectors >= 3) {
        game.transactionLog.unshift(`[VICTORY] ${room.players.find(p => p.id === playerId)?.name} has achieved global dominance (3 Sectors owned)!`);
        // Provide visual win state?
    }
};
