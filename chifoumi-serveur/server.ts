import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupGameSockets } from './sockets/game';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Chifoumi server is running!');
});

setupGameSockets(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
