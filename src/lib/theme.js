// src/lib/theme.js
const KEY = "theme"; // "light" | "dark"

export function getStoredTheme() {
  const t = localStorage.getItem(KEY);
  if (t === "light" || t === "dark") return t;
  return null;
}

export function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function initTheme() {
  const fromStore = getStoredTheme();
  const theme = fromStore || getSystemTheme();
  applyTheme(theme);
  return theme;
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}
