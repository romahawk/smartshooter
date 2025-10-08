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
import { toast } from "sonner"; // ✅ toasts for validation

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

  const onChangeRoundRange = (i, newRange) =>
    setModel((m) => {
      const rounds = [...m.rounds];
      const zones = rounds[i].zones.map((z) => ({ ...z, range: newRange }));
      rounds[i] = { ...rounds[i], range: newRange, zones };
      return { ...m, rounds };
    });

  const onChangeShotsPerZone = (i, val) =>
    setModel((m) => {
      const n = Number(val);
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
    const attempts = sum(model, "attempts");
    const made = sum(model, "made");
    if (made > attempts) return "Made cannot exceed attempts.";
    if (!model.rounds.some((r) => Number(r.shotsPerZone || 0) > 0))
      return "Add at least one shot.";
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) {
      toast.error(err); // ✅ surface validation via toast
      return;
    }

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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs md:text-sm opacity-70">Date</label>
          <input
            type="date"
            value={model.date}
            onChange={(e) => setField("date", e.target.value)}
            className="border rounded-xl p-2 text-sm md:text-base"
            aria-label="Session date"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs md:text-sm opacity-70">Training type</label>
          <select
            value={model.type}
            onChange={(e) => setField("type", e.target.value)}
            className="border rounded-xl p-2 text-sm md:text-base"
            aria-label="Training type"
          >
            {TRAINING_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 lg:col-span-1 sm:col-span-2">
          <label className="text-xs md:text-sm opacity-70">Notes</label>
          <input
            placeholder="Optional notes"
            value={model.notes}
            onChange={(e) => setField("notes", e.target.value)}
            className="border rounded-xl p-2 text-sm md:text-base"
            aria-label="Notes"
          />
        </div>
      </div>

      {/* Rounds */}
      {model.rounds.map((r, i) => (
        <div key={i} className="border rounded-2xl p-3 md:p-4 space-y-3 md:space-y-4">
          {/* Round header controls */}
          <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-5 items-center">
            <div className="col-span-2 md:col-span-1 flex items-center">
              <span className="font-medium text-sm md:text-base">Round {i + 1}</span>
            </div>

            {/* Direction */}
            <div className="col-span-1">
              <label className="block text-xs opacity-70 mb-1">Direction</label>
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
                className="w-full border rounded-lg p-2 text-sm md:text-base"
                aria-label="Direction"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Range */}
            <div className="col-span-1">
              <label className="block text-xs opacity-70 mb-1">Range</label>
              <select
                value={r.range}
                onChange={(e) => onChangeRoundRange(i, e.target.value)}
                className="w-full border rounded-lg p-2 text-sm md:text-base"
                aria-label="Range"
              >
                {RANGE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* shots/zone */}
            <div className="col-span-1">
              <label className="block text-xs opacity-70 mb-1">Shots per zone</label>
              <select
                value={r.shotsPerZone ?? 10}
                onChange={(e) => onChangeShotsPerZone(i, e.target.value)}
                className="w-full border rounded-lg p-2 text-sm md:text-base"
                aria-label="Shots per zone"
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-1 flex justify-end items-end">
              <button
                type="button"
                onClick={() => removeRound(i)}
                className="text-sm border rounded-lg px-2 py-2 hover:bg-gray-50 w-full md:w-auto"
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
                  attempts: r.shotsPerZone ?? 10,
                };
              const attempts = Number(r.shotsPerZone ?? z.attempts ?? 0);
              return (
                <div key={pos} className="border rounded-xl p-3 md:p-4 space-y-2">
                  <div className="text-sm md:text-base font-medium">
                    {pretty[pos]}{" "}
                    <span className="text-xs md:text-sm text-gray-500">
                      ({r.range} • {attempts})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Made */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs opacity-70">Made</label>
                      <input
                        type="number"
                        min="0"
                        max={attempts}
                        inputMode="numeric"
                        className="w-full border rounded p-2 text-sm md:text-base"
                        value={z.made ?? 0}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const clamped = Math.min(Math.max(0, n), attempts);
                          setZone(i, pos, { made: clamped });
                        }}
                        aria-label={`${pretty[pos]} made`}
                      />
                    </div>

                    {/* Attempts (read-only) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs opacity-70">Attempts</label>
                      <input
                        type="number"
                        className="w-full border rounded p-2 bg-gray-50 text-sm md:text-base"
                        value={attempts}
                        readOnly
                        tabIndex={-1}
                        aria-label={`${pretty[pos]} attempts`}
                      />
                    </div>
                  </div>
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
          className="border rounded-xl px-3 py-2 text-sm md:text-base"
        >
          + Add round
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border rounded-xl px-3 py-2 text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="bg-black text-white rounded-xl px-4 py-2 text-sm md:text-base"
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
