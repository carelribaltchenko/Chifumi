import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export default function PopupMatchmaking() {
  const [room, setRoom] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId"); // Ou autre méthode pour récupérer l'ID

    socket.emit("joinMatchmaking", { userId });

    socket.on("matchFound", ({ room }) => {
      console.log("✅ Match trouvé dans room :", room);
      setRoom(room);
    });

    socket.on("message", (msg) => {
      setChat(prev => [...prev, msg]);
    });

    socket.on("opponentLeft", () => {
      alert("L'adversaire a quitté la partie.");
      window.close();
    });

    return () => {
      socket.emit("leaveGame");
      socket.off("matchFound");
      socket.off("message");
      socket.off("opponentLeft");
    };
  }, []);

  const sendMessage = () => {
    if (room && message.trim()) {
      socket.emit("message", { roomId: room, message });
      setChat(prev => [...prev, `Moi: ${message}`]);
      setMessage("");
    }
  };

  return (
    <div>
      <h2>🧩 Recherche d'un joueur...</h2>
      {room && <h3>🎯 Match trouvé ! Room: {room}</h3>}
      {room && (
        <>
          <div style={{ border: "1px solid gray", height: 200, overflowY: "auto" }}>
            {chat.map((msg, idx) => <div key={idx}>{msg}</div>)}
          </div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre message"
          />
          <button onClick={sendMessage}>Envoyer</button>
        </>
      )}
    </div>
  );
}
