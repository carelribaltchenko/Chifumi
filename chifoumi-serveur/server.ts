import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { setupGameSockets } from "./sockets/game"; // Assure-toi que le fichier game.ts est bien dans sockets/
import path from "path";


const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.static(path.join(__dirname, "./../public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./../public/index.html"));
});

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupGameSockets(io);

httpServer.listen(3001, () => {
  console.log("🚀 Serveur Socket.io lancé sur http://localhost:3001");
});
