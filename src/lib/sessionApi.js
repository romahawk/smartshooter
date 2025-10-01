// src/lib/sessionApi.js
import { db } from "./firebase";
import {
  collection, addDoc, doc, getDocs, query, where, orderBy, limit,
  updateDoc, deleteDoc, startAfter
} from "firebase/firestore";

const sessionsCol = collection(db, "sessions");

export async function listSessions(uid, pageSize = 10, cursor) {
  let q = query(sessionsCol, where("userId","==",uid), orderBy("date","desc"), limit(pageSize));
  if (cursor) q = query(sessionsCol, where("userId","==",uid), orderBy("date","desc"), startAfter(cursor), limit(pageSize));
  const snap = await getDocs(q);
  return { docs: snap.docs.map(d => ({ id: d.id, ...d.data() })), cursor: snap.docs.at(-1) };
}

export async function createSession(data) {
  data.createdAt = Date.now();
  data.updatedAt = Date.now();
  return await addDoc(sessionsCol, data);
}

export async function updateSession(id, data) {
  data.updatedAt = Date.now();
  await updateDoc(doc(db, "sessions", id), data);
}

export async function deleteSession(id) {
  await deleteDoc(doc(db, "sessions", id));
}
