export type GameType = 'scattergories' | 'crossword' | 'charades' | 'monopoly' | 'oligarchy';

export interface Room {
    id: string;
    gameType: GameType;
    players: Player[];
    gameState: GameState;
    gameConfig: GameConfig;
    answers: Record<string, Record<number, string>>;
    rejections: Record<string, Record<number, string[]>>;
    votes: Record<string, Record<number, number>>;
}

export interface Player {
    id: string; // Socket ID
    userId?: string; // Persistent UUID
    name: string;
    avatar?: string;
    score: number;
    role?: 'player' | 'banker';
}

export interface GameConfig {
    timerDuration: number;
    maxRounds: number;
    charadesCategory?: string;
}

export interface GameState {
    status: 'waiting' | 'playing' | 'voting' | 'results';
    timer: number;
    letter: string | null;
    round: number;
    currentVotingCategory: number;
    // Crossword
    grid?: { value: string, isBlack: boolean, number?: number, locked?: boolean, ownerId?: string }[][];
    clues?: { across: Record<string, string>, down: Record<string, string> };
    cursors?: Record<string, { row: number, col: number }>;
    // Scattergories
    categories?: string[];
    solution?: string[][];
    // Charades
    actorId?: string;
    currentScene?: string;
    isPaused?: boolean;
    guessingPlayerId?: string;
    penalties?: Record<string, number>;
    actingTimes?: Record<string, number>;
    roundStartTime?: number;
    charades?: {
        activePlayerId: string;
        word: string;
        category: string;
        teams: { [key: string]: string[] }; // 'A' | 'B'
    };
    // Monopoly
    monopoly?: {
        players: Record<string, {
            cash: number,
            position: number,
            properties: number[], // indices of owned properties
            jailTurns: number,
            getOutOfJailCards: number,
            colorSets: Record<string, number>, // group -> count owned
            isBankrupt: boolean,
            isAfk?: boolean
        }>,
        properties: Record<number, {
            ownerId?: string,
            houses: number, // 5 = hotel
            isMortgaged: boolean
        }>,
        turnPhase: 'rolling' | 'acting' | 'auction' | 'trading',
        currentTurnPlayerId: string,
        doublesCount: number,
        lastRoll?: number[],
        auction?: {
            propertyId: number,
            currentBid: number,
            highestBidder?: string,
            timeLeft: number,
            participants: string[] // IDs of players still in auction
        },
        trade?: {
            proposerId: string,
            receiverId: string,
            offer: { cash: number, properties: number[] },
            request: { cash: number, properties: number[] }
        },
        pot?: number,
        transactionLog: string[],
        lastActionTime?: number,
        currentCard?: { text: string, type: 'chance' | 'chest', ownerId: string } | null
    };
    // Oligarchy
    oligarchy?: {
        players: Record<string, {
            cash: number,         // Start $1500
            position: number,     // 0-35
            companies: number[],  // IDs of owned companies
            isBankrupt: boolean,
            isAfk?: boolean
        }>;
        companies: Record<number, {
            ownerId?: string;
            currentValue: number; // Dynamic Market Value
        }>;
        turnPhase: 'rolling' | 'acting';
        currentTurnPlayerId: string;
        roundCount: number;       // For Newsflash trigger
        activeNewsflash?: {
            title: string;
            description: string;
            type: string;
            sectors: string[]; // Affected sectors
        } | null;
        lastRoll?: number[];
        transactionLog: string[];
        lastActionTime?: number;
    };
}
