"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const game_1 = require("./sockets/game"); // Assure-toi que le fichier game.ts est bien dans sockets/
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express_1.default.static(path_1.default.join(__dirname, "./../dist")));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "./../dist/index.html"));
});
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});
(0, game_1.setupGameSockets)(io);
httpServer.listen(3001, () => {
    console.log("🚀 Serveur Socket.io lancé sur http://localhost:3001");
});
