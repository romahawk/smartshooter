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

export default function HeatmapCourt({ data = {}, onSelect }) {
  return (
    <div className="w-full">
      <div className="text-sm font-semibold mb-2">Court Heatmap</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {POS.map((p) => {
          const v = data[p] || { acc: 0, made: 0, attempts: 0 };
          const bg = colorForAcc(v.acc);
          return (
            <button
              key={p}
              onClick={() => onSelect?.(p)}
              className="rounded-xl p-3 text-left border transition"
              style={{ background: bg }}
              title={`${LABEL[p]} — ${v.made}/${v.attempts} (${v.acc}%)`}
            >
              <div className="text-xs font-medium">{LABEL[p]}</div>
              <div className="text-xs opacity-80">
                {v.made}/{v.attempts} ({v.acc}%)
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs">
        <span>Low</span>
        <div className="h-2 flex-1 rounded bg-gradient-to-r from-[#fee2e2] via-[#fde68a] to-[#bbf7d0]" />
        <span>High</span>
      </div>
    </div>
  );
}

// green for high, red for low (very simple scale)
function colorForAcc(acc = 0) {
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const v = clamp(acc);
  // interpolate from red(254,226,226) -> yellow(253,230,138) -> green(187,247,208)
  // piecewise: 0-50 -> red->yellow, 50-100 -> yellow->green
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  let r, g, b;
  if (v <= 50) {
    const t = v / 50;
    r = mix(254, 253, t); g = mix(226, 230, t); b = mix(226, 138, t);
  } else {
    const t = (v - 50) / 50;
    r = mix(253, 187, t); g = mix(230, 247, t); b = mix(138, 208, t);
  }
  return `rgb(${r},${g},${b})`;
}
