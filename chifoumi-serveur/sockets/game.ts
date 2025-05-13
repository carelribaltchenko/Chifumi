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
    
      // Vérifie si ce joueur est déjà en attente
      if (waitingPlayer?.userId === userId) {
        console.log("⚠️ Utilisateur déjà en matchmaking");
        return;
      }
    
      // Vérifie si ce joueur est déjà dans une room
      const rooms = Array.from(socket.rooms);
      const isInRoom = rooms.some((room) => room.startsWith("room-"));
      if (isInRoom) {
        console.log("⚠️ Utilisateur déjà dans une room");
        return;
      }
    
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
      const user = connectedUsers[socketId];
      if (!user) return;
    
      if (waitingPlayer?.socketId === socketId) {
        waitingPlayer = null;
      }
    
      // Trouver la room à laquelle ce joueur est connecté
      const socketInstance = io.sockets.sockets.get(socketId);
      const rooms = socketInstance?.rooms;
    
      if (rooms) {
        rooms.forEach((room) => {
          if (room.startsWith("room-")) {
            // Informer les autres dans la room
            socket.to(room).emit("opponentLeft", { message: "L'adversaire a quitté la partie." });
    
            // Déconnecter les autres aussi si nécessaire
            const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(room) || []);
            clientsInRoom.forEach((clientId) => {
              if (clientId !== socketId) {
                io.sockets.sockets.get(clientId)?.leave(room);
              }
            });
          }
        });
      }
    
      console.log(`🚪 ${user.pseudo} déconnecté`);
      delete connectedUsers[socketId];
      updateUserList();
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

    socket.on("leaveRoom", ({ roomId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
    
      console.log(`🚪 ${user.pseudo} quitte la room ${roomId}`);
    
      socket.leave(roomId);
      socket.to(roomId).emit("opponentLeft", { message: `${user.pseudo} a quitté la partie.` });
    });

  });
}
