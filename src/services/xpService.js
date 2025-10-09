import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../firebase"; // your initialized Firestore
import { getLevelFromXP, getNextLevelXP } from "../config/levels";

export async function getUserXP(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { xp: 0, level: 1 };
  const data = snap.data();
  return { xp: data.xp ?? 0, level: data.level ?? 1 };
}

export async function addXPToUser(uid, sessionId, xpEarned) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  const prevXP = snap.exists() ? (snap.data().xp ?? 0) : 0;
  const newXP = prevXP + xpEarned;
  const newLevel = getLevelFromXP(newXP);

  if (!snap.exists()) {
    await setDoc(ref, {
      xp: newXP,
      level: newLevel,
      xpHistory: [
        { sessionId, xpEarned, ts: serverTimestamp() },
      ],
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      xp: newXP,
      level: newLevel,
      xpHistory: arrayUnion({ sessionId, xpEarned, ts: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    });
  }

  const nextLevelXP = getNextLevelXP(newXP);
  return { newXP, newLevel, nextLevelXP, leveledUp: newLevel > (snap.data()?.level ?? 1) };
}
