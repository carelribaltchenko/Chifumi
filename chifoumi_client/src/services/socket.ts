import { io } from "socket.io-client";

export const socket = io("http://localhost:3001", {
  autoConnect: false, // Désactivé pour contrôler manuellement
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 5000,
  withCredentials: true,
  auth: (cb) => {
    const token = localStorage.getItem('token');
    cb({ token });
  }
});

// Debug
socket.on("connect", () => {
  console.log("🟢 Socket connecté :", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket déconnecté :", reason);
  if (reason === "io server disconnect") {
    console.warn("Le serveur a forcé la déconnexion");
  }
});

socket.on("connect_error", (err) => {
  console.error("❌ Erreur de connexion:", err.message);
});

// Pour le débogage en développement
if (process.env.NODE_ENV === 'development') {
  localStorage.debug = 'socket.io*';
}
