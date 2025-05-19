import { useState } from "react";
import { updateProfile } from "../services/profile";
export default function Profile({ userProfile, onClose, onUpdate }: { userProfile: any, onClose: () => void, onUpdate: (profile: any) => void }) {
  const [pseudo, setPseudo] = useState(userProfile.pseudo || "");
  const [handColor, setHandColor] = useState(userProfile.hand_color || "");

  const handleSave = async () => {
    const { error } = await updateProfile(pseudo, handColor);
    if (error) alert("Erreur: " + error.message);
    else {
      alert("Profil mis à jour !");
      onUpdate({ pseudo, hand_color: handColor }); // ← mettre à jour l'état local
      onClose();
    }
  };

  return (
    <div>
      <h2>🧑 Mon Profil</h2>
      <label>Pseudo:</label>
      <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} />
      <br />
      <label>Couleur de la main:</label>
      <select value={handColor} onChange={(e) => setHandColor(e.target.value)}>
        <option value="✋🏻">Blanc</option>
        <option value="✋🏼">Beige</option>
        <option value="✋🏽">Brun</option>
        <option value="✋🏾">Noir</option>
        <option value="✋🏿">Très foncé</option>
      </select>
      <br />
      <button onClick={handleSave}>Enregistrer</button>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
}
