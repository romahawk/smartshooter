// src/components/charts/AccuracyTrend.jsx
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target } from "lucide-react";

const useIsDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export default function AccuracyTrend({ data = [], title = "Accuracy Trend" }) {
  const isDark = useIsDark();

  // Stronger, heatmap-friendly palette
  const colors = {
    axis: isDark ? "#E5E7EB" : "#334155", // slate-200 (dark) / slate-700 (light)
    grid: isDark ? "rgba(255,255,255,0.25)" : "rgba(2,6,23,0.16)",
    line: "#60a5fa",
    gStart: "#fee2e2",
    gMid:   "#fde68a",
    gEnd:   "#bbf7d0",
    pillBg: "rgba(250,250,210,0.92)",
    pillFg: "#0f172a",
    tooltipBg: isDark ? "rgba(17,17,18,0.95)" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  };

  const avgAcc = useMemo(() => {
    if (!data.length) return 0;
    const s = data.reduce((a, b) => a + (b.acc || 0), 0);
    return Math.round(s / data.length);
  }, [data]);

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 w-full">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        <TrendingUp className="w-4 h-4" />
        <span>{title}</span>
        <span
          className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
          style={{ backgroundColor: colors.pillBg, color: colors.pillFg }}
        >
          <Target className="w-3 h-3" /> avg {avgAcc}%
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="accFill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%"   stopColor={colors.gStart} stopOpacity={isDark ? 0.12 : 0.18} />
                <stop offset="50%"  stopColor={colors.gMid}   stopOpacity={isDark ? 0.12 : 0.18} />
                <stop offset="100%" stopColor={colors.gEnd}   stopOpacity={isDark ? 0.12 : 0.18} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={colors.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              minTickGap={24}
              tick={{ fill: colors.axis }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: colors.axis }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: colors.grid }}
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                borderColor: colors.tooltipBorder,
                borderWidth: 1,
                borderStyle: "solid",
              }}
              labelStyle={{ color: colors.axis }}
              formatter={(v) => [`${v}%`, "Accuracy"]}
            />

            {/* Gradient area + line */}
            <Area type="monotone" dataKey="acc" stroke="none" fill="url(#accFill)" isAnimationActive={false} />
            <Line type="monotone" dataKey="acc" dot={false} strokeWidth={2.5} stroke={colors.line} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
