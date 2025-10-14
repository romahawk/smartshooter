// src/ui/toast/BadgeToastListener.jsx
import { useEffect } from "react";
import { toast } from "sonner";
import { subscribe } from "../../lib/events/bus.js";

/**
 * Mount once at app root. Listens for { type: 'badge_awarded', payload: Achievement[] }
 * and shows a sonner toast per badge.
 */
export default function BadgeToastListener() {
  useEffect(() => {
    const off = subscribe((evt) => {
      if (evt?.type !== "badge_awarded") return;
      const awarded = Array.isArray(evt.payload) ? evt.payload : [];
      if (!awarded.length) return;

      if (awarded.length === 1) {
        const a = awarded[0];
        toast.success("New badge unlocked!", {
          description: a?.name || "Achievement unlocked",
          // sonner supports React nodes; emoji in title via prefix unicode is enough
        });
      } else {
        // multiple badges at once
        const names = awarded.map((a) => a?.name || "Badge").join(", ");
        toast.success(`You unlocked ${awarded.length} badges!`, {
          description: names,
        });
      }
    });
    return off;
  }, []);

  return null;
}
