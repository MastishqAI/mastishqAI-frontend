import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";
import { Stepper } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";

const REPORT_REASONS = ["Incorrect answer", "Unclear question", "Inappropriate content", "Something else"];

// Per-question deadlines live in sessionStorage so jumping around the navigator or refreshing can't reset the clock
const store = (attemptId) => {
  const key = `quiz-timer:${attemptId}`;
  const read = () => { try { return JSON.parse(sessionStorage.getItem(key)) || { deadlines: {}, expired: [] }; } catch { return { deadlines: {}, expired: [] }; } };
  const write = (v) => { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };
  return { read, write };
};

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
  const [notice, setNotice] = useState("");
  const [expired, setExpired] = useState([]);
  const [visited, setVisited] = useState([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [report, setReport] = useState(null); // { reason, note } while the report dialog is open
  const startedAt = useRef(Date.now());
  const lock = useRef(false); // blocks double-clicks on Submit / Finish before React re-renders

  useEffect(() => {
    api.get(`/practice/attempts/${attemptId}`).then(async (r) => {
      if (r.attempt.status === "submitted") return nav(`/result/${attemptId}`, { replace: true });
      setA(r.attempt);
      const first = r.attempt.questions.findIndex((q) => !q.answered);
      const start = first === -1 ? 0 : first;
      setIdx(start);
      setVisited([...new Set([...r.attempt.questions.map((q, i) => (q.answered ? i : -1)).filter((i) => i >= 0), start])]);
      setExpired(store(attemptId).read().expired);
      setLeft(r.attempt.secondsPerQuestion);
      try { const p = await api.get(`/practice/${r.attempt.practiceId}`); setStages(p.practice.stages); } catch {}
    }).catch((e) => setErr(e.message));
  }, [attemptId]);

  const q = a?.questions[idx];
  const total = a?.questions.length || 0;
  const isExpired = (x) => x && expired.includes(x.id);

  // per-question countdown against a stored deadline; at zero the question is marked skipped and we move on with a message
  useEffect(() => {
    if (!a || !q || q.answered || isExpired(q)) return;
    const st = store(attemptId);
    const s = st.read();
    if (!s.deadlines[q.id]) { s.deadlines[q.id] = Date.now() + a.secondsPerQuestion * 1000; st.write(s); }
    startedAt.current = s.deadlines[q.id] - a.secondsPerQuestion * 1000;
    const tick = () => {
      const remaining = Math.ceil((s.deadlines[q.id] - Date.now()) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) timeUp();
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [idx, a?.id, q?.answered, expired.length]);

  async function timeUp() {
    if (lock.current || !q || q.answered) return;
    lock.current = true;
    await flush(); // a picked-but-unsubmitted option is still saved
    const st = store(attemptId); const s = st.read();
    if (!s.expired.includes(q.id)) { s.expired.push(q.id); st.write(s); }
    setExpired(s.expired);
    setNotice(`Time's up for question ${idx + 1}. It was skipped and counts as wrong.`);
    lock.current = false;
    const order = [...a.questions.keys()];
    const nextIdx = order.slice(idx + 1).concat(order.slice(0, idx)).find((i) => !a.questions[i].answered && !s.expired.includes(a.questions[i].id));
    if (nextIdx === undefined) return finish(true);
    goTo(nextIdx);
  }

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

  const goTo = (i) => { setSel(null); setIdx(i); setVisited((v) => (v.includes(i) ? v : [...v, i])); };

  const unanswered = a ? a.questions.filter((x, i) => !x.answered && !(i === idx && sel !== null)).length : 0;

  const finish = async (auto = false) => {
    if (lock.current && !auto) return;
    lock.current = true; setBusy(true); setConfirmEnd(false);
    try { await flush(); await api.post(`/practice/attempts/${attemptId}/finish`); nav(`/result/${attemptId}`); }
    catch (e) { setErr(e.message); setBusy(false); lock.current = false; }
  };
  // "End quiz" asks first when it would throw away unanswered questions
  const endQuiz = () => (unanswered > 0 ? setConfirmEnd(true) : finish());

  async function next() {
    if (idx >= total - 1) return finish();
    await flush();
    goTo(idx + 1);
  }

  const submit = async () => {
    if (sel === null || lock.current) return;
    lock.current = true; setBusy(true); setErr("");
    try { await postAnswer(); } catch (e) { setErr(e.message); } finally { setBusy(false); lock.current = false; }
  };

  const sendReport = async () => {
    const note = `${report.reason}${report.note.trim() ? `: ${report.note.trim()}` : ""}`;
    try { await api.post(`/practice/attempts/${attemptId}/questions/${q.id}/feedback`, { kind: "report_question", note }); setReported(q.id); setReport(null); }
    catch (e) { setErr(e.message); setReport(null); }
  };

  // keyboard: A–D picks an option, Enter submits
  useEffect(() => {
    const h = (e) => {
      if (!a || !q || q.answered || confirmEnd || report || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k >= "a" && k <= "d" && q.options[k.charCodeAt(0) - 97] !== undefined) setSel(k.charCodeAt(0) - 97);
      else if (e.key === "Enter" && sel !== null && e.target.tagName !== "BUTTON") submit();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (err && !a) return <div className="container"><div className="error">{err}</div></div>;
  if (!a) return <div className="container skeleton">Loading your quiz…</div>;

  const shown = q.answered ? q.selectedIndex : sel;
  const isDiag = a.stage === "diagnostic";
  const timedOut = isExpired(q) && !q.answered;

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
              {!q.answered && !timedOut && <div className="ring" role="timer" aria-label={`${left} seconds left for this question`} style={{ "--p": `${Math.max(0, (left / a.secondsPerQuestion) * 100)}%` }}><span>{Math.max(0, left)}</span></div>}
            </div>
            {!isDiag && <Stepper stages={stages} current={a.stage} />}
          </div>

          {!q.answered && !timedOut && left > 0 && left <= 10 && <div className="notice warn" role="status"><b>Less than {left <= 5 ? "5" : "10"} seconds left</b> on this question. {unanswered} question{unanswered === 1 ? "" : "s"} still unanswered.</div>}
          {notice && <div className="notice" role="status">{notice} <button type="button" className="link" onClick={() => setNotice("")} aria-label="Dismiss message">Dismiss</button></div>}

          <div className="card q-card">
            <h2>{q.text}</h2>
            <div role="radiogroup" aria-label="Answer options">
              {q.options.map((o, i) => (
                <button key={i} type="button" role="radio" aria-checked={shown === i} disabled={q.answered || timedOut} className={`opt ${shown === i ? "sel" : ""} ${q.answered || timedOut ? "locked" : ""}`} onClick={() => setSel(i)}>
                  <span className="l" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                  {o}
                  <span className="box" aria-hidden="true">{shown === i && <Icon.check size={14} />}</span>
                </button>
              ))}
            </div>
            <p className="q-note">Question {idx + 1} of {total} · {a.stageLabel} stage · Peer stats appear only in review.</p>
            {timedOut && <div className="error">Time ran out for this question, so it counts as wrong.</div>}
            {err && <div className="error">{err}</div>}
            <div className="q-foot">
              <button className="flag" type="button" disabled={reported === q.id} onClick={() => setReport({ reason: REPORT_REASONS[0], note: "" })}><Icon.flag size={14} /> {reported === q.id ? "Reported ✓" : "Report this question"}</button>
              {q.answered && <span className="saved">✓ Saved</span>}
              <span className="grow" />
              {q.answered
                ? <button className="btn" style={{ height: 48, minWidth: 160, boxShadow: "var(--shadow-btn)" }} disabled={busy} onClick={next}>{idx < total - 1 ? "Next question" : "Finish stage"}</button>
                : <button className="btn" style={{ height: 48, minWidth: 160, boxShadow: "var(--shadow-btn)" }} disabled={sel === null || busy || timedOut} onClick={submit}>{busy ? "Submitting…" : "Submit answer"}</button>}
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
              {a.questions.map((x, i) => {
                const skipped = !x.answered && isExpired(x);
                const reachable = x.answered || visited.includes(i) || i === idx;
                const state = x.answered ? (x.correct ? "correct" : "wrong") : skipped ? "skipped" : i === idx ? "current" : reachable ? "unanswered" : "not reached yet";
                return (
                  <button key={x.id} type="button" disabled={(!reachable || skipped) && i !== idx} aria-label={`Question ${i + 1}, ${state}`} aria-current={i === idx ? "step" : undefined}
                    className={`${x.answered ? (x.correct ? "ok" : "bad") : skipped ? "skip" : i === idx ? "cur" : ""} ${i === idx && x.answered ? "view" : ""}`}
                    onClick={async () => { await flush(); goTo(i); }}>{i + 1}</button>
                );
              })}
            </div>
            <div className="legend"><span><i style={{ background: "var(--green-400)" }} />Correct</span><span><i style={{ background: "#F25C5C" }} />Wrong</span><span><i style={{ background: "var(--gray-300)" }} />Skipped</span></div>
          </div>
          <button className="end-btn" disabled={busy} onClick={endQuiz}>End quiz &amp; save progress</button>
        </aside>
      </div>

      {confirmEnd && (
        <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="end-title">
          <div className="modal">
            <h3 id="end-title">End this quiz now?</h3>
            <p className="modal-p">{unanswered} question{unanswered > 1 ? "s are" : " is"} still unanswered. They will be scored as wrong and added to your Mistake Bank. This can't be undone.</p>
            <div className="modal-actions">
              <button type="button" className="btn outline" onClick={() => setConfirmEnd(false)}>Keep going</button>
              <button type="button" className="btn danger" disabled={busy} onClick={() => finish()}>End quiz</button>
            </div>
          </div>
        </div>
      )}

      {report && (
        <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="report-title">
          <div className="modal">
            <h3 id="report-title">Report this question</h3>
            <fieldset className="reasons">
              <legend>What's wrong with it?</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r}><input type="radio" name="reason" checked={report.reason === r} onChange={() => setReport({ ...report, reason: r })} /> {r}</label>
              ))}
            </fieldset>
            <label className="lbl" htmlFor="report-note">Details (optional)</label>
            <textarea id="report-note" className="pr-area" style={{ height: 96 }} maxLength={300} value={report.note} onChange={(e) => setReport({ ...report, note: e.target.value })} placeholder="Tell us what looks wrong" />
            <div className="char-count">{report.note.length}/300</div>
            <div className="modal-actions">
              <button type="button" className="btn outline" onClick={() => setReport(null)}>Cancel</button>
              <button type="button" className="btn" onClick={sendReport}>Submit report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
