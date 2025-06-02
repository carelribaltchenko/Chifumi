// setupGameSockets.ts
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ConnectedUser {
  userId: string;
  pseudo: string;
  handColor: string;
}

const gameStates: Record<string, {
  players: string[],
  choices: Record<string, string>,
  scores: Record<string, number>
}> = {};

const connectedUsers: Record<string, ConnectedUser> = {};
let waitingPlayer: { socketId: string; userId: string } | null = null;

export function setupGameSockets(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
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
      if (!user) return;
      if (waitingPlayer?.userId === userId) return;

      const rooms = Array.from(socket.rooms);
      const isInRoom = rooms.some((room) => room.startsWith("room-"));
      if (isInRoom) return;

      if (!waitingPlayer) {
        waitingPlayer = { socketId: socket.id, userId };
        return;
      }

      if (waitingPlayer.userId === userId) return;

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
        waitingPlayer = null;
      }
    });

    socket.on("playerChoice", ({ roomId, choice }) => {
      const game = gameStates[roomId];
      if (!game) return;

      game.choices[socket.id] = choice;
      socket.emit("choiceReceived", choice);

      if (Object.keys(game.choices).length === 2) {
        const [p1, p2] = game.players;
        const c1 = game.choices[p1];
        const c2 = game.choices[p2];

        const result = determineWinner(c1, c2);
        if (result === 1) game.scores[p1]++;
        else if (result === 2) game.scores[p2]++;

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

    socket.on("leaveRoom", ({ roomId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      socket.leave(roomId);
      socket.to(roomId).emit("opponentLeft", { message: `${user.pseudo} a quitté la partie.` });
    });

    // 👉 GESTION DES DEMANDES D'AMIS
    socket.on("sendFriendRequest", async ({ targetId }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;

      if (sender.userId === targetId) {
        socket.emit("friendRequestError", "❌ Tu ne peux pas t'ajouter toi-même !");
        return;
      }

      const { data: existing, error: checkError } = await supabase
        .from("friends")
        .select("*")
        .or(`and(user_id.eq.${sender.userId},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${sender.userId})`);

      if (checkError) {
        socket.emit("friendRequestError", "❌ Erreur lors de la vérification.");
        return;
      }

      if (existing && existing.length > 0) {
        socket.emit("friendRequestError", "⚠️ Une relation existe déjà.");
        return;
      }

      const { error } = await supabase.from("friends").insert([
        {
          user_id: sender.userId,
          friend_id: targetId,
          status: "pending",
        },
      ]);

      if (error) {
        socket.emit("friendRequestError", "❌ Erreur lors de l'envoi.");
      } else {
        socket.emit("friendRequestSent", "✅ Demande envoyée !");
        // Notifie la cible si elle est connectée
        const targetSocket = Object.entries(connectedUsers).find(
          ([, user]) => user.userId === targetId
        )?.[0];
        if (targetSocket) {
          io.to(targetSocket).emit("newFriendRequest", {
            fromId: sender.userId,
            pseudo: sender.pseudo,
          });
        }
      }
    });
  });

  function cleanupSocket(socketId: string) {
    const user = connectedUsers[socketId];
    if (!user) return;

    if (waitingPlayer?.socketId === socketId) {
      waitingPlayer = null;
    }

    const socketInstance = io.sockets.sockets.get(socketId);
    const rooms = socketInstance?.rooms;
    if (rooms) {
      rooms.forEach((room) => {
        if (room.startsWith("room-")) {
          io.to(room).emit("opponentLeft", { message: "L'adversaire a quitté la partie." });
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

  function determineWinner(c1: string, c2: string) {
    if (c1 === c2) return 0;
    if (
      (c1 === "pierre" && c2 === "ciseaux") ||
      (c1 === "feuille" && c2 === "pierre") ||
      (c1 === "ciseaux" && c2 === "feuille")
    ) return 1;
    return 2;
  }

  function cleanPreviousConnections(userId: string, currentSocketId: string) {
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
}

function extractModifier(emoji: string = "") {
  const skinToneRegex = /[\u{1F3FB}-\u{1F3FF}]/u;
  const match = emoji.match(skinToneRegex);
  return match ? match[0] : "";
}
