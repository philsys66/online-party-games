import type { Socket } from 'socket.io-client';

export interface Player {
    id: string; // Socket ID (ephemeral)
    userId?: string; // Persistent UUID
    name: string;
    avatar: string;
    score: number;
    color?: string; // Assigned game color
    role: 'player' | 'banker';
    isConnected?: boolean;
}

export type GameType = 'scattergories' | 'crossword' | 'charades' | 'monopoly' | 'oligarchy';

export interface Cell {
    row: number;
    col: number;
    value: string;
    isBlack: boolean;
    number?: number;
    clueId?: string; // e.g. "1-across"
    locked?: boolean;
    ownerId?: string; // Player who solved it
}

export interface GameState {
    status: 'waiting' | 'playing' | 'voting' | 'results';
    timer: number;
    letter: string | null;
    round: number;
    currentVotingCategory?: number;
    // Crossword specific
    grid?: Cell[][];
    clues?: { across: Record<string, string>, down: Record<string, string> };
    cursors?: Record<string, { row: number, col: number }>; // playerId -> position
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
        teams: { [key: string]: string[] };
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
        pot?: number, // Free parking cash (house rule option?)
        transactionLog: string[], // Log of financial events for Banker
        lastActionTime?: number,
        currentCard?: { text: string, type: 'chance' | 'chest', ownerId: string } | null
    };
    // Oligarchy
    oligarchy?: {
        players: Record<string, {
            cash: number;
            position: number;
            companies: number[];
            isBankrupt: boolean;
            isAfk?: boolean;
        }>;
        companies: Record<number, {
            ownerId?: string;
            currentValue: number;
        }>;
        turnPhase: 'rolling' | 'acting' | 'auction';
        currentTurnPlayerId: string;
        roundCount: number;
        activeNewsflash?: { title: string, description: string, type: string, sectors: string[], expiresAt?: number } | null;
        auction?: {
            companyId: number;
            currentBid: number;
            highestBidderId?: string;
            sellerId: string;
            timeLeft: number;
            participants: string[];
        } | null;
        activeAlert?: {
            type: 'rent';
            message: string;
            playerId: string;
        } | null;
        lastRoll?: number[];
        transactionLog: string[];
        lastActionTime?: number;
    };
}

export interface Room {
    id: string;
    gameType: GameType;
    players: Player[];
    gameState: GameState;
    gameConfig: GameConfig;
    answers: Record<string, Record<number, string>>;
    rejections: Record<string, Record<number, string[]>>; // targetID -> cat -> [voters]
    votes: Record<string, Record<number, number>>;
}

export interface GameConfig {
    timerDuration: number;
    maxRounds: number;
    charadesCategory?: string;
}

export interface GameContextType {
    socket: Socket | null;
    room: Room | null;
    player: Player | null; // Current player info (local)
    setPlayerName: (name: string) => void;
    setPlayerAvatar: (avatar: string) => void;
    createRoom: (gameType: GameType, name: string, avatar: string) => void;
    joinRoom: (roomCode: string, name: string, avatar: string, role?: 'player' | 'banker') => void;
    leaveRoom: () => void;
    startGame: () => void;
    startNextRound: () => void;
    updateSettings: (settings: Partial<GameConfig>) => void;
    submitVote: (targetPlayerId: string, categoryIndex: number) => void;
    nextCategory: () => void;
    isConnected: boolean;
    error: string | null;
    setError: (err: string | null) => void;
}
