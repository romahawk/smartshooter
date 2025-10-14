/**
 * @typedef {{ date: string, shotsMade: number, shotsAttempted: number,
 *   type?: 'spot'|'catch_shoot'|'off_dribble'|'run_half'|'other' }} SessionLite
 */

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // ← adjust if your client is elsewhere

/** @param {string} uid */
export async function fetchUserSessionsLite(uid) {
  const col = collection(db, 'sessions');       // sessions stored at root
  const q = query(col, where('userId', '==', uid), orderBy('date', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map(d => {
    const data = d.data() || {};
    return {
      date: typeof data.date === 'string' ? data.date : new Date().toISOString(),
      shotsMade: data?.totals?.made ?? data.made ?? 0,
      shotsAttempted: data?.totals?.attempts ?? data.attempts ?? 0,
      type: data.type ?? 'other',
    };
  });
}
