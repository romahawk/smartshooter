// src/utils/xpCalculator.js

// XP rules for one saved session
// Inputs: { shotsTaken, attempts, made, trainingType }
// trainingType: 'spot', 'catch_n_shoot', 'off_dribble', 'run_half_court', etc.

const TYPE_MULTIPLIER = {
  spot: 1.0,
  catch_n_shoot: 1.05,
  off_dribble: 1.2,
  run_half_court: 1.5,
};

// We’ll compare against the rounded percentage (to match UI)
const ACCURACY_BONUSES = [
  { minPct: 90, xp: 50 }, // 90%+
  { minPct: 80, xp: 25 }, // 80%+
  { minPct: 70, xp: 10 }, // 70%+
];

export function calculateSessionXP({ shotsTaken, attempts, made, trainingType }) {
  // accept either 'shotsTaken' or 'attempts'
  const taken = Number(shotsTaken != null ? shotsTaken : attempts) || 0;
  const madeNum = Number(made) || 0;

  // Base XP: +1 per shot
  const volumeXP = Math.max(0, taken);

  // Accuracy (rounded to match UI labels & player expectation)
  // e.g., 89.6% → rounds to 90%, so +50 XP applies
  const accuracyRaw = taken > 0 ? (madeNum / taken) : 0;
  const accuracyPct = accuracyRaw * 100;
  const accuracyPctRounded = Math.round(accuracyPct);

  // Pick the highest tier that matches the rounded percentage
  let accuracyBonus = 0;
  for (const tier of ACCURACY_BONUSES) {
    if (accuracyPctRounded >= tier.minPct) {
      accuracyBonus = tier.xp;
      break;
    }
  }

  const mult = TYPE_MULTIPLIER[String(trainingType || "spot")] ?? 1.0;

  // Final XP (rounded once at the end)
  const xp = Math.round((volumeXP + accuracyBonus) * mult);

  return {
    xp,
    breakdown: {
      volumeXP,
      accuracyBonus,
      multiplier: mult,
      accuracyPct,          // raw percent (e.g., 89.6)
      accuracyPctRounded,   // UI-aligned percent (e.g., 90)
      taken,
      made: madeNum,
    },
  };
}
