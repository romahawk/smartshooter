import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "sonner";
import { initTheme } from "./lib/theme"; // ⬅️ initialize theme class on <html>

// Apply stored/system theme BEFORE the app mounts
initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Global toast host */}
      <Toaster
        richColors
        theme="system"          // ⬅️ follows light/dark (including your toggle)
        position="top-right"
        toastOptions={{ duration: 2200 }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
