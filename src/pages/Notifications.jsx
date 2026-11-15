import api from "../api";
import { useGet } from "../hooks";

export default function Notifications() {
  const { data, loading, error, reload } = useGet("/notifications");
  const call = async (fn) => { await fn(); reload(); };
  if (loading) return <div className="container skeleton">Loading…</div>;
  if (error) return <div className="container"><div className="error">{error}</div></div>;
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="row-between">
        <h1 className="page-title">Notifications</h1>
        <button className="btn outline sm" onClick={() => call(() => api.patch("/notifications/read-all"))}>Mark all read</button>
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {data.notifications.map((n) => (
          <div key={n._id} className="card pad" style={{ opacity: n.read ? 0.6 : 1, padding: 18, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <div><b>{n.title}</b><div style={{ color: "var(--gray-500)", fontSize: 13, marginTop: 2 }}>{n.body}</div></div>
            {!n.read && <button className="btn outline sm" onClick={() => call(() => api.patch(`/notifications/${n._id}/read`))}>Mark read</button>}
          </div>
        ))}
        {!data.notifications.length && <p style={{ color: "var(--gray-500)" }}>You're all caught up.</p>}
      </div>
    </div>
  );
}
