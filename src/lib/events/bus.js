// src/lib/events/bus.js
// Tiny global event bus (no deps)

const listeners = new Set();

/** Subscribe to events. Returns an unsubscribe fn. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Emit an event: { type: string, payload: any } */
export function emit(evt) {
  for (const fn of listeners) fn(evt);
}
