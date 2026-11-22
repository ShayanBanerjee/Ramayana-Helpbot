import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hand off from the static boot splash (index.html) once React has painted,
// so a reload fades into the app instead of flashing blank/background art.
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const boot = document.getElementById("boot");
    if (!boot) return;
    boot.classList.add("done");
    setTimeout(() => boot.remove(), 600);
  })
);
