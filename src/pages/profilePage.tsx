import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "./../services/profile.ts";

export default function ProfilePage() {
  const [pseudo, setPseudo] = useState("");
  const [handColor, setHandColor] = useState("");

  useEffect(() => {
    getProfile().then((data) => {
      if (data) {
        setPseudo(data.pseudo);
        setHandColor(data.hand_color);
      }
    });
  }, []);

  const handleUpdate = async () => {
    const { error } = await updateProfile(pseudo, handColor);
    if (error) alert("Erreur de mise à jour");
    else alert("Profil mis à jour !");
  };

  return (
    <div>
      <h1>Mon Profil</h1>
      <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Pseudo" />
      <input value={handColor} onChange={(e) => setHandColor(e.target.value)} placeholder="👋 Couleur de main" />
      <button onClick={handleUpdate}>Enregistrer</button>
    </div>
  );
}
