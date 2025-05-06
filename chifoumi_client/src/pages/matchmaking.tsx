import { useEffect, useState } from "react";
import { socket } from "../services/socket";
import { useNavigate } from "react-router-dom";

export default function Matchmaking({ userProfile }: { userProfile: any }) {
  const [matched, setMatched] = useState(false);
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile?.id) return;

    // Gestion des événements
    const handleMatchFound = ({ room }: { room: string }) => {
      setMatched(true);
      setRoom(room);
    };

    const handleMessage = (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleOpponentLeft = () => {
      setMatched(false);
      setRoom("");
      setMessages([]);
      navigate("/");
    };

    const handleForceDisconnect = ({ reason }: { reason: string }) => {
      console.warn("Déconnexion forcée:", reason);
      setError("Une nouvelle connexion a été détectée ailleurs");
      socket.disconnect();
    };

    // Connexion et inscription
    const connectSocket = () => {
      socket.auth = { userId: userProfile.id };
      socket.connect();
    };

    connectSocket();

    // Écouteurs d'événements
    socket.on("matchFound", handleMatchFound);
    socket.on("message", handleMessage);
    socket.on("opponentLeft", handleOpponentLeft);
    socket.on("forceDisconnect", handleForceDisconnect);

    // Nettoyage
    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("message", handleMessage);
      socket.off("opponentLeft", handleOpponentLeft);
      socket.off("forceDisconnect", handleForceDisconnect);
      socket.emit("leaveGame");
    };
  }, [userProfile, navigate]);

  const sendMessage = () => {
    if (input.trim() && room) {
      socket.emit("message", { roomId: room, message: input });
      setInput("");
    }
  };

  const handleLeave = () => {
    socket.emit("leaveGame");
    navigate("/");
  };

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reconnecter</button>
      </div>
    );
  }

  return (
    <div className="matchmaking-container">
      {matched ? (
        <div className="game-room">
          <h2>🎮 Partie en cours</h2>
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className="message">{msg}</div>
            ))}
          </div>
          <div className="input-area">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Envoyer</button>
            <button onClick={handleLeave}>Quitter</button>
          </div>
        </div>
      ) : (
        <div className="waiting-room">
          <p>⏳ Recherche d'un adversaire...</p>
          <button onClick={handleLeave}>Annuler</button>
        </div>
      )}
    </div>
  );
}