// src/components/HeatmapCourtImage.jsx
import React from "react";

const LABEL = {
  left_corner: "Left Corner",
  left_wing: "Left Wing",
  center: "Center",
  right_wing: "Right Wing",
  right_corner: "Right Corner",
};

/**
 * data: { [position]: { made, attempts, acc } }
 * range: 'paint' | 'midrange' | '3pt'
 * direction: reserved for future (L->R / R->L specific layouts)
 */
export default function HeatmapCourtImage({
  data = {},
  src = "/court.png",
  range = "3pt",
  direction,
  width = 600,
  height = 567,
}) {
  // Percent-based overlay rectangles, tuned for a 600x567 half-court image.
  const ZONES = {
    paint: {
      left_corner:  { left: 35.5, top: 81,   w: 8, h: 12 }, // low block L
      left_wing:    { left: 35.5, top: 63.5, w: 8,   h: 12 }, // left lane
      center:       { left: 46, top: 60,   w: 8,   h: 12 }, // restricted area
      right_wing:   { left: 56.5,   top: 63.5, w: 8,   h: 12 }, // right lane
      right_corner: { left: 57.5, top: 81,   w: 8, h: 12 }, // low block R
    },
    midrange: {
      left_corner:  { left: 15,   top: 81, w: 11.5, h: 14 },
      left_wing:    { left: 20.5, top: 52,   w: 11.5, h: 14 },
      center:       { left: 44,   top: 44,   w: 11.5,   h: 14 },
      right_wing:   { left: 68, top: 52,   w: 11.5, h: 14 },
      right_corner: { left: 74.5, top: 81, w: 11.5, h: 14 },
    },
    "3pt": {
      left_corner:  { left: 0.5, top: 78, w: 7,  h: 25 }, // deep corner L
      left_wing:    { left: 4,   top: 31.5, w: 16,  h: 18 }, // beyond arc L
      center:       { left: 41,   top: 20.5, w: 16,  h: 18 }, // top of key 3
      right_wing:   { left: 80,   top: 31.5, w: 16,  h: 18 }, // beyond arc R
      right_corner: { left: 93, top: 78, w: 7,  h: 25 }, // deep corner R
    },
  };

  const ZONE_POS = ZONES[range] || ZONES["3pt"];

  return (
    <div className="w-full">
      <div className="text-sm font-semibold mb-2">Court Heatmap</div>

      <div
        className="relative mx-auto rounded-2xl overflow-hidden border bg-white"
        style={{ width: "100%", maxWidth: width, aspectRatio: `${width}/${height}` }}
      >
        <img
          src={src}
          alt="Court"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        />

        {Object.entries(ZONE_POS).map(([pos, rect]) => {
          const v = data[pos] || { acc: 0, made: 0, attempts: 0 };
          const bg = colorForAcc(v.acc);
          return (
            <div
              key={pos}
              className="absolute rounded-xl border"
              style={{
                left: `${rect.left}%`,
                top: `${rect.top}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
                background: bg,
                opacity: 0.75,
              }}
              title={`${LABEL[pos]} — ${v.made}/${v.attempts} (${v.acc}%)`}
            />
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

function colorForAcc(acc = 0) {
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const v = clamp(acc);
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  let r, g, b;
  if (v <= 50) {
    const t = v / 50; r = mix(254, 253, t); g = mix(226, 230, t); b = mix(226, 138, t);
  } else {
    const t = (v - 50) / 50; r = mix(253, 187, t); g = mix(230, 247, t); b = mix(138, 208, t);
  }
  return `rgb(${r},${g},${b})`;
}
