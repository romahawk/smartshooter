import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// keep in sync with lib/theme.js
function getStoredTheme() {
  return localStorage.getItem("theme");
}
function setStoredTheme(t) {
  localStorage.setItem("theme", t);
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      setStoredTheme("dark");
    } else {
      root.classList.remove("dark");
      setStoredTheme("light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((v) => !v)}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <>
          <Sun size={16} strokeWidth={1.75} />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon size={16} strokeWidth={1.75} />
          <span>Dark mode</span>
        </>
      )}
    </button>
  );
}
