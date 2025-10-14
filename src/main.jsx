// src/main.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { Toaster, toast } from "sonner";
import { initTheme } from "./lib/theme";
import { subscribe } from "./lib/events/bus.js"; // tiny event bus

// Apply stored/system theme BEFORE the app mounts
initTheme();

// Inline listener for badge_awarded events → sonner toasts
function BadgeToastListenerInline() {
  useEffect(() => {
    const off = subscribe((evt) => {
      if (evt?.type !== "badge_awarded") return;
      const awarded = Array.isArray(evt.payload) ? evt.payload : [];
      if (!awarded.length) return;

      if (awarded.length === 1) {
        const a = awarded[0];
        toast.success("New badge unlocked!", {
          description: a?.name || "Achievement unlocked",
        });
      } else {
        const names = awarded.map((a) => a?.name || "Badge").join(", ");
        toast.success(`You unlocked ${awarded.length} badges!`, {
          description: names,
        });
      }
    });
    return off;
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <BadgeToastListenerInline />
      <App />
      <Toaster richColors theme="system" position="top-right" toastOptions={{ duration: 2200 }} />
    </BrowserRouter>
  </React.StrictMode>
);
