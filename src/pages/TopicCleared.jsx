import { Link } from "react-router-dom";
import { useGet } from "../hooks";

const COLORS = { easy: "var(--green-400)", medium: "var(--amber-500)", hard: "var(--red-400)" };
const mmss = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`);
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const Tick = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;

// "Topic quiz · all stages complete": shown after the last stage is cleared
export default function TopicCleared({ practiceId }) {
  const { data: d, error } = useGet(`/practice/${practiceId}/summary`);
  if (error) return <div className="container"><div className="error" style={{ marginTop: 26 }}>{error}</div></div>;
  if (!d) return <div className="container"><p className="skeleton">Loading your results…</p></div>;
  return (
    <div className="container tc">
      <div className="tc-steps" aria-label="All three stages cleared">
        {d.stages.map((s, i) => (
          <span key={s.stage} className="tc-step"><i className="ok"><Tick /></i><b>{s.label}</b>{i < 2 && <u />}</span>
        ))}
      </div>

      <section className="tc-card">
        <div className="tc-hero">
          {d.earnedBadge && <img src={`/badges/${d.earnedBadge}.png`} alt="" width="96" height="96" />}
          <div>
            <span className="tc-chip">All 3 stages cleared</span>
            <h1>Topic cleared: {d.topic}</h1>
            <p>{d.score} of {d.max} marks across Easy, Medium and Hard.{d.lostTotal > 0 ? ` ${d.lostTotal} marks were lost, mostly on ${d.worstStage}. Fix them to master the topic.` : " A perfect run."}</p>
          </div>
        </div>

        <div className="tc-stages">
          {d.stages.map((s) => (
            <div key={s.stage} className="tc-stage">
              <div className="top"><b><i style={{ background: COLORS[s.stage] }} />{s.label}</b><span className="tc-ok"><Tick /> Cleared</span></div>
              <strong>{s.score} / {s.max}</strong>
              <i className="bar"><u style={{ width: `${s.pct}%`, background: COLORS[s.stage] }} /></i>
              <small>{s.pct}% · {mmss(s.timeSec)}</small>
            </div>
          ))}
        </div>

        <h2>Rewards</h2>
        <div className="tc-rewards">
          <div className="pts"><small>Points earned</small><b>+{fmt(d.pointsEarned)}</b><span>Total {fmt(d.totalPoints)} pts</span></div>
          <div className="badge"><small>Next badge</small><b>{d.nextBadge ? d.nextBadge.name : "All earned"}</b><span>{d.nextBadge ? d.nextBadge.hint : "You have every badge"}</span></div>
          <div className="streak"><small>Streak</small><b>{d.streak} {d.streak === 1 ? "day" : "days"}</b><span>Practise tomorrow to keep it</span></div>
          <div className="lvl"><small>{d.level.next ? `Level ${d.level.n} → ${d.level.n + 1}` : `Level ${d.level.n}`}</small><b>{d.level.pct}%</b><i className="bar"><u style={{ width: `${d.level.pct}%` }} /></i></div>
        </div>

        {d.lostTotal > 0 && (
          <div className="tc-diag">
            <div>
              <b>{d.lostTotal} marks still lost · {d.mistakes} questions saved to Mistake Bank</b>
              <p>{d.lost.map((m) => `${m.topic} (−${m.lost})`).join(" · ")}{d.lostOther > 0 ? ` · other (−${d.lostOther})` : ""}</p>
            </div>
            <Link className="btn outline" to="/mistakes">See diagnosis</Link>
          </div>
        )}

        <div className="tc-actions">
          <Link className="btn outline" to={`/review/${d.reviewAttemptId}`}>Review all questions</Link>
          <Link className="btn outline" to="/">Back to Today</Link>
        </div>
      </section>
    </div>
  );
}
