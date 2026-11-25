import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth.jsx";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";
import { buyPro } from "../upgrade.js";
import { prepareImage } from "../components/Attachments.jsx";
import { LogoMark } from "../components/ui.jsx";
import MoreMenu from "../components/MoreMenu.jsx";

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
  const { user, refresh, logout } = useAuth();
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
  const [files, setFiles] = useState([]);          // new files waiting to be sent: { id, name, mime, pages }
  const [chatFiles, setChatFiles] = useState([]); // files already part of this chat: { id, name }
  const [reading, setReading] = useState(0);
  const pick = useRef(null);
  const [drawer, setDrawer] = useState(false);       // chat list as a slide-in panel on phones
  const [menu, setMenu] = useState(false);          // the ••• menu next to your name
  const menuRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recog = useRef(null);
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
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
    message = (message || "").trim() || (files.length ? "Please explain this material." : "");
    if (!message || busy || reading) return;
    setText(""); setErr(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message, files: files.map((f) => f.name) }]);
    if (!title) setTitle(message.slice(0, 60));
    try {
      const r = await api.post("/ai/chat", { conversationId: id, message, materialIds: files.map((f) => f.id) });
      setChatFiles((cf) => [...cf, ...files.map((f) => ({ id: f.id, name: f.name }))]);   // the file now belongs to the chat; the box is clear for the next message
      setFiles([]);
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
    try { const r = await api.get(`/ai/conversations/${id}`); setConvoId(id); setTitle(r.conversation.title); setMsgs(r.conversation.messages); setFiles([]); setChatFiles(r.files || []); } catch (e) { setErr(e.message); }
  };
  const fresh = () => { setConvoId(null); setTitle(""); setMsgs([]); setErr(""); setFiles([]); setChatFiles([]); };

  // Voice: the browser turns speech into text (Chrome, Edge, Safari). The words appear in the box for you to check before sending.
  const voice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setErr("Voice input isn't supported in this browser. Try Chrome, Edge or Safari.");
    if (listening) { recog.current?.stop(); return; }
    const r = new SR();
    r.lang = "en-IN"; r.interimResults = true; r.continuous = false;
    const base = text.trim() ? `${text.trim()} ` : "";
    r.onresult = (e) => setText(base + Array.from(e.results).map((x) => x[0].transcript).join(""));
    r.onerror = (e) => { setListening(false); if (e.error === "not-allowed" || e.error === "service-not-allowed") setErr("Microphone access is blocked. Allow it in your browser's site settings and try again."); else if (e.error !== "no-speech" && e.error !== "aborted") setErr("Couldn't hear you. Please try again."); };
    r.onend = () => setListening(false);
    recog.current = r; setErr(""); setListening(true);
    try { r.start(); } catch { setListening(false); }
  };

  const attach = async (list) => {
    for (const f of list) {
      if (files.length + chatFiles.length + reading >= 5) { setErr("You can attach up to 5 files to one chat."); break; }
      setErr(""); setReading((n) => n + 1);
      try {
        const file = f.type.startsWith("image/") ? await prepareImage(f, f.name || "photo.jpg") : f;
        if (file.size > 8 * 1024 * 1024) throw new Error("That file is over 8 MB. Please use a smaller file.");
        const fd = new FormData(); fd.append("file", file);
        const r = await api.post("/materials", fd);
        setFiles((fs) => [...fs, { id: r.material.id, name: r.material.name, mime: r.material.mime, pages: r.material.pages, linked: false }]);
      } catch (e) { setErr(e.message); } finally { setReading((n) => n - 1); }
    }
  };
  // pending file: forget it and delete the upload; file already in the chat: stop using it in this chat
  const detach = async (f) => {
    setFiles((fs) => fs.filter((x) => x.id !== f.id));
    try { await api.delete(`/materials/${f.id}`); } catch { /* already gone */ }
  };
  const detachFromChat = async (f) => {
    setChatFiles((cf) => cf.filter((x) => x.id !== f.id));
    try { await api.delete(`/ai/conversations/${convoId}/materials/${f.id}`); } catch { /* already gone */ }
  };

  const filtered = (list.data?.conversations || []).filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const g = group(filtered);
  const initials = (user?.name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const lastIsAI = msgs.length && msgs[msgs.length - 1].role === "assistant";

  return (
    <div className="ask">
      <aside className={`side ${drawer ? "open" : ""}`} onClick={(e) => { if (e.target.closest("a, .new-chat")) setDrawer(false); }}>
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
          <button className="btn" disabled={paying || (payCfg && !payCfg.enabled)} onClick={() => nav("/plans")}>{paying ? "Opening payment…" : isPro ? "Extend Pro →" : "Upgrade now →"}</button>
          <em>{note || (payCfg && !payCfg.enabled ? "Payments are not available yet." : "One-time payment. No auto-renewal.")}</em>
        </div>
        <div className="me-row"><span className="avatar" style={{ width: 40, height: 40 }}>{initials}</span><div><b>{user?.name}</b><small>{(user?.goalName || "Learner").split(" ")[0]}</small></div><div ref={menuRef} className="me-more"><button type="button" aria-label="Account options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>•••</button>
          {menu && <MoreMenu email={user?.email} onClose={() => setMenu(false)} />}</div></div>
      </aside>

      {drawer && <div className="side-back" onClick={() => setDrawer(false)} aria-hidden="true" />}
      <section className="chat-main">
        <button type="button" className="ask-menu" onClick={() => setDrawer(true)} aria-label="Open your chats"><Icon.menu size={16} /> Chats</button>
        {msgs.length > 0 && (
          <div className="chat-head">
            <b>{title || "New chat"}</b><span><i />Mastishq AI is ready</span>
            {chatFiles.length > 0 && (
              <div className="head-files" aria-label="Files used in this chat">
                <em>Using</em>
                {chatFiles.map((f) => <span key={f.id} className="head-file"><b title={f.name}>{f.name}</b><button type="button" aria-label={`Stop using ${f.name}`} onClick={() => detachFromChat(f)}>×</button></span>)}
              </div>
            )}
          </div>
        )}
        <div className="msgs">
          {!msgs.length && (
            <div className="empty-chat">
              <h2>Ask anything with <b>Mastishq AI</b></h2>
              <p>Your AI-powered study companion. Ask doubts, get explanations, and learn faster.</p>
              <div className="sugg">{SUGGEST.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`row ${m.role === "user" ? "u" : "a"}`}>
              {m.role !== "user" && <span className="ai-av" aria-hidden="true"><LogoMark size={16} /></span>}
              <div className="col">
                {m.role === "user" && m.files?.length > 0 && <div className="msg-files">{m.files.map((n, k) => <span key={k} className="file-card sm"><span className="fi">{/\.pdf$/i.test(n) ? "PDF" : "IMG"}</span><b>{n}</b></span>)}</div>}
                <div className={`m ${m.role === "user" ? "user" : "ai"}`}>{m.role === "user" ? m.content : rich(m.content)}</div>
                {m.role === "assistant" && (
                  <div className="m-actions"><button type="button" onClick={() => navigator.clipboard?.writeText(m.content)} aria-label="Copy reply"><Icon.copy size={13} /> Copy</button></div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="row a"><span className="ai-av" aria-hidden="true"><LogoMark size={16} /></span><div className="col"><div className="m ai"><span className="typing"><i /><i /><i /></span></div></div></div>}
          {err && <div className="error">{err}</div>}
          <div ref={endRef} />
        </div>
        <input ref={pick} type="file" accept="application/pdf,image/png,image/jpeg" multiple hidden onChange={(e) => { attach([...e.target.files]); e.target.value = ""; }} />
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          {(files.length > 0 || reading > 0) && (
            <div className="c-files" aria-label="Attached files">
              {files.map((f) => (
                <div key={f.id} className="file-card">
                  <span className="fi">{f.mime === "application/pdf" || /\.pdf$/i.test(f.name) ? "PDF" : "IMG"}</span>
                  <div><b title={f.name}>{f.name}</b><small>{f.mime === "application/pdf" || /\.pdf$/i.test(f.name) ? "PDF" : "Image"}{f.pages ? ` · ${f.pages} ${f.pages === 1 ? "page" : "pages"}` : ""}</small></div>
                  <button type="button" className="x" aria-label={`Remove ${f.name}`} onClick={() => detach(f)}>×</button>
                </div>
              ))}
              {reading > 0 && <div className="file-card busy"><span className="fi"><i className="spin" /></span><div><b>Reading your file…</b><small>a few seconds</small></div></div>}
            </div>
          )}
          <div className="c-row">
          <button type="button" className="icon-btn" style={{ background: "none", border: 0, color: "var(--gray-500)" }} onClick={() => pick.current?.click()} aria-label="Attach a file" disabled={reading > 0}><Icon.clip size={18} /></button>
          <input placeholder={files.length || chatFiles.length ? "Ask about your attached file…" : "Ask a follow-up or start a new topic..."} value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" onClick={voice} aria-label={listening ? "Stop voice input" : "Voice input"} aria-pressed={listening} className={listening ? "mic on" : "mic"}><Icon.mic size={18} /></button>
          <button className="send" disabled={busy || reading > 0 || (!text.trim() && !files.length)} aria-label="Send"><Icon.send size={20} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}
