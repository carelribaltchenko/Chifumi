import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import path from "path";
import { setupGameSockets } from "./sockets/game";

const app = express();
const httpServer = createServer(app);

// Autorise toutes les origines (Render)
app.use(cors({
  origin: true,
  credentials: true
}));

// Sert les fichiers du frontend compilé
const clientDistPath = path.join(__dirname, "../chifoumi_client/dist");
app.use(express.static(clientDistPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// WebSocket
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupGameSockets(io);

// Port Render ou 3001 en local
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
