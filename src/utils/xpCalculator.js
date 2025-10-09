// XP rules for one saved session
// Inputs: { shotsTaken, made, trainingType }  (accuracy = made/shotsTaken)
// trainingType: 'spot', 'catch_n_shoot', 'off_dribble', 'run_half_court', etc.

const TYPE_MULTIPLIER = {
  spot: 1.0,
  catch_n_shoot: 1.05,
  off_dribble: 1.2,
  run_half_court: 1.5,
};

const ACCURACY_BONUSES = [
  { min: 0.7, xp: 10 },  // 70%+
  { min: 0.8, xp: 25 },  // 80%+
  { min: 0.9, xp: 50 },  // 90%+
];

export function calculateSessionXP({ shotsTaken, attempts, made, trainingType }) {
  // accept either 'shotsTaken' or 'attempts'
  const taken = shotsTaken != null ? Number(shotsTaken) : Number(attempts);

  const volumeXP = Math.max(0, taken || 0); // +1 per shot
  const accuracy = taken > 0 ? (made / taken) : 0;

  let accuracyBonus = 0;
  for (let i = ACCURACY_BONUSES.length - 1; i >= 0; i--) {
    if (accuracy >= ACCURACY_BONUSES[i].min) {
      accuracyBonus = ACCURACY_BONUSES[i].xp;
      break;
    }
  }

  const mult = TYPE_MULTIPLIER[trainingType] ?? 1.0;
  const xp = Math.round((volumeXP + accuracyBonus) * mult);

  return { xp, breakdown: { volumeXP, accuracyBonus, multiplier: mult, accuracy } };
}