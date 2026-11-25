import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api";
import { Icon } from "../components/icons.jsx";
import ReportDialog from "../components/ReportDialog.jsx";
import AskPanel from "../components/AskPanel.jsx";

const TAGS = ["Concept", "Calculation", "Misread", "Guess", "Time"];


// Step-by-step solution (Short / Detailed), generated on demand and cached by the server
function StepsSection({ attemptId, qid }) {
  const [mode, setMode] = useState("detailed");
  const [data, setData] = useState({});
  const [open, setOpen] = useState(0);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (data[`${qid}:${mode}`]) return;
    setErr("");
    api.get(`/practice/attempts/${attemptId}/questions/${qid}/steps`, { params: { mode } })
      .then((r) => setData((d) => ({ ...d, [`${qid}:${mode}`]: r.steps })))
      .catch((e) => setErr(e.message));
  }, [qid, mode]);
  useEffect(() => setOpen(0), [qid, mode]);
  const list = data[`${qid}:${mode}`];
  return (
    <div className="steps-card">
      <div className="hd">
        <h3>Step-by-step solution</h3>
        <div className="seg">{["short", "detailed"].map((m) => <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{m[0].toUpperCase() + m.slice(1)}</button>)}</div>
      </div>
      {err && <div className="error">{err}</div>}
      {!list && !err && <p style={{ color: "var(--gray-500)", fontSize: 13 }}>Writing the solution…</p>}
      {list?.map((st, i) => (
        <div key={i} className={`step-row ${open === i ? "open" : ""}`} onClick={() => setOpen(open === i ? -1 : i)}>
          <div className="h"><span className="n">Step {i + 1}</span>{st.title}</div>
          {open === i && <p>{st.body}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Review() {
  const { attemptId } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [a, setA] = useState(null);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [panel, setPanel] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    api.get(`/practice/attempts/${attemptId}/review`).then((r) => {
      setA(r.attempt);
      if (sp.get("only") === "wrong") { const i = r.attempt.questions.findIndex((q) => !q.correct); if (i >= 0) setIdx(i); }
    }).catch((e) => setErr(e.message));
  }, [attemptId]);

  if (err) return <div className="container"><div className="error">{err}</div></div>;
  if (!a) return <div className="container skeleton">Loading review…</div>;

  const q = a.questions[idx];
  const total = a.questions.length;
  const only = sp.get("only") === "wrong";
  const order = a.questions.map((x, i) => i).filter((i) => !only || !a.questions[i].correct);
  const pos = order.indexOf(idx);
  const nextIdx = order[pos + 1];

  const toggleTag = async (t) => {
    const tags = q.tags.includes(t) ? q.tags.filter((x) => x !== t) : [...q.tags, t];
    setA({ ...a, questions: a.questions.map((x, i) => (i === idx ? { ...x, tags } : x)) });
    try { await api.post(`/practice/attempts/${attemptId}/questions/${q.id}/tag`, { tags }); setSaved(true); } catch (e) { setErr(e.message); }
  };
  const ask = () => setPanel(true);

  return (
    <div className="container wide" style={{ maxWidth: 1180 }}>
      <div className="row-between" style={{ marginBottom: 26, fontSize: 14 }}>
        <Link to={`/result/${attemptId}`} style={{ fontWeight: 600, display: "inline-flex", gap: 6, alignItems: "center" }}>← Back</Link>
        <span style={{ color: "var(--gray-500)" }}>{a.topic} · {a.stageLabel} stage · Attempt {a.attemptNo}</span>
      </div>
      <div className="quiz-grid" style={{ gridTemplateColumns: "1fr 300px" }}>
        <div>
          <div className="card q-card" style={{ marginTop: 0 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
              <span className="pill-tag gray">Question {idx + 1} of {total}</span>
              <span className={`pill-tag ${q.correct ? "green" : "red"}`}>{q.correct ? "Correct" : q.selectedIndex === -1 ? "Skipped" : "Wrong"}</span>
              <span className="pill-tag" style={{ background: "#EEF0FE", color: "#233AE8" }}>Source: {q.source || "AI generated"}</span>
            </div>
            <h2>{q.text}</h2>
            {q.options.map((o, i) => {
              const mine = q.selectedIndex === i, right = q.correctIndex === i;
              return (
                <div key={i} className={`opt locked ${mine && !right ? "wrong" : ""} ${right ? "right" : ""}`} style={{ fontWeight: 500 }}>
                  <span className="l-plain">{String.fromCharCode(65 + i)}</span>{o}
                  {mine && !right && <span className="tagp red"><Icon.x size={12} /> Your answer</span>}
                  {right && <span className="tagp green"><Icon.check size={12} /> {mine ? "Your answer · Correct" : "Correct answer"}</span>}
                </div>
              );
            })}
            {q.explanation && <div className="ok" style={{ background: "var(--blue-50)", color: "var(--blue-700)", marginTop: 14, marginBottom: 0 }}>💡 {q.explanation}</div>}
          </div>
          <div className="q-foot" style={{ marginTop: 24 }}>
            <button className="btn" style={{ height: 46 }} onClick={ask}>Ask why</button>
            {nextIdx !== undefined
              ? <button className="btn outline" style={{ height: 46 }} onClick={() => { setIdx(nextIdx); setSaved(false); setPanel(false); setNote(""); }}>{only ? "Next wrong question" : "Next question"} →</button>
              : <button className="btn outline" style={{ height: 46 }} onClick={() => nav(`/result/${attemptId}`)}>Back to result</button>}
            <span className="grow" />
            <button className="flag" onClick={() => setReporting(true)}><Icon.flag size={14} /> Report this question</button>
          </div>
          {note && <div className="ok" style={{ marginTop: 14 }}>{note}</div>}
          <StepsSection attemptId={attemptId} qid={q.id} />
        </div>

        <aside>
          <div className="card side-card">
            <h4>Question navigator</h4>
            <div className="nav-grid">
              {a.questions.map((x, i) => (
                <button key={x.id} className={`${x.correct ? "ok" : "bad"} ${i === idx ? "view" : ""}`} onClick={() => { setIdx(i); setSaved(false); }}>{i + 1}</button>
              ))}
            </div>
            <div className="legend"><span><i style={{ background: "var(--green-400)" }} />Correct</span><span><i style={{ background: "#F25C5C" }} />Wrong</span><span><i style={{ background: "#000" }} />Viewing</span></div>
          </div>

          {!q.correct && (
            <div className="card side-card">
              <h4>Why did you miss it?<span style={{ color: "var(--red-600)" }}>*</span></h4>
              <p style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 8 }}>Tag the mistake so we can give you the right practice.</p>
              <div className="tags">{TAGS.map((t) => <button key={t} className={`tag-btn ${q.tags.includes(t) ? "sel" : ""}`} onClick={() => toggleTag(t)}>{t}</button>)}</div>
              {q.tags.length > 0 && <div className="ok" style={{ background: "var(--green-50)", color: "var(--green-700)", fontWeight: 600, fontSize: 12, marginBottom: 0 }}>✓ Saved to your Mistake Bank</div>}
            </div>
          )}

          {q.peers && (
            <div className="card side-card">
              <h4>How others answered</h4>
              <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "6px 0 12px" }}>Shown only after you answer.</p>
              {q.options.map((o, i) => (
                <div key={i} className="row-between" style={{ fontSize: 12.5, padding: "4px 0" }}><span>{String.fromCharCode(65 + i)} · {o}</span><b>{String(q.peers[i]).padStart(2, "0")}%</b></div>
              ))}
            </div>
          )}
        </aside>
      </div>
      {reporting && <ReportDialog onClose={() => setReporting(false)} onSubmit={async (reason, text) => {
        try { await api.post(`/practice/attempts/${attemptId}/questions/${q.id}/feedback`, { kind: "report_question", note: `${reason}${text ? `: ${text}` : ""}` }); setNote("Thanks — this question has been flagged for review."); }
        catch (e) { setNote(e.message); }
        setReporting(false);
      }} />}
      {panel && <AskPanel attemptId={attemptId} q={q} number={idx + 1} subject={a.subject} onClose={() => setPanel(false)} />}
    </div>
  );
}
