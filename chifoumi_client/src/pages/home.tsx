import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import Profile from "../components/profile";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";
import { useSocketRegistration } from "../hook/useSocketRegistration";

export default function Home({
  userProfile,
  onLogout,
}: {
  userProfile: any;
  onLogout: () => void;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "users">("home");
  const navigate = useNavigate();

  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    function tryRegister() {
      if (userProfile && socket.connected && !hasRegisteredRef.current) {
        console.log("📤 Envoi de registerUser", userProfile);
        socket.emit("registerUser", {
          userId: userProfile.id,
          pseudo: userProfile.pseudo,
          handColor: userProfile.hand_color,
        });
        hasRegisteredRef.current = true;
      }
    }

    tryRegister();
    socket.on("connect", tryRegister);

    return () => {
      socket.off("connect", tryRegister);
    };
  }, [userProfile]);

  const { users, error } = useSocketRegistration(userProfile);

  const handleLogout = async () => {
    socket.disconnect(); // ❌ Déconnecte proprement le socket
    await supabase.auth.signOut();
    onLogout();
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    if (!userProfile) return;

    userProfile.pseudo = updatedProfile.pseudo;
    userProfile.hand_color = updatedProfile.hand_color;
    // Pas besoin de socket.emit ici : le hook le gère à la reconnexion
  };

  if (!userProfile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <div>
      <h2>
        👋 Bienvenue, {userProfile.pseudo} {userProfile.hand_color}
      </h2>

      <button onClick={() => setShowProfile(true)}>Mon Profil</button>
      <button
        onClick={() =>
          setActiveView(activeView === "home" ? "users" : "home")
        }
      >
        {activeView === "home"
          ? "Voir les utilisateurs"
          : "Retour à l'accueil"}
      </button>
      <button onClick={() => {
        const width = 600;
        const height = 800;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        window.open(
          "/popup-matchmaking", // Assure-toi que c'est le bon chemin dans ton routeur
          "MatchmakingPopup",
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }}>
        🎮 Rejoindre le matchmaking
      </button>
      <button onClick={handleLogout}>Se déconnecter</button>

      {showProfile && (
        <Profile
          userProfile={userProfile}
          onClose={() => setShowProfile(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {activeView === "users" && (
        <>
          <h3>Utilisateurs connectés :</h3>
          <ul>
            {users.map((user, idx) => (
              <li key={idx}>
                {user.pseudo} ({user.handColor})
              </li>
            ))}
          </ul>
        </>
      )}

      {error && (
        <p style={{ color: "red" }}>🚫 Erreur d'enregistrement : {error}</p>
      )}
    </div>
  );
}
