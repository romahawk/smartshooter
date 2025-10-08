// src/components/HeatmapCourtImage.jsx
import React, { useEffect, useState } from "react";

/** -------- Display labels by key -------- */
const LABEL = {
  left_corner: "Left Corner",
  left_wing: "Left Wing",
  center: "Center",
  right_wing: "Right Wing",
  right_corner: "Right Corner",
};

/** -------- Heat box coordinates (normalized 0..1) -------- */
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

const isCorner = (k) => k === "left_corner" || k === "right_corner";

/** --- responsive hook: sm breakpoint (Tailwind ~640px) --- */
function useIsSmall() {
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsSmall(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return isSmall;
}

/** Compute outside label placement + connector line for each zone */
function getPlacement(z, isSmall) {
  // Default gaps
  const sideGap = isSmall ? 8 : 16; // tighter on mobile
  const lineLenH = isSmall ? 8 : 12;
  const bottomGap = isSmall ? 8 : 12;
  const lineLenV = isSmall ? 8 : 10;

  // Corners:
  // - Desktop: label OUTSIDE (left_corner→left side, right_corner→right side)
  // - Mobile:  label INSIDE the court (left_corner→to RIGHT of zone, right_corner→to LEFT)
  if (isCorner(z.key)) {
    if (z.key === "left_corner") {
      // desktop: outside-left ; mobile: inside-right
      return isSmall
        ? {
            pillStyle: { left: `calc(100% + ${sideGap}px)`, top: "50%", transform: "translateY(-50%)" },
            lineStyle: { left: "100%", width: `${lineLenH}px`, top: "50%", transform: "translateY(-50%)" },
            lineDir: "h",
          }
        : {
            pillStyle: { right: `calc(100% + ${sideGap}px)`, top: "50%", transform: "translateY(-50%)" },
            lineStyle: { right: `-${lineLenH}px`, width: `${lineLenH}px`, top: "50%", transform: "translateY(-50%)" },
            lineDir: "h",
          };
    } else {
      // right_corner
      return isSmall
        ? {
            pillStyle: { right: `calc(100% + ${sideGap}px)`, top: "50%", transform: "translateY(-50%)" },
            lineStyle: { right: "100%", width: `${lineLenH}px`, top: "50%", transform: "translateY(-50%)" },
            lineDir: "h",
          }
        : {
            pillStyle: { left: `calc(100% + ${sideGap}px)`, top: "50%", transform: "translateY(-50%)" },
            lineStyle: { left: `-${lineLenH}px`, width: `${lineLenH}px`, top: "50%", transform: "translateY(-50%)" },
            lineDir: "h",
          };
    }
  }

  // Wings & Center: labels below with vertical connector (both mobile & desktop)
  return {
    pillStyle: { left: "50%", top: `calc(100% + ${bottomGap + lineLenV}px)`, transform: "translateX(-50%)" },
    lineStyle: { left: "50%", transform: "translateX(-50%)", bottom: `-${lineLenV}px`, height: `${lineLenV}px`, width: "2px" },
    lineDir: "v",
  };
}

/**
 * Responsive court image + overlay heat boxes.
 */
export default function HeatmapCourtImage({
  data = {},
  src = "/court.png",
  range = "3pt",
  width = 600,
  height = 567,
  title = "Court Heatmap",
  titleAlign = "center",
  flip = true,
  className = "",
}) {
  const isSmall = useIsSmall();
  const boxes = ZONES_FOR_RANGE[range] || ZONES_FOR_RANGE["3pt"];
  const titleAlignClass =
    titleAlign === "left" ? "text-left" : titleAlign === "right" ? "text-right" : "text-center";

  return (
    <div className={`w-full border rounded-2xl p-4 bg-white dark:bg-neutral-900 dark:border-neutral-700 ${className}`}>
      <div className={`text-sm font-medium mb-3 opacity-80 ${titleAlignClass}`}>{title}</div>

      <div
        className={`relative mx-auto ${flip ? "scale-y-[-1]" : ""}`}
        style={{
          maxWidth: width,
          aspectRatio: `${width}/${height}`,
          transformOrigin: "center",
          overflow: "visible",
        }}
      >
        <img
          src={src}
          alt="Court"
          width={width}
          height={height}
          className="w-full h-auto select-none rounded-xl dark:invert dark:contrast-125"
          draggable={false}
        />

        {boxes.map((z) => {
          const stat = data[z.key] || { acc: 0, made: 0, attempts: 0 };
          const bg = colorForAcc(stat.acc);
          const placement = getPlacement(z, isSmall);

          return (
            <div
              key={z.key}
              className={`absolute ${flip ? "scale-y-[-1]" : ""}`}
              style={{
                left: `${z.x * 100}%`,
                top: `${z.y * 100}%`,
                width: `${z.w * 100}%`,
                height: `${z.h * 100}%`,
                background: bg,
                borderRadius: "0.75rem",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
              title={`${LABEL[z.key]} — ${stat.made}/${stat.attempts} (${stat.acc}%)`}
            >
              {/* CONNECTOR */}
              {placement.lineDir === "h" ? (
                <div
                  className="absolute h-[2px] bg-slate-400 dark:bg-slate-400"
                  style={placement.lineStyle}
                />
              ) : (
                <div
                  className="absolute w-[2px] bg-slate-400 dark:bg-slate-400"
                  style={placement.lineStyle}
                />
              )}

              {/* OUTSIDE/INSIDE LABEL PILL (responsive) */}
              <div
                className={[
                  "absolute",
                  "rounded-lg",
                  "px-2 py-1",
                  "text-[11px] md:text-xs",
                  "leading-tight",
                  "bg-[rgba(250,250,210,0.92)]",
                  "shadow-sm",
                  "text-slate-900",
                  "whitespace-nowrap",
                  "font-medium",
                ].join(" ")}
                style={placement.pillStyle}
              >
                <div className="text-[11px] md:text-[12px] font-semibold text-center">
                  {LABEL[z.key]}
                </div>
                <div className="text-[10px] md:text-[11px] opacity-90 text-center">
                  {stat.made}/{stat.attempts}
                </div>
                <div className="text-[10px] md:text-[11px] opacity-75 text-center">
                  ({stat.acc}%)
                </div>
              </div>

              {/* Micro-label (percent only) visible on very tight screens if needed */}
              <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold text-black/90">
                {stat.acc}%
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
