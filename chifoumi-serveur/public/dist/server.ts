import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { setupGameSockets } from "./../../sockets/game";
import path from "path";

const app = express();
const httpServer = createServer(app);

// Autorise toutes les origines (utile sur Render ou pour tests)
app.use(cors({
  origin: true,
  credentials: true
}));

// Sert les fichiers statiques directement depuis le dossier dist (où se trouve index.html, assets, etc.)
const clientDistPath = __dirname;

app.use(express.static(clientDistPath));

// Pour toute autre route, retourne l'index.html du frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Configuration de Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupGameSockets(io);

// Lancement du serveur
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
