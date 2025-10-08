// src/components/charts/AttemptsVsMadeByType.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2 } from "lucide-react";

const useIsDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export default function AttemptsVsMadeByType({
  data = [],
  title = "Attempts vs Made (by type)",
}) {
  const isDark = useIsDark();

  const colors = {
    axis: isDark ? "#E5E7EB" : "#334155",
    grid: isDark ? "rgba(255,255,255,0.25)" : "rgba(2,6,23,0.16)",
    attempts: "rgba(253, 231, 76, 0.9)", // brighter in light mode
    made:     "rgba(52, 211, 153, 0.92)",
    tooltipBg: isDark ? "rgba(17,17,18,0.95)" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  };

  const CustomLegend = () => (
    <div className="mt-2 flex items-center justify-center gap-6 text-xs">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: colors.attempts }} />
        <span style={{ color: colors.axis }}>Attempts</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: colors.made }} />
        <span style={{ color: colors.axis }}>Made</span>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 w-full">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        <BarChart2 className="w-4 h-4" />
        <span>{title}</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={24}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="type"
              tick={{ fill: colors.axis }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => String(v || "").replaceAll("_", " ")}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: colors.axis }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(2,6,23,0.03)" }}
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                borderColor: colors.tooltipBorder,
                borderWidth: 1,
                borderStyle: "solid",
              }}
              labelStyle={{ color: colors.axis }}
              formatter={(value, _name, item) => {
                const a = item?.payload?.attempts ?? 0;
                const m = item?.payload?.made ?? 0;
                const acc = a ? Math.round((m / a) * 100) : 0;
                const lbl = item?.dataKey === "attempts" ? "Attempts" : "Made";
                return [String(value), `${lbl} (acc ${acc}%)`];
              }}
            />

            <Bar dataKey="attempts" name="Attempts" fill={colors.attempts} radius={[10, 10, 0, 0]} />
            <Bar dataKey="made"     name="Made"     fill={colors.made}     radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend that matches heatmap style */}
      <CustomLegend />
    </div>
  );
}
