import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

interface Props {
  userProfile: {
    id: string;
    pseudo: string;
  };
}

interface FriendRequest {
  id: number;
  user_id: string;
  friend_id: string;
  status: string;
  sender_pseudo?: string;
}

export default function FriendRequests({ userProfile }: Props) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("friends")
      .select("*, sender: user_id (pseudo)")
      .eq("friend_id", userProfile.id)
      .eq("status", "pending");

    if (error) {
      setMessage("❌ Erreur lors du chargement des demandes.");
      setLoading(false);
      return;
    }

    const formatted = data.map((req) => ({
      ...req,
      sender_pseudo: req.sender?.pseudo || "Inconnu",
    }));

    setRequests(formatted);
    setLoading(false);
  };

  const respondToRequest = async (id: number, accept: boolean) => {
    const { error } = await supabase
      .from("friends")
      .update({ status: accept ? "accepted" : "refused" })
      .eq("id", id);

    if (error) {
      setMessage("❌ Erreur lors de la mise à jour.");
    } else {
      setMessage(accept ? "✅ Ami accepté !" : "❌ Demande refusée.");
      fetchRequests(); // refresh
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div style={{ marginTop: "2em" }}>
      <h3>Demandes d'amis reçues</h3>
      {loading ? (
        <p>Chargement...</p>
      ) : requests.length === 0 ? (
        <p>Pas de demandes en attente.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req.id} style={{ marginBottom: "1em" }}>
              {req.sender_pseudo} souhaite devenir ami.
              <br />
              <button onClick={() => respondToRequest(req.id, true)} style={{ marginRight: "0.5em" }}>
                ✅ Accepter
              </button>
              <button onClick={() => respondToRequest(req.id, false)}>❌ Refuser</button>
            </li>
          ))}
        </ul>
      )}
      {message && <p style={{ color: "darkblue", marginTop: "1em" }}>{message}</p>}
    </div>
  );
}
