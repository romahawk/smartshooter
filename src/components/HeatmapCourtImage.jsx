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
 * These are tuned for a 600x567 half-court image, but since we
 * multiply by width/height they scale cleanly.
 * You can tweak x,y,w,h if you want to fine-tune positions.
 */
const ZONES_FOR_RANGE = {
  "3pt": [
    // corners: skinny vertical boxes hugging baselines
    { key: "left_corner",  x: 0.005, y: 0.77, w: 0.05, h: 0.22 },
    { key: "right_corner", x: 0.945, y: 0.77, w: 0.05, h: 0.22 },
    // wings & center above the arc
    { key: "left_wing",  x: 0.10, y: 0.4, w: 0.13, h: 0.10 },
    { key: "center",     x: 0.435, y: 0.26, w: 0.13, h: 0.12 },
    { key: "right_wing", x: 0.775, y: 0.4, w: 0.13, h: 0.10 },
  ],
  midrange: [
    { key: "left_corner",  x: 0.12, y: 0.85, w: 0.13, h: 0.12 },
    { key: "left_wing",    x: 0.19, y: 0.6, w: 0.13, h: 0.12 },
    { key: "center",       x: 0.43, y: 0.45, w: 0.14, h: 0.13 },
    { key: "right_wing",   x: 0.68, y: 0.6, w: 0.13, h: 0.12 },
    { key: "right_corner", x: 0.75, y: 0.85, w: 0.13, h: 0.12 },
  ],
  paint: [
    { key: "left_corner",  x: 0.34, y: 0.85, w: 0.10, h: 0.10 },
    { key: "center",       x: 0.45, y: 0.6, w: 0.10, h: 0.10 },
    { key: "right_corner", x: 0.56, y: 0.85, w: 0.10, h: 0.10 },
    // lightly place wings to suggest short-mid paint kickouts
    { key: "left_wing",    x: 0.35, y: 0.70, w: 0.10, h: 0.10 },
    { key: "right_wing",   x: 0.55, y: 0.7, w: 0.10, h: 0.10 },
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
 * HeatmapCourtImage
 * @param {{
 *   data: Record<string,{made:number,attempts:number,acc:number}>,
 *   src?: string,
 *   range?: "3pt"|"midrange"|"paint",
 *   direction?: string,           // not used for placement, present for future
 *   width?: number,
 *   height?: number,
 *   title?: string,
 *   titleAlign?: "left"|"center"|"right",
 *   flip?: boolean,               // vertical flip (offense view)
 * }} props
 */
export default function HeatmapCourtImage({
  data = {},
  src = "/court.png",
  range = "3pt",
  direction,           // reserved for future use (e.g., LR/RL mirroring)
  width = 600,
  height = 567,
  title = "Court Heatmap",
  titleAlign = "center",
  flip = true,         // set to true to show offense (vertical flip)
}) {
  const boxes = ZONES_FOR_RANGE[range] || ZONES_FOR_RANGE["3pt"];

  return (
    <div className="w-full">
      <div className={`text-sm font-semibold mb-2 text-${titleAlign}`}>{title}</div>

      {/* Flip the entire court vertically; counter-flip each box content */}
      <div
        className="relative mx-auto"
        style={{
          width,
          height,
          transform: flip ? "scaleY(-1)" : "none",
          transformOrigin: "center",
        }}
      >
        <img
          src={src}
          alt="court"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {boxes.map((z) => {
          const stat = data[z.key] || { acc: 0, made: 0, attempts: 0 };
          const bg = colorForAcc(stat.acc);

          // position & size in pixels
          const style = {
            left: z.x * width,
            top: z.y * height,
            width: z.w * width,
            height: z.h * height,
            background: bg,
            transform: flip ? "scaleY(-1)" : "none", // keep text upright
            transformOrigin: "center",
          };

          return (
            <div
              key={z.key}
              className="absolute rounded-xl border flex items-center justify-center p-1"
              style={style}
              title={`${LABEL[z.key]} — ${stat.made}/${stat.attempts} (${stat.acc}%)`}
            >
              <div className="text-[10px] text-black/90 text-center leading-tight">
                <div className="font-medium">{LABEL[z.key]}</div>
                <div className="opacity-80">
                  {stat.made}/{stat.attempts} ({stat.acc}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend (not flipped) */}
      <div className="flex items-center gap-2 mt-2 text-xs">
        <span>Low</span>
        <div className="h-2 flex-1 rounded bg-gradient-to-r from-[#fee2e2] via-[#fde68a] to-[#bbf7d0]" />
        <span>High</span>
      </div>
    </div>
  );
}
