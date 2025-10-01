import { create } from "zustand";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  init: () =>
    onAuthStateChanged(auth, (u) => {
      set({ user: u, loading: false });
    }),
  logout: () => signOut(auth),
}));
