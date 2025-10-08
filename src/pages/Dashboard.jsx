// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import SessionForm from "../components/SessionForm";

// Sessions API
import {
  listSessions,
  createSession,
  updateSession,
  deleteSession,
} from "../lib/sessionApi";
import { newSession } from "../lib/models";

// Analytics helpers & UI
import {
  filterSessions,
  aggregateByPosition,
  aggregateAccuracyByDate,
  aggregateByType,
  computeKpis,
} from "../lib/analytics";
import AnalyticsFilters from "../components/AnalyticsFilters";
import KpiTiles from "../components/KpiTiles";
import HeatmapCourt from "../components/HeatmapCourt";
import HeatmapCourtImage from "../components/HeatmapCourtImage";
import AccuracyTrend from "../components/charts/AccuracyTrend";
import AttemptsVsMadeByType from "../components/charts/AttemptsVsMadeByType";

// UI bits
import { toast } from "sonner";
import Spinner from "../components/ui/Spinner";
import { Skeleton } from "../components/ui/Skeleton";
import ThemeToggle from "../components/ThemeToggle";

// Dev helpers
import { seedSessions } from "../dev/seedSessions";
import { devDelay } from "../lib/devDelay";

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  // ---------------- Data ----------------
  const [rows, setRows] = useState([]); // all sessions for the user

  // ---------------- Loading ----------------
  const [isLoading, setIsLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  // ---------------- Editor ----------------
  const [editing, setEditing] = useState(null); // null | {id?, ...session}

  // ---------------- Tabs ----------------
  const [tab, setTab] = useState("analytics"); // 'log' | 'analytics'

  // ---------------- DEV: slow toggle via ?slow ----------------
  const [slowEnabled, setSlowEnabled] = useState(
    import.meta.env.DEV && new URLSearchParams(location.search).has("slow")
  );
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onPop = () =>
      setSlowEnabled(new URLSearchParams(location.search).has("slow"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ---------------- Analytics filters (DEFAULT = last 7 days) ----------------
  const todayISO = new Date().toISOString().slice(0, 10);
  const sevenAgoISO = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [filters, setFilters] = useState({
    windowDays: 7, // label for KPI tiles / quick buttons
    dateFrom: sevenAgoISO, // ISO 'YYYY-MM-DD'
    dateTo: todayISO, // ISO 'YYYY-MM-DD'
    types: [], // [] = all
    direction: undefined, // 'L->R' | 'R->L' | 'static' | 'all'
    range: undefined, // 'paint' | 'midrange' | '3pt' | 'all'
  });

  // ---------------- Load ALL sessions (paginate until end) ----------------
  const load = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      await devDelay(900); // visible skeletons in dev with ?slow
      let next = null;
      const all = [];
      do {
        const { docs, cursor } = await listSessions(user.uid, 50, next);
        all.push(...docs);
        next = cursor || null;
      } while (next);
      setRows(all);
    } catch (e) {
      console.error("Load sessions failed:", e);
      toast.error(e?.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ---------------- CRUD handlers ----------------
  const onCreateClick = () => setEditing(newSession(user.uid));
  const onEditClick = (row) => setEditing({ id: row.id, ...row });

  const onDeleteClick = async (id) => {
    const ok = window.confirm(
      "Delete this session? This action cannot be undone."
    );
    if (!ok) return;
    try {
      await deleteSession(id);
      toast.success("Session deleted");
      await load();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err?.message || "Failed to delete session");
    }
  };

  const onClearAll = async () => {
    if (!rows.length) return;
    const ok1 = window.confirm("Clear ALL sessions in your log?");
    if (!ok1) return;
    const phrase = prompt('Type "CLEAR" to confirm:');
    if (phrase !== "CLEAR") return;

    setClearing(true);
    try {
      let next = null;
      let total = 0;
      do {
        const { docs, cursor } = await listSessions(user.uid, 50, next);
        const ids = docs.map((d) => d.id);
        total += ids.length;
        if (ids.length) await Promise.all(ids.map((id) => deleteSession(id)));
        next = cursor || null;
      } while (next);
      toast.success(`Cleared ${total} session${total === 1 ? "" : "s"}`);
      await load();
    } catch (e) {
      console.error("Clear log failed:", e);
      toast.error(e?.message || "Failed to clear log");
    } finally {
      setClearing(false);
    }
  };

  const onSave = async (data) => {
    try {
      const payload = { ...data, userId: user.uid };
      if (editing?.id) {
        await updateSession(editing.id, payload);
        toast.success("Session updated");
      } else {
        await createSession(payload);
        toast.success("Session created");
      }
      setEditing(null);
      await load();
    } catch (e) {
      console.error("Save failed:", e);
      toast.error(e?.message || "Failed to save session");
    }
  };

  // ---------------- Analytics: compute from FILTERED set ----------------
  const filtered = useMemo(
    () =>
      filterSessions(rows, {
        // ✅ pass correct keys that analytics.js expects
        from: filters.dateFrom,
        to: filters.dateTo,
        types: filters.types,
      }),
    [rows, filters.dateFrom, filters.dateTo, filters.types]
  );

  const aggOpts = useMemo(
    () => ({ direction: filters.direction, range: filters.range }),
    [filters.direction, filters.range]
  );

  const kpis = useMemo(() => computeKpis(filtered, aggOpts), [filtered, aggOpts]);
  const byPos = useMemo(
    () => aggregateByPosition(filtered, aggOpts),
    [filtered, aggOpts]
  );
  const trend = useMemo(
    () => aggregateAccuracyByDate(filtered, aggOpts),
    [filtered, aggOpts]
  );
  const byType = useMemo(
    () => aggregateByType(filtered, aggOpts),
    [filtered, aggOpts]
  );

  // ---------------- Skeleton flags ----------------
  const hasAny = rows.length > 0;
  const showSkelKPIs = isLoading && !hasAny;
  const showSkelHeat = isLoading && !hasAny;
  const showSkelTrend = isLoading && !hasAny;
  const showSkelBar = isLoading && !hasAny;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white text-black dark:bg-neutral-900 dark:text-neutral-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-lg md:text-xl font-medium">
          Welcome, {user?.email}
        </h1>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <>
              {/* Simulate slow */}
              <button
                type="button"
                onClick={() => {
                  const url = new URL(location.href);
                  const params = url.searchParams;
                  if (params.has("slow")) {
                    params.delete("slow");
                    history.pushState(
                      {},
                      "",
                      `${url.pathname}${params.size ? "?" + params.toString() : ""}${url.hash || ""}`
                    );
                    setSlowEnabled(false);
                  } else {
                    params.set("slow", "1");
                    history.pushState(
                      {},
                      "",
                      `${url.pathname}?${params.toString()}${url.hash || ""}`
                    );
                    setSlowEnabled(true);
                  }
                }}
                className={`rounded-lg px-3 py-2 text-sm border inline-flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700 ${
                  slowEnabled ? "bg-yellow-50 border-yellow-300 text-yellow-800 dark:text-yellow-300" : ""
                }`}
                title="Toggle ?slow to simulate delays (dev only)"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: slowEnabled ? "#ca8a04" : "#9ca3af" }}
                />
                {slowEnabled ? "Simulate slow: ON" : "Simulate slow: OFF"}
              </button>

              {/* Seed */}
              <button
                className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
                title="Create random sessions for testing"
                onClick={async () => {
                  try {
                    const n = 25;
                    await seedSessions(user.uid, n);
                    await load();
                    toast.success(`Seeded ${n} sessions`);
                  } catch (e) {
                    console.error("Seed failed:", e);
                    toast.error(e?.message || "Seeding failed");
                  }
                }}
              >
                Seed 25 sessions
              </button>
            </>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          <button
            onClick={logout}
            className="border rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto dark:border-neutral-800">
        <TabButton active={tab === "log"} onClick={() => setTab("log")}>
          Log
        </TabButton>
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")}>
          Analytics
        </TabButton>
      </div>

      {tab === "log" ? (
        <LogSection
          rows={rows}
          isLoading={isLoading}
          clearing={clearing}
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
          showSkelKPIs={showSkelKPIs}
          showSkelHeat={showSkelHeat}
          showSkelTrend={showSkelTrend}
          showSkelBar={showSkelBar}
        />
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
          <div className="bg-white dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 border rounded-2xl p-4 md:p-6 max-w-5xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-lg md:text-xl font-semibold mb-3">
              {editing.id ? "Edit session" : "New session"}
            </h2>
            <SessionForm
              initial={editing}
              onSubmit={onSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Log (table) ---------------- */

function LogSection({
  rows,
  isLoading,
  clearing,
  onCreate,
  onEdit,
  onDelete,
  onClearAll,
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState("date"); // 'date' | 'type' | 'accuracy'
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [exporting, setExporting] = useState(false);

  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const parseDate = (s) => (s ? new Date(s) : null);

  // Filter
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

  // Sort
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
        const aA = a.totals?.attempts ? a.totals.made / a.totals.attempts : 0;
        const aB = b.totals?.attempts ? b.totals.made / b.totals.attempts : 0;
        return cmp(aA, aB) * dir;
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination (client-side)
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages - 1);
  const start = safePage * pageSize;
  const end = start + pageSize;
  const paged = sorted.slice(start, end);

  // CSV
  const exportCsv = async () => {
    try {
      setExporting(true);
      await devDelay(1200);
      const headers = [
        "Date",
        "Type",
        "Rounds",
        "Accuracy",
        "Attempts",
        "Made",
        "Notes",
      ];
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
          made,
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
      toast.success(`Exported ${sorted.length} row${sorted.length === 1 ? "" : "s"}`);
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

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
    <div className="space-y-3 md:space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onCreate}
          className="bg-black text-white rounded-xl px-4 py-2 text-sm md:text-base"
        >
          New session
        </button>

        <button
          onClick={onClearAll}
          disabled={!rows.length || clearing}
          className={`rounded-xl px-3 py-2 border text-sm md:text-base ${
            clearing ? "opacity-60 cursor-not-allowed" : "hover:bg-red-50 dark:hover:bg-red-900/20"
          } text-red-600 dark:text-red-400 dark:border-neutral-700`}
          title="Delete ALL sessions"
        >
          {clearing ? "Clearing…" : "Clear log"}
        </button>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-2 text-sm md:text-base dark:bg-neutral-900 dark:border-neutral-700"
          title="Filter by training type"
        >
          <option value="all">All types</option>
          <option value="spot">spot</option>
          <option value="catch_shoot">catch_shoot</option>
          <option value="off_dribble">off_dribble</option>
          <option value="run_half">run_half</option>
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-2 text-sm md:text-base dark:bg-neutral-900 dark:border-neutral-700"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-2 text-sm md:text-base dark:bg-neutral-900 dark:border-neutral-700"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={!sorted.length || exporting}
            className="border rounded-lg px-3 py-2 text-sm md:text-base hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 inline-flex items-center gap-2 dark:border-neutral-700"
            title="Export filtered rows"
          >
            {exporting && <Spinner size={14} />}
            Export CSV
          </button>

          <label className="text-sm opacity-70">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="border rounded-lg p-2 text-sm md:text-base dark:bg-neutral-900 dark:border-neutral-700"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-2xl bg-white dark:bg-neutral-800 dark:border-neutral-700">
        <table className="w-full text-sm md:text-[15px]">
          <thead className="bg-gray-50 dark:bg-neutral-800/60">
            <tr className="dark:text-neutral-200">
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
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t dark:border-neutral-700">
                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-64" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="p-3"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              : paged.map((r) => {
                  const att = Number(r.totals?.attempts || 0);
                  const made = Number(r.totals?.made || 0);
                  const acc = att ? Math.round((made / att) * 100) : 0;
                  return (
                    <tr key={r.id} className="border-t align-top dark:border-neutral-700">
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
            {!isLoading && !paged.length && (
              <tr>
                <td className="p-3" colSpan={7}>
                  {rows.length ? "No results for current filters." : "No sessions yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2 min-h-[36px]">
        <button
          disabled={safePage === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="border rounded px-2 py-1 disabled:opacity-40 dark:border-neutral-700"
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
          className="border rounded px-2 py-1 disabled:opacity-40 dark:border-neutral-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------------- Analytics section ---------------- */

function AnalyticsSection({
  filters,
  setFilters,
  kpis,
  byPos,
  trend,
  byType,
  showSkelKPIs,
  showSkelHeat,
  showSkelTrend,
  showSkelBar,
}) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters + KPI tiles */}
      <div className="min-h-[88px]">
        <AnalyticsFilters value={filters} onChange={setFilters} />
        {showSkelKPIs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border rounded-2xl p-4 dark:bg-neutral-800 dark:border-neutral-700">
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="border rounded-2xl p-4 dark:bg-neutral-800 dark:border-neutral-700">
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="border rounded-2xl p-4 dark:bg-neutral-800 dark:border-neutral-700">
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-5 w-56" />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <KpiTiles kpis={kpis} windowDays={filters.windowDays || 7} />
          </div>
        )}
      </div>

      {/* Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,380px),1fr] gap-4 md:gap-6 items-start">
        <div className="lg:sticky lg:top-4">
          {showSkelHeat ? (
            <div className="border rounded-2xl p-4 dark:bg-neutral-800 dark:border-neutral-700">
              <Skeleton className="h-4 w-40 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <HeatmapCourt data={byPos} layout="stack" />
          )}
        </div>

        <div className="w-full">
          {showSkelHeat ? (
            <div className="border rounded-2xl p-3 dark:bg-neutral-800 dark:border-neutral-700" style={{ aspectRatio: "600 / 567" }}>
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
          ) : (
            <HeatmapCourtImage
              data={byPos}
              src="/court.png"
              range={filters.range || "3pt"}
              direction={filters.direction}
              width={600}
              height={567}
              flip={true}
              className="w-full max-w-[620px] mx-auto"
            />
          )}
        </div>
      </div>

      {/* Trend */}
      <div className="min-h-[220px]">
        {showSkelTrend ? (
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        ) : (
          <AccuracyTrend data={trend} />
        )}
      </div>

      {/* Attempts vs Made */}
      <div className="min-h-[220px]">
        {showSkelBar ? (
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        ) : (
          <AttemptsVsMadeByType data={byType} />
        )}
      </div>
    </div>
  );
}

/* ---------------- Small components & utils ---------------- */

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 ${
        active
          ? "border-black font-medium dark:border-white"
          : "border-transparent opacity-70 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}

/** per-range summary string for list view */
function summarizeByRange(session) {
  const totals = {};
  (session.rounds || []).forEach((r) =>
    (r.zones || []).forEach((z) => {
      const key = z.range || r.range || "unknown";
      if (!totals[key]) totals[key] = { m: 0, a: 0 };
      totals[key].m += Number(z.made || 0);
      totals[key].a += Number(z.attempts || 0);
    })
  );

  return Object.entries(totals)
    .filter(([, v]) => v.a > 0)
    .map(([k, v]) => `${k}: ${v.m}/${v.a} (${Math.round((v.m / v.a) * 100)}%)`)
    .join(" • ");
}
