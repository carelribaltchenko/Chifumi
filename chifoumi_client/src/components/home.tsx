import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Profile from "./profile";
import { socket } from "../socket";

export default function Home({ userProfile, onLogout }: { userProfile: any, onLogout: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "users">("home");
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile) {
      socket.emit("registerUser", {
        userId: userProfile.id,
        pseudo: userProfile.pseudo,
        handColor: userProfile.hand_color,
      });
    }
  
    if (activeView === "users") {
      socket.on("usersUpdate", (userList) => {
        setUsers(userList);
      });
    }
  
    return () => {
      socket.off("usersUpdate");
    };
  }, [activeView, userProfile]);
  
  const handleLogout = async () => {
    socket.disconnect(); // <-- important
    await supabase.auth.signOut();
    onLogout();
  };
  
  const handleProfileUpdate = (updatedProfile: any) => {
    userProfile.pseudo = updatedProfile.pseudo;
    userProfile.hand_color = updatedProfile.hand_color;
  
    // Mise à jour côté serveur
    socket.emit("registerUser", {
      userId: userProfile.id,
      pseudo: updatedProfile.pseudo,
      handColor: updatedProfile.hand_color,
    });
  };

  return (
    <div>
      <h2>👋 Bienvenue, {userProfile.pseudo} {userProfile.hand_color}</h2>
      <button onClick={() => setShowProfile(true)}>Mon Profil</button>
      <button onClick={() => setActiveView(activeView === "home" ? "users" : "home")}>
        {activeView === "home" ? "Voir les utilisateurs" : "Retour à l'accueil"}
      </button>
      <button onClick={handleLogout}>Se déconnecter</button>

      {showProfile && (
        <Profile userProfile={userProfile} onClose={() => setShowProfile(false)} onUpdate={handleProfileUpdate} />
      )}

      {activeView === "users" && (
        <>
          <h3>Utilisateurs connectés :</h3>
          <ul>
            {users.map((user, idx) => (
              <li key={idx}>
                {user.pseudo} {user.handColor}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
