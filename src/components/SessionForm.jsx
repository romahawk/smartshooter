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
import { toast } from "sonner"; // toasts for validation

function orderForDirection(dir) {
  const isRTL =
    dir === "R→L" ||
    dir === "R-L" ||
    dir === "right_to_left" ||
    dir === "rtl";
  return isRTL
    ? ["right_corner", "right_wing", "center", "left_wing", "left_corner"]
    : ["left_corner", "left_wing", "center", "right_wing", "right_corner"];
}

const baseField =
  "border rounded-xl p-2 text-sm md:text-base " +
  "bg-white text-gray-900 border-gray-300 placeholder-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-teal-500/50 " +
  "dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400 " +
  "disabled:opacity-70";

const baseSelect =
  "w-full border rounded-lg p-2 text-sm md:text-base " +
  "bg-white text-gray-900 border-gray-300 " +
  "focus:outline-none focus:ring-2 focus:ring-teal-500/50 " +
  "dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700";

const baseLabel = "text-xs md:text-sm text-gray-700 dark:text-gray-300";

const baseCard =
  "border rounded-2xl p-3 md:p-4 space-y-3 md:space-y-4 " +
  "border-gray-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60";

const baseZoneCard =
  "border rounded-xl p-3 md:p-4 space-y-2 border-gray-200 dark:border-neutral-700 " +
  "bg-white/60 dark:bg-neutral-900/60";

export default function SessionForm({ initial, onSubmit, onCancel }) {
  const [model, setModel] = useState(normalizeInitial(initial));

  const setField = (k, v) => setModel((m) => ({ ...m, [k]: v }));

  const setZone = (rIdx, pos, patch) =>
    setModel((m) => {
      const rounds = [...m.rounds];
      const zones = rounds[rIdx].zones.map((z) => {
        if (z.position !== pos) return z;
        const next = { ...z, ...patch };
        // clamp: made ≤ attempts, no negatives
        const att = Math.max(0, Number(next.attempts ?? 0));
        const made = Math.max(0, Math.min(Number(next.made ?? 0), att));
        return { ...next, attempts: att, made };
      });
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

  const onChangeRoundRange = (i, newRange) =>
    setModel((m) => {
      const rounds = [...m.rounds];
      const zones = rounds[i].zones.map((z) => ({ ...z, range: newRange }));
      rounds[i] = { ...rounds[i], range: newRange, zones };
      return { ...m, rounds };
    });

  // NEW: bulk fill attempts for all zones in a round (you can edit per-zone after)
  const onBulkAttempts = (i, val) =>
    setModel((m) => {
      const n = Math.max(0, Number(val) || 0);
      const rounds = [...m.rounds];
      const zones = rounds[i].zones.map((z) => ({
        ...z,
        attempts: n,
        made: Math.min(Number(z.made || 0), n),
      }));
      rounds[i] = { ...rounds[i], shotsPerZone: n, zones };
      return { ...m, rounds };
    });

  const validate = () => {
    const totalAttempts = sum(model, "attempts");
    const totalMade = sum(model, "made");
    if (totalAttempts === 0)
      return "Enter attempts for at least one zone in any round.";
    if (totalMade > totalAttempts) return "Made cannot exceed attempts.";
    // per-zone clamp is enforced during edits, but double-check:
    for (const r of model.rounds) {
      for (const z of r.zones) {
        if (Number(z.made || 0) > Number(z.attempts || 0)) {
          return "Some zones have 'made' greater than 'attempts'.";
        }
      }
    }
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    // Normalize: keep per-zone attempts as edited; clamp again defensively.
    const normalizedRounds = model.rounds.map((r) => ({
      ...r,
      zones: r.zones.map((z) => {
        const att = Math.max(0, Number(z.attempts || 0));
        const made = Math.max(0, Math.min(Number(z.made || 0), att));
        return {
          ...z,
          range: r.range,
          attempts: att,
          made,
        };
      }),
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className={baseLabel}>Date</label>
          <input
            type="date"
            value={model.date}
            onChange={(e) => setField("date", e.target.value)}
            className={baseField}
            aria-label="Session date"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={baseLabel}>Training type</label>
          <select
            value={model.type}
            onChange={(e) => setField("type", e.target.value)}
            className={baseSelect}
            aria-label="Training type"
          >
            {TRAINING_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 lg:col-span-1 sm:col-span-2">
          <label className={baseLabel}>Notes</label>
          <input
            placeholder="Optional notes"
            value={model.notes}
            onChange={(e) => setField("notes", e.target.value)}
            className={baseField}
            aria-label="Notes"
          />
        </div>
      </div>

      {/* Rounds */}
      {model.rounds.map((r, i) => (
        <div key={i} className={baseCard}>
          {/* Round header controls */}
          <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-5 items-center">
            <div className="col-span-2 md:col-span-1 flex items-center">
              <span className="font-medium text-sm md:text-base text-gray-900 dark:text-gray-100">
                Round {i + 1}
              </span>
            </div>

            {/* Direction */}
            <div className="col-span-1">
              <label className={`${baseLabel} mb-1 block`}>Direction</label>
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
                className={baseSelect}
                aria-label="Direction"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Range */}
            <div className="col-span-1">
              <label className={`${baseLabel} mb-1 block`}>Range</label>
              <select
                value={r.range}
                onChange={(e) => onChangeRoundRange(i, e.target.value)}
                className={baseSelect}
                aria-label="Range"
              >
                {RANGE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk attempts */}
            <div className="col-span-1">
              <label className={`${baseLabel} mb-1 block`}>
                Bulk attempts (fill all zones)
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={Number(r.shotsPerZone ?? 10)}
                onChange={(e) => onBulkAttempts(i, e.target.value)}
                className={baseField}
                aria-label="Bulk attempts"
              />
            </div>

            <div className="col-span-1 md:col-span-1 flex justify-end items-end">
              <button
                type="button"
                onClick={() => removeRound(i)}
                className="text-sm border rounded-lg px-2 py-2 w-full md:w-auto border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-900 dark:text-gray-100"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Zones grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {(orderForDirection(r.direction) || ZONE_POSITIONS).map((pos) => {
              const z =
                r.zones.find((x) => x.position === pos) || {
                  position: pos,
                  range: r.range,
                  made: 0,
                  attempts: r.shotsPerZone ?? 0,
                };
              const attempts = Number(z.attempts ?? 0);
              return (
                <div key={pos} className={baseZoneCard}>
                  <div className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                    {pretty[pos]}{" "}
                    <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      ({r.range} • {attempts})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Made */}
                    <div className="flex flex-col gap-1">
                      <label className={baseLabel}>Made</label>
                      <input
                        type="number"
                        min="0"
                        max={Math.max(0, attempts)}
                        inputMode="numeric"
                        className={baseField}
                        value={z.made ?? 0}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const clamped = Math.max(
                            0,
                            Math.min(n, Math.max(0, attempts))
                          );
                          setZone(i, pos, { made: clamped });
                        }}
                        aria-label={`${pretty[pos]} made`}
                      />
                    </div>

                    {/* Attempts (editable now) */}
                    <div className="flex flex-col gap-1">
                      <label className={baseLabel}>Attempts</label>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        className={baseField}
                        value={attempts}
                        onChange={(e) => {
                          const n = Math.max(0, Number(e.target.value) || 0);
                          setZone(i, pos, { attempts: n });
                        }}
                        aria-label={`${pretty[pos]} attempts`}
                      />
                    </div>
                  </div>

                  {attempts === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Zone inactive (0 attempts)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={addRound}
          className="border rounded-xl px-3 py-2 text-sm md:text-base border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-900 dark:text-gray-100"
        >
          + Add round
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border rounded-xl px-3 py-2 text-sm md:text-base border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-900 dark:text-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="bg-black text-white dark:bg-white dark:text-black rounded-xl px-4 py-2 text-sm md:text-base"
          >
            Save session
          </button>
        </div>
      </div>
    </div>
  );
}

function sum(model, key) {
  return model.rounds
    .flatMap((r) => r.zones)
    .reduce((a, z) => a + (Number(z?.[key]) || 0), 0);
}
