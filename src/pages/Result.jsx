import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { Stepper } from "../components/ui.jsx";
import TopicCleared from "./TopicCleared.jsx";
import { Icon } from "../components/icons.jsx";

const Delta = ({ from, to, unit = "", lowerBetter = false, pct = false }) => {
  const d = to - from;
  const good = lowerBetter ? d <= 0 : d >= 0;
  return (
    <div className="cmp">
      <span style={{ flex: 1 }} />
      <b>{from}{pct ? "%" : unit} → {to}{pct ? "%" : unit}</b>
      <span className={`delta ${good ? "" : "neg"}`}>{d > 0 ? "+" : d < 0 ? "−" : ""}{Math.abs(d)}{pct ? "%" : unit}</span>
    </div>
  );
};

export default function Result() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.post(`/practice/attempts/${attemptId}/finish`).then((x) => setR(x.result)).catch((e) => setErr(e.message));
  }, [attemptId]);

  const go = async (stage) => {
    setBusy(true);
    try { const s = await api.post(`/practice/${r.practiceId}/stages/${stage}/start`); nav(`/quiz/${s.attempt.id}`); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  if (err && !r) return <div className="container"><div className="error">{err}</div></div>;
  if (!r) return <div className="container skeleton">Calculating your result…</div>;

  /* ---------- diagnostic ---------- */
  if (r.stage === "diagnostic") {
    const pct = Math.round((r.score / r.maxScore) * 100);
    return (
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="card result" style={{ textAlign: "center" }}>
          <div className="result-ico" style={{ background: "var(--green-100)", color: "var(--green-700)", margin: "0 auto" }}><Icon.check size={30} /></div>
          <h1 style={{ marginTop: 18 }}>Diagnostic complete</h1>
          <p className="d">You answered {r.score} of {r.maxScore} correctly ({pct}%). You earned {r.earned} pts.</p>
          {r.marksLost.length > 0 && (
            <div className="panel" style={{ textAlign: "left", marginTop: 28 }}>
              <h3>Where to focus first<em>{r.mistakes} to review</em></h3>
              {r.marksLost.slice(0, 5).map((m) => (
                <div key={m.topic} className="barrow"><span>{m.topic}</span><div className="t"><i style={{ width: `${Math.min(100, (m.lost / r.marksLost[0].lost) * 100)}%` }} /></div><b>−{m.lost}</b></div>
              ))}
            </div>
          )}
          <div className="res-actions" style={{ justifyContent: "center" }}>
            <Link className="btn outline" to={`/review/${r.attemptId}`}>Review all questions</Link>
            <Link className="btn" to="/practice">Start practising</Link>
          </div>
        </div>
      </div>
    );
  }

  const cleared = r.cleared;
  if (cleared && !r.nextStage && r.practiceId) return <TopicCleared practiceId={r.practiceId} />;   // all three stages done
  const current = cleared ? r.nextStage || r.stage : r.stage;
  const stages = { ...r.stages };
  const lostLabel = r.marksLost.length === 1 ? "so this is very fixable" : "";
  const mostTopic = r.marksLost[0]?.topic;

  return (
    <div className="container" style={{ maxWidth: 1104 }}>
      <div style={{ display: "flex", justifyContent: "center" }}><Stepper stages={stages} current={current} /></div>
      <div className="card result">
        <span className="stagepill" style={cleared ? { background: "var(--green-100)", color: "var(--green-700)" } : { background: "rgba(245,11,11,.14)", color: "#B40909" }}>
          {r.stageLabel} stage · {cleared ? "Cleared" : `Attempt ${r.attemptNo}`}
        </span>
        <div className="result-head">
          <div className="result-ico" style={cleared ? { background: "var(--green-100)", color: "var(--green-700)" } : { background: "var(--red-100)", color: "var(--red-600)" }}>
            {cleared ? <Icon.check size={30} /> : <Icon.arrowUpRight size={30} />}
          </div>
          <div>
            <h1>{cleared ? (r.marksLostTotal ? `Stage cleared, ${r.marksLostTotal} mark${r.marksLostTotal > 1 ? "s" : ""} still lost` : "Stage cleared, perfect score!") : `Not cleared yet: ${r.marksToGo} marks to go`}</h1>
            <p className="d">
              {cleared
                ? `You scored ${r.score} of ${r.maxScore}. ${r.nextStageLabel ? `${r.nextStageLabel} is unlocked. ` : "You've cleared every stage of this topic. "}${r.marksLostTotal ? `Fix the ${r.marksLostTotal} lost marks now so they don't follow you to the next stage.` : ""}`
                : `You scored ${r.score} of ${r.maxScore} and need ${r.passMark} to clear ${r.stageLabel}.${mostTopic ? ` Most lost marks come from ${r.marksLost.length > 1 ? "a few topics" : "one topic"}, so this is very fixable.` : ""}`}
            </p>
            {cleared && r.earned > 0 && <p style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber-500)" }} />{r.badge ? `You earned the ${r.badge} badge · ` : "You earned "}+{r.earned} pts</p>}
          </div>
        </div>

        <div className="res-grid">
          <div className="panel" style={{ minHeight: 230 }}>
            <h3>Where your marks went<em>{r.marksLostTotal} marks lost</em></h3>
            {r.marksLost.length === 0 && <p style={{ color: "var(--gray-500)", marginTop: 16 }}>No marks lost — nicely done.</p>}
            {r.marksLost.slice(0, 5).map((m) => (
              <div key={m.topic} className="barrow"><span>{m.topic}</span><div className="t"><i style={{ width: `${Math.min(100, (m.lost / r.marksLost[0].lost) * 100)}%` }} /></div><b>−{m.lost}</b></div>
            ))}
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-600)", marginTop: 22 }}>By mistake type</p>
            {r.mistakeTypes?.length > 0
              ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>{r.mistakeTypes.map((m) => <span key={m.type} className="pill-tag">{m.type} · {m.count}</span>)}</div>
              : r.mistakes > 0 && <p style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 6 }}>Tag why you missed each question in Review to see this breakdown.</p>}
          </div>
          <div className="panel">
            <h3>Compared with last attempt</h3>
            {r.compare ? (
              <>
                <div className="cmp"><span>Score</span><span><b>{r.compare.score[0]} → {r.compare.score[1]}</b><span className={`delta ${r.compare.score[1] >= r.compare.score[0] ? "" : "neg"}`}>{r.compare.score[1] - r.compare.score[0] >= 0 ? "+" : "−"}{Math.abs(r.compare.score[1] - r.compare.score[0])}</span></span></div>
                <div className="cmp"><span>Accuracy</span><span><b>{r.compare.accuracy[0]}% → {r.compare.accuracy[1]}%</b><span className={`delta ${r.compare.accuracy[1] >= r.compare.accuracy[0] ? "" : "neg"}`}>{r.compare.accuracy[1] - r.compare.accuracy[0] >= 0 ? "+" : "−"}{Math.abs(r.compare.accuracy[1] - r.compare.accuracy[0])}%</span></span></div>
                <div className="cmp"><span>Avg time / Q</span><span><b>{r.compare.avgTime[0]}s → {r.compare.avgTime[1]}s</b><span className={`delta ${r.compare.avgTime[1] <= r.compare.avgTime[0] ? "" : "neg"}`}>{r.compare.avgTime[1] - r.compare.avgTime[0] <= 0 ? "−" : "+"}{Math.abs(r.compare.avgTime[1] - r.compare.avgTime[0])}s</span></span></div>
              </>
            ) : <p style={{ color: "var(--gray-500)", marginTop: 16, fontSize: 13 }}>This is your first attempt at this stage. Retry it to see how you improve.</p>}
          </div>
        </div>

        <h3 style={{ fontSize: 16, margin: "30px 0 0" }}>Review, Practice &amp; Progress</h3>
        <div className="rev-card">
          <div>
            <h4>{r.mistakes ? `Review your ${r.mistakes} mistake${r.mistakes > 1 ? "s" : ""}` : "No mistakes to review"}</h4>
            <p>{r.mistakes ? `Review your ${r.mistakes} question${r.mistakes > 1 ? "s" : ""} which you have given a wrong answer. Ask with AI the answer in detail` : "You got everything right on this attempt."}</p>
          </div>
          {r.mistakes > 0 && <Link to={`/review/${r.attemptId}?only=wrong`} style={{ fontWeight: 600, fontSize: 14 }}>Review {r.mistakes} question{r.mistakes > 1 ? "s" : ""}</Link>}
        </div>

        {err && <div className="error" style={{ marginTop: 16 }}>{err}</div>}
        <div className="res-actions">
          <Link className="btn outline" to={`/review/${r.attemptId}`}>Review all questions</Link>
          {cleared && r.nextStage
            ? <button className="btn" disabled={busy} onClick={() => go(r.nextStage)}>Continue to {r.nextStageLabel}</button>
            : !cleared ? <button className="btn" disabled={busy} onClick={() => go(r.stage)}>Retry {r.stageLabel}</button>
            : <Link className="btn" to="/practice">Practise another topic</Link>}
        </div>
      </div>
    </div>
  );
}
