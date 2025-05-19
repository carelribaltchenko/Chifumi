import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { setupGameSockets } from "./sockets/game"; // Assure-toi que le fichier game.ts est bien dans sockets/
import path from "path";

const app = express();
const httpServer = createServer(app);

// CORS autorisé depuis le frontend, en développement c'était : http://localhost:5173
app.use(cors({
  origin: true,
  credentials: true
}));

// Dossier où est copié le build frontend (via build-all.sh)
const clientDistPath = path.join(__dirname, "public");

app.use(express.static(clientDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupGameSockets(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
