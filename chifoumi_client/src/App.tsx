import { useEffect, useState } from "react";
import AuthForm from "./components/authForm";
import Home from "./pages/home";
import Matchmaking from "./pages/matchmaking";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import { getProfile } from "./services/profile";
import { useSocketRegistration } from "./hook/useSocketRegistration"; // 👈 Ajout du hook global
import { socket } from "./socket"; // en haut
import PopupMatchmaking from "./pages/popupMatchmaking";

function App() {
  const [userProfile, setUserProfile] = useState<any>(null);

  <AuthForm onLogin={(profile) => {
    if (!socket.connected) socket.connect();
    setUserProfile(profile);
  }} />

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const profile = await getProfile();
        setUserProfile(profile);
      }
    };
    init();
  }, []);

  // 🔌 Enregistrement WebSocket centralisé
  useSocketRegistration(userProfile);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  if (!userProfile) {
    return (
      <div>
        <h1>Chifoumi</h1>
        <AuthForm onLogin={(profile) => setUserProfile(profile)} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <h1>Chifoumi</h1>
      <Routes>
        <Route path="/" element={<Home userProfile={userProfile} onLogout={handleLogout} />} />
        <Route path="/matchmaking" element={<Matchmaking userProfile={userProfile} />} />
        <Route path="/popup-matchmaking" element={<PopupMatchmaking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
