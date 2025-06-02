import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { setupGameSockets } from "./sockets/game";
import path from "path";
import fs from "fs";


const app = express();
const httpServer = createServer(app);

// Autorise toutes les origines (utile sur Render ou pour tests)
app.use(cors({
  origin: true,
  credentials: true
}));

// Sert les fichiers statiques depuis le dossier public/dist (build frontend)
const clientDistPath = path.join(__dirname, "public", "dist");

app.use(express.static(clientDistPath));

// Pour toute autre route, retourne l'index.html du frontend

app.get("*", (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error("❌ index.html not found at", indexPath);
    res.status(500).send("index.html not found");
  }
});


// app.get("*", (req, res) => {
//   res.sendFile(path.join(clientDistPath, "index.html"));
// });

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
