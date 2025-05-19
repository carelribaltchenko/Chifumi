import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Matchmaking from "./pages/matchmaking";
import GameRoom from "./pages/gameRoom";
import ProfilePage from "./pages/profilePage";
import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import AuthForm from "./components/authForm";
import "./index.css";
import { socket } from "./socket";

function App() {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    refreshUserProfile();
  }, []);

  const refreshUserProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
  
    if (session?.user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
  
      if (!error && data) {
        // Met à jour le state local
        setUserProfile(data);
  
        // Réenvoie les nouvelles infos au serveur Socket
        socket.emit("registerUser", {
          userId: data.id,
          pseudo: data.pseudo,
          handColor: data.hand_color,
        });
      }
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
  };

  if (!userProfile) {
    return <AuthForm onLogin={setUserProfile} />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home userProfile={userProfile} onLogout={handleLogout} />}
        />
        <Route
          path="/matchmaking"
          element={<Matchmaking userProfile={userProfile} />}
        />
        <Route
          path="/game/:roomId"
          element={<GameRoom userProfile={userProfile} />}
        />
        <Route
          path="/profile"
          element={<ProfilePage onProfileUpdated={refreshUserProfile} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
