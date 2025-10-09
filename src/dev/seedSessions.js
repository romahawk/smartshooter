// src/dev/seedSessions.js
import { createSession } from "../lib/sessionApi";
import { calculateSessionXP } from "../utils/xpCalculator"; // ← add XP

const TYPES = ["spot", "catch_shoot", "off_dribble", "run_half"];
const RANGES = ["3pt", "midrange", "paint"];
const DIRS = ["L→R", "R→L", "static"];
const ZONES = ["left_corner", "left_wing", "center", "right_wing", "right_corner"];

// random helpers
const rpick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Date -> 'YYYY-MM-DD'
function fmt(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function makeRound() {
  const range = rpick(RANGES);
  const direction = rpick(DIRS);
  const shotsPerRound = rpick([5, 10, 20]);

  const zones = ZONES.map((position) => {
    const attempts = rint(Math.floor(shotsPerRound / 2), shotsPerRound);
    const made = rint(Math.floor(attempts * 0.3), attempts); // 30–100% for realism
    return { position, range, attempts, made };
  });

  return { direction, range, shotsPerRound, zones };
}

function calcTotals(rounds) {
  let made = 0, attempts = 0;
  rounds.forEach((r) =>
    r.zones.forEach((z) => {
      made += Number(z.made || 0);
      attempts += Number(z.attempts || 0);
    })
  );
  return { made, attempts, accuracy: attempts ? Math.round((made / attempts) * 100) : 0 };
}

// Normalize seed type names to XP calculator keys
function normalizeTrainingType(t) {
  if (!t) return "spot";
  const key = String(t).toLowerCase();
  if (key === "catch_shoot") return "catch_n_shoot";
  if (key === "run_half") return "run_half_court";
  return key; // 'spot' | 'off_dribble' | already normalized
}

/**
 * Seed N sessions for a user.
 * - Spreads dates over the last ~60 days
 * - Adds 1–3 rounds per session
 * - Ensures userId is set (passes your Firestore rules)
 * - NOW includes xpEarned based on totals + type
 */
export async function seedSessions(uid, n = 25) {
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - rint(0, 60)); // last ~2 months

    const roundsCount = rint(1, 3);
    const rounds = Array.from({ length: roundsCount }, makeRound);
    const totals = calcTotals(rounds);
    const type = rpick(TYPES);

    // ---- XP ----
    const trainingType = normalizeTrainingType(type);
    const { xp } = calculateSessionXP({
      attempts: totals.attempts,
      made: totals.made,
      trainingType,
    });

    const payload = {
      userId: uid,
      date: fmt(d),
      type,
      notes: "",
      rounds,
      totals,
      xpEarned: xp, // ← write per-session XP
      createdAt: new Date().toISOString(),
    };

    await createSession(payload);
  }
}
