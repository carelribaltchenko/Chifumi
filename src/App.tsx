import { useEffect, useState } from "react";
import AuthForm from "./components/authForm";
import Home from "./components/home";
import { supabase } from "./services/supabaseClient";
import { getProfile } from "./services/profile";

function App() {
  const [userProfile, setUserProfile] = useState<any>(null);

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

  return (
    <div>
      <h1>Chifoumi</h1>
      {userProfile ? (
        <Home
        userProfile={userProfile}
        onLogout={() => setUserProfile(null)}
      />
      ) : (
        <AuthForm onLogin={(profile) => setUserProfile(profile)} />
      )}
    </div>
  );
}

export default App;
