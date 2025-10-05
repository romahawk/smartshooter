// src/components/KpiTiles.jsx
import React from "react";

export default function KpiTiles({ kpis = { acc7: 0, vol7: 0, bestZone: null } }) {
  const { acc7, vol7, bestZone } = kpis || {};
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile title="Accuracy (7d)">{acc7}%</Tile>
      <Tile title="Volume (7d)">{vol7}</Tile>
      <Tile title="Best Zone">
        {bestZone ? (
          <div className="text-sm">
            <div className="font-medium capitalize">{bestZone.position.replaceAll("_"," ")}</div>
            <div className="opacity-70">{bestZone.m}/{bestZone.a} ({bestZone.acc}%)</div>
          </div>
        ) : "—"}
      </Tile>
    </div>
  );
}

function Tile({ title, children }) {
  return (
    <div className="border rounded-2xl p-4">
      <div className="text-xs uppercase tracking-wide opacity-60">{title}</div>
      <div className="text-2xl font-semibold mt-1">{children}</div>
    </div>
  );
}
