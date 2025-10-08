// src/lib/devDelay.js
export const devDelay = async (ms = 1200) => {
  // Only delay in dev AND when ?slow is present
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("slow")) {
    await new Promise((r) => setTimeout(r, ms));
  }
};
