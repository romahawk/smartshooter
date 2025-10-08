import React, { useEffect } from "react";

/**
 * Controlled analytics filters.
 * Parent owns the state; we never force our own 90d range.
 *
 * value: {
 *   windowDays: number,
 *   dateFrom: 'YYYY-MM-DD',
 *   dateTo: 'YYYY-MM-DD',
 *   types: string[],
 *   direction?: 'L->R'|'R->L'|'static'|'all',
 *   range?: 'paint'|'midrange'|'3pt'|'all'
 * }
 */
export default function AnalyticsFilters({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange({ ...v, ...patch });

  const applyWindow = (days) => {
    const today = new Date();
    const toISO = today.toISOString().slice(0, 10);
    const fromISO = new Date(today.getTime() - days * 86400000)
      .toISOString()
      .slice(0, 10);
    set({ windowDays: days, dateFrom: fromISO, dateTo: toISO });
  };

  // On first mount: if the parent forgot dates, derive from windowDays (default 7)
  useEffect(() => {
    if (!v.dateFrom || !v.dateTo) {
      applyWindow(Number(v.windowDays || 7));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers
  const isActive = (d) => Number(v.windowDays) === d;
  const toggleType = (t) => {
    const setTypes = new Set(v.types || []);
    if (setTypes.has(t)) setTypes.delete(t);
    else setTypes.add(t);
    set({ types: Array.from(setTypes) });
  };

  const onDateFromChange = (fromISO) => {
    const toISO = v.dateTo || new Date().toISOString().slice(0, 10);
    set({
      dateFrom: fromISO,
      windowDays: diffDays(fromISO, toISO),
    });
  };
  const onDateToChange = (toISO) => {
    const fromISO = v.dateFrom || toISO;
    set({
      dateTo: toISO,
      windowDays: diffDays(fromISO, toISO),
    });
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Window buttons */}
      <div className="flex gap-2 flex-wrap">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => applyWindow(d)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isActive(d) ? "bg-black text-white border-black" : "hover:bg-gray-50"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Date pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="date"
          value={v.dateFrom || ""}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="border rounded-lg p-2"
          title="From"
        />
        <input
          type="date"
          value={v.dateTo || ""}
          onChange={(e) => onDateToChange(e.target.value)}
          className="border rounded-lg p-2"
          title="To"
        />
      </div>

      {/* Type pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { k: "spot", label: "Spot" },
          { k: "catch_shoot", label: "Catch Shoot" },
          { k: "off_dribble", label: "Off Dribble" },
          { k: "run_half", label: "Run Half" },
        ].map((t) => {
          const active = (v.types || []).includes(t.k);
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => toggleType(t.k)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                active ? "bg-black text-white border-black" : "hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Direction / range */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={v.direction || "all"}
          onChange={(e) => set({ direction: e.target.value })}
          className="border rounded-lg p-2 text-sm"
          title="Direction"
        >
          <option value="all">All directions</option>
          <option value="L->R">L→R</option>
          <option value="R->L">R→L</option>
          <option value="static">static</option>
        </select>

        <select
          value={v.range || "all"}
          onChange={(e) => set({ range: e.target.value })}
          className="border rounded-lg p-2 text-sm"
          title="Range"
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

/* utils */
function diffDays(fromISO, toISO) {
  if (!fromISO || !toISO) return 7;
  const from = new Date(fromISO);
  const to = new Date(toISO);
  // inclusive window (e.g., 7d when from is 7 days before to)
  const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.round(ms / 86400000));
  return days;
}
