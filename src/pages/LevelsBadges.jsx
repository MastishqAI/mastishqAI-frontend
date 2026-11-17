import { useEffect, useState } from "react";
import api from "../api";
import { useGet } from "../hooks";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const dateText = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const Lock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
const Tick = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

function Summary({ d }) {
  const lv = d.level, b = d.badgeSummary;
  return (
    <div className="lv-sum">
      <div className="lv-stat"><small>Level</small><b>Level {lv.n}</b><span>{lv.next ? `${fmt(lv.points)} / ${fmt(lv.next)} pts to Level ${lv.n + 1}` : `${fmt(lv.points)} pts · top level`}</span><i className="bar"><u style={{ width: `${lv.pct}%` }} /></i></div>
      <div className="lv-stat"><small>Total points</small><b>{fmt(d.totalXp)}</b><span>+{fmt(d.weekXp)} this week</span></div>
      <div className="lv-stat"><small>Streak</small><b>{d.streak.current} {d.streak.current === 1 ? "day" : "days"}</b><span>Best: {d.streak.best} {d.streak.best === 1 ? "day" : "days"}</span></div>
      <div className="lv-stat"><small>Badges</small><b>{b.earned} of {b.total}</b><span>{b.next ? `Next: ${b.next}` : "All earned"}</span><i className="bar"><u style={{ width: `${Math.round((b.earned / b.total) * 100)}%` }} /></i></div>
    </div>
  );
}

function BadgeArt({ b, locked }) {
  return <img className={`lv-art ${locked ? "locked" : ""}`} src={`/badges/${b.key}.png`} alt={`${b.name} badge`} width="64" height="64" />;
}

function Badges({ list }) {
  const earned = list.filter((b) => b.met), upcoming = list.filter((b) => !b.met);
  return (
    <section className="lv-card lv-badges">
      <div className="lv-head"><h2>Badges</h2><span className="lv-chip">{earned.length} earned · {upcoming.length} to go</span></div>
      {earned.length > 0 && <p className="lv-eyebrow green">EARNED</p>}
      <div className="lv-bgrid">
        {earned.map((b) => (
          <div key={b.key} className="lv-badge got">
            <BadgeArt b={b} />
            <div><b>{b.name}</b><p>{b.desc}</p><span className="lv-chip green"><Tick size={11} /> Earned {dateText(b.earnedAt)}</span></div>
          </div>
        ))}
      </div>
      {upcoming.length > 0 && <p className="lv-eyebrow">UPCOMING</p>}
      <div className="lv-bgrid">
        {upcoming.map((b) => (
          <div key={b.key} className="lv-badge">
            <BadgeArt b={b} locked />
            <div className="grow">
              <div className="lv-bt"><b>{b.name}</b><span className="lv-chip gray"><Lock /> Locked</span></div>
              <p>{b.desc}</p>
              <div className="lv-prog"><i className="bar amber"><u style={{ width: `${b.pct}%` }} /></i><small>{b.hint}</small></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Levels({ rows }) {
  return (
    <section className="lv-card lv-levels">
      <h2>Levels</h2>
      <div className="lv-list" tabIndex={0} aria-label="Levels">
        {rows.map((r) => (
          <div key={r.n} className={`lv-row ${r.state}`}>
            <span className="dot">{r.state === "done" ? <Tick size={13} /> : r.n}</span>
            <div><b>Level {r.n}</b><small>From {fmt(r.from)} pts · unlocks {r.unlocks}</small></div>
            {r.state === "done" && <span className="lv-chip green">Done</span>}
            {r.state === "current" && <span className="lv-chip blue">You are here · {r.pct}%</span>}
            {r.state === "next" && <span className="lv-chip gray">{fmt(r.toGo)} pts to go</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Heatmap() {
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/xp/heatmap", { params: month ? { month } : {} }).then(setData).catch(() => {}); }, [month]);
  if (!data) return <section className="lv-card lv-heat"><h2>Activity Heatmap</h2><p className="lv-note">Loading…</p></section>;
  const step = (delta) => { const [y, m] = data.month.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + delta, 1)); setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`); };
  const isNow = data.month === data.today.slice(0, 7);
  const todayCell = data.weeks.flat().find((c) => c?.date === data.today);
  return (
    <section className="lv-card lv-heat">
      <div className="lv-head"><h2>Activity Heatmap</h2></div>
      <div className="lv-month"><button type="button" aria-label="Previous month" onClick={() => step(-1)}>‹</button><span>{data.label}</span><button type="button" aria-label="Next month" disabled={isNow} onClick={() => step(1)}>›</button></div>
      <div className="lv-hgrid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <small key={d}>{d}</small>)}
        {data.weeks.flat().map((c, i) => <i key={i} className={c ? `h${c.level}` : "blank"} title={c ? `${c.date}: ${c.xp} pts` : undefined} />)}
      </div>
      <div className="lv-legend"><span>Less</span>{[0, 1, 2, 3, 4].map((n) => <i key={n} className={`h${n}`} />)}<span>More</span></div>
      <p className="lv-note">Practise at least one 20-minute set a day to keep your streak.{isNow && <> Today: {todayCell?.xp > 0 ? <b>done <Tick size={11} /></b> : "not yet"}</>}</p>
    </section>
  );
}

function Earn({ week, weekXp }) {
  const max = Math.max(1, ...week.map((d) => d.xp));
  return (
    <section className="lv-card lv-earn">
      <h2>How you earn points</h2>
      <div className="lv-rule"><span>Correct answer · Easy / Medium / Hard</span><b>2 / 3 / 4</b></div>
      <div className="lv-rule"><span>Stage cleared</span><b>+20</b></div>
      <div className="lv-rule"><span>Mistake moved to Fixed</span><b>+5</b></div>
      <div className="lv-rule"><span>Daily streak kept</span><b>+10</b></div>
      <div className="lv-week">
        <small>This week · +{fmt(weekXp)} pts</small>
        <div className="bars">
          {week.map((d, i) => (
            <div key={d.date} className="col"><i style={{ height: d.future || !d.xp ? 2 : Math.max(8, Math.round((d.xp / max) * 64)) }} className={d.future || !d.xp ? "none" : ""} title={`${d.date}: ${d.xp} pts`} /><em>{d.label}</em></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LevelsBadges() {
  const { data, error } = useGet("/xp/overview");
  if (error) return <div className="error" style={{ marginTop: 26 }}>{error}</div>;
  if (!data) return <p className="skeleton" style={{ marginTop: 26 }}>Loading…</p>;
  return (
    <>
      <h1 className="page-title lv-title">Points, levels and badges</h1>
      <p className="page-sub">Everything you have earned, and what is next to unlock.</p>
      <Summary d={data} />
      <Badges list={data.badges} />
      <div className="lv-bottom">
        <Levels rows={data.levels} />
        <div className="lv-side"><Heatmap /><Earn week={data.week} weekXp={data.weekXp} /></div>
      </div>
    </>
  );
}
