// src/components/HeatmapCourt.jsx
import React from "react";

const POS = ["left_corner", "left_wing", "center", "right_wing", "right_corner"];
const LABEL = {
  left_corner: "Left Corner",
  left_wing: "Left Wing",
  center: "Center",
  right_wing: "Right Wing",
  right_corner: "Right Corner",
};

/**
 * Props:
 *  - data: { [position]: { made, attempts, acc } }
 *  - layout: "row" | "stack"
 *      "row"   -> responsive row (5 columns on md+, single column on mobile)
 *      "stack" -> always vertical list (used next to court image)
 */
export default function HeatmapCourt({ data = {}, layout = "row" }) {
  const gridClass =
    layout === "stack"
      ? "grid grid-cols-1 gap-2"
      : "grid grid-cols-1 md:grid-cols-5 gap-2";

  return (
    <div className="w-full border rounded-2xl p-4 bg-white dark:bg-neutral-800 dark:border-neutral-700">
      <div className="text-sm font-medium mb-3 opacity-80">Zones Heatmap</div>

      <div className={gridClass}>
        {POS.map((p) => {
          const v = data[p] || { acc: 0, made: 0, attempts: 0 };
          const bg = colorForAcc(v.acc);
          return (
            <div
              key={p}
              className="rounded-xl p-3 text-left border border-transparent dark:border-neutral-700"
              style={{ background: bg }}
              title={`${LABEL[p]} — ${v.made}/${v.attempts} (${v.acc}%)`}
            >
              {/* Force black text for best contrast on the pastel/yellow chips (matches court labels) */}
              <div className="text-xs font-medium text-black">{LABEL[p]}</div>
              <div className="text-xs text-black opacity-80">
                {v.made}/{v.attempts} ({v.acc}%)
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className="opacity-70">Low</span>
        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#fee2e2] via-[#fde68a] to-[#bbf7d0] dark:from-rose-200 dark:via-yellow-300 dark:to-green-300" />
        <span className="opacity-70">High</span>
      </div>
    </div>
  );
}

// Simple red → yellow → green scale
function colorForAcc(acc = 0) {
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const v = clamp(acc);
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  let r, g, b;
  if (v <= 50) {
    const t = v / 50;
    r = mix(254, 253, t);
    g = mix(226, 230, t);
    b = mix(226, 138, t);
  } else {
    const t = (v - 50) / 50;
    r = mix(253, 187, t);
    g = mix(230, 247, t);
    b = mix(138, 208, t);
  }
  return `rgb(${r},${g},${b})`;
}
