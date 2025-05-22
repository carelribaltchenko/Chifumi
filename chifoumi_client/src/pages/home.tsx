import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket, connectSocket } from "../socket";
import { supabase } from "../services/supabaseClient";
import AddFriend from "../components/addFriend"; // 👈

interface UserProfile {
  id: string;
  pseudo: string;
  handColor: string;
}

interface ConnectedUser {
  userId: string;
  pseudo: string;
  handColor: string;
}

export default function Home({ userProfile, onLogout }: { userProfile: UserProfile, onLogout: () => void }) {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    connectSocket();

    socket.on("connect", () => {
      console.log("✅ Socket connectée au serveur");

      socket.emit("registerUser", {
        userId: userProfile.id,
        pseudo: userProfile.pseudo,
        handColor: userProfile.handColor,
      });
    });

    socket.on("registerSuccess", () => {
      console.log("📝 Utilisateur enregistré sur le serveur");
    });

    socket.on("usersUpdate", (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    });

    socket.on("forceDisconnect", ({ reason }) => {
      console.warn("🚫 Déconnecté :", reason);
      socket.disconnect();
    });

    return () => {
      socket.off("connect");
      socket.off("registerSuccess");
      socket.off("usersUpdate");
      socket.off("forceDisconnect");
    };
  }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    socket.disconnect();
    onLogout();
  };

  const handleEditProfile = () => {
    navigate("/profile");
  };

  const handleMatchmaking = () => {
    navigate("/matchmaking");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Bienvenue, {userProfile.pseudo} 👋</h1>
      <p>Ta couleur de main : <span style={{ color: userProfile.handColor }}>{userProfile.handColor}</span></p>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleEditProfile}>✏️ Modifier mon profil</button>
        <button onClick={handleLogout} style={{ marginLeft: "1rem" }}>🚪 Se déconnecter</button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleMatchmaking}>🎮 Entrer dans le matchmaking</button>
      </div>

      {/* ✅ Formulaire pour ajouter un ami */}
      <div style={{ marginTop: "2rem" }}>
        <h2>Ajouter un ami</h2>
        <AddFriend userProfile={userProfile} />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => setShowUsers(!showUsers)}>
          {showUsers ? "👁️ Masquer les utilisateurs" : "👥 Voir les utilisateurs connectés"}
        </button>
        {showUsers && (
          <ul style={{ marginTop: "1rem" }}>
            {connectedUsers.map(user => (
              <li key={user.userId}>
                {user.pseudo} — <span style={{ color: user.handColor }}>{user.handColor}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
