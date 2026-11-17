import { useGet } from "../hooks";

const mmss = (s) => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`;
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

function Best({ label, value, sub, tone }) {
  return (
    <div className="mb-best">
      <small>{label}</small>
      <b className={tone}>{value ?? "–"}</b>
      <span>{sub || "Complete a stage to set this"}</span>
    </div>
  );
}

function Chip({ r }) {
  if (r.diff === null) return <span className="mb-chip blue">New</span>;
  if (r.diff === 0) return <span className="mb-chip gray">No change</span>;
  return <span className={`mb-chip ${r.diff > 0 ? "green" : "red"}`}>{r.diff > 0 ? `+${r.diff}` : r.diff}</span>;
}

export default function MyBest() {
  const bests = useGet("/xp/bests");
  const around = useGet("/leaderboard/around");
  const b = bests.data, a = around.data;
  const scope = a?.scope?.all ? "all" : a?.scope?.label;

  return (
    <>
      <h1 className="page-title mb-title">My personal bests</h1>
      <p className="page-sub" style={{ marginTop: 4 }}>Beat your own record first. Comparing with others is optional.</p>
      {bests.error && <div className="error" style={{ marginTop: 20 }}>{bests.error}</div>}

      <div className="mb-bests">
        <Best label="Best stage score" tone="brand" value={b?.bestScore && `${b.bestScore.score} / ${b.bestScore.max}`} sub={b?.bestScore && `${b.bestScore.topic} · ${b.bestScore.stage} · ${b.bestScore.date}`} />
        <Best label="Highest accuracy" tone="success" value={b?.accuracy && `${b.accuracy.pct}%`} sub={b?.accuracy && `${b.accuracy.subject} · ${b.accuracy.stage} · ${b.accuracy.date}`} />
        <Best label="Fastest clean stage" tone="accent" value={b?.fastest && mmss(b.fastest.timeSec)} sub={b?.fastest && `${b.fastest.subject} · ${b.fastest.stage} · ${b.fastest.score}/${b.fastest.max}`} />
        <Best label="Longest streak" tone="warning" value={b && `${b.streak.best} ${b.streak.best === 1 ? "day" : "days"}`} sub={b && `Current: ${b.streak.current} ${b.streak.current === 1 ? "day" : "days"}`} />
      </div>

      <section className="mb-card">
        <div className="mb-head"><h2>Records by topic</h2><span>This month</span></div>
        {b?.topics?.map((r) => (
          <div key={r.topic} className="mb-row">
            <b className="t">{r.topic}</b>
            <strong>Best {r.score} / {r.max}</strong>
            {r.was && <small>was {r.was.score} / {r.was.max}</small>}
            <Chip r={r} />
          </div>
        ))}
        {b && !b.topics.length && <p className="mb-empty">{b.hasData ? "No practice this month yet. Do a stage to see how you compare with your earlier best." : "Clear your first stage to start your records."}</p>}
      </section>

      {a?.rows?.length > 0 && (
        <section className="mb-card mb-board">
          <h2>Where are you?</h2>
          <p className="mb-sub">Ranked by points among {scope === "all" ? "all" : scope} learners. Levels shown as numbers, not labels.</p>
          {a.rows.map((r) => (
            <div key={r.rank} className={`mb-lrow ${r.me ? "me" : ""}`}>
              <span className="rk">#{r.rank}</span>
              <span className="av">{r.initial}</span>
              <b className="nm">{r.name}</b>
              <span className="mb-chip gray">Level {r.level}</span>
              <strong className="pt">{fmt(r.points)} pts</strong>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
