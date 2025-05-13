import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { setupGameSockets } from "./sockets/game"; // ton module

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: "http://localhost:5174", // ✅ mets bien l’URL de ton front ici
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5174", // ✅ autoriser l'origine
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupGameSockets(io);

httpServer.listen(3001, () => {
  console.log("🚀 Serveur Socket.io lancé sur http://localhost:3001");
});
