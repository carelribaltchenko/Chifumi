import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

interface UserProfile {
  id: string;
  pseudo: string;
  handColor: string;
}

export default function Matchmaking({ userProfile }: { userProfile: UserProfile }) {
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    if (!socket.connected) {
      console.warn("⛔ Socket non connectée");
      return;
    }

    
    // On rejoint le matchmaking
    socket.emit("joinMatchmaking", {
      userId: userProfile.id,
    });

    setWaiting(true);

    // Lorsqu’un match est trouvé
    socket.on("matchFound", ({ room }) => {
      console.log("🎯 Match trouvé, redirection vers la room :", room);
      navigate(`/game/${room}`);
    });

    return () => {
      socket.off("matchFound");
    };
  }, [userProfile, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h2>🔎 Recherche d’un adversaire...</h2>
      <p>Merci de patienter pendant que nous vous trouvons un joueur...</p>
      {waiting && <div style={{ fontSize: "3rem", marginTop: "2rem" }}>⏳</div>}
    </div>
  );
}
