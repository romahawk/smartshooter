// Positions on the arc / floor
export const ZONE_POSITIONS = [
  "left_corner",
  "left_wing",
  "center",
  "right_wing",
  "right_corner",
];

// Shot range / type selector
export const RANGE_TYPES = ["paint", "midrange", "3pt"];

// Keep training types & directions as-is
export const TRAINING_TYPES = ["spot", "catch_shoot", "off_dribble", "run_half"];
export const DIRECTIONS = ["L→R", "R→L", "static"];

// Helper to pretty print labels
export const pretty = {
  left_corner: "Left Corner",
  left_wing: "Left Wing",
  center: "Center",
  right_wing: "Right Wing",
  right_corner: "Right Corner",
};

// Round factory now includes range per zone (default to "3pt")
export const emptyRound = (i = 0) => ({
  roundIndex: i,
  direction: "static",
  range: "3pt",
  shotsPerZone: 10, // NEW: attempts per position in this round (5/10/20)
  zones: ZONE_POSITIONS.map((pos) => ({
    position: pos,
    range: "3pt",
    made: 0,
    attempts: 10,   // mirror shotsPerZone by default
  })),
});


export const newSession = (userId) => ({
  userId,
  date: new Date().toISOString().slice(0, 10),
  type: "spot",
  notes: "",
  rounds: [emptyRound(0)],
  totals: { made: 0, attempts: 0, accuracy: 0 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export function normalizeInitial(s) {
  const clone = JSON.parse(JSON.stringify(s));
  clone.rounds = (clone.rounds || []).map((r, idx) => {
    const roundRange = r.range || r?.zones?.[0]?.range || "3pt";
    const spz = Number(r.shotsPerZone ?? r?.zones?.[0]?.attempts ?? 10);
    const zones = (r.zones || []).map((z) => ({
      position: z.position || z.zoneId || "center",
      range: z.range || roundRange,
      made: Number(z.made || 0),
      attempts: Number(z.attempts ?? spz),
    }));
    return {
      roundIndex: r.roundIndex ?? idx,
      direction: r.direction || "static",
      range: roundRange,
      shotsPerZone: spz,
      zones,
    };
  });
  return clone;
}
