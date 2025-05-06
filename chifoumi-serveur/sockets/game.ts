import { Server } from "socket.io";

interface ConnectedUser {
  userId: string;
  pseudo: string;
  handColor: string;
}

const connectedUsers: Record<string, ConnectedUser> = {};
let waitingPlayer: { socketId: string; userId: string } | null = null;

export function setupGameSockets(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    // Vous pouvez valider le token ici, par exemple via un service externe
    next();
  });

  io.on("connection", (socket) => {
    console.log("🔌 Nouvelle connexion:", socket.id);

    socket.on("registerUser", ({ userId, pseudo, handColor }) => {
      if (connectedUsers[socket.id]?.userId === userId) {
        socket.emit("registerSuccess");
        return;
      }

      cleanPreviousConnections(userId, socket.id);
      
      connectedUsers[socket.id] = { userId, pseudo, handColor };
      console.log(`✅ ${pseudo} enregistré (${socket.id})`);
      socket.emit("registerSuccess");
      updateUserList();
    });

    socket.on("joinMatchmaking", ({ userId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;

      console.log(`🎮 ${user.pseudo} cherche un match`);

      if (!waitingPlayer) {
        waitingPlayer = { socketId: socket.id, userId };
        return;
      }

      if (waitingPlayer.userId === userId) {
        console.log("🚫 Tentative de match avec soi-même");
        return;
      }

      const roomName = `room-${Date.now()}`;
      socket.join(roomName);
      io.to(waitingPlayer.socketId).socketsJoin(roomName);
      
      io.to(roomName).emit("matchFound", { room: roomName });
      console.log(`✨ Match créé entre ${user.pseudo} et ${connectedUsers[waitingPlayer.socketId]?.pseudo}`);
      
      waitingPlayer = null;
    });

    socket.on("message", ({ roomId, message }) => {
      socket.to(roomId).emit("message", `${connectedUsers[socket.id]?.pseudo}: ${message}`);
    });

    socket.on("leaveGame", () => {
      cleanupSocket(socket.id);
    });

    socket.on("disconnect", () => {
      cleanupSocket(socket.id);
    });

    function cleanupSocket(socketId: string) {
      if (waitingPlayer?.socketId === socketId) {
        waitingPlayer = null;
      }
      
      const user = connectedUsers[socketId];
      if (user) {
        console.log(`🚪 ${user.pseudo} déconnecté`);
        delete connectedUsers[socketId];
        updateUserList();
      }
    }

    function cleanPreviousConnections(userId: string, currentSocketId: string) {
      Object.entries(connectedUsers).forEach(([socketId, user]) => {
        if (user.userId === userId && socketId !== currentSocketId) {
          console.log(`♻️ Nettoyage ancienne connexion ${socketId}`);
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
  });
}
