// src/components/LevelUpToast.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Controlled toast (no external deps).
 *
 * Props:
 *  - open: boolean (required)              -> controls visibility
 *  - onOpenChange: (open:boolean)=>void    -> called to request close/open
 *  - level: number (required)
 *  - duration?: number (ms, default 4000)  -> auto-hide timer
 *  - milestone?: boolean (default false)
 */
export default function LevelUpToast({
  open,
  onOpenChange,
  level,
  duration = 4000,
  milestone = false,
}) {
  const [mounted, setMounted] = useState(false); // for enter/exit animation
  const timerRef = useRef(null);

  // Enter / exit animation driver
  useEffect(() => {
    if (open) {
      // kick in enter animation in next tick
      const id = setTimeout(() => setMounted(true), 10);
      // start auto-dismiss
      timerRef.current = setTimeout(() => onOpenChange?.(false), duration);
      return () => {
        clearTimeout(id);
        clearTimeout(timerRef.current);
      };
    } else {
      // ensure we reset animation state when closed
      setMounted(false);
      clearTimeout(timerRef.current);
    }
  }, [open, duration, onOpenChange]);

  // Close handler (X button, ESC key)
  const closeNow = () => {
    clearTimeout(timerRef.current);
    setMounted(false);
    // wait for exit transition (~250ms), then notify parent to unmount
    setTimeout(() => onOpenChange?.(false), 250);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <div
        className={[
          "pointer-events-auto select-none rounded-2xl border border-emerald-400/40",
          "dark:border-emerald-500/40 bg-white/90 dark:bg-gray-900/90",
          "backdrop-blur px-4 py-3 shadow-xl transition-all duration-250 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
        ].join(" ")}
        style={{ transitionDuration: "250ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 text-white text-xl shadow-md">
            🎉
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Level Up!
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              You reached <span className="font-bold">Level {level}</span>.
            </p>
            {milestone && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                Milestone level — new badge unlocked!
              </p>
            )}

            {/* Timer bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <span
                className="block h-full bg-emerald-500 transition-[width] ease-linear"
                // When mounted becomes true, width animates to 0 across `duration`
                style={{
                  width: mounted ? "0%" : "100%",
                  transitionDuration: `${duration}ms`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={closeNow}
            className="ml-1 rounded-md px-1.5 text-lg leading-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
