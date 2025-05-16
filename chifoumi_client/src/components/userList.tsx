import { SetStateAction, useEffect, useState } from 'react';
import socket from '../socket';

interface ConnectedUser {
  userId: string;
  pseudo: string;
  handColor: string;
}


function UserList({ userId }: { userId: string }) {
  const [users, setUsers] = useState<ConnectedUser[]>([]);

  useEffect(() => {
    // Enregistre l'utilisateur
    socket.emit('registerUser', { userId });

    // Écoute les mises à jour de la liste
    socket.on('usersUpdate', (userList: SetStateAction<ConnectedUser[]>) => {
      setUsers(userList);
    });

    return () => {
      socket.off('usersUpdate');
    };
  }, [userId]);

  return (
    <div>
      <h3>Utilisateurs connectés :</h3>
        <ul>
        {users.map((user, index) => (
            <li key={index}>{user.userId}</li>
        ))}
        </ul>
    </div>
  );
}

export default UserList;
