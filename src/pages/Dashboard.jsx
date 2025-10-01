import { useAuthStore } from "../store/useAuthStore";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Welcome, {user?.email}</h1>
        <button onClick={logout} className="border rounded-lg px-3 py-2">Logout</button>
      </div>
      <div className="rounded-xl border p-6">
        Sprint 1 ✅ — Auth working. Next: Sessions CRUD.
      </div>
    </div>
  );
}
