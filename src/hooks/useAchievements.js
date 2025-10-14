// Realtime achievements hook (no deps)
// Usage: const { achievements, loading, error } = useAchievements(user?.uid);

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase"; // adjust if your client is elsewhere

export function useAchievements(uid) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);

    const colRef = collection(db, `users/${uid}/achievements`);
    const q = query(colRef, orderBy("unlockedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAchievements(rows);
        setLoading(false);
      },
      (err) => {
        console.error("[useAchievements] snapshot error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { achievements, loading, error };
}

export default useAchievements;
