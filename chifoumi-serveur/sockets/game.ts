import { Server } from 'socket.io';

const connectedUsers: { [socketId: string]: { userId: string; pseudo: string; handColor: string } } = {};

export function setupGameSockets(io: Server) {
  io.on('connection', (socket) => {
    console.log('🔌 Client connecté :', socket.id);

    socket.on('registerUser', ({ userId, pseudo, handColor }) => {
      connectedUsers[socket.id] = { userId, pseudo, handColor };
      console.log(`✅ Utilisateur enregistré : ${pseudo} (${handColor})`);
      updateUserList();
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnexion :', socket.id);
      delete connectedUsers[socket.id];
      updateUserList();
    });

    function updateUserList() {
      const users = Object.values(connectedUsers);
      io.emit('usersUpdate', users);
    }
  });
}
