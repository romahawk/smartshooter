// --- src/ui/toast/ToastProvider.jsx ---
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { subscribe } from "../../lib/events/bus.js";

const ToastContext = createContext({ push: (_t) => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((t) => {
    const id = ++idRef.current;
    const item = { id, ...t };
    setItems((prev) => [item, ...prev]);
    // auto-dismiss after 3.5s
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  // Listen for badge events
  useEffect(() => {
    const off = subscribe((evt) => {
      if (evt?.type === "badge_awarded") {
        const awarded = Array.isArray(evt.payload) ? evt.payload : [];
        awarded.forEach((a) =>
          push({
            title: "New badge unlocked!",
            description: a?.name || "Achievement unlocked",
            icon: a?.icon || "🏅",
          })
        );
      }
    });
    return off;
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {/* toast viewport */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,360px)]">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-xl border shadow-lg bg-white/95 dark:bg-neutral-900/90 backdrop-blur p-3"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">{t.icon || "🔔"}</div>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
