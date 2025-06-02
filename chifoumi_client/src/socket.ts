// socket.ts
import { io } from "socket.io-client";
import { supabase } from "./services/supabaseClient";

// const URL = "http://162.19.26.84:3001"; // ton backend socket
const URL = "localhost:3001"


export const socket = io(URL, {
  autoConnect: false, // On connecte manuellement après avoir obtenu le token
  transports: ["websocket", "polling"], // fallback
});

// Fonction pour récupérer le token et connecter
export async function connectSocket() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    socket.auth = { token };
    socket.connect();
  } else {
    console.error("❌ Impossible d'obtenir le token pour la socket");
  }
}

