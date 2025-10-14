// src/components/badges/BadgesPanel.jsx
import React from "react";
import { useAchievements } from "../../hooks/useAchievements.js";

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">🏅</span>
      <h3 className="text-xl font-bold tracking-tight">{children}</h3>
    </div>
  );
}

function BadgeSkeleton() {
  return (
    <div className="rounded-2xl border p-3 shadow-sm bg-white/50 dark:bg-neutral-900/40 animate-pulse">
      <div className="h-6 w-6 rounded-md mb-2 bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-2/3 rounded mb-2 bg-black/10 dark:bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-black/10 dark:bg-white/10" />
    </div>
  );
}

function BadgeCard({ a }) {
  const millis =
    a?.unlockedAt && typeof a.unlockedAt.toMillis === "function"
      ? a.unlockedAt.toMillis()
      : a?.unlockedAt;
  const unlocked = millis ? new Date(millis).toLocaleDateString() : "";

  return (
    <div className="group relative flex items-start gap-3 rounded-2xl border p-3 shadow-sm bg-white/70 dark:bg-neutral-900/60 backdrop-blur transition hover:shadow-md">
      <div className="text-2xl leading-none select-none" aria-hidden>
        {a?.icon || "🏅"}
      </div>
      <div className="min-w-0">
        <div className="font-semibold leading-tight truncate">{a?.name || "Achievement"}</div>
        <div className="text-sm text-muted-foreground line-clamp-2">
          {a?.description || "Unlocked milestone"}
        </div>
        {unlocked && <div className="text-xs text-muted-foreground mt-1">Unlocked {unlocked}</div>}
      </div>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 pointer-events-none" />
    </div>
  );
}

export function BadgesPanel({ uid }) {
  const { achievements, loading } = useAchievements(uid);
  if (!uid) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Milestone Badges</SectionTitle>
        {loading && <span className="text-sm text-muted-foreground">Loading…</span>}
      </div>

      {!loading && achievements.length === 0 && (
        <div className="rounded-2xl border p-5 bg-white/60 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="text-2xl">👟</div>
            <div>
              <div className="font-medium">No badges yet</div>
              <div className="text-sm text-muted-foreground">
                Log a session to start unlocking Accuracy, Streak, and Volume milestones.
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <BadgeSkeleton />
          <BadgeSkeleton />
          <BadgeSkeleton />
        </div>
      )}

      {!loading && achievements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <BadgeCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </section>
  );
}

export default BadgesPanel; // <-- default export present
