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
import HeatmapCourt from "../components/HeatmapCourt";               // blocks view
import HeatmapCourtImage from "../components/HeatmapCourtImage";     // court.png overlay
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

// DEV: seeding helper (dev-only button)
import { seedSessions } from "../dev/seedSessions";

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  // data + pagination (server cursor)
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);

  // editor
  const [editing, setEditing] = useState(null); // null | {id?, ...data}

  // tabs
  const [tab, setTab] = useState("log"); // 'log' | 'analytics'

  // analytics filters
  const [filters, setFilters] = useState({ windowDays: 30, types: [] });

  // destructive op state
  const [clearing, setClearing] = useState(false);

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
    const ok = window.confirm("Delete this session? This action cannot be undone.");
    if (!ok) return;
    try {
      await deleteSession(id);
      await load(true);
    } catch (err) {
      console.error("[Dashboard] delete failed:", err);
      alert(err?.message || "Failed to delete session");
    }
  };

  const onClearAll = async () => {
    if (!rows.length) return;
    const confirm1 = window.confirm(
      "Clear ALL sessions in your log? This cannot be undone."
    );
    if (!confirm1) return;

    const phrase = prompt('Type "CLEAR" to confirm deleting ALL sessions:');
    if (phrase !== "CLEAR") return;

    setClearing(true);
    try {
      let nextCursor = null;
      do {
        const { docs, cursor: cur } = await listSessions(user.uid, 50, nextCursor);
        const ids = docs.map((d) => d.id);
        if (ids.length) {
          await Promise.all(ids.map((id) => deleteSession(id)));
        }
        nextCursor = cur || null;
      } while (nextCursor);

      await load(true);
      alert("All sessions have been deleted.");
    } catch (err) {
      console.error("[Dashboard] clear log failed:", err);
      alert(err?.message || "Failed to clear log");
    } finally {
      setClearing(false);
    }
  };

  const onSave = async (data) => {
    try {
      // always stamp ownership on the payload
      const payload = { ...data, userId: user.uid };

      if (editing?.id) {
        await updateSession(editing.id, payload);
      } else {
        await createSession(payload);
      }
      setEditing(null);
      await load(true);
    } catch (err) {
      console.error("[Dashboard] save failed:", err);
      alert(err?.message || "Failed to save session");
    }
  };

  // ----- Analytics computed data -----
  const filtered = useMemo(() => filterSessions(rows, filters), [rows, filters]);
  const aggOpts = { direction: filters.direction, range: filters.range };

  const byPos = useMemo(
    () => aggregateByPosition(filtered, aggOpts),
    [filtered, filters]
  );
  const trend = useMemo(
    () => aggregateAccuracyByDate(filtered, aggOpts),
    [filtered, filters]
  );
  const byType = useMemo(
    () => aggregateByType(filtered, aggOpts),
    [filtered, filters]
  );
  const kpis = useMemo(
    () => computeKpis(filtered, { sinceDays: filters.windowDays || 7, ...aggOpts }),
    [filtered, filters]
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-xl">Welcome, {user?.email}</h1>
        <div className="flex items-center gap-2">
          {/* DEV-ONLY seed button */}
          {import.meta.env.DEV && (
            <button
              className="border rounded-lg px-3 py-2"
              onClick={async () => {
                const n = 25; // change as needed
                try {
                  await seedSessions(user.uid, n);
                  await load(true);
                  alert(`Seeded ${n} sessions for ${user.email}`);
                } catch (e) {
                  console.error("Seeding failed:", e);
                  alert(e?.message || "Seeding failed");
                }
              }}
              title="Create random sessions for testing pagination"
            >
              Seed 25 sessions
            </button>
          )}
          <button onClick={logout} className="border rounded-lg px-3 py-2">
            Logout
          </button>
        </div>
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
          clearing={clearing}
          onLoadMore={() => load()}
          onCreate={onCreateClick}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
          onClearAll={onClearAll}
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

/* ---------- Log (Sessions list) with filtering/sorting/pagination + CSV ---------- */
function LogSection({
  rows,
  cursor,
  clearing,
  onLoadMore,
  onCreate,
  onEdit,
  onDelete,
  onClearAll,
}) {
  // Controls
  const [typeFilter, setTypeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState("date"); // 'date' | 'type' | 'accuracy'
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const parseDate = (s) => (s ? new Date(s) : null);
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  // 1) Filter (type + date range)
  const filtered = useMemo(() => {
    const f = parseDate(from);
    const t = parseDate(to);
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      const d = new Date(r.date);
      if (f && d < f) return false;
      if (t && d > t) return false;
      return true;
    });
  }, [rows, typeFilter, from, to]);

  // 2) Sort (date/type/accuracy)
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "date") {
        return cmp(new Date(a.date), new Date(b.date)) * dir;
      }
      if (sortKey === "type") {
        return cmp(a.type || "", b.type || "") * dir;
      }
      if (sortKey === "accuracy") {
        const accA = a.totals?.attempts ? a.totals.made / a.totals.attempts : 0;
        const accB = b.totals?.attempts ? b.totals.made / b.totals.attempts : 0;
        return cmp(accA, accB) * dir;
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // 3) Client-side pagination
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages - 1);
  const start = safePage * pageSize;
  const end = start + pageSize;
  const paged = sorted.slice(start, end);

  // 4) CSV export of filtered+sorted rows (not just current page)
  // 4) CSV export of filtered+sorted rows (not just current page)
  const exportCsv = () => {
    const headers = ["Date", "Type", "Rounds", "Accuracy", "Attempts", "Made", "Notes"];
    const toRow = (s) => {
      const attempts = Number(s.totals?.attempts || 0);
      const made = Number(s.totals?.made || 0);
      const acc = attempts ? Math.round((made / attempts) * 100) : 0;
      const notes = (s.notes || "").replace(/"/g, '""');
      return [
        s.date,
        s.type,
        s.rounds?.length ?? 0,
        `${acc}%`,
        attempts,
        made,              // <-- NEW COLUMN
        `"${notes}"`,
      ].join(",");
    };
    const csv = [headers.join(","), ...sorted.map(toRow)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sortable header cell
  const Th = ({ k, children }) => (
    <th
      className={`text-left p-3 select-none ${
        ["date", "type", "accuracy"].includes(k) ? "cursor-pointer" : ""
      }`}
      onClick={() => {
        if (!["date", "type", "accuracy"].includes(k)) return;
        if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else {
          setSortKey(k);
          setSortDir(k === "date" ? "desc" : "asc");
        }
        setPage(0);
      }}
      title={
        ["date", "type", "accuracy"].includes(k) ? "Click to sort" : undefined
      }
    >
      {children}
      {sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : null}
    </th>
  );

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onCreate} className="bg-black text-white rounded-xl px-4 py-2">
          New session
        </button>

        {/* Clear log (danger) */}
        <button
          onClick={onClearAll}
          disabled={!rows.length || clearing}
          className={`rounded-xl px-3 py-2 border ${
            clearing ? "opacity-60 cursor-not-allowed" : "hover:bg-red-50"
          } text-red-600`}
          title="Delete ALL sessions for your account"
        >
          {clearing ? "Clearing…" : "Clear log"}
        </button>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-2"
          title="Filter by training type"
        >
          <option value="all">All types</option>
          <option value="spot">spot</option>
          <option value="catch_shoot">catch_shoot</option>
          <option value="off_dribble">off_dribble</option>
          <option value="run_half">run_half</option>
        </select>

        {/* Date range */}
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-2"
          title="From"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-2"
          title="To"
        />

        {/* Right-side tools */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={!sorted.length}
            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-40"
            title="Export filtered rows as CSV"
          >
            Export CSV
          </button>

          <label className="text-sm opacity-70">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="border rounded-lg p-2"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          {cursor && (
            <button onClick={onLoadMore} className="border rounded-xl px-3 py-2">
              Load more
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th k="date">Date</Th>
              <Th k="type">Type</Th>
              <th className="text-left p-3">Zones</th>
              <th className="text-left p-3">Rounds</th>
              <Th k="accuracy">Accuracy</Th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => {
              const att = Number(r.totals?.attempts || 0);
              const made = Number(r.totals?.made || 0);
              const acc = att ? Math.round((made / att) * 100) : 0;
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">{r.date}</td>
                  <td className="p-3 whitespace-nowrap">{r.type}</td>
                  <td className="p-3">{summarizeByRange(r) || "—"}</td>
                  <td className="p-3">{r.rounds?.length ?? 0}</td>
                  <td className="p-3">{acc}%</td>
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
              );
            })}

            {!paged.length && (
              <tr>
                <td className="p-3" colSpan={7}>
                  {rows.length ? "No results for current filters." : "No sessions yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex justify-end items-center gap-2">
        <button
          disabled={safePage === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="border rounded px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm">
          Page <strong>{safePage + 1}</strong> of <strong>{pages}</strong> •{" "}
          <span className="opacity-70">{total} rows</span>
        </span>
        <button
          disabled={safePage >= pages - 1}
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          className="border rounded px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------- Analytics UI ---------- */
function AnalyticsSection({ filters, setFilters, kpis, byPos, trend, byType }) {
  return (
    <div className="space-y-4">
      <AnalyticsFilters value={filters} onChange={setFilters} />
      <KpiTiles kpis={kpis} windowDays={filters.windowDays || 7} />

      {/* Heatmaps side-by-side (stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-4">
          <HeatmapCourt data={byPos} layout="stack" />
        </div>
        <HeatmapCourtImage
          data={byPos}
          src="/court.png"
          range={filters.range || "3pt"}
          direction={filters.direction}
          width={600}
          height={567}
          flip={true} // offense view
        />
      </div>

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
