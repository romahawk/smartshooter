// src/components/HeatmapCourtImage.jsx
import React from "react";

/** -------- Display labels by key -------- */
const LABEL = {
  left_corner: "Left Corner",
  left_wing: "Left Wing",
  center: "Center",
  right_wing: "Right Wing",
  right_corner: "Right Corner",
};

/** -------- Heat box coordinates (normalized 0..1) --------
 * Tuned for a 600x567 half-court; since we output percentages,
 * it scales responsively with the container.
 * x, y are TOP-LEFT (not center). w, h are size.
 */
const ZONES_FOR_RANGE = {
  "3pt": [
    { key: "left_corner",  x: 0.005, y: 0.77, w: 0.05, h: 0.22 },
    { key: "right_corner", x: 0.945, y: 0.77, w: 0.05, h: 0.22 },
    { key: "left_wing",    x: 0.10,  y: 0.40, w: 0.13, h: 0.10 },
    { key: "center",       x: 0.435, y: 0.26, w: 0.13, h: 0.12 },
    { key: "right_wing",   x: 0.775, y: 0.40, w: 0.13, h: 0.10 },
  ],
  midrange: [
    { key: "left_corner",  x: 0.12, y: 0.85, w: 0.13, h: 0.12 },
    { key: "left_wing",    x: 0.19, y: 0.60, w: 0.13, h: 0.12 },
    { key: "center",       x: 0.43, y: 0.45, w: 0.14, h: 0.13 },
    { key: "right_wing",   x: 0.68, y: 0.60, w: 0.13, h: 0.12 },
    { key: "right_corner", x: 0.75, y: 0.85, w: 0.13, h: 0.12 },
  ],
  paint: [
    { key: "left_corner",  x: 0.34, y: 0.85, w: 0.10, h: 0.10 },
    { key: "center",       x: 0.45, y: 0.60, w: 0.10, h: 0.10 },
    { key: "right_corner", x: 0.56, y: 0.85, w: 0.10, h: 0.10 },
    { key: "left_wing",    x: 0.35, y: 0.70, w: 0.10, h: 0.10 },
    { key: "right_wing",   x: 0.55, y: 0.70, w: 0.10, h: 0.10 },
  ],
};

/** -------- Color scale (red -> yellow -> green) -------- */
function colorForAcc(acc = 0) {
  const v = Math.max(0, Math.min(100, acc));
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

/**
 * Responsive court image + overlay heat boxes.
 * width/height act as MAX dimensions; component scales to parent width.
 */
export default function HeatmapCourtImage({
  data = {},
  src = "/court.png",
  range = "3pt",
  direction,                    // reserved for future use
  width = 600,
  height = 567,
  title = "Court Heatmap",
  titleAlign = "center",
  flip = true,                  // offense view
  className = "",
}) {
  const boxes = ZONES_FOR_RANGE[range] || ZONES_FOR_RANGE["3pt"];

  // Tailwind-safe title alignment mapping
  const titleAlignClass =
    titleAlign === "left" ? "text-left" : titleAlign === "right" ? "text-right" : "text-center";

  return (
    <div className={`w-full border rounded-2xl p-4 bg-white dark:bg-neutral-800 dark:border-neutral-700 ${className}`}>
      <div className={`text-sm font-medium mb-3 opacity-80 ${titleAlignClass}`}>{title}</div>

      {/* Outer wrapper: responsive. aspectRatio preserves shape; maxWidth caps growth */}
      <div
        className={`relative mx-auto ${flip ? "scale-y-[-1]" : ""}`}
        style={{
          maxWidth: width,
          aspectRatio: `${width}/${height}`,
          transformOrigin: "center",
        }}
      >
        {/* Court image (light lines in dark via invert/contrast) */}
        <img
          src={src}
          alt="Court"
          width={width}
          height={height}
          className="w-full h-auto select-none rounded-xl dark:invert dark:contrast-125"
          draggable={false}
        />

        {/* Overlays (percent-based) */}
        {boxes.map((z) => {
          const stat = data[z.key] || { acc: 0, made: 0, attempts: 0 };
          const bg = colorForAcc(stat.acc);
          return (
            <div
              key={z.key}
              className={`absolute rounded-xl border flex items-center justify-center p-1 ${flip ? "scale-y-[-1]" : ""}`}
              style={{
                left: `${z.x * 100}%`,
                top: `${z.y * 100}%`,
                width: `${z.w * 100}%`,
                height: `${z.h * 100}%`,
                background: bg,
              }}
              title={`${LABEL[z.key]} — ${stat.made}/${stat.attempts} (${stat.acc}%)`}
            >
              {/* Desktop/tablet: full label + numbers; Mobile: only % */}
              <div className="text-[11px] md:text-xs text-black text-center leading-tight">
                {/* Mobile-only percentage */}
                <div className="font-semibold md:hidden">{stat.acc}%</div>

                {/* Desktop/Tablet content */}
                <div className="hidden md:block">
                  <div className="font-medium">{LABEL[z.key]}</div>
                  <div className="opacity-80">
                    {stat.made}/{stat.attempts} ({stat.acc}%)
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend (dark-mode tuned) */}
      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className="opacity-70">Low</span>
        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#fee2e2] via-[#fde68a] to-[#bbf7d0] dark:from-rose-200 dark:via-yellow-300 dark:to-green-300" />
        <span className="opacity-70">High</span>
      </div>
    </div>
  );
}
