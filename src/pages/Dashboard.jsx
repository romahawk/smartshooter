// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { newSession } from "../lib/models";
import {
  listSessions,
  createSession,
  updateSession,
  deleteSession,
} from "../lib/sessionApi";
import SessionForm from "../components/SessionForm";

// Analytics bits
import HeatmapCourt from "../components/HeatmapCourt";
import AccuracyTrend from "../components/charts/AccuracyTrend";
import AttemptsVsMadeByType from "../components/charts/AttemptsVsMadeByType";
import AnalyticsFilters from "../components/AnalyticsFilters";
import KpiTiles from "../components/KpiTiles";
import {
  filterSessions,
  aggregateByPosition,
  aggregateAccuracyByDate,
  aggregateByType,
  computeKpis,
} from "../lib/analytics";

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  // data + pagination
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);

  // editor
  const [editing, setEditing] = useState(null); // null | {id?, ...data}

  // tabs
  const [tab, setTab] = useState("log"); // 'log' | 'analytics'

  // analytics filters
  const [filters, setFilters] = useState({ windowDays: 30, types: [] });

  const load = async (reset = false) => {
    if (!user) return;
    const res = await listSessions(user.uid, 10, reset ? null : cursor);
    setRows(reset ? res.docs : [...rows, ...res.docs]);
    setCursor(res.cursor || null);
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onCreateClick = () => setEditing(newSession(user.uid));
  const onEditClick = (row) => setEditing({ id: row.id, ...row });
  const onDeleteClick = async (id) => {
    await deleteSession(id);
    await load(true);
  };

  const onSave = async (data) => {
    if (editing.id) await updateSession(editing.id, data);
    else await createSession(data);
    setEditing(null);
    await load(true);
  };

  // ----- Analytics computed data -----
  const filtered = useMemo(() => filterSessions(rows, filters), [rows, filters]);
  const byPos = useMemo(() => aggregateByPosition(filtered), [filtered]);
  const trend = useMemo(() => aggregateAccuracyByDate(filtered), [filtered]);
  const byType = useMemo(() => aggregateByType(filtered), [filtered]);
  const kpis = useMemo(() => computeKpis(filtered, { sinceDays: 7 }), [filtered]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-xl">Welcome, {user?.email}</h1>
        <button onClick={logout} className="border rounded-lg px-3 py-2">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <TabButton active={tab === "log"} onClick={() => setTab("log")}>
          Log
        </TabButton>
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")}>
          Analytics
        </TabButton>
      </div>

      {/* Content */}
      {tab === "log" ? (
        <LogSection
          rows={rows}
          cursor={cursor}
          onLoadMore={() => load()}
          onCreate={onCreateClick}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
        />
      ) : (
        <AnalyticsSection
          filters={filters}
          setFilters={setFilters}
          kpis={kpis}
          byPos={byPos}
          trend={trend}
          byType={byType}
        />
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-5xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-3">
              {editing.id ? "Edit session" : "New session"}
            </h2>
            <SessionForm initial={editing} onSubmit={onSave} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Log (Sessions list) ---------- */
function LogSection({ rows, cursor, onLoadMore, onCreate, onEdit, onDelete }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={onCreate} className="bg-black text-white rounded-xl px-4 py-2">
          New session
        </button>
        {cursor && (
          <button onClick={onLoadMore} className="border rounded-xl px-3 py-2">
            Load more
          </button>
        )}
      </div>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Zones</th>
              <th className="text-left p-3">Rounds</th>
              <th className="text-left p-3">Accuracy</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">{r.date}</td>
                <td className="p-3 whitespace-nowrap">{r.type}</td>
                <td className="p-3">{summarizeByRange(r) || "—"}</td>
                <td className="p-3">{r.rounds?.length ?? 0}</td>
                <td className="p-3">
                  {r.totals?.attempts
                    ? Math.round((r.totals.made / r.totals.attempts) * 100)
                    : 0}
                  %
                </td>
                <td className="p-3 max-w-[16rem]">
                  <div className="truncate" title={r.notes || ""}>
                    {r.notes || "—"}
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button className="mr-2 underline" onClick={() => onEdit(r)}>
                    Edit
                  </button>
                  <button className="underline" onClick={() => onDelete(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-3" colSpan={7}>
                  No sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Analytics UI ---------- */
function AnalyticsSection({ filters, setFilters, kpis, byPos, trend, byType }) {
  return (
    <div className="space-y-4">
      <AnalyticsFilters value={filters} onChange={setFilters} />
      <KpiTiles kpis={kpis} />
      <HeatmapCourt data={byPos} />
      <AccuracyTrend data={trend} />
      <AttemptsVsMadeByType data={byType} />
    </div>
  );
}

/* ---------- Small components & utils ---------- */
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 ${
        active ? "border-black font-medium" : "border-transparent opacity-70 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}

/** per-range summary string for list view */
function summarizeByRange(session) {
  const totals = {};
  (session.rounds || []).forEach((round) => {
    (round.zones || []).forEach((z) => {
      const key = z.range || round.range || "unknown";
      if (!totals[key]) totals[key] = { m: 0, a: 0 };
      totals[key].m += Number(z.made || 0);
      totals[key].a += Number(z.attempts || 0);
    });
  });

  return Object.entries(totals)
    .filter(([, v]) => v.a > 0)
    .map(([k, v]) => `${k}: ${v.m}/${v.a} (${Math.round((v.m / v.a) * 100)}%)`)
    .join(" • ");
}
