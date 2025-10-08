import { useEffect, useState } from "react";
import { getStoredTheme, getSystemTheme, setTheme } from "../lib/theme";

export default function ThemeToggle({ className = "" }) {
  const [theme, setLocal] = useState(() => getStoredTheme() || getSystemTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  const toggle = () => setLocal((t) => (t === "dark" ? "light" : "dark"));

  const label = theme === "dark" ? "Dark" : "Light";
  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-lg px-3 py-2 text-sm border inline-flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800 ${className}`}
      title="Toggle light / dark theme"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 dark:bg-blue-400" />
      {label} mode
    </button>
  );
}
