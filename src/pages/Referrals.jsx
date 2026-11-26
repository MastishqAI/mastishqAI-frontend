import { useState } from "react";
import { Link } from "react-router-dom";
import { useGet } from "../hooks";
import { Avatar } from "../components/ui.jsx";

const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

// Friends who joined with my invite link, and the bonus chats each one earned me.
export default function Referrals() {
  const { data, loading, error } = useGet("/profile/referrals");
  const [note, setNote] = useState("");
  const rows = data?.referrals || [];

  const share = async () => {
    const link = `${window.location.origin}/signup?ref=${data.code}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Mastishq.ai", text: "Practice smarter with Mastishq.ai. Join with my link:", url: link }); return; }
      await navigator.clipboard.writeText(link); setNote("Link copied. Send it to a friend.");
    } catch (e) { if (e?.name !== "AbortError") setNote(link); }
  };

  return (
    <div className="container rf">
      <Link to="/profile" className="pl-back">← Back to Profile</Link>
      <div className="rf-top">
        <div className="rf-pill"><span>Total Credits Earned</span><b>{data ? data.earned : "–"}</b></div>
        <button type="button" className="rf-btn" disabled={!data} onClick={share}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
          Refer friends
        </button>
      </div>
      {note && <p className="rf-note" role="status">{note}</p>}

      <div className="rf-head"><h2>Milestones Met</h2><span>{rows.length ? `Showing ${rows.length} ${rows.length === 1 ? "entry" : "entries"}` : ""}</span></div>
      <div className="rf-table">
        <div className="rf-row rf-th"><span className="c1">Referrer</span><span className="c2">Reward</span><span className="c3">Status</span><span className="c4">Date</span></div>
        {loading && <p className="rf-empty">Loading…</p>}
        {error && <p className="rf-empty" role="alert">{error}</p>}
        {!loading && !error && rows.length === 0 && <p className="rf-empty">No friends yet. You both get {data?.reward ?? 5} credits when a friend finishes their first level.</p>}
        {rows.map((r, i) => (
          <div key={i} className="rf-row">
            <span className="c1"><Avatar user={r} size={41} /><b>{r.name}</b></span>
            <b className="c2">{r.rewarded ? `+${r.reward}` : 0} Credits</b>
            <span className="c3"><i className={r.rewarded ? "on" : ""} />{r.rewarded ? "Level 1 Completed" : "Joined · Level 1 pending"}</span>
            <span className="c4">{fmt(r.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
