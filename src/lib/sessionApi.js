// Central session CRUD + post-save hooks.

import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  startAfter,
} from 'firebase/firestore';

import { awardBadgesAfterSave } from './integrations/award-on-save';
import { emit } from './events/bus.js';

const sessionsCol = collection(db, 'sessions');

/**
 * List sessions for a user (paged).
 * @param {string} uid
 * @param {number} pageSize
 * @param {any} cursor
 */
export async function listSessions(uid, pageSize = 10, cursor) {
  let q = query(sessionsCol, where('userId', '==', uid), orderBy('date', 'desc'), limit(pageSize));
  if (cursor) {
    q = query(
      sessionsCol,
      where('userId', '==', uid),
      orderBy('date', 'desc'),
      startAfter(cursor),
      limit(pageSize)
    );
  }
  const snap = await getDocs(q);
  return { docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })), cursor: snap.docs.at(-1) };
}

/**
 * Create a session document.
 * Expects data.userId to be set by caller.
 * @param {Object} data
 */
export async function createSession(data) {
  const now = Date.now();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await addDoc(sessionsCol, payload);

  // Award badges; emit toast event if any were granted.
  try {
    if (payload?.userId) {
      const awarded = await awardBadgesAfterSave(payload.userId);
      if (awarded?.length) emit({ type: 'badge_awarded', payload: awarded });
    }
  } catch (e) {
    console.warn('[badges] createSession award failed', e);
  }

  return ref;
}

/**
 * Update a session document by id.
 * Expects data.userId to be set (or you can pass it separately).
 * @param {string} id
 * @param {Object} data
 */
export async function updateSession(id, data) {
  const now = Date.now();
  await updateDoc(doc(db, 'sessions', id), { ...data, updatedAt: now });

  // Award badges; emit toast event if any were granted.
  try {
    const uid = data?.userId;
    if (uid) {
      const awarded = await awardBadgesAfterSave(uid);
      if (awarded?.length) emit({ type: 'badge_awarded', payload: awarded });
    }
  } catch (e) {
    console.warn('[badges] updateSession award failed', e);
  }
}

/**
 * Delete a session by id.
 * @param {string} id
 */
export async function deleteSession(id) {
  await deleteDoc(doc(db, 'sessions', id));
}
