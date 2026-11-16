import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth.jsx";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";
import { buyPro } from "../upgrade.js";

const SUGGEST = ["Explain Newton's Laws of Motion", "Solve this algebra quadratic equation", "Summarize cellular respiration in biology", "Help me understand photosynthesis step-by-step"];

// minimal markdown: **bold** only (everything else stays plain text)
const rich = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

function group(list) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const week = start.getTime() - 7 * 864e5;
  const today = [], prev = [];
  list.forEach((c) => (new Date(c.updatedAt).getTime() >= start.getTime() ? today : new Date(c.updatedAt).getTime() >= week ? prev : null)?.push?.(c));
  return { today, prev };
}

export default function Ask() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const list = useGet("/ai/conversations");
  const [convoId, setConvoId] = useState(null);
  const [title, setTitle] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [paying, setPaying] = useState(false);
  const { data: payCfg } = useGet("/payments/config");
  const isPro = user?.plan === "pro";
  const upgrade = async () => {
    if (paying) return;
    setPaying(true); setNote("");
    try {
      const r = await buyPro(user);
      if (r) { await refresh?.(); setNote("You're Pro now. Thank you!"); }
    } catch (e) { setNote(e.message); }
    finally { setPaying(false); }
  };
  const endRef = useRef(null);
  const sent = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (message, id = convoId) => {
    message = (message || "").trim();
    if (!message || busy) return;
    setText(""); setErr(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }]);
    if (!title) setTitle(message.slice(0, 60));
    try {
      const r = await api.post("/ai/chat", { conversationId: id, message });
      setConvoId(r.conversationId);
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
      list.reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  // arrive from "Ask why" with a prefilled question
  useEffect(() => {
    const q = sp.get("q");
    if (q && !sent.current) { sent.current = true; setSp({}, { replace: true }); send(q, null); }
  }, []);

  const open = async (id) => {
    try { const r = await api.get(`/ai/conversations/${id}`); setConvoId(id); setTitle(r.conversation.title); setMsgs(r.conversation.messages); } catch (e) { setErr(e.message); }
  };
  const fresh = () => { setConvoId(null); setTitle(""); setMsgs([]); setErr(""); };

  const makeQuiz = async () => {
    try {
      const p = await api.post("/practice", { topic: title || "Quick quiz", description: "" });
      const s = await api.post(`/practice/${p.practice.id}/stages/easy/start`);
      nav(`/quiz/${s.attempt.id}`);
    } catch (e) { setErr(e.message); }
  };

  const filtered = (list.data?.conversations || []).filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const g = group(filtered);
  const initials = (user?.name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const lastIsAI = msgs.length && msgs[msgs.length - 1].role === "assistant";

  return (
    <div className="ask">
      <aside className="side">
        <button className="new-chat" onClick={fresh}><Icon.plus size={16} style={{ verticalAlign: -3, marginRight: 6 }} />New chat</button>
        <div className="sbox"><Icon.search size={16} style={{ color: "var(--gray-400)" }} /><input placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="convos">
          {g.today.length > 0 && <h6>Today</h6>}
          {g.today.map((c) => <a key={c._id} className={c._id === convoId ? "on" : ""} onClick={() => open(c._id)}>{c.title}</a>)}
          {g.prev.length > 0 && <h6>Previous 7 days</h6>}
          {g.prev.map((c) => <a key={c._id} className={c._id === convoId ? "on" : ""} onClick={() => open(c._id)}>{c.title}</a>)}
          {!filtered.length && <p style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 16 }}>No chats yet.</p>}
        </div>
        <div className="upgrade">
          <div className="t">Upgrade Plan <span className="pro">{isPro ? "Active" : "Pro"}</span></div>
          <p>{isPro ? `Pro is active until ${new Date(user.planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Pay again to add ${payCfg?.days || 30} more days.` : "Unlock advanced features, unlimited weak-spot sets and solution PDFs."}</p>
          <div className="price">₹{payCfg?.amount ?? 49} <small>/ {payCfg?.days || 30} days</small></div>
          <button className="btn" disabled={paying || (payCfg && !payCfg.enabled)} onClick={upgrade}>{paying ? "Opening payment…" : isPro ? "Extend Pro →" : "Upgrade now →"}</button>
          <em>{note || (payCfg && !payCfg.enabled ? "Payments are not available yet." : "One-time payment. No auto-renewal.")}</em>
        </div>
        <div className="me-row"><span className="avatar" style={{ width: 40, height: 40 }}>{initials}</span><div><b>{user?.name}</b><small>{(user?.goalName || "Learner").split(" ")[0]}</small></div><button aria-label="More">•••</button></div>
      </aside>

      <section className="chat-main">
        {msgs.length > 0 && <div className="chat-head"><b>{title || "New chat"}</b><span><i />Mastishq AI is ready</span></div>}
        <div className="msgs">
          {!msgs.length && (
            <div className="empty-chat">
              <h2>Ask anything with <b>Mastishq AI</b></h2>
              <p>Your AI-powered study companion. Ask doubts, get explanations, and learn faster.</p>
              <div className="sugg">{SUGGEST.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i}>
              <div className={`m ${m.role === "user" ? "user" : "ai"}`}>{m.role === "user" ? m.content : rich(m.content)}</div>
              {m.role === "assistant" && i === msgs.length - 1 && (
                <div className="m-actions">
                  <button onClick={() => navigator.clipboard?.writeText(m.content)} aria-label="Copy"><Icon.copy size={13} /></button>
                  <button onClick={makeQuiz}>Make a 5-question quiz on this</button>
                </div>
              )}
            </div>
          ))}
          {busy && <div className="m ai"><span className="typing"><i /><i /><i /></span> <span style={{ fontSize: 12, color: "var(--gray-500)", marginLeft: 8 }}>Writing…</span></div>}
          {err && <div className="error">{err}</div>}
          <div ref={endRef} />
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <button type="button" className="icon-btn" style={{ background: "none", border: 0, color: "var(--gray-500)" }} onClick={() => setNote("Attachments are coming soon.")}><Icon.clip size={18} /></button>
          <input placeholder="Ask a follow-up or start a new topic..." value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" style={{ background: "none", border: 0, color: "var(--gray-400)" }} onClick={() => setNote("Voice input is coming soon.")}><Icon.mic size={18} /></button>
          <button className="send" disabled={busy || !text.trim()} aria-label="Send"><Icon.send size={20} /></button>
        </form>
      </section>
    </div>
  );
}
