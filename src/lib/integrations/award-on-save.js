// Evaluate and award badges for a user after a session save/update.

import { fetchUserSessionsLite } from '../sessions/fetchUserSessionsLite';
import { evaluateAndAwardAchievements } from '../achievements/engine';

/**
 * @param {string} uid
 * @returns {Promise<Array>} list of newly awarded achievements (may be empty)
 */
export async function awardBadgesAfterSave(uid) {
  try {
    const sessions = await fetchUserSessionsLite(uid);
    const awarded = await evaluateAndAwardAchievements(uid, sessions);
    return awarded;
  } catch (err) {
    console.error('[badges] awardBadgesAfterSave failed:', err);
    return [];
  }
}
