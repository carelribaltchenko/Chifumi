import { io } from "socket.io-client";
export const socket = io("http://localhost:3001"); // remplace l’URL si besoin
export default socket;
