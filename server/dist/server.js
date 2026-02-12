"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const roomHandlers_1 = require("./handlers/roomHandlers");
const gameStartHandlers_1 = require("./handlers/gameStartHandlers");
const scattergoriesHandlers_1 = require("./handlers/scattergoriesHandlers");
const crosswordHandlers_1 = require("./handlers/crosswordHandlers");
const charadesHandlers_1 = require("./handlers/charadesHandlers");
const monopolyHandlers_1 = require("./handlers/monopolyHandlers");
const oligarchyHandlers_1 = require("./handlers/oligarchyHandlers");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Serve client static files in production
const clientPath = path_1.default.join(__dirname, '..', '..', 'client', 'dist');
app.use(express_1.default.static(clientPath));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    (0, roomHandlers_1.registerRoomHandlers)(socket, io);
    (0, gameStartHandlers_1.registerGameStartHandlers)(socket, io);
    (0, scattergoriesHandlers_1.registerScattergoriesHandlers)(socket, io);
    (0, crosswordHandlers_1.registerCrosswordHandlers)(socket, io);
    (0, charadesHandlers_1.registerCharadesHandlers)(socket, io);
    (0, monopolyHandlers_1.registerMonopolyHandlers)(socket, io);
    (0, oligarchyHandlers_1.registerOligarchyHandlers)(socket, io);
});
// SPA catch-all: serve index.html for any non-API/non-socket route
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(clientPath, 'index.html'));
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
