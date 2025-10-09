import { useEffect } from "react";

export default function LevelUpToast({ level, onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-8 z-[9999] pointer-events-none">
      <div className="pointer-events-auto rounded-2xl px-4 py-3 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-emerald-300/40 dark:border-emerald-600/40">
        <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
          🎉 Level Up!
        </div>
        <div className="text-gray-700 dark:text-gray-200">You reached <b>Level {level}</b>.</div>
      </div>
    </div>
  );
}
