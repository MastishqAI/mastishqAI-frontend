import { useEffect, useRef, useState } from "react";
import api from "../api";
import { Icon } from "./icons.jsx";

// tiny markdown: **bold** and [text](https://link) -> clickable link that opens in a new tab
const rich = (t) => t.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g).map((p, i) => {
  if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
  const m = p.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
  return m ? <a key={i} className="inl" href={m[2]} target="_blank" rel="noopener noreferrer">{m[1]}</a> : p;
});

const QUICK = ["Why is my answer wrong?", "Show steps", "Explain simpler", "Give a similar question"];
const PROMPT = {
  "Why is my answer wrong?": "Why is my answer wrong? Explain what I misunderstood and how to avoid it.",
  "Show steps": "Show the solution step by step.",
  "Explain simpler": "Explain this again in simpler words, like I'm new to the topic.",
  "Give a similar question": "Give me one similar practice question (with 4 options) on the same concept, and put the answer at the end.",
};

// Slide-over "Ask about this question" chat. It knows the question, the learner's answer and their past mistakes.
export default function AskPanel({ attemptId, q, number, subject, onClose }) {
  // lock the page behind the chat so only the chat scrolls
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [past, setPast] = useState(null);
  // web sources cost real money, so they are off unless the learner turns them on (remembered on this device)
  const [sources, setSources] = useState(() => { try { return localStorage.getItem("askWhySources") === "1"; } catch { return false; } });
  const toggleSources = (on) => { setSources(on); try { localStorage.setItem("askWhySources", on ? "1" : "0"); } catch {} };
  const end = useRef(null);
  const topic = q.subtopic || "";

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    api.get("/mistakes", { params: { topic } }).then((r) => setPast(r.mistakes.length)).catch(() => setPast(null));
  }, [topic]);

  // 👍 / 👎 / report on one AI answer (saved on the server)
  const rate = async (i, kind) => {
    const m = msgs[i];
    const field = kind === "report_answer" ? "reported" : "rating";
    setMsgs((all) => all.map((x, j) => (j === i ? { ...x, [field]: kind === "report_answer" ? true : kind } : x)));
    try { await api.post(`/practice/attempts/${attemptId}/questions/${q.id}/feedback`, { kind, answer: m.content }); }
    catch (e) { setErr(e.message); setMsgs((all) => all.map((x, j) => (j === i ? { ...x, [field]: undefined } : x))); }
  };

  const send = async (label) => {
    const shown = (label ?? text).trim();
    if (!shown || busy) return;
    const message = PROMPT[shown] || shown;
    setText(""); setErr(""); setBusy(true);
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: shown }]);
    try {
      const r = await api.post(`/practice/attempts/${attemptId}/questions/${q.id}/ask`, { message, history, sources });
      setMsgs((m) => [...m, { role: "ai", content: r.reply, sources: r.sources, note: r.sourcesLimited }]);
      setPast(r.pastMistakes);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const mine = q.selectedIndex >= 0 ? q.options[q.selectedIndex] : null;
  return (
    <div className="drawer-bg" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ask about this question">
        <header>
          <div><h3>Ask about this question</h3><p>Mastishq AI · knows your answer and past mistakes</p></div>
          <button onClick={onClose} aria-label="Close"><Icon.x size={22} /></button>
        </header>
        <div className="body">
          <div className="ctx">
            <div className="top"><span>Q{number}{subject ? ` · ${subject}` : ""}</span>{q.tags?.[0] && <span className="chip2">{q.tags[0]} mistake</span>}</div>
            <h4>{q.text}</h4>
            <div className="ans">
              {mine && !q.correct && <span className="r">Your answer: {mine}</span>}
              {q.correct && mine && <span className="g">Your answer: {mine} ✓</span>}
              <span className="g">Correct: {q.options[q.correctIndex]}</span>
            </div>
            {past !== null && <small>Past mistakes loaded: {past}{topic ? ` on ${topic}` : ""}</small>}
          </div>

          {!msgs.length && <div className="qchips">{QUICK.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>}

          {msgs.map((m, i) => m.role === "user"
            ? <div key={i} className="bub-user">{m.content}</div>
            : (
              <div key={i} className="bub-ai">
                {rich(m.content)}
                {m.note && <div className="src-note">{m.note}</div>}
                {m.sources?.length > 0 && (
                  <>
                    <span className="src-l">Sources</span>
                    <div className="srcs">
                      {m.sources.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" title={s.url}>{s.title} <Icon.arrowUpRight size={11} /></a>
                      ))}
                    </div>
                  </>
                )}
                <div className="fb">
                  {m.rating || m.reported
                    ? <span>{m.reported ? "Reported — thanks, we'll review this answer." : m.rating === "helpful" ? "Thanks for the feedback 👍" : "Thanks — we'll use this to improve 👎"}</span>
                    : <span>Was this helpful? <button aria-label="Helpful" onClick={() => rate(i, "helpful")}>👍</button><button aria-label="Not helpful" onClick={() => rate(i, "not_helpful")}>👎</button></span>}
                  {!m.reported && <b onClick={() => rate(i, "report_answer")}>⚑ Report if wrong</b>}
                </div>
              </div>
            ))}
          {msgs.length > 0 && !busy && <div className="qchips" style={{ marginTop: 4 }}>{QUICK.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>}
          {busy && <div className="bub-ai"><span className="typing"><i /><i /><i /></span></div>}
          {err && <div className="error">{err}</div>}
          <div ref={end} />
        </div>
        <div className="comp">
          <label className="src-toggle" title="Searches the web and links the pages it used. Answers take a little longer.">
            <input type="checkbox" checked={sources} onChange={(e) => toggleSources(e.target.checked)} />
            <span className="sw" /> Include web sources <small>(slower)</small>
          </label>
          <form onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input autoFocus placeholder="Ask a follow-up about this question…" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="send" disabled={busy || !text.trim()} aria-label="Send"><Icon.send size={20} /></button>
          </form>
        </div>
      </aside>
    </div>
  );
}
