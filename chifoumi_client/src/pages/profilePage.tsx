import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "./../services/profile";

const handOptions = ["🖐🏻", "🖐🏼", "🖐🏽", "🖐🏾", "🖐🏿"];

export default function ProfilePage({ onProfileUpdated }: { onProfileUpdated: () => void }) {
  const [pseudo, setPseudo] = useState("");
  const [handColor, setHandColor] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getProfile().then((data) => {
      if (data) {
        setPseudo(data.pseudo || "");
        setHandColor(data.hand_color || "");
      }
    });
  }, []);

  const handleUpdate = async () => {
    const { error } = await updateProfile(pseudo, handColor);
    if (error) {
      alert("❌ Erreur de mise à jour du profil.");
    } else {
      alert("✅ Profil mis à jour !");
      onProfileUpdated(); // Rafraîchir le profil dans App.tsx
      navigate("/"); // Rediriger vers la page d'accueil
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 20 }}>🧑‍💼 Modifier mon profil</h2>

      <label>Pseudo :</label>
      <input
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        placeholder="Ton pseudo"
        style={{ padding: 8, margin: "10px 0", width: "100%" }}
      />

      <label>Choisis une main :</label>
      <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
        {handOptions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setHandColor(emoji)}
            style={{
              fontSize: 24,
              padding: 10,
              borderRadius: "50%",
              border: emoji === handColor ? "2px solid #000" : "1px solid #ccc",
              background: "white",
              cursor: "pointer",
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <button onClick={handleUpdate} style={{ padding: 10, marginTop: 20, width: "100%" }}>
        💾 Enregistrer
      </button>
    </div>
  );
}
