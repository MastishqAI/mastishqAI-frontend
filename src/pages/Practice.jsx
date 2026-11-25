import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";
import Attachments from "../components/Attachments.jsx";

const STAGE_INFO = [
  ["easy", "Easy", "10 questions · 2 pts each", "Score 14 / 20 to pass"],
  ["medium", "Medium", "20 questions · 3 pts each", "Score 42 / 60 to pass"],
  ["hard", "Hard", "40 questions · 4 pts each", "Score 112 / 160 to pass"],
];

export default function Practice() {
  const nav = useNavigate();
  const daily = useGet("/home/daily");
  const recs = useGet("/practice/recommendations");
  const recent = useGet("/practice");
  const [topic, setTopic] = useState("");
  const [desc, setDesc] = useState("");
  const [secs, setSecs] = useState(60);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [files, setFiles] = useState([]);
  const [scanning, setScanning] = useState(0);
  // topics found in the files, and a description suggested from them (never overwrites what the learner typed)
  const found = [...new Set(files.flatMap((f) => f.topics || []))].slice(0, 6);
  const autoDesc = useRef("");
  useEffect(() => {
    const suggestion = files.map((f) => f.summary).filter(Boolean).slice(0, 2).join(" ");
    setDesc((cur) => { if (cur.trim() === "" || cur === autoDesc.current) { autoDesc.current = suggestion; return suggestion; } return cur; });
  }, [files]);

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalVal, setGoalVal] = useState("");
  const [goalErr, setGoalErr] = useState("");
  const editGoal = () => { setGoalVal(String(daily.data?.goal ?? 10)); setGoalErr(""); setGoalOpen(true); };
  const saveGoal = async (e) => {
    e.preventDefault();
    const n = parseInt(goalVal, 10);
    if (!(n >= 1 && n <= 200)) return setGoalErr("Enter a number from 1 to 200.");
    try { await api.patch("/home/daily-goal", { dailyGoal: n }); daily.reload(); setGoalOpen(false); } catch (x) { setGoalErr(x.message); }
  };

  const generate = async () => {
    if (busy) return;
    if (!topic.trim()) return setErr("Please enter a topic name.");
    if (!desc.trim()) return setErr("Please add a description.");
    setErr(""); setBusy(true);
    try {
      const p = await api.post("/practice", { topic, description: desc, secondsPerQuestion: secs, materialIds: files.map((f) => f.id) });
      const s = await api.post(`/practice/${p.practice.id}/stages/easy/start`);
      nav(`/quiz/${s.attempt.id}`);
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const resume = async (p) => {
    const next = ["easy", "medium", "hard"].find((k) => p.stages[k].status === "open");
    if (!next) return;
    setBusy(true);
    try { const s = await api.post(`/practice/${p.id}/stages/${next}/start`); nav(`/quiz/${s.attempt.id}`); } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="container">
      <h1 className="page-title">Practice</h1>
      <div className="daily" style={{ marginTop: 28 }}>
        <span>{daily.data ? `${daily.data.done}/${daily.data.goal}` : "–"} Daily Goal for practice questions</span>
        <button className="link" onClick={editGoal} aria-label="Edit daily goal"><Icon.pencil size={16} style={{ color: "var(--gray-800)" }} /></button>
      </div>

      {goalOpen && (
        <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="goal-title" onClick={() => setGoalOpen(false)}>
          <form className="modal fig" onClick={(e) => e.stopPropagation()} onSubmit={saveGoal}>
            <div className="mh"><h3 id="goal-title">Change daily goal</h3><button type="button" className="mx" aria-label="Close" onClick={() => setGoalOpen(false)}>×</button></div>
            <p className="modal-p">Set how many questions you practise each day.</p>
            <label className="lbl" htmlFor="goal-input" style={{ marginTop: 14 }}>Daily question goal</label>
            <input id="goal-input" className="pr-input" type="number" min="1" max="200" inputMode="numeric" autoFocus value={goalVal} onChange={(e) => setGoalVal(e.target.value)} />
            <small className="hint-l">Questions per day</small>
            {goalErr && <div className="error" role="alert" style={{ marginTop: 8 }}>{goalErr}</div>}
            <div className="modal-actions"><button type="button" className="btn outline" onClick={() => setGoalOpen(false)}>Cancel</button><button className="btn">Save goal</button></div>
          </form>
        </div>
      )}

      <div className="practice-grid">
        <div className="card main">
          <h2>What do you want to practise?</h2>
          <label className="lbl first" htmlFor="pr-topic">Topic Name <span className="req" aria-hidden="true">*</span></label>
          <input id="pr-topic" className="pr-input" required aria-required="true" maxLength={200} value={topic} placeholder="e.g. Fundamental Rights (Articles 12–35)" onChange={(e) => setTopic(e.target.value)} />
          {found.length > 0 ? (
            <div className="recs">
              <span>Found in your material</span>
              {found.map((t) => <button key={t} type="button" onClick={() => setTopic(t)}>{t}</button>)}
            </div>
          ) : recs.data?.topics?.length > 0 && (
            <div className="recs">
              <span>Recommended from your weak spots</span>
              {recs.data.topics.map((t) => <button key={t} onClick={() => setTopic(t)}>{t}</button>)}
            </div>
          )}
          <label className="lbl" htmlFor="pr-desc">Description <span className="req" aria-hidden="true">*</span></label>
          <textarea id="pr-desc" className="pr-area" required aria-required="true" maxLength={500} placeholder={scanning ? "Reading your material to suggest a description…" : "e.g. Writs, Article 21 cases"} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="or-line">{scanning ? `your material · ${files.length + scanning} file${files.length + scanning > 1 ? "s" : ""}` : files.length ? `your material · ${files.length} file${files.length > 1 ? "s" : ""} scanned` : "or use your own material"}</div>
          <Attachments files={files} setFiles={setFiles} onError={setErr} onScanning={setScanning} />
        </div>

        <div className="card main" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16 }}>3 stages to clear the topic</h2>
          {STAGE_INFO.map(([k, t, a, b]) => (
            <div key={k} className={`stage-card ${k}`}>
              <b><i style={{ background: k === "easy" ? "var(--green-400)" : k === "medium" ? "var(--amber-500)" : "var(--red-400)" }} />{t}</b>
              <div>{a}</div><div>{b}</div>
            </div>
          ))}
          <div className="timer-row">
            <span>Time per question</span>
            <span className="ctl"><button type="button" aria-label="Decrease time per question" disabled={secs <= 20} onClick={() => setSecs(Math.max(20, secs - 10))}>−</button><span aria-live="polite">{secs} s</span><button type="button" aria-label="Increase time per question" disabled={secs >= 180} onClick={() => setSecs(Math.min(180, secs + 10))}>+</button></span>
          </div>
          <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "16px 0 14px" }}>{scanning > 0 ? `Scanning ${scanning} file${scanning > 1 ? "s" : ""}. This takes a few seconds.` : files.length ? `Quiz built from your ${files.length} file${files.length > 1 ? "s" : ""} · Clear a stage at 70%. Every answer autosaves.` : "Clear a stage at 70%. Every answer autosaves."}</p>
          {err && <div className="error" role="alert">{err}</div>}
          <button className="btn block" disabled={busy || scanning > 0 || !topic.trim() || !desc.trim()} onClick={generate}>{busy ? <><span className="spinner" aria-hidden="true" />Generating quiz…</> : scanning > 0 ? "Scanning material…" : files.length ? "Generate quiz from my files" : "Generate quiz"}</button>
          {!busy && (!topic.trim() || !desc.trim()) && <p className="hint">Enter a topic name and a description to continue.</p>}
          {busy && <p style={{ fontSize: 12, color: "var(--gray-500)", textAlign: "center", marginTop: 10 }}>Building your questions with AI — this takes a few seconds.</p>}
        </div>
      </div>

      {recent.data?.practices?.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, margin: "36px 0 14px" }}>Continue a topic</h2>
          <div className="m-grid">
            {recent.data.practices.slice(0, 6).map((p) => {
              const next = ["easy", "medium", "hard"].find((k) => p.stages[k].status === "open");
              return (
                <div key={p.id} className="card pad" style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <b style={{ fontSize: 15 }}>{p.topic}</b>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
                      {["easy", "medium", "hard"].map((k) => `${k[0].toUpperCase() + k.slice(1)} ${p.stages[k].status === "cleared" ? "✓" : p.stages[k].status === "locked" ? "🔒" : "•"}`).join("  ·  ")}
                    </div>
                  </div>
                  {next ? <button className="btn sm" disabled={busy} onClick={() => resume(p)}>Continue {next}</button> : <span className="pill-tag green">All cleared</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
