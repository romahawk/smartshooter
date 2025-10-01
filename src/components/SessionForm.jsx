// src/components/SessionForm.jsx
import { useState } from "react";
import {
  TRAINING_TYPES,
  DIRECTIONS,
  ZONE_POSITIONS,
  RANGE_TYPES,
  emptyRound,
  pretty,
  normalizeInitial,
} from "../lib/models";

export default function SessionForm({ initial, onSubmit, onCancel }) {
  const [model, setModel] = useState(normalizeInitial(initial));

  const setField = (k, v) => setModel((m) => ({ ...m, [k]: v }));

  const setZone = (rIdx, pos, patch) =>
    setModel((m) => {
      const rounds = [...m.rounds];
      const zones = rounds[rIdx].zones.map((z) =>
        z.position === pos ? { ...z, ...patch } : z
      );
      rounds[rIdx] = { ...rounds[rIdx], zones };
      return { ...m, rounds };
    });

  const addRound = () =>
    setModel((m) => ({
      ...m,
      rounds: [...m.rounds, emptyRound(m.rounds.length)],
    }));

  const removeRound = (i) =>
    setModel((m) => ({
      ...m,
      rounds: m.rounds
        .filter((_, idx) => idx !== i)
        .map((r, idx) => ({ ...r, roundIndex: idx })),
    }));

  // Apply range to entire round (and mirror into zones)
  const onChangeRoundRange = (i, newRange) =>
    setModel((m) => {
      const rounds = [...m.rounds];
      const zones = rounds[i].zones.map((z) => ({ ...z, range: newRange }));
      rounds[i] = { ...rounds[i], range: newRange, zones };
      return { ...m, rounds };
    });

  // Apply attempts per zone (shots/round) to the whole round
  const onChangeShotsPerZone = (i, val) =>
    setModel((m) => {
      const n = Number(val);
      const rounds = [...m.rounds];
      const zones = rounds[i].zones.map((z) => ({
        ...z,
        attempts: n,
        made: Math.min(Number(z.made || 0), n), // clamp made ≤ attempts
      }));
      rounds[i] = { ...rounds[i], shotsPerZone: n, zones };
      return { ...m, rounds };
    });

  const validate = () => {
    const attempts = sum(model, "attempts");
    const made = sum(model, "made");
    if (made > attempts) return "Made cannot exceed attempts.";
    if (!model.rounds.some((r) => Number(r.shotsPerZone || 0) > 0))
      return "Add at least one shot.";
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) return alert(err);

    // Ensure zones mirror round.range and round.shotsPerZone before save
    const normalizedRounds = model.rounds.map((r) => ({
      ...r,
      zones: r.zones.map((z) => ({
        ...z,
        range: r.range,
        attempts: r.shotsPerZone,
        made: Math.min(Number(z.made || 0), Number(r.shotsPerZone || 0)),
      })),
    }));

    const attempts = normalizedRounds
      .flatMap((r) => r.zones)
      .reduce((a, z) => a + Number(z.attempts || 0), 0);
    const made = normalizedRounds
      .flatMap((r) => r.zones)
      .reduce((a, z) => a + Number(z.made || 0), 0);

    onSubmit({
      ...model,
      rounds: normalizedRounds,
      totals: {
        made,
        attempts,
        accuracy: attempts ? Math.round((made / attempts) * 100) : 0,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="date"
          value={model.date}
          onChange={(e) => setField("date", e.target.value)}
          className="border rounded-xl p-2"
        />
        <select
          value={model.type}
          onChange={(e) => setField("type", e.target.value)}
          className="border rounded-xl p-2"
        >
          {TRAINING_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          placeholder="Notes"
          value={model.notes}
          onChange={(e) => setField("notes", e.target.value)}
          className="border rounded-xl p-2"
        />
      </div>

      {/* Rounds */}
      {model.rounds.map((r, i) => (
        <div key={i} className="border rounded-2xl p-3 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-medium">Round {i + 1}</span>

            {/* Direction */}
            <select
              value={r.direction}
              onChange={(e) => {
                const v = e.target.value;
                setModel((m) => {
                  const rounds = [...m.rounds];
                  rounds[i] = { ...rounds[i], direction: v };
                  return { ...m, rounds };
                });
              }}
              className="border rounded-lg p-2"
            >
              {DIRECTIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            {/* Range for ALL zones */}
            <select
              value={r.range}
              onChange={(e) => onChangeRoundRange(i, e.target.value)}
              className="border rounded-lg p-2"
              title="Shot range for all positions in this round"
            >
              {RANGE_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>

            {/* shots/round (attempts per zone) */}
            <select
              value={r.shotsPerZone ?? 10}
              onChange={(e) => onChangeShotsPerZone(i, e.target.value)}
              className="border rounded-lg p-2"
              title="Attempts per position for this round"
            >
              {[5, 10, 20].map((n) => (
                <option key={n} value={n}>
                  {n} shots/round
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => removeRound(i)}
              className="ml-auto text-sm border rounded-lg px-2 py-1"
            >
              Remove
            </button>
          </div>

          {/* Zone cards: 5 positions; Attempts are read-only and mirror shotsPerZone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {ZONE_POSITIONS.map((pos) => {
              const z =
                r.zones.find((x) => x.position === pos) || {
                  position: pos,
                  range: r.range,
                  made: 0,
                  attempts: r.shotsPerZone ?? 10,
                };
              const attempts = Number(r.shotsPerZone ?? z.attempts ?? 0);
              return (
                <div key={pos} className="border rounded-xl p-3 space-y-2">
                  <div className="text-sm font-medium">
                    {pretty[pos]}{" "}
                    <span className="text-xs text-gray-500">
                      ({r.range} • {attempts})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {/* Made (editable) */}
                    <input
                      type="number"
                      min="0"
                      className="w-1/2 border rounded p-2"
                      value={z.made ?? 0}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        const clamped = Math.min(Math.max(0, n), attempts);
                        setZone(i, pos, { made: clamped });
                      }}
                    />
                    {/* Attempts (read-only) */}
                    <input
                      type="number"
                      className="w-1/2 border rounded p-2 bg-gray-50"
                      value={attempts}
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={addRound} className="border rounded-xl px-3 py-2">
          + Add round
        </button>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="border rounded-xl px-3 py-2">
            Cancel
          </button>
          <button type="button" onClick={submit} className="bg-black text-white rounded-xl px-4 py-2">
            Save session
          </button>
        </div>
      </div>
    </div>
  );
}

/** utils */
function sum(model, key) {
  return model.rounds
    .flatMap((r) => r.zones)
    .reduce((a, z) => a + (Number(z?.[key]) || 0), 0);
}
