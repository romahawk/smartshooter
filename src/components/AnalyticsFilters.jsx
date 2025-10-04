// src/components/AnalyticsFilters.jsx
import React, { useMemo } from "react";

const TYPES = ["spot", "catch_shoot", "off_dribble", "run_half"];

export default function AnalyticsFilters({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  const todayStr = useMemo(() => new Date().toISOString().slice(0,10), []);
  const toStr = (d) => d?.toISOString?.().slice(0,10) ?? "";

  const onPreset = (days) => {
    const to = new Date();
    const from = new Date(); from.setDate(from.getDate() - days);
    set({ from, to, windowDays: days });
  };

  const toggleType = (t) => {
    const cur = new Set(v.types || []);
    if (cur.has(t)) cur.delete(t); else cur.add(t);
    set({ types: Array.from(cur) });
  };

  return (
    <div className="border rounded-2xl p-3 space-y-3">
      <div className="text-sm font-semibold">Filters</div>

      {/* Presets */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => onPreset(d)}
            className={`px-3 py-1 rounded-lg border ${v.windowDays===d ? "bg-black text-white" : ""}`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={toStr(v.from)}
          onChange={(e) => set({ from: e.target.value ? new Date(e.target.value) : undefined })}
          className="border rounded-lg p-2"
          max={todayStr}
        />
        <input
          type="date"
          value={toStr(v.to)}
          onChange={(e) => set({ to: e.target.value ? new Date(e.target.value) : undefined })}
          className="border rounded-lg p-2"
          max={todayStr}
        />
      </div>

      {/* Types */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => {
          const active = (v.types || []).includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-3 py-1 rounded-lg border capitalize ${active ? "bg-black text-white" : ""}`}
            >
              {t.replaceAll("_"," ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
