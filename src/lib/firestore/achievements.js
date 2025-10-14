// src/lib/firestore/achievements.js
// Firestore helpers for milestone badges (JS + JSDoc types)

/**
 * @typedef {"accuracy"|"streak"|"volume"|"type"} BadgeCategory
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {BadgeCategory} category
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {number} unlockedAt
 * @property {Object<string, any>=} details
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ⬇️ Adjust this import to your Firestore client
// Example if you have something like src/lib/firebase.js exporting { db }:
import { db } from "../firebase"; // ← change if your path/name differs

/** @param {string} uid */
export function userAchievementsCol(uid) {
  return collection(db, `users/${uid}/achievements`);
}

/** @param {string} uid @param {string} achievementId */
export function userAchievementDoc(uid, achievementId) {
  return doc(db, `users/${uid}/achievements/${achievementId}`);
}

/** @param {string} uid @param {string} achievementId */
export async function hasAchievement(uid, achievementId) {
  const snap = await getDoc(userAchievementDoc(uid, achievementId));
  return snap.exists();
}

/** @param {string} uid @param {Achievement} achievement */
export async function awardAchievement(uid, achievement) {
  const payload = {
    ...achievement,
    unlockedAt: achievement.unlockedAt
      ? Timestamp.fromMillis(achievement.unlockedAt)
      : serverTimestamp(),
  };
  await setDoc(userAchievementDoc(uid, achievement.id), payload, { merge: true });
}

/** @param {string} uid */
export async function listAchievements(uid) {
  const snap = await getDocs(userAchievementsCol(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
