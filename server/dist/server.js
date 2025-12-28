"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const britishCategories_1 = require("./britishCategories");
const crosswordData_1 = __importDefault(require("./crosswordData"));
const charadesData_1 = require("./charadesData");
const monopolyLogic_1 = require("./monopolyLogic");
const oligarchyLogic_1 = require("./oligarchyLogic");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // In production, restrict this to client URL
        methods: ["GET", "POST"]
    }
});
const rooms = {};
const ROOM_CODES = [
    "PARIS", "TOKYO", "MARS", "VENUS", "ZEUS", "HERA", "APOLLO", "ROME", "LIMA", "OSLO",
    "CAIRO", "DELHI", "SEOUL", "DUBAI", "YORK", "LYON", "NICE", "BONN", "BERN", "KIEV",
    "RIGA", "BAKU", "DOHA", "MALE", "LOME", "SUVA", "AGRA", "PUNE", "GOA", "MAUI"
];
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('create_room', (data) => {
        console.log(`[DEBUG] create_room request. GameType: ${data.gameType}`);
        // Generate a unique room code
        let roomCode = "";
        let attempts = 0;
        do {
            roomCode = ROOM_CODES[Math.floor(Math.random() * ROOM_CODES.length)];
            attempts++;
        } while (rooms[roomCode] && attempts < 100);
        // Fallback if we run out of unique codes (highly unlikely for small scale)
        if (rooms[roomCode]) {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        let gameState;
        if (data.gameType === 'crossword') {
            // Choose random puzzle
            const puzzleIndex = Math.floor(Math.random() * crosswordData_1.default.length);
            const puzzle = crosswordData_1.default[puzzleIndex];
            // Build grid from rows
            const grid = puzzle.rows.map((rowStr, r) => rowStr.split('').map((char, c) => {
                return {
                    value: '',
                    isBlack: char === ' ',
                    number: undefined,
                    locked: false,
                    ownerId: undefined
                };
            }));
            // Auto-numbering logic
            let n = 1;
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[0].length; c++) {
                    if (grid[r][c].isBlack)
                        continue;
                    const isAcrossStart = (c === 0 || grid[r][c - 1].isBlack) && (c + 1 < grid[0].length && !grid[r][c + 1].isBlack && grid[r][c + 1].isBlack === false);
                    const isDownStart = (r === 0 || grid[r - 1][c].isBlack) && (r + 1 < grid.length && !grid[r + 1][c].isBlack && grid[r + 1][c].isBlack === false);
                    if (isAcrossStart || isDownStart) {
                        grid[r][c].number = n++;
                    }
                }
            }
            const solution = puzzle.rows.map(r => r.split(''));
            gameState = {
                status: 'waiting',
                round: 0,
                letter: '',
                timer: 0,
                currentVotingCategory: 0,
                grid: grid,
                clues: puzzle.clues,
                cursors: {},
                solution: solution
            };
        }
        else {
            // Scattergories
            // Select 12 unique categories
            const shuffled = [...britishCategories_1.BRITISH_CATEGORIES].sort(() => 0.5 - Math.random());
            const selectedCategories = shuffled.slice(0, 12);
            gameState = {
                status: 'waiting',
                round: 0,
                letter: '',
                timer: 0,
                currentVotingCategory: 0,
                categories: selectedCategories
            };
        }
        rooms[roomCode] = {
            id: roomCode,
            gameType: data.gameType || 'scattergories',
            players: [{
                    id: socket.id,
                    userId: data.userId, // Host Persistent ID
                    name: data.playerName,
                    avatar: data.avatar,
                    score: 0
                }],
            gameState: gameState,
            gameConfig: {
                timerDuration: 180,
                maxRounds: data.gameType === 'charades' ? 1 : 3,
                charadesCategory: 'Friends'
            },
            answers: {},
            rejections: {},
            votes: {}
        };
        if (data.gameType === 'monopoly') {
            (0, monopolyLogic_1.initializeMonopolyGame)(rooms[roomCode]);
        }
        else if (data.gameType === 'oligarchy') {
            (0, oligarchyLogic_1.initializeOligarchyGame)(rooms[roomCode]);
        }
        socket.join(roomCode);
        socket.emit('room_joined', rooms[roomCode]);
        console.log(`Room ${roomCode} created by ${data.playerName}`);
    });
    socket.on('join_room', (data) => {
        console.log(`Join attempt: ${data.playerName} trying to join ${data.roomCode} as ${data.role || 'player'} (UserId: ${data.userId})`);
        const room = rooms[data.roomCode];
        if (room) {
            // Check if player ALREADY exists (Rejoin Logic)
            const existingPlayer = data.userId ? room.players.find(p => p.userId === data.userId) : null;
            if (existingPlayer) {
                console.log(`Rejoin: Updating socket ID for ${existingPlayer.name} from ${existingPlayer.id} to ${socket.id}`);
                // If the old socket is still connected? Force disconnect? Or just overwrite.
                // socket.leave is handled by disconnect logic usually.
                existingPlayer.id = socket.id; // Update to NEW socket ID
                existingPlayer.role = data.role || existingPlayer.role; // Update role if requested? Or keep old? Keep old usually safer for rejoin.
                // Actually, let's keep old role to prevent "Banker" stealing?
                // But if they refresh, they send the same role hopefully.
                socket.join(data.roomCode);
                if (room.gameType === 'monopoly' && room.gameState.monopoly && room.gameState.monopoly.players[existingPlayer.id]) {
                    room.gameState.monopoly.players[existingPlayer.id].isAfk = false;
                }
                // Fix: Reset score if game is in "waiting" state (Lobby)
                // This prevents points carrying over if players rejoin the same room for a new game.
                if (room.gameState.status === 'waiting') {
                    existingPlayer.score = 0;
                }
                io.to(data.roomCode).emit('room_update', room);
                console.log(`${existingPlayer.name} rejoined room ${data.roomCode}`);
            }
            else {
                // New Join Logic
                // Check if trying to join as banker but one exists
                let requestedRole = data.role || 'player';
                if (requestedRole === 'banker') {
                    const hasBanker = room.players.some(p => p.role === 'banker');
                    if (hasBanker) {
                        console.log(`Room ${data.roomCode} already has a banker. Demoting ${data.playerName} to player.`);
                        requestedRole = 'player';
                    }
                }
                room.players.push({
                    id: socket.id,
                    userId: data.userId, // Store persistent ID
                    name: data.playerName,
                    avatar: data.avatar,
                    score: 0,
                    role: requestedRole
                });
                socket.join(data.roomCode);
                io.to(data.roomCode).emit('room_update', room);
                console.log(`${data.playerName} joined room ${data.roomCode} as ${requestedRole}`);
            }
        }
        else {
            console.log(`Join failed: Room ${data.roomCode} not found. Available rooms: ${Object.keys(rooms).join(', ')}`);
            socket.emit('error', 'Room not found');
        }
    });
    socket.on('leave_room', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            socket.leave(roomCode);
            if (room.players.length === 0) {
                delete rooms[roomCode];
                console.log(`Room ${roomCode} deleted (empty)`);
            }
            else {
                io.to(roomCode).emit('room_update', room);
                console.log(`User ${socket.id} left room ${roomCode}`);
            }
        }
    });
    socket.on('update_settings', (data) => {
        const room = rooms[data.roomCode];
        if (room) {
            room.gameConfig = Object.assign(Object.assign({}, room.gameConfig), data.settings);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('start_game', (roomCode) => {
        console.log(`[DEBUG] Received start_game request for room: ${roomCode} from socket ${socket.id}`);
        const room = rooms[roomCode];
        if (room) {
            console.log(`[DEBUG] Starting Game. Type: ${room.gameType}`);
            room.gameState.status = 'playing';
            room.gameState.round = 1;
            room.players.forEach(p => p.score = 0);
            if (room.gameType === 'crossword') {
                // Crossword game starts immediately with the pre-generated grid
                io.to(roomCode).emit('game_started', room);
            }
            else if (room.gameType === 'charades') {
                // Reset Charades State
                room.gameState.actingTimes = {};
                room.gameState.penalties = {};
                startCharadesRound(roomCode);
                return;
            }
            else if (room.gameType === 'monopoly') {
                console.log(`Starting Monopoly for room ${roomCode}. Players:`, room.players.map(p => p.name));
                try {
                    (0, monopolyLogic_1.initializeMonopolyGame)(room);
                    console.log(`Monopoly initialized successfully.`);
                    // Start Monopoly Game Loop
                    const intervalId = setInterval(() => {
                        const currentRoom = rooms[roomCode];
                        if (!currentRoom || !currentRoom.gameState.monopoly) {
                            clearInterval(intervalId);
                            return;
                        }
                        // Check Timeouts
                        const result = (0, monopolyLogic_1.checkTurnTimeout)(currentRoom);
                        if (result === 'warn' || result === 'kick') {
                            io.to(roomCode).emit('room_update', currentRoom);
                        }
                    }, 1000); // Check every second
                    io.to(roomCode).emit('game_started', room);
                    console.log(`Emitted game_started for room ${roomCode}`);
                }
                catch (error) {
                    console.error('Error initializing Monopoly game:', error);
                    socket.emit('error', 'Failed to start game: ' + (error instanceof Error ? error.message : String(error)));
                }
            }
            else if (room.gameType === 'oligarchy') {
                console.log(`[DEBUG] Initializing Oligarchy for room ${roomCode}`);
                try {
                    (0, oligarchyLogic_1.initializeOligarchyGame)(room);
                    console.log(`[DEBUG] Oligarchy initialized. State:`, JSON.stringify(room.gameState.oligarchy ? 'OK' : 'MISSING'));
                    io.to(roomCode).emit('game_started', room);
                }
                catch (e) {
                    console.error(`[DEBUG] Error starting Oligarchy:`, e);
                    socket.emit('error', 'Failed to init Oligarchy');
                }
                // Start Oligarchy Game Loop (Timer Tick)
                const intervalId = setInterval(() => {
                    const currentRoom = rooms[roomCode];
                    if (!currentRoom || !currentRoom.gameState.oligarchy) {
                        clearInterval(intervalId);
                        return;
                    }
                    // Check Auction Timer
                    if (currentRoom.gameState.oligarchy.turnPhase === 'auction') {
                        const { checkOligarchyAuctionTick } = require('./oligarchyLogic');
                        checkOligarchyAuctionTick(currentRoom);
                        // Emit update every second? Or only on significant changes?
                        // For timer UI, every second is good.
                        io.to(roomCode).emit('room_update', currentRoom);
                    }
                }, 1000);
            }
            else {
                startRound(roomCode);
            }
        }
        else {
            console.error(`[DEBUG] start_game failed: Room ${roomCode} not found.`);
            socket.emit('error', 'Room not found (expired?)');
        }
    });
    socket.on('start_next_round', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            room.gameState.round++;
            if (room.gameState.round > room.gameConfig.maxRounds) {
                // Should not happen if UI is correct, but sanity check
                room.gameState.status = 'results';
                io.to(roomCode).emit('game_over', room);
            }
            else {
                room.gameState.status = 'playing';
                startRound(roomCode);
            }
        }
    });
    function startRound(roomCode) {
        const room = rooms[roomCode];
        if (!room)
            return;
        // Top 20 common letters (excluding Q, X, Z, J, K, V)
        const alphabet = "ABCDEFGHILMNOPRSTUWY";
        room.gameState.letter = alphabet[Math.floor(Math.random() * alphabet.length)];
        room.answers = {}; // Clear answers for new round
        room.rejections = {}; // Clear rejections for new round
        io.to(roomCode).emit('game_started', room);
        // Start Timer
        let timeLeft = room.gameConfig.timerDuration;
        // Immediate update
        room.gameState.timer = timeLeft;
        io.to(roomCode).emit('timer_update', timeLeft);
        const timerInterval = setInterval(() => {
            // Charades Pause Logic
            if (room.gameType === 'charades' && room.gameState.isPaused) {
                return; // Don't decrement
            }
            timeLeft--;
            room.gameState.timer = timeLeft;
            io.to(roomCode).emit('timer_update', timeLeft);
            // Debug log every 10s or at end
            if (timeLeft % 10 === 0 || timeLeft <= 0) {
                console.log(`Room ${roomCode} timer: ${timeLeft}`);
            }
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                console.log(`Timer finished for Room ${roomCode}. Starting voting.`);
                if (room.gameType === 'charades') {
                    // Time up logic for Charades? Maybe just next round or game over?
                    // For now, let's just cycle actor
                    startCharadesRound(roomCode);
                }
                else {
                    // Auto-transition to Voting (Scattergories)
                    room.gameState.status = 'voting';
                    room.gameState.currentVotingCategory = 0;
                    io.to(roomCode).emit('start_voting', room);
                }
            }
        }, 1000);
    }
    function startCharadesRound(roomCode, nextActorId) {
        const room = rooms[roomCode];
        if (!room)
            return;
        // Check Win Condition: All players have acted?
        if (room.gameState.actingTimes && Object.keys(room.gameState.actingTimes).length === room.players.length) {
            room.gameState.status = 'results';
            io.to(roomCode).emit('room_update', room);
            return;
        }
        room.gameState.status = 'playing';
        room.gameState.isPaused = false;
        room.gameState.guessingPlayerId = undefined;
        // Determine Actor
        if (nextActorId) {
            room.gameState.actorId = nextActorId;
        }
        else {
            // First round? Pick random who hasn't acted? Or just random.
            // For relay, we pick one, then relay.
            // If restarting, we might need logic to resume.
            // Assuming fresh game:
            if (!room.gameState.actingTimes)
                room.gameState.actingTimes = {};
            // Start with the Host (Player 0)
            room.gameState.actorId = room.players[0].id; // Host starts first in charades
        }
        // Pick Random Scene
        const category = room.gameConfig.charadesCategory || 'Friends';
        const sceneList = charadesData_1.CHARADES_DATA[category] || charadesData_1.CHARADES_DATA['Friends'];
        room.gameState.currentScene = sceneList[Math.floor(Math.random() * sceneList.length)];
        // Set Start Time for Stopwatch
        room.gameState.roundStartTime = Date.now();
        // Clear legacy timer stuff just in case, though Stopwatch uses client logic mostly.
        // Announce
        // (Added hack to Room interface in next edit if needed, or assume chaos for now... 
        // better to fix: add timerId to Room)
        io.to(roomCode).emit('room_update', room);
    }
    socket.on('submit_answers', (data) => {
        const room = rooms[data.roomCode];
        if (room) {
            room.answers[socket.id] = data.answers;
            console.log(`Answers received from ${socket.id} for room ${data.roomCode}`);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('submit_vote', (data) => {
        // This is a "challenge" system. Default is 1 point. If challenged, maybe 0?
        // Simpler MVP: Vote "Yes" (1) or "No" (0). Default is Yes?
        // Let's do: Client sends "Reject" for bad answers.
        // For now, let's just store simple votes. 
        // ACTUALLY, simpler: Host clicks "Next". We just calculate scores at end based on lack of rejects?
        // Let's stick to the plan:
        // "Votes: Map of PlayerID -> score delta"
        // We will store "Rejections". If a player is rejected by > 50% of others, they get 0.
        const room = rooms[data.roomCode];
        if (room) {
            // Cannot reject own answer
            if (socket.id === data.targetPlayerId)
                return;
            if (!room.rejections[data.targetPlayerId]) {
                room.rejections[data.targetPlayerId] = {};
            }
            if (!room.rejections[data.targetPlayerId][data.categoryIndex]) {
                room.rejections[data.targetPlayerId][data.categoryIndex] = [];
            }
            const voters = room.rejections[data.targetPlayerId][data.categoryIndex];
            const voterIndex = voters.indexOf(socket.id);
            if (voterIndex > -1) {
                // Already voted, remove vote (toggle off)
                voters.splice(voterIndex, 1);
            }
            else {
                // Add vote (reject)
                voters.push(socket.id);
            }
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('next_category', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.status === 'voting') {
            room.gameState.currentVotingCategory++;
            if (room.gameState.currentVotingCategory >= 12) {
                // End of voting, calculate scores
                room.players.forEach(p => {
                    const pAnswers = room.answers[p.id] || {};
                    let roundScore = 0;
                    const otherPlayersCount = room.players.length - 1;
                    Object.entries(pAnswers).forEach(([catIdxStr, ans]) => {
                        var _a;
                        const catIdx = Number(catIdxStr);
                        if (typeof ans === 'string' && ans.trim().length > 0) {
                            // Check rejections
                            const rejections = ((_a = room.rejections[p.id]) === null || _a === void 0 ? void 0 : _a[catIdx]) || [];
                            let isRejected = false;
                            if (otherPlayersCount > 0) {
                                if (rejections.length / otherPlayersCount >= 0.5) {
                                    isRejected = true;
                                }
                            }
                            if (!isRejected) {
                                roundScore++;
                            }
                        }
                    });
                    p.score += roundScore;
                });
                // Check if game over or next round
                if (room.gameState.round >= room.gameConfig.maxRounds) {
                    room.gameState.status = 'results';
                    io.to(roomCode).emit('game_over', room);
                }
                else {
                    room.gameState.status = 'results';
                    io.to(roomCode).emit('round_over', room);
                }
            }
            else {
                io.to(roomCode).emit('update_voting_category', room.gameState.currentVotingCategory);
            }
        }
    });
    function checkWord(room, r, c, activePlayerId) {
        if (!room.gameState.grid || !room.gameState.solution)
            return;
        const grid = room.gameState.grid;
        const solution = room.gameState.solution;
        // Check Across
        let cStart = c;
        while (cStart > 0 && !grid[r][cStart - 1].isBlack)
            cStart--;
        let cEnd = c;
        while (cEnd < grid[0].length - 1 && !grid[r][cEnd + 1].isBlack)
            cEnd++;
        // Validate Across Word
        let isAcrossCorrect = true;
        for (let k = cStart; k <= cEnd; k++) {
            if (grid[r][k].value !== solution[r][k]) {
                isAcrossCorrect = false;
                break;
            }
        }
        // If correct and ANY cell is not already locked, lock them and give points
        if (isAcrossCorrect) {
            let newLocks = false;
            for (let k = cStart; k <= cEnd; k++) {
                if (!grid[r][k].locked) {
                    grid[r][k].locked = true;
                    grid[r][k].ownerId = activePlayerId;
                    newLocks = true;
                }
            }
            if (newLocks) {
                const player = room.players.find(p => p.id === activePlayerId);
                if (player)
                    player.score += 1; // 1 point per word solved
            }
        }
        // Check Down
        let rStart = r;
        while (rStart > 0 && !grid[rStart - 1][c].isBlack)
            rStart--;
        let rEnd = r;
        while (rEnd < grid.length - 1 && !grid[rEnd + 1][c].isBlack)
            rEnd++;
        // Validate Down Word
        let isDownCorrect = true;
        for (let k = rStart; k <= rEnd; k++) {
            if (grid[k][c].value !== solution[k][c]) {
                isDownCorrect = false;
                break;
            }
        }
        if (isDownCorrect) {
            let newLocks = false;
            for (let k = rStart; k <= rEnd; k++) {
                if (!grid[k][c].locked) {
                    grid[k][c].locked = true;
                    grid[k][c].ownerId = activePlayerId;
                    newLocks = true;
                }
            }
            if (newLocks) {
                const player = room.players.find(p => p.id === activePlayerId);
                if (player)
                    player.score += 1;
            }
        }
    }
    socket.on('update_cell', (data) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.grid) {
            const cell = room.gameState.grid[data.r][data.c];
            if (cell.locked)
                return; // Prevent editing locked cells
            cell.value = data.value;
            // Check solution
            checkWord(room, data.r, data.c, socket.id);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('cursor_move', (data) => {
        const room = rooms[data.roomCode];
        if (room) {
            if (!room.gameState.cursors)
                room.gameState.cursors = {};
            room.gameState.cursors[socket.id] = { row: data.r, col: data.c };
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    // --- Charades Handlers ---
    socket.on('start_charades_round', (roomCode) => {
        startCharadesRound(roomCode);
    });
    socket.on('buzz', (roomCode) => {
        var _a;
        const room = rooms[roomCode];
        if (room && room.gameState.status === 'playing' && !room.gameState.isPaused) {
            // Check penalty
            const now = Date.now();
            const penaltyEnd = ((_a = room.gameState.penalties) === null || _a === void 0 ? void 0 : _a[socket.id]) || 0;
            if (now < penaltyEnd)
                return; // Player is penalized
            room.gameState.isPaused = true;
            room.gameState.guessingPlayerId = socket.id;
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('resolve_guess', (data) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.isPaused && room.gameState.guessingPlayerId) {
            if (data.correct) {
                // Correct Guess!
                const actorId = room.gameState.actorId;
                const guesserId = room.gameState.guessingPlayerId;
                // Record Time for ACTOR
                if (actorId && room.gameState.roundStartTime) {
                    const timeTaken = Date.now() - room.gameState.roundStartTime;
                    if (!room.gameState.actingTimes)
                        room.gameState.actingTimes = {};
                    room.gameState.actingTimes[actorId] = timeTaken;
                    console.log(`[Charades] Room ${data.roomCode}: Actor ${actorId} time ${timeTaken}ms. ActingTimes:`, room.gameState.actingTimes);
                }
                // Award point to Guesser (optional, but keep scoring)
                const guesser = room.players.find(p => p.id === guesserId);
                if (guesser)
                    guesser.score++;
                // Relay: Guesser becomes next Actor
                startCharadesRound(data.roomCode, guesserId);
            }
            else {
                // Wrong guess
                const guesserId = room.gameState.guessingPlayerId;
                room.gameState.isPaused = false;
                room.gameState.guessingPlayerId = undefined;
                // Apply Penalty (20s)
                if (!room.gameState.penalties)
                    room.gameState.penalties = {};
                room.gameState.penalties[guesserId] = Date.now() + 20000;
                io.to(data.roomCode).emit('room_update', room);
            }
        }
    });
    // Monopoly Listeners
    socket.on('monopoly_roll_dice', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || !room.gameState.monopoly)
            return;
        (0, monopolyLogic_1.handleDiceRoll)(room, socket.id);
        io.to(roomCode).emit('room_update', room);
    });
    socket.on('monopoly_buy_property', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || !room.gameState.monopoly)
            return;
        (0, monopolyLogic_1.purchaseProperty)(room, socket.id);
        io.to(roomCode).emit('room_update', room);
    });
    socket.on('monopoly_end_turn', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || !room.gameState.monopoly)
            return;
        (0, monopolyLogic_1.endTurn)(room);
        io.to(roomCode).emit('room_update', room);
    });
    socket.on('monopoly_mortgage', (data) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.mortgageProperty)(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_unmortgage', (data) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.unmortgageProperty)(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_buy_house', (data) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.buyHouse)(room, socket.id, data.propertyId);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_declare_bankruptcy', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.declareBankruptcy)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_create_trade', (data) => {
        const room = rooms[data.roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.createTradeOffer)(room, socket.id, data.receiverId, data.offer, data.request);
            io.to(data.roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_accept_trade', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.acceptTrade)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_reject_trade', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            (0, monopolyLogic_1.rejectTrade)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('monopoly_dismiss_card', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.monopoly) {
            room.gameState.monopoly.currentCard = null;
            // User Request: "Finish the go" when card is dismissed
            (0, monopolyLogic_1.endTurn)(room);
            io.to(roomCode).emit('room_update', room);
        }
    });
    // --- Oligarchy Events ---
    socket.on('oligarchy_roll', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            const roll = (0, oligarchyLogic_1.handleOligarchyRoll)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
            if (roll) {
                io.to(roomCode).emit('oligarchy_dice_rolled', {
                    die1: roll.die1,
                    die2: roll.die2,
                    playerId: socket.id
                });
            }
        }
    });
    socket.on('oligarchy_buy', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            (0, oligarchyLogic_1.purchaseOligarchyCompany)(room, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('oligarchy_end_turn', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            (0, oligarchyLogic_1.endOligarchyTurn)(room);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('oligarchy_start_auction', (roomCode, companyId) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            // Import dynamically or ensure imported at top
            const { startOligarchyAuction } = require('./oligarchyLogic');
            startOligarchyAuction(room, companyId, socket.id);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('oligarchy_bid', (roomCode, amount) => {
        const room = rooms[roomCode];
        if (room && room.gameState.oligarchy) {
            const { handleOligarchyBid } = require('./oligarchyLogic');
            handleOligarchyBid(room, socket.id, amount);
            io.to(roomCode).emit('room_update', room);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
function startCrossword(roomCode) {
    const room = rooms[roomCode];
    if (!room)
        return;
    // Sample Mini Crossword Data (Static for MVP)
    // 5x5 Grid
    // . . . . .
    // . . . . . 
    // . . . . . (Black squares?)
    // Simple 5x5:
    // C A T S .
    // O V A L .
    // D I V A .
    // E . E A T 
    // S E . R .
    // Better 5x5 (fully dense or minimal black)
    // H E A R T
    // E R R O R
    // A R E N A
    // R O N E .
    // T R A . .
    const initialGrid = [
        [{ v: '', b: false, n: 1 }, { v: '', b: false, n: 2 }, { v: '', b: false, n: 3 }, { v: '', b: false, n: 4 }, { v: '', b: false, n: 5 }],
        [{ v: '', b: false, n: 6 }, { v: '', b: false }, { v: '', b: false }, { v: '', b: false }, { v: '', b: false }],
        [{ v: '', b: false, n: 7 }, { v: '', b: false }, { v: '', b: false }, { v: '', b: false }, { v: '', b: false }],
        [{ v: '', b: false, n: 8 }, { v: '', b: false }, { v: '', b: false }, { v: '', b: false }, { v: '', b: true }],
        [{ v: '', b: false, n: 9 }, { v: '', b: false }, { v: '', b: true }, { v: '', b: true }, { v: '', b: true }],
    ];
    // Transform to simple object logic
    const gridState = initialGrid.map((row, r) => row.map((c, col) => ({
        row: r,
        col: col,
        value: '',
        isBlack: c.b,
        number: c.n
    })));
    room.gameState.grid = gridState;
    room.gameState.clues = {
        across: {
            "1": "Vital organ",
            "6": "Mistake",
            "7": "Stadium",
            "8": "River in France (Rhone)",
            "9": "Transportation agency"
        },
        down: {
            "1": "Listens to",
            "2": "To make a mistake",
            "3": "Gladiator's place",
            "4": "Compass point (variant)",
            "5": "___-Ra (Thundercats)"
        }
    };
    io.to(roomCode).emit('game_started', room);
}
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
