"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const game_1 = require("../sockets/game");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Autorise toutes les origines (utile sur Render ou pour tests)
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
// Sert les fichiers statiques depuis le dossier public/dist (build frontend)
const clientDistPath = path_1.default.join(__dirname, "public", "dist");
app.use(express_1.default.static(clientDistPath));
// Pour toute autre route, retourne l'index.html du frontend
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(clientDistPath, "index.html"));
});
// Configuration de Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});
(0, game_1.setupGameSockets)(io);
// Lancement du serveur
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
});
