// src/components/charts/AttemptsVsMadeByType.jsx
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function AttemptsVsMadeByType({ data = [], title = "Attempts vs Made (by type)" }) {
  return (
    <div className="w-full">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="attempts" />
            <Bar dataKey="made" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
