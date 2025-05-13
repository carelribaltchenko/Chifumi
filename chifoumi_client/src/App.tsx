import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Matchmaking from "./pages/matchmaking";
import GameRoom from "./components/gameRoom";
import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import AuthForm from "./components/authForm";
import './index.css';

function App() {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (!error) setUserProfile(data);
      }
    };

    getUser();
  }, []);

  const handleLogout = () => {
    setUserProfile(null);
  };

  if (!userProfile) {
    return <AuthForm onLogin={setUserProfile} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home userProfile={userProfile} onLogout={handleLogout} />} />
        <Route path="/matchmaking" element={<Matchmaking userProfile={userProfile} />} />
        <Route path="/game/:roomId" element={<GameRoom userProfile={userProfile} />} />
      </Routes>
    </Router>
  );
}

export default App;
