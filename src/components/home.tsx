import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Profile from "./profile";

export default function Home({ userProfile, onLogout }: { userProfile: any, onLogout: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("pseudo, hand_color");
      if (!error) setUsers(data || []);
      else console.error("Erreur fetch profiles:", error.message);
    };
    fetchUsers();
  }, []); // On charge la liste des utilisateurs une seule fois au départ

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    // Met à jour le profil local de l'utilisateur
    userProfile.pseudo = updatedProfile.pseudo;
    userProfile.hand_color = updatedProfile.hand_color;

    // Mettre à jour la liste des utilisateurs (c'est-à-dire recharger les utilisateurs)
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("pseudo, hand_color");
      if (!error) {
        // Ici, nous mettons à jour la liste avec les utilisateurs modifiés
        setUsers(data || []);
      } else {
        console.error("Erreur fetch profiles:", error.message);
      }
    };
    fetchUsers(); // Recharger la liste des utilisateurs après la mise à jour
  };

  return (
    <div>
      <h2>👋 Bienvenue, {userProfile.pseudo} {userProfile.hand_color}</h2>
      <button onClick={() => setShowProfile(true)}>Mon Profil</button>
      <button onClick={handleLogout}>Se déconnecter</button>

      {showProfile && (
        <Profile userProfile={userProfile} onClose={() => setShowProfile(false)} onUpdate={handleProfileUpdate} />
      )}

      <h3>Utilisateurs :</h3>
      <ul>
        {users.map((user, idx) => (
          <li key={idx}>
            {user.pseudo} {user.hand_color}
          </li>
        ))}
      </ul>
    </div>
  );
}
