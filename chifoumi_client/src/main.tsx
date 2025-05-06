import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css'; // ✅ Ajoute ceci pour activer le CSS

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
