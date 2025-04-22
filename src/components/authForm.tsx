import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { signUp, signIn } from "../services/auth";
import { getProfile } from "../services/profile";

const handOptions = ["🖐🏻", "🖐🏼", "🖐🏽", "🖐🏾", "🖐🏿"];

export default function AuthForm({ onLogin }: { onLogin: (profile: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [handColor, setHandColor] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const profile = await getProfile();
        setUserProfile(profile);
        setEmail(sessionData.session.user.email ?? ""); // pour affichage
      }
    };
    loadSession();
  }, []);
  

  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) alert(error.message);
    else {
      const profile = await getProfile();
      setUserProfile(profile);
      onLogin(profile); // ← ICI
    }
  };

  const handleSignup = async () => {
    const { error } = await signUp(email, password, pseudo, handColor);
    if (error) alert("Erreur à l'inscription : " + error.message);
    else {
      const profile = await getProfile();
      setUserProfile(profile);
      onLogin(profile); // ← ICI AUSSI
    }
  };
  
  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && (!pseudo || !handColor))) {
      alert("Remplis tous les champs !");
      return;
    }

    let error;
    if (isLogin) {
      const res = await signIn(email, password);
      error = res.error;
    } else {
      const res = await signUp(email, password, pseudo, handColor);
      error = res.error;
    }

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      const profile = await getProfile();
      setUserProfile(profile);
    }
  };

  if (userProfile) {
    return (
      <div>
        <h2>Bienvenue, {userProfile.pseudo} 👋</h2>
        <p><strong>Email :</strong> {email}</p>
        <p><strong>Main :</strong> {userProfile.hand_color}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{isLogin ? "Connexion" : "Inscription"}</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: 10, padding: 8 }}
      />
      <br />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginBottom: 10, padding: 8 }}
      />
      <br />

      {!isLogin && (
        <>
          <input
            placeholder="Pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            style={{ marginBottom: 10, padding: 8 }}
          />
          <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
            {handOptions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setHandColor(emoji)}
                style={{
                  fontSize: 24,
                  padding: 10,
                  borderRadius: "50%",
                  border: emoji === handColor ? "2px solid #000" : "1px solid #ccc",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      <button onClick={handleSubmit} style={{ marginTop: 10, padding: 10 }}>
        {isLogin ? "Se connecter" : "S'inscrire"}
      </button>

      <p style={{ marginTop: 20 }}>
        {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
        <button onClick={() => setIsLogin(!isLogin)} style={{ color: "blue", textDecoration: "underline" }}>
          {isLogin ? "Créer un compte" : "Se connecter"}
        </button>
      </p>
    </div>
  );
}
