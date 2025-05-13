import { useState, useEffect } from "react";
import { socket } from "../socket";

interface ConnectedUser {
  userId: string;
  pseudo: string;
  handColor: string;
}

export function useSocketRegistration(userProfile: any) {
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleUsersUpdate = (userList: ConnectedUser[]) => {
      console.log("📥 Liste des utilisateurs reçue :", userList);
      setUsers(userList);
    };

    const handleRegistrationError = (errMsg: string) => {
      console.error("🚫 Erreur d'enregistrement :", errMsg);
      setError(errMsg);
    };

    socket.on("usersUpdate", handleUsersUpdate);
    socket.on("registrationError", handleRegistrationError);

    return () => {
      socket.off("usersUpdate", handleUsersUpdate);
      socket.off("registrationError", handleRegistrationError);
    };
  }, []);

  return { users, error };
}
