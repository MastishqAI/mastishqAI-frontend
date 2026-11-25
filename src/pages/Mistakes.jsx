import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { Icon } from "../components/icons.jsx";

const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Dropdown({ label, items, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const all = value.length === 0;
  const toggle = (it) => onChange(value.includes(it) ? value.filter((x) => x !== it) : [...value, it]);
  return (
    <div className="dd" ref={ref}>
      <button onClick={() => setOpen(!open)}>{label}<span className="cnt">{all ? "All" : value.length}</span><Icon.chevDown size={16} /></button>
      {open && (
        <div className="pop">
          <label className="all"><input type="checkbox" checked={all} onChange={() => { onChange([]); setOpen(false); }} />All {label.toLowerCase()}s</label>
          {items.map((it) => (
            <label key={it}><input type="checkbox" checked={value.includes(it)} onChange={() => toggle(it)} />{it}</label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Mistakes() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [subj, setSubj] = useState([]);
  const [topic, setTopic] = useState([]);
  const [shown, setShown] = useState(10);
  const [modal, setModal] = useState(null); // {mode:'review'|'similar', m, ...}

  const load = () =>
    api.get("/mistakes", { params: { subject: subj.join(","), topic: topic.join(",") } }).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); setShown(10); }, [subj.join(","), topic.join(",")]);

  const review = async (m) => {
    try { const r = await api.get(`/mistakes/${m.id}`); setModal({ mode: "review", m: r.mistake }); } catch (e) { setErr(e.message); }
  };
  const similar = async (m) => {
    setModal({ mode: "similar", m, loading: true });
    try { const r = await api.post(`/mistakes/${m.id}/similar`); setModal({ mode: "similar", m, q: r.question, fixCorrect: r.fixCorrect, needed: r.needed, sel: null }); }
    catch (e) { setModal(null); setErr(e.message); }
  };
  const answer = async () => {
    try {
      const r = await api.post(`/mistakes/${modal.m.id}/similar/answer`, { selectedIndex: modal.sel });
      setModal({ ...modal, result: r });
      load();
    } catch (e) { setErr(e.message); }
  };

  if (!data) return <div className="container skeleton">{err || "Loading…"}</div>;
  const empty = data.open === 0 && data.fixed === 0;

  return (
    <div className="container">
      <h1 className="page-title">Mistake Bank</h1>
      <p className="page-sub">Every wrong or guessed answer, saved by topic. Fix them with fresh questions.</p>
      {err && <div className="error" style={{ marginTop: 16 }}>{err}</div>}

      {empty ? (
        <div className="card empty" style={{ maxWidth: 604, margin: "40px auto" }}>
          <div className="ic"><Icon.check size={30} style={{ color: "var(--blue-700)" }} /></div>
          <h3>No mistakes yet</h3>
          <p>Take a quiz and we'll keep track for you.</p>
          <Link className="btn" to="/practice">Start a 10-minute quiz</Link>
        </div>
      ) : (
        <>
          <div className="stat-two">
            <div className="card stat-card"><div className="t"><i style={{ background: "var(--red-400)" }} />Open</div><div className="n" style={{ color: "var(--red-600)" }}>{data.open}</div><small>Not practised yet</small></div>
            <div className="card stat-card"><div className="t"><i style={{ background: "var(--green-400)" }} />Fixed</div><div className="n" style={{ color: "var(--green-700)" }}>{data.fixed}</div><small>2 correct on new questions</small></div>
          </div>
          <div className="filters">
            <Dropdown label="Topic" items={data.topics} value={topic} onChange={setTopic} />
          </div>
          <div className="m-grid">
            {data.mistakes.slice(0, shown).map((m) => (
              <div key={m.id} className="card m-card">
                <div className="m-tags">{m.tags.map((t) => <span key={t}>{t}</span>)}</div>
                <div className="m-meta"><span>{m.subject} · {m.topic}</span><span className={`status ${m.status}`}>{m.status[0].toUpperCase() + m.status.slice(1)}</span></div>
                <h4>{m.text}</h4>
                <div className="m-foot">
                  <span>{fmt(m.lastAt)} · {m.tries} {m.tries === 1 ? "try" : "tries"}</span>
                  <span className="a">
                    <button className="link" onClick={() => review(m)}>Review</button>
                    <button className="btn outline sm m-sim" onClick={() => similar(m)}>Practice similar</button>
                  </span>
                </div>
              </div>
            ))}
            {!data.mistakes.length && <p style={{ color: "var(--gray-500)" }}>No mistakes match these filters.</p>}
          </div>
          {data.mistakes.length > shown && <div className="m-more"><button type="button" className="btn outline" onClick={() => setShown(shown + 10)}>Show more ({data.mistakes.length - shown} left)</button></div>}
        </>
      )}

      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modal.mode === "review" && (
              <>
                <h3>{modal.m.text}</h3>
                {modal.m.options.map((o, i) => (
                  <div key={i} className={`opt locked ${i === modal.m.correctIndex ? "right" : ""}`} style={{ height: 48, fontSize: 14 }}><span className="l-plain">{String.fromCharCode(65 + i)}</span>{o}{i === modal.m.correctIndex && <span className="tagp green">Correct answer</span>}</div>
                ))}
                {modal.m.explanation && <div className="ok" style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}>💡 {modal.m.explanation}</div>}
                <div className="res-actions" style={{ marginTop: 10 }}>
                  <button className="btn outline" onClick={() => nav(`/ask?q=${encodeURIComponent(`Explain why the correct answer is "${modal.m.options[modal.m.correctIndex]}" for: ${modal.m.text}`)}`)}>Ask AI</button>
                  <button className="btn" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            )}
            {modal.mode === "similar" && (modal.loading ? <p style={{ padding: 30, textAlign: "center", color: "var(--gray-500)" }}>Writing a fresh question for you…</p> : (
              <>
                <p style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 8 }}>New question on {modal.m.topic} · {modal.result ? modal.result.fixCorrect : modal.fixCorrect}/{modal.needed} correct to fix</p>
                <h3>{modal.q.text}</h3>
                {modal.q.options.map((o, i) => {
                  const r = modal.result;
                  const cls = r ? (i === r.correctIndex ? "right" : i === modal.sel ? "wrong" : "") : modal.sel === i ? "sel" : "";
                  return <button key={i} disabled={!!r} className={`opt ${cls}`} style={{ height: 48, fontSize: 14 }} onClick={() => setModal({ ...modal, sel: i })}><span className="l">{String.fromCharCode(65 + i)}</span>{o}</button>;
                })}
                {modal.result && (
                  <div className={modal.result.correct ? "ok" : "error"}>
                    {modal.result.correct ? (modal.result.status === "fixed" ? "Correct — this mistake is now Fixed! 🎉" : "Correct! One more correct answer to fix it.") : "Not quite — try again with another question."}
                    {modal.result.explanation && <div style={{ marginTop: 6 }}>{modal.result.explanation}</div>}
                  </div>
                )}
                <div className="res-actions" style={{ marginTop: 10 }}>
                  <button className="btn outline" onClick={() => setModal(null)}>Close</button>
                  {modal.result
                    ? (modal.result.status !== "fixed" && <button className="btn" onClick={() => similar(modal.m)}>Another question</button>)
                    : <button className="btn" disabled={modal.sel === null || modal.sel === undefined} onClick={answer}>Check answer</button>}
                </div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
