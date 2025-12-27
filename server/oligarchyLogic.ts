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

    console.log(`[OligarchyLogic] Initializing for ${room.players.length} players.`);

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
                ownerId: undefined,
                currentValue: company.value // Initialize with base value
            };
        }
    });
};

export const handleOligarchyRoll = (room: Room, playerId: string) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;

    if (game.currentTurnPlayerId !== playerId) return;
    if (game.turnPhase !== 'rolling') return;

    // Clear previous newsflash when a new turn action starts
    if (game.activeNewsflash) {
        game.activeNewsflash = null;
    }

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

    return Math.floor(companyState.currentValue * percentage);
};

export const purchaseOligarchyCompany = (room: Room, playerId: string) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;
    const player = game.players[playerId];
    const company = OLIGARCHY_BOARD[player.position];
    const companyState = game.companies[company.id];

    if (companyState.ownerId) return; // Already owned
    if (player.cash < companyState.currentValue) return;

    player.cash -= companyState.currentValue;
    companyState.ownerId = playerId;

    if (!player.companies.includes(company.id)) {
        player.companies.push(company.id);
    }

    game.transactionLog.unshift(`[BUY] ${room.players.find(p => p.id === playerId)?.name} acquired ${company.name} for $${companyState.currentValue}M.`);

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

    // APPLY ECONOMIC EFFECTS
    const affectedSectors = event.sectors;
    const allCompanies = OLIGARCHY_BOARD;

    allCompanies.forEach(c => {
        if (affectedSectors.includes(c.sector)) {
            const companyState = game.companies[c.id];

            // 1. Update Market Value
            if (event.valueChange) {
                // Keep value reasonably bounded? e.g. min $10M
                const newValue = Math.floor(companyState.currentValue * event.valueChange);
                companyState.currentValue = Math.max(10, newValue);
            }

            // 2. Direct Cash Effect (Dividend / Cost) to Owner
            if (companyState.ownerId && event.cashEffect) {
                const owner = game.players[companyState.ownerId];
                if (owner && !owner.isBankrupt) {
                    owner.cash += event.cashEffect;
                    // Log if significant?
                }
            }
        }
    });
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

export const startOligarchyAuction = (room: Room, companyId: number, sellerId: string) => {
    if (!room.gameState.oligarchy) return;
    const game = room.gameState.oligarchy;

    const company = OLIGARCHY_BOARD.find(c => c.id === companyId);
    if (!company) return;

    game.turnPhase = 'auction';
    game.auction = {
        companyId: companyId,
        sellerId: sellerId,
        currentBid: Math.floor(company.value * 0.8), // Start at 80%? Or $1? Let's say $1 to encourage action. Actually $1M.
        highestBidderId: undefined, // No bids yet
        timeLeft: 30, // 30 seconds
        participants: room.players.map(p => p.id).filter(id => id !== sellerId) // Everyone else
    };

    game.transactionLog.unshift(`[AUCTION] ${room.players.find(p => p.id === sellerId)?.name} is selling ${company.name}! Bidding starts at $${game.auction.currentBid}M.`);
};

export const handleOligarchyBid = (room: Room, playerId: string, bidAmount: number) => {
    if (!room.gameState.oligarchy || !room.gameState.oligarchy.auction) return;
    const auction = room.gameState.oligarchy.auction;

    if (bidAmount <= auction.currentBid) return;
    if (room.gameState.oligarchy.players[playerId].cash < bidAmount) return;

    auction.currentBid = bidAmount;
    auction.highestBidderId = playerId;
    auction.timeLeft = Math.max(auction.timeLeft, 10); // Extend time if low

    const bidderName = room.players.find(p => p.id === playerId)?.name;
    // game.transactionLog.unshift(`[BID] ${bidderName} bids $${bidAmount}M.`); // Maybe too spammy?
};

export const endOligarchyAuction = (room: Room) => {
    if (!room.gameState.oligarchy || !room.gameState.oligarchy.auction) return;
    const game = room.gameState.oligarchy;
    const auction = game.auction!;

    // Process Transfer
    if (auction.highestBidderId) {
        const winner = game.players[auction.highestBidderId];
        const seller = game.players[auction.sellerId];
        const companyState = game.companies[auction.companyId];

        winner.cash -= auction.currentBid;
        seller.cash += auction.currentBid;
        companyState.ownerId = auction.highestBidderId;

        // Update lists
        seller.companies = seller.companies.filter(id => id !== auction.companyId);
        if (!winner.companies.includes(auction.companyId)) winner.companies.push(auction.companyId);

        // Update Market Value to match Sold Price?
        companyState.currentValue = auction.currentBid; // Market realizes new value

        const companyName = OLIGARCHY_BOARD.find(c => c.id === auction.companyId)?.name;
        const winnerName = room.players.find(p => p.id === auction.highestBidderId)?.name;
        game.transactionLog.unshift(`[SOLD] ${companyName} sold to ${winnerName} for $${auction.currentBid}M.`);
    } else {
        game.transactionLog.unshift(`[AUCTION] No bids for ${OLIGARCHY_BOARD.find(c => c.id === auction.companyId)?.name}. Retained by owner.`);
    }

    game.auction = null;
    game.turnPhase = 'acting'; // Return to seller's turn (or 'rolling'? Usually selling is an action during turn)
    // Actually if they sold during their turn, they can still act.
};

export const checkOligarchyAuctionTick = (room: Room) => {
    if (!room.gameState.oligarchy || !room.gameState.oligarchy.auction) return;
    const auction = room.gameState.oligarchy.auction;

    auction.timeLeft -= 1;
    if (auction.timeLeft <= 0) {
        endOligarchyAuction(room);
    }
};
