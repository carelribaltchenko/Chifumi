import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "./../socket";

export default function WaitingRoom() {
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("matchFound", ({ room }) => {
      navigate(`/game/${room}`);
    });

    return () => {
      socket.off("matchFound");
    };
  }, [navigate]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🕒 En attente d'un autre joueur...</h2>
    </div>
  );
}
