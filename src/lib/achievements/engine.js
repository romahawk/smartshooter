// Achievements evaluation + awarding engine (JS)

/**
 * @typedef {import('../sessions/fetchUserSessionsLite').SessionLite} SessionLite
 */

import { awardAchievement, hasAchievement } from '../firestore/achievements';

export const BADGES = {
  // Accuracy (single best session)
  accuracy80: { id: 'accuracy_80', category: 'accuracy', name: 'Marksman 80%', description: 'Hit 80%+ accuracy in a session', icon: '🎯' },
  accuracy85: { id: 'accuracy_85', category: 'accuracy', name: 'Sharpshooter 85%', description: 'Hit 85%+ accuracy in a session', icon: '🎯' },
  accuracy90: { id: 'accuracy_90', category: 'accuracy', name: 'Sniper 90%', description: 'Hit 90%+ accuracy in a session', icon: '🎯' },
  // Streaks (consecutive calendar days trained)
  streak7:   { id: 'streak_7d', category: 'streak', name: 'Weekly Warrior', description: 'Train 7 days in a row', icon: '🔥' },
  streak30:  { id: 'streak_30d', category: 'streak', name: 'Iron Streak 30', description: 'Train 30 days in a row', icon: '🔥' },
  // Volume (lifetime attempts)
  vol500:   { id: 'volume_500', category: 'volume', name: '500 Up', description: 'Reach 500 total shots', icon: '🚀' },
  vol5000:  { id: 'volume_5000', category: 'volume', name: '5,000 Grinder', description: 'Reach 5,000 total shots', icon: '🚀' },
  // Type-specific (session counts by type)
  typeCatch:{ id: 'type_cns', category: 'type', name: 'Catch & Shoot Pro', description: 'Complete 5 Catch & Shoot sessions', icon: '🏀' },
  typeOtd:  { id: 'type_otd', category: 'type', name: 'Off the Dribble Pro', description: 'Complete 5 Off the Dribble sessions', icon: '🏀' },
};

function toDateOnly(ts) {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function calcStreak(datesISO) {
  if (!datesISO.length) return 0;
  const days = Array.from(new Set(datesISO.map(toDateOnly))).sort();
  let streak = 1, best = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) { streak++; best = Math.max(best, streak); }
    else if (diff > 1) { streak = 1; }
  }
  return best;
}

/**
 * Aggregate minimal stats from sessions.
 * @param {SessionLite[]} sessions
 */
export function aggregateSessions(sessions) {
  let totalShots = 0, totalMakes = 0, best = 0;
  const dates = [];
  const typeCounts = {};
  for (const s of sessions) {
    totalShots += s.shotsAttempted || 0;
    totalMakes += s.shotsMade || 0;
    const acc = s.shotsAttempted ? s.shotsMade / s.shotsAttempted : 0;
    best = Math.max(best, acc);
    dates.push(toDateOnly(s.date));
    if (s.type) typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1;
  }
  return { totalShots, totalMakes, sessionDates: dates, typeCounts, bestSingleSessionAcc: best };
}

/**
 * Decide which badges are met by current aggregates.
 * @param {{ totalShots:number, totalMakes:number, sessionDates:string[], typeCounts:Object.<string,number>, bestSingleSessionAcc:number }} stats
 */
export function evaluateBadges(stats) {
  const out = [];
  const accPct = stats.bestSingleSessionAcc * 100;
  if (accPct >= 90) out.push(BADGES.accuracy90);
  else if (accPct >= 85) out.push(BADGES.accuracy85);
  else if (accPct >= 80) out.push(BADGES.accuracy80);

  const streak = calcStreak(stats.sessionDates);
  if (streak >= 30) out.push(BADGES.streak30);
  else if (streak >= 7) out.push(BADGES.streak7);

  if (stats.totalShots >= 5000) out.push(BADGES.vol5000);
  else if (stats.totalShots >= 500) out.push(BADGES.vol500);

  if ((stats.typeCounts['catch_shoot'] ?? 0) >= 5) out.push(BADGES.typeCatch);
  if ((stats.typeCounts['off_dribble'] ?? 0) >= 5) out.push(BADGES.typeOtd);

  // stamp time for display; Firestore adapter will convert to Timestamp
  return out.map(a => ({ ...a, unlockedAt: Date.now() }));
}

/**
 * Evaluate and write any *new* achievements. Returns the list of newly awarded.
 * @param {string} uid
 * @param {SessionLite[]} sessions
 * @returns {Promise<Array<{id:string, name:string, description:string, icon:string, category:string, unlockedAt:number}>>}
 */
export async function evaluateAndAwardAchievements(uid, sessions) {
  const stats = aggregateSessions(sessions);
  const candidates = evaluateBadges(stats);
  const newlyAwarded = [];
  for (const ach of candidates) {
    const already = await hasAchievement(uid, ach.id);
    if (!already) {
      await awardAchievement(uid, ach);
      newlyAwarded.push(ach);
    }
  }
  return newlyAwarded;
}
