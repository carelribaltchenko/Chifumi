import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export function useSocketRegistration(userProfile: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    if (!socket.connected) socket.connect();

    socket.emit("registerUser", {
      userId: userProfile.id,
      pseudo: userProfile.pseudo,
      handColor: userProfile.hand_color,
    });

    socket.on("usersUpdate", (userList) => setUsers(userList));
    socket.on("registerFailed", ({ reason }) => setError(reason));

    return () => {
      socket.off("usersUpdate");
      socket.off("registerFailed");
    };
  }, [userProfile]);

  return { users, error };
}
