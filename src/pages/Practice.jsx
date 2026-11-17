import { useState } from "react";
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

  const editGoal = async () => {
    const v = window.prompt("Daily goal for practice questions", daily.data?.goal ?? 10);
    if (!v) return;
    try { await api.patch("/home/daily-goal", { dailyGoal: v }); daily.reload(); } catch (e) { setErr(e.message); }
  };

  const generate = async () => {
    if (!topic.trim() && !files.length) return setErr("Please enter a topic name or add a file.");
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

      <div className="practice-grid">
        <div className="card main">
          <h2>What do you want to practise?</h2>
          <label className="lbl first">Topic Name</label>
          <input className="pr-input" value={topic} placeholder={files.length ? "Optional: we'll use your file's name" : "e.g. Fundamental Rights (Articles 12–35)"} onChange={(e) => setTopic(e.target.value)} />
          {recs.data?.topics?.length > 0 && (
            <div className="recs">
              <span>Recommended from your weak spots</span>
              {recs.data.topics.map((t) => <button key={t} onClick={() => setTopic(t)}>{t}</button>)}
            </div>
          )}
          <label className="lbl">Description</label>
          <textarea className="pr-area" placeholder="e.g. Writs, Article 21 cases" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="or-line">or use your own material</div>
          <Attachments files={files} setFiles={setFiles} onError={setErr} />
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
            <span className="ctl"><button onClick={() => setSecs(Math.max(20, secs - 10))}>−</button>{secs} s<button onClick={() => setSecs(Math.min(180, secs + 10))}>+</button></span>
          </div>
          <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "16px 0 14px" }}>Clear a stage at 70%. Every answer autosaves.</p>
          {err && <div className="error">{err}</div>}
          <button className="btn block" disabled={busy} onClick={generate}>{busy ? "Generating quiz…" : "Generate quiz"}</button>
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
