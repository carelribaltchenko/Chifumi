import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { socket } from "./../services/socket";

export default function GameRoom({ userProfile }: { userProfile: any }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.emit("joinRoom", { roomId, pseudo: userProfile.pseudo });

    socket.on("messageReceived", ({ message, pseudo }) => {
      setMessages((prev) => [...prev, `${pseudo} : ${message}`]);
    });

    return () => {
      socket.off("messageReceived");
    };
  }, [roomId]);

  const handleSend = () => {
    socket.emit("sendMessage", { roomId, message: input, pseudo: userProfile.pseudo });
    setInput("");
  };

  return (
    <div>
      <h2>Bienvenue dans la partie {roomId}</h2>
      <div style={{ border: "1px solid #ccc", height: 200, overflowY: "scroll", padding: 10 }}>
        {messages.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>Envoyer</button>
    </div>
  );
}
