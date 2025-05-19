"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGameSockets = setupGameSockets;
const gameStates = {};
const connectedUsers = {};
let waitingPlayer = null;
function setupGameSockets(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error("Authentication error"));
        next();
    });
    io.on("connection", (socket) => {
        socket.on("registerUser", ({ userId, pseudo, handColor }) => {
            if (connectedUsers[socket.id]?.userId === userId) {
                socket.emit("registerSuccess");
                return;
            }
            cleanPreviousConnections(userId, socket.id);
            connectedUsers[socket.id] = { userId, pseudo, handColor };
            socket.emit("registerSuccess");
            updateUserList();
        });
        socket.on("joinMatchmaking", ({ userId }) => {
            const user = connectedUsers[socket.id];
            if (!user)
                return;
            if (waitingPlayer?.userId === userId)
                return;
            const rooms = Array.from(socket.rooms);
            const isInRoom = rooms.some((room) => room.startsWith("room-"));
            if (isInRoom)
                return;
            if (!waitingPlayer) {
                waitingPlayer = { socketId: socket.id, userId };
                return;
            }
            if (waitingPlayer.userId === userId)
                return;
            const roomName = `room-${Date.now()}`;
            socket.join(roomName);
            io.to(waitingPlayer.socketId).socketsJoin(roomName);
            io.to(roomName).emit("matchFound", { room: roomName });
            gameStates[roomName] = {
                players: [socket.id, waitingPlayer.socketId],
                choices: {},
                scores: {
                    [socket.id]: 0,
                    [waitingPlayer.socketId]: 0
                }
            };
            waitingPlayer = null;
        });
        socket.on("leaveMatchmaking", () => {
            if (waitingPlayer?.socketId === socket.id) {
                console.log(`⛔ ${connectedUsers[socket.id]?.pseudo} a quitté le matchmaking`);
                waitingPlayer = null;
            }
        });
        socket.on("playerChoice", ({ roomId, choice }) => {
            const game = gameStates[roomId];
            if (!game)
                return;
            game.choices[socket.id] = choice;
            socket.emit("choiceReceived", choice);
            if (Object.keys(game.choices).length === 2) {
                const [p1, p2] = game.players;
                const c1 = game.choices[p1];
                const c2 = game.choices[p2];
                const result = determineWinner(c1, c2);
                if (result === 1)
                    game.scores[p1]++;
                else if (result === 2)
                    game.scores[p2]++;
                io.to(roomId).emit("roundResult", {
                    choices: { [p1]: c1, [p2]: c2 },
                    scores: game.scores,
                    pseudos: {
                        [p1]: connectedUsers[p1]?.pseudo || "Joueur 1",
                        [p2]: connectedUsers[p2]?.pseudo || "Joueur 2",
                    },
                    handColors: {
                        [p1]: extractModifier(connectedUsers[p1]?.handColor) || "",
                        [p2]: extractModifier(connectedUsers[p2]?.handColor) || "",
                    }
                });
                game.choices = {};
            }
        });
        socket.on("message", ({ roomId, message }) => {
            const pseudo = connectedUsers[socket.id]?.pseudo || "Inconnu";
            socket.to(roomId).emit("message", `${pseudo}: ${message}`);
        });
        socket.on("leaveGame", () => cleanupSocket(socket.id));
        socket.on("disconnect", () => cleanupSocket(socket.id));
        function cleanupSocket(socketId) {
            const user = connectedUsers[socketId];
            if (!user)
                return;
            if (waitingPlayer?.socketId === socketId) {
                waitingPlayer = null;
            }
            const socketInstance = io.sockets.sockets.get(socketId);
            const rooms = socketInstance?.rooms;
            if (rooms) {
                rooms.forEach((room) => {
                    if (room.startsWith("room-")) {
                        socket.to(room).emit("opponentLeft", { message: "L'adversaire a quitté la partie." });
                        const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
                        clients.forEach((clientId) => {
                            if (clientId !== socketId) {
                                io.sockets.sockets.get(clientId)?.leave(room);
                            }
                        });
                    }
                });
            }
            delete connectedUsers[socketId];
            updateUserList();
        }
        function determineWinner(c1, c2) {
            if (c1 === c2)
                return 0;
            if ((c1 === "pierre" && c2 === "ciseaux") ||
                (c1 === "feuille" && c2 === "pierre") ||
                (c1 === "ciseaux" && c2 === "feuille"))
                return 1;
            return 2;
        }
        function cleanPreviousConnections(userId, currentSocketId) {
            Object.entries(connectedUsers).forEach(([socketId, user]) => {
                if (user.userId === userId && socketId !== currentSocketId) {
                    io.to(socketId).emit("forceDisconnect", {
                        reason: "Nouvelle connexion détectée"
                    });
                    io.sockets.sockets.get(socketId)?.disconnect();
                    delete connectedUsers[socketId];
                }
            });
        }
        function updateUserList() {
            io.emit("usersUpdate", Object.values(connectedUsers));
        }
        socket.on("leaveRoom", ({ roomId }) => {
            const user = connectedUsers[socket.id];
            if (!user)
                return;
            socket.leave(roomId);
            socket.to(roomId).emit("opponentLeft", { message: `${user.pseudo} a quitté la partie.` });
        });
    });
}
function extractModifier(emoji = "") {
    // Retourne uniquement le modificateur (ex: 🏾)
    const skinToneRegex = /[\u{1F3FB}-\u{1F3FF}]/u;
    const match = emoji.match(skinToneRegex);
    return match ? match[0] : "";
}
