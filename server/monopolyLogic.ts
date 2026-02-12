import { Room, GameState, Player } from './types';
import { MONOPOLY_BOARD, PROPERTY_GROUPS, CHANCE_CARDS, COMMUNITY_CHEST_CARDS, type Card } from './monopolyData';

export const initializeMonopolyGame = (room: Room) => {
    room.gameState.monopoly = {
        players: {},
        properties: {},
        turnPhase: 'rolling',
        currentTurnPlayerId: room.players[0].id,
        doublesCount: 0,
        transactionLog: [],
        lastActionTime: Date.now()
    };

    console.log(`Initializing Monopoly for ${room.players.length} players. Refs:`, room.players.map(p => p.id));

    // Only add active players, ignore bankers
    const activePlayers = room.players.filter(p => p.role !== 'banker');

    // Ensure we start with a valid player
    room.gameState.monopoly.currentTurnPlayerId = activePlayers[0]?.id || '';

    activePlayers.forEach(p => {
        if (room.gameState.monopoly) {
            console.log(`Adding player ${p.name} (${p.id}) to Monopoly game.`);
            room.gameState.monopoly.players[p.id] = {
                cash: 1500,
                position: 0,
                properties: [],
                jailTurns: 0,
                getOutOfJailCards: 0,
                colorSets: {},
                isBankrupt: false,
                isAfk: false
            };
        }
    });

    // Initialize all properties
    MONOPOLY_BOARD.forEach(space => {
        if (['property', 'railroad', 'utility'].includes(space.type)) {
            if (room.gameState.monopoly) {
                room.gameState.monopoly.properties[space.id] = {
                    houses: 0,
                    isMortgaged: false
                };
            }
        }
    });
};

export const handleDiceRoll = (room: Room, playerId: string) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;

    if (game.currentTurnPlayerId !== playerId) return;
    if (game.turnPhase !== 'rolling') return;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    // const die1 = 1; const die2 = 2; // Testing non-doubles

    const total = die1 + die2;
    const isDoubles = die1 === die2;
    const playerState = game.players[playerId];

    console.log(`Player ${playerId} rolled ${die1} + ${die2} = ${total} (Doubles: ${isDoubles})`);

    // Save roll for UI
    game.lastRoll = [die1, die2];
    game.currentCard = null; // Clear any previous card shown

    // Handle Jail
    if (playerState.jailTurns > 0) {
        if (isDoubles) {
            playerState.jailTurns = 0; // Free!
            game.doublesCount = 0;
            movePlayer(room, playerId, total);
        } else {
            playerState.jailTurns--;
            if (playerState.jailTurns === 0) {
                game.turnPhase = 'acting'; // Must pay 50 or use card next turn? 
                // MVP: If they fail 3rd time, they just stay in jail space but turn ends.
                // Actually rules: "If you do not throw doubles by your third turn, you must pay the £50 fine. You then get out of jail and immediately move forward the number of spaces shown by your throw."
                // Implementing Rule:
                playerState.cash -= 50;
                movePlayer(room, playerId, total);
            } else {
                game.turnPhase = 'acting'; // Turn ends effectively (waiting for endTurn call)
            }
        }
    } else {
        // Normal Move
        if (isDoubles) {
            game.doublesCount++;
            if (game.doublesCount === 3) {
                goToJail(room, playerId);
                game.doublesCount = 0;
                endTurn(room); // Speeding ends turn immediately
                return;
            }
        } else {
            game.doublesCount = 0;
        }

        movePlayer(room, playerId, total);
    }

    // Auto-end turn if nothing to do? 
    // No, player might want to build houses/trade even if they land on safe space.
    // So always go to 'acting' phase.
    // EXCEPT if they rolled doubles, they need to know they can roll again.
    // We'll handle "Roll Again" state via doubledCount and turnPhase logic in endTurn (or client UI).
    // Let's keep phase as 'acting'. Client "End Turn" button becomes "Roll Again" if doubles?
    // Simply: When "End Turn" is clicked, we check logic.
};

const movePlayer = (room: Room, playerId: string, steps: number) => {
    const game = room.gameState.monopoly!;
    const player = game.players[playerId];

    const oldPos = player.position;
    player.position = (player.position + steps) % 40;

    // Passed GO?
    if (player.position < oldPos) {
        player.cash += 200;
        game.transactionLog.unshift(`[GO] ${room.players.find(p => p.id === playerId)?.name} passed GO and collected £200.`);
        if (game.transactionLog.length > 50) game.transactionLog.pop();
    }

    const space = MONOPOLY_BOARD[player.position];
    game.turnPhase = 'acting';

    // Space Logic
    if (space.type === 'gotojail') {
        goToJail(room, playerId);
        return;
    }

    if (space.type === 'tax') {
        const taxAmount = space.price || 0;
        player.cash -= taxAmount;
        game.transactionLog.unshift(`[TAX] ${room.players.find(p => p.id === playerId)?.name} paid £${taxAmount} in tax.`);
        if (game.transactionLog.length > 50) game.transactionLog.pop();
        checkBankruptcy(room, playerId);
        return;
    }

    if (space.type === 'action') {
        if (space.name.includes('Chance')) {
            handleCardDraw(room, playerId, 'chance');
        } else if (space.name.includes('Community Chest')) {
            handleCardDraw(room, playerId, 'chest');
        }
        return;
    }

    if (['property', 'railroad', 'utility'].includes(space.type)) {
        const prop = game.properties[space.id];

        if (prop.ownerId) {
            if (prop.ownerId !== playerId && !prop.isMortgaged) {
                // Calculate Rent
                const rent = calculateRent(game, space.id, (steps)); // steps needed for Utility

                // Auto-pay for MVP
                // TODO: Handle bankruptcy
                player.cash -= rent;
                const owner = game.players[prop.ownerId];
                if (owner) owner.cash += rent;

                const payerName = room.players.find(p => p.id === playerId)?.name;
                const ownerName = room.players.find(p => p.id === prop.ownerId)?.name;
                game.transactionLog.unshift(`[RENT] ${payerName} paid £${rent} rent to ${ownerName} for ${space.name}.`);
                if (game.transactionLog.length > 50) game.transactionLog.pop();

                console.log(`Paid £${rent} rent to ${prop.ownerId}`);

                checkBankruptcy(room, playerId);
            }
        } else {
            // Unowned - Client will see "Buy" button
        }
    }
};

const calculateRent = (game: GameState['monopoly'], spaceId: number, diceTotal: number): number => {
    const space = MONOPOLY_BOARD[spaceId];
    const prop = game!.properties[spaceId];
    if (!space || !prop || !prop.ownerId) return 0;

    const ownerId = prop.ownerId;

    if (space.type === 'railroad') {
        // Count railroads owned by this owner
        const railroadIds = [5, 15, 25, 35];
        const ownedCount = railroadIds.filter(id => game!.properties[id].ownerId === ownerId).length;
        return 25 * Math.pow(2, ownedCount - 1);
    }

    if (space.type === 'utility') {
        const utilityIds = [12, 28];
        const ownedCount = utilityIds.filter(id => game!.properties[id].ownerId === ownerId).length;
        const multiplier = ownedCount === 2 ? 10 : 4;
        return diceTotal * multiplier;
    }

    if (space.type === 'property') {
        // Basic rent logic
        // TODO: Hotel/House logic
        if (prop.houses === 0) {
            // Check for monopoly (all in group owned) for 2x rent
            const group = space.group;
            if (group && game!.players[ownerId].colorSets[group] === PROPERTY_GROUPS[group].length) {
                return (space.rent?.[0] || 0) * 2;
            }
            return space.rent?.[0] || 0;
        }
        return space.rent?.[prop.houses] || 0;
    }

    return 0;
};

export const purchaseProperty = (room: Room, playerId: string) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const player = game.players[playerId];
    const space = MONOPOLY_BOARD[player.position];

    if (!space.price) return;
    if (game.properties[space.id].ownerId) return; // Already owned
    if (player.cash < space.price) return; // Too poor

    player.cash -= space.price;
    game.properties[space.id].ownerId = playerId;

    if (!player.properties.includes(space.id)) {
        player.properties.push(space.id);
    }

    game.transactionLog.unshift(`[BUY] ${room.players.find(p => p.id === playerId)?.name} bought ${space.name} for £${space.price}.`);
    if (game.transactionLog.length > 50) game.transactionLog.pop();

    // Update Color Sets
    if (space.group) {
        if (!player.colorSets[space.group]) player.colorSets[space.group] = 0;
        player.colorSets[space.group]++;
    }
};

export const endTurn = (room: Room) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;

    // If doubles were rolled and count < 3 and not in jail, player goes again
    // But we need to know if they JUST rolled doubles or if they are ending their "extra" turn.
    // Logic: 
    // If doublesCount > 0, it means they rolled doubles.
    // If they aren't in jail (moved successfully), they get to roll again.
    // SO `endTurn` shouldn't actally advance player if doubles?
    // Client should probably just call 'roll' again?
    // BUT we need a way to signify "Turn Over" vs "Roll Again".

    // Simplification:
    // If doubles > 0, we stay in 'rolling' phase for same player.
    // If not, we advance.

    // Wait, `handleDiceRoll` sets phase to `acting`.
    // Player does stuff (buy).
    // Then clicks "End Turn".
    // WE check here if they get another go.

    if (game.doublesCount > 0) {
        game.turnPhase = 'rolling';
        // Same player keeps turn
    } else {
        // Next player
        game.doublesCount = 0;

        // Only include players who are actually in the game state (excludes bankers, bankrupt, AND AFK)
        const playerIds = room.players
            .filter(p => {
                const pState = game.players[p.id];
                return pState && !pState.isBankrupt && !pState.isAfk && p.role !== 'banker';
            })
            .map(p => p.id);

        if (playerIds.length === 0) return; // Game over?

        const currentIdx = playerIds.indexOf(game.currentTurnPlayerId);
        // Safety check if current player left?
        if (currentIdx === -1) {
            game.currentTurnPlayerId = playerIds[0];
        } else {
            const nextIdx = (currentIdx + 1) % playerIds.length;
            game.currentTurnPlayerId = playerIds[nextIdx];
        }

        game.turnPhase = 'rolling';
        game.lastActionTime = Date.now(); // Reset timer for next player
    }
};

const goToJail = (room: Room, playerId: string) => {
    const game = room.gameState.monopoly!;
    game.players[playerId].position = 10; // Jail
    game.players[playerId].jailTurns = 3;
    game.turnPhase = 'acting';

    game.transactionLog.unshift(`[JAIL] ${room.players.find(p => p.id === playerId)?.name} was sent to Jail!`);
    if (game.transactionLog.length > 50) game.transactionLog.pop();
};

export const mortgageProperty = (room: Room, playerId: string, propertyId: number) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const prop = game.properties[propertyId];
    const player = game.players[playerId];
    const space = MONOPOLY_BOARD[propertyId];

    if (prop.ownerId !== playerId) return;
    if (prop.houses > 0) return; // Must sell houses first
    if (prop.isMortgaged) return;

    if (space.mortgageValue) {
        prop.isMortgaged = true;
        player.cash += space.mortgageValue;
    }
};

export const unmortgageProperty = (room: Room, playerId: string, propertyId: number) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const prop = game.properties[propertyId];
    const player = game.players[playerId];
    const space = MONOPOLY_BOARD[propertyId];

    if (prop.ownerId !== playerId) return;
    if (!prop.isMortgaged) return;

    // Return unmortgaged value? Rule usually says you pay 10% interest.
    // Simplifying: Pay back mortgage value + 10%
    const cost = Math.floor((space.mortgageValue || 0) * 1.1);
    if (player.cash < cost) return;

    player.cash -= cost;
    prop.isMortgaged = false;
};

const checkBankruptcy = (room: Room, playerId: string) => {
    if (!room.gameState.monopoly) return;
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
        const prop = MONOPOLY_BOARD[propId];
        const mortgageValue = prop.mortgageValue || 0;

        game.properties[propId].isMortgaged = true;
        player.cash += mortgageValue;

        game.transactionLog.unshift(`[FORCED SALE] ${room.players.find(p => p.id === playerId)?.name} mortgaged ${prop.name} for £${mortgageValue} to cover debt.`);
    }
};

const eliminatePlayer = (room: Room, playerId: string) => {
    const game = room.gameState.monopoly!;
    const playerStore = game.players[playerId];

    game.transactionLog.unshift(`[BANKRUPT] ${room.players.find(p => p.id === playerId)?.name} is out of the game!`);

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
    const activePlayers = room.players.filter(p => p.role !== 'banker' && !game.players[p.id]?.isBankrupt);

    if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        game.transactionLog.unshift(`[GAME OVER] ${winner.name} WINS THE GAME!`);
        // We could set a 'winner' state or just leave it logged
    }
};

export const declareBankruptcy = (room: Room, playerId: string) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const player = game.players[playerId];

    // MVP: surrender everything to bank (or creditor if implemented)
    // 1. Reset Property Ownership
    player.properties.forEach(propId => {
        game.properties[propId].ownerId = undefined;
        game.properties[propId].houses = 0;
        game.properties[propId].isMortgaged = false; // Reset state
    });

    // 2. Mark Bankrupt
    player.isBankrupt = true;
    player.cash = 0;
    player.properties = [];
    player.colorSets = {};

    // 3. End Turn immediately
    if (game.currentTurnPlayerId === playerId) {
        endTurn(room);
    }
};

// House Buying Logic
export const buyHouse = (room: Room, playerId: string, propertyId: number) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const prop = game.properties[propertyId];
    const player = game.players[playerId];
    const space = MONOPOLY_BOARD[propertyId];

    if (prop.ownerId !== playerId) return;
    if (prop.houses >= 5) return; // Max 5 (Hotel)
    if (!space.houseCost) return;
    if (player.cash < space.houseCost) return;

    // Check Logic: Must own all in group
    const group = space.group;
    if (!group) return;

    // Check even building? (MVP: Ignore even building rule for simplicity?)
    // Let's ignore even building for MVP.

    if (player.colorSets[group] === PROPERTY_GROUPS[group].length) {
        // Owns all
        player.cash -= space.houseCost;
        prop.houses++;
    }
};

export const sellHouse = (room: Room, playerId: string, propertyId: number) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const prop = game.properties[propertyId];
    const player = game.players[playerId];
    const space = MONOPOLY_BOARD[propertyId];

    if (!prop || !player || !space) return;
    if (prop.ownerId !== playerId) return;
    if (prop.houses <= 0) return;
    if (!space.houseCost) return;

    prop.houses--;
    player.cash += Math.floor(space.houseCost / 2);
    game.transactionLog.push(`${room.players.find(p => p.id === playerId)?.name} sold a house on ${space.name} for $${Math.floor(space.houseCost / 2)}M`);
};

// Trading Logic
export const createTradeOffer = (
    room: Room,
    proposerId: string,
    receiverId: string,
    offer: { cash: number, properties: number[] },
    request: { cash: number, properties: number[] }
) => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;

    // Validate Proposer has assets
    const proposer = game.players[proposerId];
    if (proposer.cash < offer.cash) return;
    if (!offer.properties.every(id => proposer.properties.includes(id))) return;

    // Validate Receiver has assets
    const receiver = game.players[receiverId];
    if (receiver.cash < request.cash) return; // Can't request more than they have? Or maybe just allow it and let them reject?
    // Better to validte ownership though.
    if (!request.properties.every(id => receiver.properties.includes(id))) return;

    game.trade = {
        proposerId,
        receiverId,
        offer,
        request
    };
};

export const acceptTrade = (room: Room, playerId: string) => {
    if (!room.gameState.monopoly || !room.gameState.monopoly.trade) return;
    const game = room.gameState.monopoly;
    const trade = game.trade!;

    if (trade.receiverId !== playerId) return;

    const proposer = game.players[trade.proposerId];
    const receiver = game.players[trade.receiverId];

    // Double check funds/assets again just in case state changed
    if (proposer.cash < trade.offer.cash || receiver.cash < trade.request.cash) {
        // Failed
        game.trade = undefined;
        return;
    }

    // Execute Trade
    // 1. Cash
    proposer.cash -= trade.offer.cash;
    proposer.cash += trade.request.cash;
    receiver.cash -= trade.request.cash;
    receiver.cash += trade.offer.cash;

    // 2. Properties
    trade.offer.properties.forEach(pid => {
        // Remove from proposer
        proposer.properties = proposer.properties.filter(id => id !== pid);
        // Add to receiver
        if (!receiver.properties.includes(pid)) receiver.properties.push(pid);

        // Update Property Owner
        game.properties[pid].ownerId = trade.receiverId;

        // Update logic for color sets?
        updateColorSets(room, trade.proposerId);
        updateColorSets(room, trade.receiverId);
    });

    trade.request.properties.forEach(pid => {
        // Remove from receiver
        receiver.properties = receiver.properties.filter(id => id !== pid);
        // Add to proposer
        if (!proposer.properties.includes(pid)) proposer.properties.push(pid);

        // Update Property Owner
        game.properties[pid].ownerId = trade.proposerId;

        updateColorSets(room, trade.proposerId);
        updateColorSets(room, trade.receiverId);
    });

    // Clear Trade
    game.trade = undefined;
};

export const rejectTrade = (room: Room, playerId: string) => {
    if (!room.gameState.monopoly || !room.gameState.monopoly.trade) return;
    if (room.gameState.monopoly.trade.receiverId === playerId || room.gameState.monopoly.trade.proposerId === playerId) {
        room.gameState.monopoly.trade = undefined;
    }
};

const updateColorSets = (room: Room, playerId: string) => {
    // Recalculate color sets for a player efficiently
    // Actually our current logic just increments.
    // Full recalc is safer.
    const game = room.gameState.monopoly!;
    const player = game.players[playerId];

    player.colorSets = {};

    player.properties.forEach(pid => {
        const space = MONOPOLY_BOARD[pid];
        if (space.group) {
            if (!player.colorSets[space.group]) player.colorSets[space.group] = 0;
            player.colorSets[space.group]++;
        }
    });
};

export const checkTurnTimeout = (room: Room) => {
    if (!room.gameState.monopoly) return 'none';
    const game = room.gameState.monopoly;

    // Check if game is over (only 1 player left)
    const activePlayers = room.players.filter(p => !game.players[p.id]?.isBankrupt && p.role !== 'banker');
    if (activePlayers.length < 2) return 'none';

    // Last Action Time Check
    if (!game.lastActionTime) {
        game.lastActionTime = Date.now();
        return 'none';
    }

    const now = Date.now();
    const diff = (now - game.lastActionTime) / 1000;

    const currentPlayerId = game.currentTurnPlayerId;
    const currentPlayerName = room.players.find(p => p.id === currentPlayerId)?.name || 'Unknown';

    // 60s Warn
    if (diff > 60 && diff < 61) {
        // Simple check to avoid spamming
        const lastLog = game.transactionLog[0];
        if (!lastLog?.includes('TIME WARNING')) {
            game.transactionLog.unshift(`[⚠️ TIME WARNING] ${currentPlayerName} has 10 seconds to move!`);
            return 'warn';
        }
    }

    // 70s Kick (Now AFK Mode)
    if (diff > 70) {
        // Mark as AFK instead of removing
        const pState = game.players[currentPlayerId];
        if (pState && !pState.isAfk) {
            game.transactionLog.unshift(`[😴 AFK] ${currentPlayerName} didn't move and is now Away.`);
            pState.isAfk = true;
            endTurn(room);
        }
        return 'kick';
    }

    return 'none';
};

const handleCardDraw = (room: Room, playerId: string, type: 'chance' | 'chest') => {
    if (!room.gameState.monopoly) return;
    const game = room.gameState.monopoly;
    const player = game.players[playerId];

    // Pick Random Card
    const deck = type === 'chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
    const card = deck[Math.floor(Math.random() * deck.length)];

    // Set Current Card for UI
    game.currentCard = {
        text: card.text,
        type: type,
        ownerId: playerId
    };

    game.transactionLog.unshift(`[${type.toUpperCase()}] ${room.players.find(p => p.id === playerId)?.name} drew: "${card.text}"`);

    // Execute Action
    switch (card.action) {
        case 'move':
            if (card.value !== undefined) {
                if (card.value === -3) {
                    // Back 3 spaces
                    // Simple move back, no pass go check usually for back
                    let newPos = player.position - 3;
                    if (newPos < 0) newPos += 40;
                    player.position = newPos;
                    // Handle where they land? Recursive?
                    // Typically "Go back 3" from Chance (at 7, 22, 36).
                    // 7 -> 4 (Income Tax). 22 -> 19 (Vine St). 36 -> 33 (Community Chest).
                    // For simplicity, just update position.
                } else {
                    // Advance to specific space
                    // Advance to specific space
                    // Wait, movePlayer logic adds steps. We need a "teleport" or just calculate steps.
                    // Let's modify movePlayer to accept absolute position?
                    // Current movePlayer signature: (room, playerId, steps)
                    // We can calculate steps forward.
                    let steps = card.value - player.position;
                    if (steps < 0) steps += 40; // Wrap around to Move Forward
                    movePlayer(room, playerId, steps);
                }
            }
            break;
        case 'money':
            if (card.value) {
                if (card.text.includes('every player')) {
                    // Birthday / Chairman
                    const amount = Math.abs(card.value);
                    const isCollect = card.value > 0;

                    room.players.forEach(p => {
                        if (p.id !== playerId && !game.players[p.id]?.isBankrupt && p.role !== 'banker') {
                            if (isCollect) {
                                // Collect from others
                                game.players[p.id].cash -= amount;
                                player.cash += amount;
                            } else {
                                // Pay others
                                player.cash -= amount;
                                game.players[p.id].cash += amount;
                            }
                        }
                    });
                } else {
                    player.cash += card.value;
                }
                checkBankruptcy(room, playerId);
            }
            break;
        case 'jail':
            goToJail(room, playerId);
            break;
    }
};
