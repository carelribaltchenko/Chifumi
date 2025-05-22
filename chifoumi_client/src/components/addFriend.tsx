import { useState } from "react";
import { supabase } from "./../services/supabaseClient";

interface Props {
  userProfile: {
    id: string;
    pseudo: string;
  };
}

export default function AddFriend({ userProfile }: Props) {
  const [targetId, setTargetId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const sendFriendRequest = async () => {
    if (targetId === userProfile.id) {
      setStatusMessage("❌ Tu ne peux pas t'ajouter toi-même !");
      return;
    }

    // Vérifie s’il existe déjà une relation
    const { data: existing, error: checkError } = await supabase
      .from("friends")
      .select("*")
      .or(`and(user_id.eq.${userProfile.id},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${userProfile.id})`);

    if (checkError) {
      setStatusMessage("❌ Erreur lors de la vérification.");
      return;
    }

    if (existing && existing.length > 0) {
      setStatusMessage("⚠️ Une relation existe déjà avec cet utilisateur.");
      return;
    }

    const { error } = await supabase.from("friends").insert([
      {
        user_id: userProfile.id,
        friend_id: targetId,
        status: "pending",
      },
    ]);

    if (error) {
      setStatusMessage("❌ Erreur lors de l'envoi de la demande.");
    } else {
      setStatusMessage("✅ Demande d'ami envoyée !");
      setTargetId("");
    }
  };

  return (
    <div>
      <h3>Ajouter un ami</h3>
      <input
        type="text"
        placeholder="ID de l'utilisateur"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        style={{ padding: "0.5em", marginRight: "1em" }}
      />
      <button onClick={sendFriendRequest}>Envoyer</button>
      <div style={{ marginTop: "1em", color: "darkblue" }}>{statusMessage}</div>
    </div>
  );
}
