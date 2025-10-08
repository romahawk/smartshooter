import { useMemo } from "react";

const TYPE_KEYS = ["spot", "catch_shoot", "off_dribble", "run_half"];

export default function AnalyticsFilters({ value, onChange }) {
  const { windowDays = 7, dateFrom, dateTo, types = [], direction, range } = value;

  const isTypeOn = (t) => types.length === 0 || types.includes(t);
  const toggleType = (t) => {
    const next =
      types.length === 0
        ? [t]
        : types.includes(t)
        ? types.filter((x) => x !== t)
        : [...types, t];
    onChange({ ...value, types: next });
  };

  const quickRange = (d) => {
    const to = new Date();
    const from = new Date(Date.now() - d * 86400000);
    const iso = (dt) => dt.toISOString().slice(0, 10);
    onChange({
      ...value,
      windowDays: d,
      dateFrom: iso(from),
      dateTo: iso(to),
    });
  };

  const inputBase =
    "w-full border rounded-lg px-3 py-2 text-sm md:text-base " +
    "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-transparent " +
    "dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-400 " +
    "dark:focus:ring-white/10";

  const selectBase =
    "border rounded-lg px-3 py-2 text-sm md:text-base " +
    "bg-white border-gray-200 text-gray-900 " +
    "focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-transparent " +
    "dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:focus:ring-white/10";

  const pill = (active) =>
    `rounded-lg px-3 py-2 text-sm border transition-colors ${
      active
        ? "bg-black text-white border-black dark:bg-neutral-100 dark:text-black dark:border-neutral-100"
        : "bg-transparent hover:bg-gray-50 border-gray-200 text-gray-800 " +
          "dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800"
    }`;

  return (
    <div className="space-y-3">
      {/* Quick windows */}
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            className={pill(windowDays === d)}
            onClick={() => quickRange(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="date"
          value={dateFrom || ""}
          onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
          className={inputBase}
        />
        <input
          type="date"
          value={dateTo || ""}
          onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
          className={inputBase}
        />
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2">
        {TYPE_KEYS.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={pill(isTypeOn(t))}
          >
            {labelOfType(t)}
          </button>
        ))}
      </div>

      {/* Direction & Range */}
      <div className="flex flex-wrap gap-2">
        <select
          className={selectBase}
          value={direction || "all"}
          onChange={(e) =>
            onChange({
              ...value,
              direction: e.target.value === "all" ? undefined : e.target.value,
            })
          }
        >
          <option value="all">All directions</option>
          <option value="static">static</option>
          <option value="L->R">L→R</option>
          <option value="R->L">R→L</option>
        </select>

        <select
          className={selectBase}
          value={range || "all"}
          onChange={(e) =>
            onChange({
              ...value,
              range: e.target.value === "all" ? undefined : e.target.value,
            })
          }
        >
          <option value="all">All ranges</option>
          <option value="paint">paint</option>
          <option value="midrange">midrange</option>
          <option value="3pt">3pt</option>
        </select>
      </div>
    </div>
  );
}

function labelOfType(t) {
  switch (t) {
    case "spot":
      return "Spot";
    case "catch_shoot":
      return "Catch Shoot";
    case "off_dribble":
      return "Off Dribble";
    case "run_half":
      return "Run Half";
    default:
      return t;
  }
}
