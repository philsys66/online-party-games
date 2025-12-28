import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { BRITISH_CATEGORIES } from './britishCategories';
import PUZZLES from './crosswordData';
import { CHARADES_DATA } from './charadesData';
import {
  initializeMonopolyGame, handleDiceRoll, purchaseProperty, endTurn, buyHouse,
  createTradeOffer, acceptTrade, rejectTrade, declareBankruptcy, checkTurnTimeout,
  mortgageProperty, unmortgageProperty
} from './monopolyLogic';
import {
  initializeOligarchyGame, handleOligarchyRoll, purchaseOligarchyCompany, endOligarchyTurn
} from './oligarchyLogic';
import { Room, Player, GameState, GameType, GameConfig } from './types';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to client URL
    methods: ["GET", "POST"]
  }
});















const rooms: Record<string, Room> = {};

const ROOM_CODES = [
  "PARIS", "TOKYO", "MARS", "VENUS", "ZEUS", "HERA", "APOLLO", "ROME", "LIMA", "OSLO",
  "CAIRO", "DELHI", "SEOUL", "DUBAI", "YORK", "LYON", "NICE", "BONN", "BERN", "KIEV",
  "RIGA", "BAKU", "DOHA", "MALE", "LOME", "SUVA", "AGRA", "PUNE", "GOA", "MAUI"
];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', (data: { playerName: string, avatar: string, gameType: GameType, userId?: string }) => {
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

    let gameState: GameState;
    if (data.gameType === 'crossword') {
      // Choose random puzzle
      const puzzleIndex = Math.floor(Math.random() * PUZZLES.length);
      const puzzle = PUZZLES[puzzleIndex];

      // Build grid from rows
      const grid = puzzle.rows.map((rowStr, r) =>
        rowStr.split('').map((char, c) => {
          return {
            value: '',
            isBlack: char === ' ',
            number: undefined as number | undefined,
            locked: false,
            ownerId: undefined
          };
        })
      );

      // Auto-numbering logic
      let n = 1;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          if (grid[r][c].isBlack) continue;
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
    } else {
      // Scattergories
      // Select 12 unique categories
      const shuffled = [...BRITISH_CATEGORIES].sort(() => 0.5 - Math.random());
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
        score: 0,
        role: 'player' // Default role for host
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
      initializeMonopolyGame(rooms[roomCode]);
    } else if (data.gameType === 'oligarchy') {
      initializeOligarchyGame(rooms[roomCode]);
    }

    socket.join(roomCode);
    socket.emit('room_joined', rooms[roomCode]);
    console.log(`Room ${roomCode} created by ${data.playerName}`);
  });

  socket.on('join_room', (data: { roomCode: string, playerName: string, avatar: string, role?: 'player' | 'banker', userId?: string }) => {
    console.log(`Join attempt: ${data.playerName} trying to join ${data.roomCode} as ${data.role || 'player'} (UserId: ${data.userId})`);
    const room = rooms[data.roomCode];

    if (room) {
      // --- REJOIN LOGIC ---
      // Check if player ALREADY exists by Name (primary) or UserId (if persistent)
      // Using Name for simplicity as "account recovery"
      const existingPlayer = room.players.find(p => p.name === data.playerName || (data.userId && p.userId === data.userId));

      if (existingPlayer) {
        console.log(`Rejoin: Updating socket ID for ${existingPlayer.name} from ${existingPlayer.id} to ${socket.id}`);
        const oldSocketId = existingPlayer.id;

        // 1. Update Player Object
        existingPlayer.id = socket.id;
        existingPlayer.isConnected = true;
        // existingPlayer.avatar = data.avatar; // Optionally update look

        // 2. Update Game State (Oligarchy)
        if (room.gameState.oligarchy) {
          // The game state stores players by ID key, so we must migrate the key
          const oldState = room.gameState.oligarchy.players[oldSocketId];
          if (oldState) {
            room.gameState.oligarchy.players[socket.id] = oldState;
            delete room.gameState.oligarchy.players[oldSocketId];

            // Update Company Ownerships
            Object.values(room.gameState.oligarchy.companies).forEach(c => {
              if (c.ownerId === oldSocketId) c.ownerId = socket.id;
            });

            // Update Turn Tracker
            if (room.gameState.oligarchy.currentTurnPlayerId === oldSocketId) {
              room.gameState.oligarchy.currentTurnPlayerId = socket.id;
            }
          }
        }

        socket.join(data.roomCode);
        socket.emit('room_joined', room);
        io.to(data.roomCode).emit('room_update', room);
        console.log(`${existingPlayer.name} rejoined room ${data.roomCode}`);
        return;
      }

      // --- NEW JOIN LOGIC ---
      // Allow joining even if gameStarted = true (Mid-Game Join)

      let requestedRole = data.role || 'player';
      if (requestedRole === 'banker' && room.players.some(p => p.role === 'banker')) {
        requestedRole = 'player';
      }

      const newPlayer: Player = {
        id: socket.id,
        userId: data.userId,
        name: data.playerName,
        avatar: data.avatar,
        score: 0,
        role: requestedRole,
        isConnected: true
      };

      room.players.push(newPlayer);
      socket.join(data.roomCode);

      // Initialize Game State for New Player (Mid-Game)
      if (room.gameState.status === 'playing') {
        console.log(`Mid-Game Join: Initializing state for ${newPlayer.name}`);
        if (room.gameState.oligarchy) {
          room.gameState.oligarchy.players[socket.id] = {
            cash: 1500, // Starting cash
            position: 0,
            isBankrupt: false,
            companies: [],
            isAfk: false
          };
        } else if (room.gameState.monopoly) {
          room.gameState.monopoly.players[socket.id] = {
            position: 0,
            cash: 1500,
            isBankrupt: false,
            isAfk: false,
            properties: [],
            jailTurns: 0,
            getOutOfJailCards: 0,
            colorSets: {}
          };
        }
      } socket.emit('room_joined', room);
      io.to(data.roomCode).emit('room_update', room);
      console.log(`${data.playerName} joined room ${data.roomCode} as ${requestedRole}`);

    } else {
      console.log(`Join failed: Room ${data.roomCode} not found.`);
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('leave_room', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id);
      socket.leave(roomCode);
      if (room.players.length === 0) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted (empty)`);
      } else {
        io.to(roomCode).emit('room_update', room);
        console.log(`User ${socket.id} left room ${roomCode}`);
      }
    }
  });

  socket.on('update_settings', (data: { roomCode: string, settings: Partial<GameConfig> }) => {
    const room = rooms[data.roomCode];
    if (room) {
      room.gameConfig = { ...room.gameConfig, ...data.settings };
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
      } else if (room.gameType === 'charades') {
        // Reset Charades State
        room.gameState.actingTimes = {};
        room.gameState.penalties = {};
        startCharadesRound(roomCode);
        return;
      } else if (room.gameType === 'monopoly') {
        console.log(`Starting Monopoly for room ${roomCode}. Players:`, room.players.map(p => p.name));
        try {
          initializeMonopolyGame(room);
          console.log(`Monopoly initialized successfully.`);

          // Start Monopoly Game Loop
          const intervalId = setInterval(() => {
            const currentRoom = rooms[roomCode];
            if (!currentRoom || !currentRoom.gameState.monopoly) {
              clearInterval(intervalId);
              return;
            }

            // Check Timeouts
            const result = checkTurnTimeout(currentRoom);
            if (result === 'warn' || result === 'kick') {
              io.to(roomCode).emit('room_update', currentRoom);
            }
          }, 1000); // Check every second

          io.to(roomCode).emit('game_started', room);
          console.log(`Emitted game_started for room ${roomCode}`);
        } catch (error) {
          console.error('Error initializing Monopoly game:', error);
          socket.emit('error', 'Failed to start game: ' + (error instanceof Error ? error.message : String(error)));
        }
      } else if (room.gameType === 'oligarchy') {
        console.log(`[DEBUG] Initializing Oligarchy for room ${roomCode}`);
        try {
          initializeOligarchyGame(room);
          console.log(`[DEBUG] Oligarchy initialized. State:`, JSON.stringify(room.gameState.oligarchy ? 'OK' : 'MISSING'));
          io.to(roomCode).emit('game_started', room);
        } catch (e) {
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

      } else {
        startRound(roomCode);
      }
    } else {
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
      } else {
        room.gameState.status = 'playing';
        startRound(roomCode);
      }
    }
  });

  function startRound(roomCode: string) {
    const room = rooms[roomCode];
    if (!room) return;

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
        } else {
          // Auto-transition to Voting (Scattergories)
          room.gameState.status = 'voting';
          room.gameState.currentVotingCategory = 0;
          io.to(roomCode).emit('start_voting', room);
        }
      }
    }, 1000);
  }

  function startCharadesRound(roomCode: string, nextActorId?: string) {
    const room = rooms[roomCode];
    if (!room) return;

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
    } else {
      // First round? Pick random who hasn't acted? Or just random.
      // For relay, we pick one, then relay.
      // If restarting, we might need logic to resume.
      // Assuming fresh game:
      if (!room.gameState.actingTimes) room.gameState.actingTimes = {};

      // Start with the Host (Player 0)
      room.gameState.actorId = room.players[0].id; // Host starts first in charades
    }

    // Pick Random Scene
    const category = room.gameConfig.charadesCategory || 'Friends';
    const sceneList = CHARADES_DATA[category] || CHARADES_DATA['Friends'];
    room.gameState.currentScene = sceneList[Math.floor(Math.random() * sceneList.length)];

    // Set Start Time for Stopwatch
    room.gameState.roundStartTime = Date.now();
    // Clear legacy timer stuff just in case, though Stopwatch uses client logic mostly.

    // Announce

    // (Added hack to Room interface in next edit if needed, or assume chaos for now... 
    // better to fix: add timerId to Room)

    io.to(roomCode).emit('room_update', room);
  }

  socket.on('submit_answers', (data: { roomCode: string, answers: Record<number, string> }) => {
    const room = rooms[data.roomCode];
    if (room) {
      room.answers[socket.id] = data.answers;
      console.log(`Answers received from ${socket.id} for room ${data.roomCode}`);
      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('submit_vote', (data: { roomCode: string, targetPlayerId: string, categoryIndex: number }) => {
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
      if (socket.id === data.targetPlayerId) return;

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
      } else {
        // Add vote (reject)
        voters.push(socket.id);
      }

      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('next_category', (roomCode: string) => {
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
            const catIdx = Number(catIdxStr);
            if (typeof ans === 'string' && ans.trim().length > 0) {
              // Check rejections
              const rejections = room.rejections[p.id]?.[catIdx] || [];

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
        } else {
          room.gameState.status = 'results';
          io.to(roomCode).emit('round_over', room);
        }
      } else {
        io.to(roomCode).emit('update_voting_category', room.gameState.currentVotingCategory);
      }
    }
  });

  function checkWord(room: Room, r: number, c: number, activePlayerId: string) {
    if (!room.gameState.grid || !room.gameState.solution) return;
    const grid = room.gameState.grid;
    const solution = room.gameState.solution;

    // Check Across
    let cStart = c;
    while (cStart > 0 && !grid[r][cStart - 1].isBlack) cStart--;
    let cEnd = c;
    while (cEnd < grid[0].length - 1 && !grid[r][cEnd + 1].isBlack) cEnd++;

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
        if (player) player.score += 1; // 1 point per word solved
      }
    }

    // Check Down
    let rStart = r;
    while (rStart > 0 && !grid[rStart - 1][c].isBlack) rStart--;
    let rEnd = r;
    while (rEnd < grid.length - 1 && !grid[rEnd + 1][c].isBlack) rEnd++;

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
        if (player) player.score += 1;
      }
    }
  }

  socket.on('update_cell', (data: { roomCode: string, r: number, c: number, value: string }) => {
    const room = rooms[data.roomCode];
    if (room && room.gameState.grid) {
      const cell = room.gameState.grid[data.r][data.c];
      if (cell.locked) return; // Prevent editing locked cells

      cell.value = data.value;

      // Check solution
      checkWord(room, data.r, data.c, socket.id);

      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('cursor_move', (data: { roomCode: string, r: number, c: number }) => {
    const room = rooms[data.roomCode];
    if (room) {
      if (!room.gameState.cursors) room.gameState.cursors = {};
      room.gameState.cursors[socket.id] = { row: data.r, col: data.c };
      io.to(data.roomCode).emit('room_update', room);
    }
  });

  // --- Charades Handlers ---
  socket.on('start_charades_round', (roomCode) => {
    startCharadesRound(roomCode);
  });

  socket.on('buzz', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.gameState.status === 'playing' && !room.gameState.isPaused) {
      // Check penalty
      const now = Date.now();
      const penaltyEnd = room.gameState.penalties?.[socket.id] || 0;
      if (now < penaltyEnd) return; // Player is penalized

      room.gameState.isPaused = true;
      room.gameState.guessingPlayerId = socket.id;
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('resolve_guess', (data: { roomCode: string, correct: boolean }) => {
    const room = rooms[data.roomCode];
    if (room && room.gameState.isPaused && room.gameState.guessingPlayerId) {
      if (data.correct) {
        // Correct Guess!
        const actorId = room.gameState.actorId;
        const guesserId = room.gameState.guessingPlayerId;

        // Record Time for ACTOR
        if (actorId && room.gameState.roundStartTime) {
          const timeTaken = Date.now() - room.gameState.roundStartTime;
          if (!room.gameState.actingTimes) room.gameState.actingTimes = {};

          room.gameState.actingTimes[actorId] = timeTaken;
          console.log(`[Charades] Room ${data.roomCode}: Actor ${actorId} time ${timeTaken}ms. ActingTimes:`, room.gameState.actingTimes);
        }

        // Award point to Guesser (optional, but keep scoring)
        const guesser = room.players.find(p => p.id === guesserId);
        if (guesser) guesser.score++;

        // Relay: Guesser becomes next Actor
        startCharadesRound(data.roomCode, guesserId);
      } else {
        // Wrong guess
        const guesserId = room.gameState.guessingPlayerId;
        room.gameState.isPaused = false;
        room.gameState.guessingPlayerId = undefined;

        // Apply Penalty (20s)
        if (!room.gameState.penalties) room.gameState.penalties = {};
        room.gameState.penalties[guesserId] = Date.now() + 20000;

        io.to(data.roomCode).emit('room_update', room);
      }
    }
  });

  // Monopoly Listeners
  socket.on('monopoly_roll_dice', (roomCode: string) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState.monopoly) return;

    handleDiceRoll(room, socket.id);
    io.to(roomCode).emit('room_update', room);
  });

  socket.on('monopoly_buy_property', (roomCode: string) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState.monopoly) return;

    purchaseProperty(room, socket.id);
    io.to(roomCode).emit('room_update', room);
  });

  socket.on('monopoly_end_turn', (roomCode: string) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState.monopoly) return;

    endTurn(room);
    io.to(roomCode).emit('room_update', room);
  });

  socket.on('monopoly_mortgage', (data: { roomCode: string, propertyId: number }) => {
    const room = rooms[data.roomCode];
    if (room && room.gameState.monopoly) {
      mortgageProperty(room, socket.id, data.propertyId);
      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_unmortgage', (data: { roomCode: string, propertyId: number }) => {
    const room = rooms[data.roomCode];
    if (room && room.gameState.monopoly) {
      unmortgageProperty(room, socket.id, data.propertyId);
      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_buy_house', (data: { roomCode: string, propertyId: number }) => {
    const room = rooms[data.roomCode];
    if (room && room.gameState.monopoly) {
      buyHouse(room, socket.id, data.propertyId);
      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_declare_bankruptcy', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.monopoly) {
      declareBankruptcy(room, socket.id);
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_create_trade', (data: {
    roomCode: string,
    receiverId: string,
    offer: { cash: number, properties: number[] },
    request: { cash: number, properties: number[] }
  }) => {
    const room = rooms[data.roomCode];
    if (room && room.gameState.monopoly) {
      createTradeOffer(room, socket.id, data.receiverId, data.offer, data.request);
      io.to(data.roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_accept_trade', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.monopoly) {
      acceptTrade(room, socket.id);
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_reject_trade', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.monopoly) {
      rejectTrade(room, socket.id);
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('monopoly_dismiss_card', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.monopoly) {
      room.gameState.monopoly.currentCard = null;
      // User Request: "Finish the go" when card is dismissed
      endTurn(room);
      io.to(roomCode).emit('room_update', room);
    }
  });

  // --- Oligarchy Events ---
  socket.on('oligarchy_roll', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.oligarchy) {
      const roll = handleOligarchyRoll(room, socket.id);

      // Emit Dice Roll Event immediately
      if (roll) {
        io.to(roomCode).emit('oligarchy_dice_rolled', {
          die1: roll.die1,
          die2: roll.die2,
          playerId: socket.id
        });
      }

      // Delay state update (movement) until animation finishes (3s)
      setTimeout(() => {
        io.to(roomCode).emit('room_update', room);
      }, 3000);
    }
  });

  socket.on('oligarchy_buy', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.oligarchy) {
      purchaseOligarchyCompany(room, socket.id);
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('oligarchy_end_turn', (roomCode: string) => {
    const room = rooms[roomCode];
    if (room && room.gameState.oligarchy) {
      endOligarchyTurn(room);
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('oligarchy_start_auction', (roomCode: string, companyId: number) => {
    const room = rooms[roomCode];
    if (room && room.gameState.oligarchy) {
      // Import dynamically or ensure imported at top
      const { startOligarchyAuction } = require('./oligarchyLogic');
      startOligarchyAuction(room, companyId, socket.id);
      io.to(roomCode).emit('room_update', room);
    }
  });

  socket.on('oligarchy_bid', (roomCode: string, amount: number) => {
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

function startCrossword(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;

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
  const gridState = initialGrid.map((row, r) =>
    row.map((c, col) => ({
      row: r,
      col: col,
      value: '',
      isBlack: c.b,
      number: c.n
    }))
  );

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
