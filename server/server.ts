import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';

import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameStartHandlers } from './handlers/gameStartHandlers';
import { registerScattergoriesHandlers } from './handlers/scattergoriesHandlers';
import { registerCrosswordHandlers } from './handlers/crosswordHandlers';
import { registerCharadesHandlers } from './handlers/charadesHandlers';
import { registerMonopolyHandlers } from './handlers/monopolyHandlers';
import { registerOligarchyHandlers } from './handlers/oligarchyHandlers';

const app = express();
app.use(cors());

// Serve client static files in production
const clientPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientPath));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    registerRoomHandlers(socket, io);
    registerGameStartHandlers(socket, io);
    registerScattergoriesHandlers(socket, io);
    registerCrosswordHandlers(socket, io);
    registerCharadesHandlers(socket, io);
    registerMonopolyHandlers(socket, io);
    registerOligarchyHandlers(socket, io);
});

// SPA catch-all: serve index.html for any non-API/non-socket route
app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
