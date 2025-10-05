// src/components/KpiTiles.jsx
export default function KpiTiles({ kpis = {}, windowDays = 7 }) {
  const suffix = `(${windowDays}d)`;
  const accText = typeof kpis.acc === "number" ? `${kpis.acc}%` : "0%";
  const volText = typeof kpis.volume === "number" ? kpis.volume : 0;
  const bestText = kpis.bestZone
    ? `${kpis.bestZone.label} — ${kpis.bestZone.acc}%`
    : "—";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <KpiCard title={`Accuracy ${suffix}`} value={accText} />
      <KpiCard title={`Volume ${suffix}`} value={volText} />
      <KpiCard title="Best Zone" value={bestText} />
    </div>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="border rounded-2xl p-4">
      <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
