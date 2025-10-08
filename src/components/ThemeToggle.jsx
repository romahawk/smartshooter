import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Theme toggle that:
 * - Persists theme to localStorage ("light" | "dark")
 * - Sets <html class="dark"> accordingly
 * - Shows "Dark mode" when light is active, "Light mode" when dark is active
 * - Ensures label is WHITE when dark mode is active (high contrast)
 */
export default function ThemeToggle() {
  const getInitial = () => {
    if (typeof document === "undefined") return false;
    // Prefer persisted setting, fallback to system, then light
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
    } catch {}
    return document.documentElement.classList.contains("dark");
  };

  const [isDark, setIsDark] = useState(getInitial);

  // Apply theme to <html> + persist
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);

  const label = isDark ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={() => setIsDark((v) => !v)}
      aria-label="Toggle theme"
      title="Toggle theme"
      className={[
        "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-colors",
        // Border & background by theme
        isDark
          ? "border border-white/20 bg-white/5 hover:bg-white/10"
          : "border border-black/10 bg-white/80 hover:bg-gray-50",
        // Text color — ensure WHITE when dark mode is active (requested)
        isDark ? "text-white" : "text-slate-700",
      ].join(" ")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );
}
