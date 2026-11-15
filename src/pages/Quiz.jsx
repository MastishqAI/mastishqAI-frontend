import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";
import { Stepper } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";

export default function Quiz() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const home = useGet("/home");
  const [a, setA] = useState(null);
  const [stages, setStages] = useState(null);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [left, setLeft] = useState(60);
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState(null);
  const [err, setErr] = useState("");
  const startedAt = useRef(Date.now());

  useEffect(() => {
    api.get(`/practice/attempts/${attemptId}`).then(async (r) => {
      if (r.attempt.status === "submitted") return nav(`/result/${attemptId}`, { replace: true });
      setA(r.attempt);
      const first = r.attempt.questions.findIndex((q) => !q.answered);
      setIdx(first === -1 ? 0 : first);
      setLeft(r.attempt.secondsPerQuestion);
      try { const p = await api.get(`/practice/${r.attempt.practiceId}`); setStages(p.practice.stages); } catch {}
    }).catch((e) => setErr(e.message));
  }, [attemptId]);

  const q = a?.questions[idx];
  const total = a?.questions.length || 0;

  // per-question countdown; when it runs out we move on (unanswered counts as wrong)
  useEffect(() => {
    if (!a || !q || q.answered) return;
    startedAt.current = Date.now();
    setLeft(a.secondsPerQuestion);
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [idx, a?.id, q?.answered]);
  useEffect(() => { if (left <= 0 && q && !q.answered) next(); }, [left]);

  // Save the highlighted option for the current question (used by Submit and by every way of leaving the question)
  const postAnswer = async () => {
    const r = await api.post(`/practice/attempts/${attemptId}/answer`, { questionId: q.id, selectedIndex: sel, timeSec: Math.round((Date.now() - startedAt.current) / 1000) });
    setA((prev) => ({
      ...prev, pointsEarned: r.pointsEarned,
      questions: prev.questions.map((x, i) => (i === idx ? { ...x, answered: true, selectedIndex: sel, correct: r.correct, correctIndex: r.correctIndex } : x)),
    }));
  };
  // A choice that was picked but not submitted must never be lost (timer ran out, End quiz, or jumping to another question)
  const flush = async () => {
    if (sel !== null && q && !q.answered) { try { await postAnswer(); } catch { /* already answered is fine */ } }
  };

  const finish = async () => {
    setBusy(true);
    try { await flush(); await api.post(`/practice/attempts/${attemptId}/finish`); nav(`/result/${attemptId}`); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  async function next() {
    if (idx >= total - 1) return finish();
    await flush();
    setSel(null);
    setIdx(idx + 1);
  }

  const submit = async () => {
    if (sel === null) return;
    setBusy(true); setErr("");
    try { await postAnswer(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (err && !a) return <div className="container"><div className="error">{err}</div></div>;
  if (!a) return <div className="container skeleton">Loading your quiz…</div>;

  const shown = q.answered ? q.selectedIndex : sel;
  const isDiag = a.stage === "diagnostic";

  return (
    <div className="container wide" style={{ maxWidth: 1180 }}>
      <div className="quiz-grid">
        <div>
          <div className="card quiz-head">
            <span className="lvl">Level {home.data?.level ?? 0}</span>
            <div className="row-between" style={{ alignItems: "flex-start" }}>
              <div>
                <h2>{a.topic}</h2>
                <p>{isDiag ? "A quick mixed check across your subjects to map where you stand." : `Easy, Medium and Hard stages — clear each at 70% to move on.`}</p>
              </div>
              {!q.answered && <div className="ring" style={{ "--p": `${Math.max(0, (left / a.secondsPerQuestion) * 100)}%` }}><span>{Math.max(0, left)}</span></div>}
            </div>
            {!isDiag && <Stepper stages={stages} current={a.stage} />}
          </div>

          <div className="card q-card">
            <h2>{q.text}</h2>
            {q.options.map((o, i) => (
              <button key={i} type="button" disabled={q.answered} className={`opt ${shown === i ? "sel" : ""} ${q.answered ? "locked" : ""}`} onClick={() => setSel(i)}>
                <span className="l">{String.fromCharCode(65 + i)}</span>
                {o}
                <span className="box">{shown === i && <Icon.check size={14} />}</span>
              </button>
            ))}
            <p className="q-note">Question {idx + 1} of {total} · {a.stageLabel} stage · Peer stats appear only in review.</p>
            {err && <div className="error">{err}</div>}
            <div className="q-foot">
              <button className="flag" type="button" onClick={async () => { try { await api.post(`/practice/attempts/${attemptId}/questions/${q.id}/feedback`, { kind: "report_question" }); setReported(q.id); } catch (e) { setErr(e.message); } }}><Icon.flag size={14} /> {reported === q.id ? "Reported ✓" : "Report this question"}</button>
              {q.answered && <span className="saved">✓ Saved</span>}
              <span className="grow" />
              {q.answered
                ? <button className="btn" style={{ height: 48, minWidth: 160, boxShadow: "var(--shadow-btn)" }} disabled={busy} onClick={next}>{idx < total - 1 ? "Next question" : "Finish stage"}</button>
                : <button className="btn" style={{ height: 48, minWidth: 160, boxShadow: "var(--shadow-btn)" }} disabled={sel === null || busy} onClick={submit}>Submit answer</button>}
            </div>
          </div>
        </div>

        <aside>
          <div className="card side-card">
            <h4>Current Performance</h4>
            <div className="perf">+{a.pointsEarned} pts <small>earned</small></div>
          </div>
          <div className="card side-card">
            <h4>Question Navigator</h4>
            <div className="nav-grid">
              {a.questions.map((x, i) => (
                <button key={x.id} className={`${x.answered ? (x.correct ? "ok" : "bad") : i === idx ? "cur" : ""}`} onClick={async () => { await flush(); setIdx(i); setSel(null); }}>{i + 1}</button>
              ))}
            </div>
            <div className="legend"><span><i style={{ background: "var(--green-400)" }} />Correct</span><span><i style={{ background: "#F25C5C" }} />Wrong</span></div>
          </div>
          <button className="end-btn" disabled={busy} onClick={finish}>End quiz &amp; save progress</button>
        </aside>
      </div>
    </div>
  );
}
