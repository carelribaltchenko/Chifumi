import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

export default function GameRoom({ userProfile }: any) {
  const { roomId } = useParams();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const navigate = useNavigate();


  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("message", { roomId, message });
      setChat((prev) => [...prev, `Moi: ${message}`]);
      setMessage("");
    }
  };

  const handleLeaveGame = () => {
    socket.emit("leaveRoom", { roomId });
    navigate("/"); // ou "/matchmaking", selon le comportement voulu
  };

  useEffect(() => {
    const handleMessage = (msg: string) => {
      setChat((prev) => [...prev, msg]);
    };
  
    const handleOpponentLeft = ({ message }: { message: string }) => {
      alert(message);
      navigate("/"); // Tu peux le changer en `/matchmaking` si tu préfères
    };
  
    socket.on("message", handleMessage);
    socket.on("opponentLeft", handleOpponentLeft);
  
    return () => {
      socket.off("message", handleMessage);
      socket.off("opponentLeft", handleOpponentLeft);
    };
  }, []);
  
  

  const sendChoice = (choice: string) => {
    // Ici tu peux plus tard envoyer ton choix pour le jeu
    console.log(`Tu as choisi : ${choice}`);
  };

  return (
    <div>
      <h1>Partie en cours - Room {roomId}</h1>

      <div>
        <h2>Chat</h2>
        <div style={{ border: "1px solid #ccc", padding: 10, height: 150, overflowY: "scroll" }}>
          {chat.map((c, i) => <p key={i}>{c}</p>)}
        </div>
        <input value={message} onChange={(e) => setMessage(e.target.value)} />
        <button onClick={sendMessage}>Envoyer</button>
      </div>

      <div>
        <h2>Fais ton choix !</h2>
        <button onClick={() => sendChoice("pierre")}>🪨 Pierre</button>
        <button onClick={() => sendChoice("feuille")}>📄 Feuille</button>
        <button onClick={() => sendChoice("ciseaux")}>✂️ Ciseaux</button>
      </div>

      <button onClick={handleLeaveGame}>Quitter la partie</button>

    </div>
  );
}
