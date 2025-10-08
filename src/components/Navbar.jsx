// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Sparkles, LifeBuoy, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";

export default function Navbar() {
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  // Keyboard: Shift+O open, Esc close
  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock background scroll while modal open
  useEffect(() => {
    const { body } = document;
    const prev = body.style.overflow;
    if (open) body.style.overflow = "hidden";
    return () => { body.style.overflow = prev; };
  }, [open]);

  const startOnboarding = () => {
    window.dispatchEvent(new CustomEvent("smarthooper:onboarding:start"));
    setOpen(false);
  };
  const loadSampleData = () => {
    window.dispatchEvent(new CustomEvent("smarthooper:onboarding:seed"));
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-neutral-900/80 border-b border-orange-300/60 dark:border-orange-400/40 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
      <div className="mx-auto max-w-7xl h-14 px-3 md:px-6 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2" aria-label="SmartShooter">
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">SmartShooter</span>
          <span className="hidden sm:inline-block h-5 w-px bg-orange-500/30" />
          <span className="hidden sm:inline text-xs text-orange-700/80 dark:text-orange-300/90">analytics</span>
        </Link>

        {/* Right actions */}
        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Onboarding (Shift+O)"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-orange-200/90 dark:bg-orange-300/90 text-slate-900 hover:bg-orange-200 active:bg-orange-300 px-3 py-1.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
          </button>

          <Link
            to="/help"
            title="Help & docs"
            className="hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            <LifeBuoy className="h-4 w-4" />
            <span className="hidden lg:inline">Help</span>
          </Link>

          <ThemeToggle />

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>

      {/* 🔒 Render modal via a PORTAL so it's not constrained by the header */}
      {open && createPortal(
        <OnboardingModal
          onClose={() => setOpen(false)}
          onStart={startOnboarding}
          onSeed={loadSampleData}
        />,
        document.body
      )}
    </header>
  );
}

/* ---------- Onboarding Modal (portal content) ---------- */
function OnboardingModal({ onClose, onStart, onSeed }) {
  const panelRef = useRef(null);

  // Focus the dialog when it opens
  useEffect(() => {
    const prev = document.activeElement;
    panelRef.current?.focus();
    return () => prev?.focus?.();
  }, []);

  return (
    // Full-viewport overlay above everything
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Center the panel; ensure it fully fits on any screen without cutting off the top */}
      <div className="relative h-full w-full grid place-items-center p-4 sm:p-6">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl p-5 outline-none
                     max-h-[min(92dvh,600px)] overflow-auto"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-300" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Welcome! Let’s get you set up
            </h2>
          </div>

          <ol className="list-decimal ml-5 mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <li><b>Create your first session</b> — pick a training type, zone(s), rounds, and notes.</li>
            <li><b>Track accuracy</b> — mark made/attempts per round to build your heatmaps.</li>
            <li><b>Explore analytics</b> — check the Court & Zones heatmaps and Trends to find focus areas.</li>
          </ol>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onStart}
              className="inline-flex justify-center items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
            >
              <Sparkles className="h-4 w-4" />
              Start onboarding
            </button>

            <button
              onClick={onSeed}
              className="inline-flex justify-center items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-orange-100 text-slate-900 dark:bg-orange-200 px-4 py-2 text-sm font-medium hover:bg-orange-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
              title="Load demo data to explore charts immediately"
            >
              Load sample data
            </button>

            <button
              onClick={onClose}
              className="ml-auto inline-flex justify-center items-center rounded-xl border border-transparent px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Tip: Press <kbd className="px-1 py-0.5 border rounded">Shift</kbd>+
            <kbd className="px-1 py-0.5 border rounded">O</kbd> anytime to open onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}
