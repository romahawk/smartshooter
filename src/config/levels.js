// Simple, extensible thresholds (cumulative XP needed to REACH the level)
export const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 200 },
  { level: 3, xp: 500 },
  { level: 4, xp: 1000 },
  { level: 5, xp: 2000 },
  { level: 6, xp: 3500 },
  { level: 7, xp: 5500 },
  { level: 8, xp: 8000 },
  { level: 9, xp: 11000 },
  { level: 10, xp: 15000 },
];

export function getLevelFromXP(totalXP) {
  let current = LEVELS[0];
  for (const row of LEVELS) {
    if (totalXP >= row.xp) current = row; else break;
  }
  return current.level;
}

export function getNextLevelXP(totalXP) {
  // returns xp threshold of NEXT level (or current if max)
  for (const row of LEVELS) {
    if (totalXP < row.xp) return row.xp;
  }
  return LEVELS[LEVELS.length - 1].xp; // at cap
}
