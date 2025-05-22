import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { supabase } from "../services/supabaseClient";

// Dictionnaire des mains selon la couleur complète
const handsByColor: Record<string, Record<string, string>> = {
  "✋🏻": { pierre: "✊🏻", feuille: "✋🏻", ciseaux: "✌🏻" },
  "✋🏼": { pierre: "✊🏼", feuille: "✋🏼", ciseaux: "✌🏼" },
  "✋🏽": { pierre: "✊🏽", feuille: "✋🏽", ciseaux: "✌🏽" },
  "✋🏾": { pierre: "✊🏾", feuille: "✋🏾", ciseaux: "✌🏾" },
  "✋🏿": { pierre: "✊🏿", feuille: "✋🏿", ciseaux: "✌🏿" },
};

export default function GameRoom({ userProfile }: any) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const [myChoice, setMyChoice] = useState<string | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [pseudos, setPseudos] = useState<Record<string, string>>({});
  const [handColors, setHandColors] = useState<Record<string, string>>({});
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<string>("");

  /** Transforme 🏾 => ✋🏾 pour accéder à handsByColor */
  const buildFullEmoji = (mod: string | undefined): string => {
    return handsByColor[`✋${mod || "🏻"}`] ? `✋${mod}` : "✋🏻";
  };

  const getEmojiForChoice = (choice: string | null, handModifier: string | undefined) => {
    if (!choice) return "❓";
    const fullEmoji = buildFullEmoji(handModifier);
    return handsByColor[fullEmoji]?.[choice] || "❓";
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("message", { roomId, message });
      setChat((prev) => [...prev, `${userProfile.pseudo}: ${message}`]);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const quitGameOrMatchmaking = () => {
    socket.emit(roomId ? "leaveRoom" : "leaveMatchmaking", { roomId });
    navigate("/");
  };

  const makeChoice = (choice: string) => {
    if (!roomId || myChoice) return;
    socket.emit("playerChoice", { roomId, choice });
  };

  const sendFriendRequest = async () => {
    if (!opponentId) return;

    const { data, error } = await supabase
      .from("friends")
      .insert([
        {
          user_id: userProfile.id,
          friend_id: opponentId,
          status: "pending",
        },
      ]);

    if (error) {
      console.error("Erreur d'ajout d'ami :", error.message);
      setFriendStatus("Erreur lors de l'ajout.");
    } else {
      setFriendStatus("Demande d'ami envoyée !");
    }
  };

  useEffect(() => {
    socket.on("choiceReceived", (choice: string) => {
      setMyChoice(choice);
      setOpponentChoice(null);
    });

    socket.on("roundResult", ({ choices, scores, pseudos, handColors }) => {
      if (!choices || !scores || !pseudos || !handColors) return;

      const opponent = Object.keys(choices).find((id) => id !== socket.id);
      if (socket.id) {
        setMyChoice(choices[socket.id]);
      }
      if (opponent) {
        setOpponentChoice(choices[opponent]);
        setOpponentId(opponent); // Stocker l'opponentId ici
      }

      setScores(scores);
      setPseudos(pseudos);
      setHandColors(handColors);

      setTimeout(() => {
        setMyChoice(null);
        setOpponentChoice(null);
      }, 3000);
    });

    socket.on("message", (fullMessage: string) => {
      setChat((prev) => [...prev, fullMessage]);
    });

    socket.on("opponentLeft", ({ message }) => {
      alert(message);
      navigate("/");
    });

    return () => {
      socket.off("choiceReceived");
      socket.off("roundResult");
      socket.off("message");
      socket.off("opponentLeft");
    };
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Partie en cours - Room {roomId}</h1>

      <div style={{ marginBottom: "1rem" }}>
        <h2>Chat</h2>
        <div
          style={{
            border: "1px solid #ccc",
            padding: 10,
            height: 150,
            overflowY: "scroll",
          }}
        >
          {chat.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
        </div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={sendMessage}>Envoyer</button>
      </div>

      <div>
        <h2>
          Votre choix :{" "}
          {getEmojiForChoice(myChoice, socket.id ? handColors[socket.id] || userProfile.handColor : userProfile.handColor)}
        </h2>

        <h2>
          Choix de l'adversaire :{" "}
          {getEmojiForChoice(opponentChoice, handColors[opponentId ?? ""])}
        </h2>

        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
          {["pierre", "feuille", "ciseaux"].map((choice) => (
            <button
              key={choice}
              onClick={() => makeChoice(choice)}
              disabled={!!myChoice}
              style={{ fontSize: "2rem", padding: "0.5rem 1rem" }}
            >
              {getEmojiForChoice(choice, socket.id ? handColors[socket.id] || userProfile.handColor : userProfile.handColor)}
            </button>
          ))}
        </div>

        <h3>Scores :</h3>
        <ul>
          {Object.entries(scores).map(([id, score]) => (
            <li key={id}>
              {id === socket.id ? "Vous" : pseudos[id] || "Adversaire"} : {score} —{" "}
              {buildFullEmoji(handColors[id])}
            </li>
          ))}
        </ul>
      </div>

      {opponentId && (
        <div style={{ marginTop: "1rem" }}>
          <button onClick={sendFriendRequest}>➕ Ajouter comme ami</button>
          {friendStatus && <p>{friendStatus}</p>}
        </div>
      )}

      <button
        onClick={quitGameOrMatchmaking}
        style={{
          marginTop: 20,
          backgroundColor: "#ff4d4f",
          color: "white",
          padding: "0.5rem 1rem",
        }}
      >
        Quitter
      </button>
    </div>
  );
}
