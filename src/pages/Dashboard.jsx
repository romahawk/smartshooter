import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { newSession } from "../lib/models";
import { listSessions, createSession, updateSession, deleteSession } from "../lib/sessionApi";
import SessionForm from "../components/SessionForm";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [editing, setEditing] = useState(null); // null | {id?, ...data}

  const load = async (reset=false)=>{
    if (!user) return;
    const res = await listSessions(user.uid, 10, reset? null : cursor);
    setRows(reset? res.docs : [...rows, ...res.docs]);
    setCursor(res.cursor || null);
  };

  useEffect(()=>{ load(true); }, [user]); // initial load when user is ready

  const onCreateClick = ()=> setEditing(newSession(user.uid));
  const onEditClick = (row)=> setEditing({ id: row.id, ...row });
  const onDeleteClick = async (id)=>{ await deleteSession(id); await load(true); };

  const onSave = async (data)=>{
    if (editing.id) await updateSession(editing.id, data);
    else await createSession(data);
    setEditing(null);
    await load(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl">Welcome, {user?.email}</h1>
        <button onClick={logout} className="border rounded-lg px-3 py-2">Logout</button>
      </div>

      <div className="flex gap-2">
        <button onClick={onCreateClick} className="bg-black text-white rounded-xl px-4 py-2">New session</button>
        {cursor && <button onClick={()=>load()} className="border rounded-xl px-3 py-2">Load more</button>}
      </div>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Rounds</th>
              <th className="text-left p-3">Accuracy</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.rounds?.length ?? 0}</td>
                <td className="p-3">{r.totals?.attempts ? Math.round((r.totals.made/r.totals.attempts)*100) : 0}%</td>
                <td className="p-3">
                  <button className="mr-2 underline" onClick={()=>onEditClick(r)}>Edit</button>
                  <button className="underline" onClick={()=>onDeleteClick(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-3" colSpan={5}>No sessions yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-5xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-3">{editing.id ? "Edit session" : "New session"}</h2>
            <SessionForm
              initial={editing}
              onSubmit={onSave}
              onCancel={()=>setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
