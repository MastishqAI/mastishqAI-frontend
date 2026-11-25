import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth.jsx";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";
import LevelsBadges from "./LevelsBadges.jsx";
import MyBest from "./MyBest.jsx";

const AV = [["#CFEBFB", "#0C6498"], ["#D1FAE5", "#059669"], ["#FCE7F3", "#BE185D"], ["#EDE9FE", "#6D28D9"], ["#FFEDD5", "#C2410C"], ["#E0E7FF", "#3730A3"], ["#FEE2E2", "#B91C1C"], ["#CCFBF1", "#0F766E"]];
const avatarColor = (s) => AV[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];

function Board() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async (offset = 0, append = false, query = q) => {
    try {
      const r = await api.get("/leaderboard", { params: { q: query, limit: 15, offset } });
      setItems((prev) => (append ? [...prev, ...r.items] : r.items));
      setMeta(r);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { const t = setTimeout(() => load(0, false, q), 250); return () => clearTimeout(t); }, [q]);

  if (loading) return <p className="skeleton">Loading…</p>;
  if (err) return <div className="error">{err}</div>;
  const me = meta.me;
  const shown = items.length;

  return (
    <>
      <h1 className="page-title" style={{ marginTop: 26 }}>Leaderboard</h1>
      <p className="page-sub">{meta.scope?.all ? "All learners" : `${meta.scope?.label} learners`} · ranked by points earned. Updated every hour.</p>
      <div className="search" style={{ marginTop: 22 }}>
        <Icon.search size={18} style={{ color: "var(--gray-400)" }} />
        <input placeholder="Search learner" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ marginTop: 22, borderRadius: 20, overflow: "hidden" }}>
        <table className="lb">
          <thead><tr><th style={{ paddingLeft: 24 }}>Rank</th><th>Learner</th><th>Level</th><th>Points</th><th>Streak</th><th>Accuracy</th><th>Avg. Time Taken</th></tr></thead>
          <tbody>
            {items.map((r) => {
              const [bg, fg] = avatarColor(r.name);
              const isMe = me && r.id === me.id;
              return (
                <tr key={r.id} className={isMe ? "me" : ""}>
                  <td className="rank">#{r.rank}</td>
                  <td><div className="who"><span className="av" style={{ background: bg, color: fg }}>{r.initials}</span><div><b>{r.name}{isMe && " (You)"}</b><small>{r.goal.split(" ")[0] || "Learner"}{r.place ? ` · ${r.place}` : ""}</small></div></div></td>
                  <td><span className="lvl">Level {r.level}</span></td>
                  <td className="pts">{r.points.toLocaleString()}</td>
                  <td>{r.streak} days</td>
                  <td>{r.accuracy}%</td>
                  <td>{r.avgMinutes} min</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <p style={{ padding: 24, color: "var(--gray-500)" }}>No learners match your search.</p>}
        <div className="lb-foot">
          <span>Showing 1–{shown} and your position · {meta.total.toLocaleString()} learners</span>
          <span className="r">
            {me && <button className="btn outline sm" style={{ height: 44, color: "var(--gray-900)" }} onClick={() => { setQ(""); load(0, false, ""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Jump to my rank</button>}
            {meta.hasMore && <button className="link" onClick={() => load(items.filter((i) => !(me && i.id === me.id)).length, true)}>Load more</button>}
          </span>
        </div>
      </div>

      {me && (
        <div className="climb">
          <span className="big">#{me.rank}</span>
          <div>
            <b>{meta.movedUp > 0 ? `You moved up ${meta.movedUp} place${meta.movedUp > 1 ? "s" : ""} this week` : "Keep practising to climb the board"}</b>
            <p>{meta.nextTarget ? `${meta.nextTarget.diff} more points passes ${meta.nextTarget.name} (#${meta.nextTarget.rank}). One 10-minute weak-spot set is about 60 points.` : "You're at the top of the leaderboard."}</p>
          </div>
          <Link className="btn" to="/practice">Start learn</Link>
        </div>
      )}
      <p className="foot-note">Points come only from practice: correct answers, cleared stages, fixed mistakes and streak days. Your accuracy and scores stay private unless you choose to show them.</p>
    </>
  );
}

export default function Progress() {
  // the tab lives in the URL (?tab=best) so it can be linked, refreshed and reached with Back
  const [params, setParams] = useSearchParams();
  const tab = ["stand", "best", "levels"].includes(params.get("tab")) ? params.get("tab") : "stand";
  const setTab = (k) => setParams(k === "stand" ? {} : { tab: k });
  return (
    <div className="container wide" style={{ maxWidth: 1136 }}>
      <div className="tabs" role="tablist">
        {[["stand", "Where I stand"], ["best", "My best"], ["levels", "Levels & badges"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "stand" && <Board />}
      {tab === "best" && <MyBest />}
      {tab === "levels" && <LevelsBadges />}
    </div>
  );
}
