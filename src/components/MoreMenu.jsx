import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";

const I = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

function UsageDialog({ onClose }) {
  const { data, error } = useGet("/ai/usage");
  const u = data?.usage;
  const rows = u ? [["AI quizzes", u.quiz], ["Ask AI chats", u.chat], ["Files and scans read", u.upload]] : [];
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="usage-title" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="usage-title">Your usage today</h3>
        {error && <div className="error">{error}</div>}
        {!u && !error && <p className="modal-p">Loading…</p>}
        {u && (
          <>
            <p className="modal-p" style={{ marginTop: 0 }}>{u.pro ? "Pro plan: 3× the free limits." : "Free plan."} Limits reset at midnight (India time).</p>
            <div className="usage-rows">
              {rows.map(([label, r]) => (
                <div key={label}>
                  <div className="row-between"><span>{label}</span><b>{r.limit ? `${r.used} / ${r.limit}` : r.used}</b></div>
                  {r.limit ? <i className="bar"><u style={{ width: `${Math.min(100, (r.used / r.limit) * 100)}%`, background: r.used >= r.limit ? "var(--red-400)" : undefined }} /></i> : null}
                </div>
              ))}
              {u.bonusChats > 0 && <p className="modal-p" style={{ margin: 0 }}>Plus <b>{u.bonusChats}</b> bonus chats from invites, used after your daily chats run out.</p>}
            </div>
          </>
        )}
        <div className="modal-actions">
          {u && !u.pro && <Link className="btn outline" to="/plans" onClick={onClose}>See Pro</Link>}
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function FeedbackDialog({ onClose }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setErr("");
    if (text.trim().length < 10) return setErr("Please write at least 10 characters.");
    setBusy(true);
    try { await api.post("/support", { message: `Feedback: ${text.trim()}` }); setDone(true); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="fb-title" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={send}>
        <h3 id="fb-title">Give feedback</h3>
        {done ? <p className="modal-p">Thank you. We read every note.</p> : (
          <>
            <p className="modal-p" style={{ marginTop: 0 }}>What is working, and what could be better?</p>
            <textarea className="pr-area" style={{ height: 120 }} maxLength={1000} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Your feedback…" aria-label="Your feedback" />
            <div className="char-count">{text.length}/1000</div>
            {err && <div className="error" role="alert">{err}</div>}
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn outline" onClick={onClose}>{done ? "Close" : "Cancel"}</button>
          {!done && <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send feedback"}</button>}
        </div>
      </form>
    </div>
  );
}

// The "•••" menu in the Ask AI sidebar (Figma "Dropdown Menu")
export default function MoreMenu({ email, onClose }) {
  const [more, setMore] = useState(false);
  const [dialog, setDialog] = useState(null);
  return (
    <>
      <div className="mm" role="menu">
        <p className="mm-mail">{email}</p>
        <Link to="/support" role="menuitem" className="mm-item" onClick={onClose}><svg {...I}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7" /><path d="M12 17h.01" /></svg>Get Help</Link>
        <button type="button" role="menuitem" className="mm-item" onClick={() => setDialog("usage")}><svg {...I}><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>Usage</button>
        <button type="button" role="menuitem" className="mm-item" onClick={() => setDialog("feedback")}><svg {...I}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>Give Feedback</button>
        <button type="button" role="menuitem" className="mm-item last" aria-expanded={more} onClick={() => setMore(!more)}>
          <svg {...I}><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></svg>Learn more
          <svg {...I} className="chev" style={{ marginLeft: "auto", transform: more ? "rotate(180deg)" : "none" }}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {more && (
          <div className="mm-sub">
            <Link to="/legal/about" onClick={onClose}>About Mastishq</Link>
            <Link to="/legal/usage" onClick={onClose}>Usage Policy</Link>
            <Link to="/legal/privacy" onClick={onClose}>Privacy Policy</Link>
            <Link to="/legal/terms" onClick={onClose}>Terms of Service</Link>
          </div>
        )}
      </div>
      {dialog === "usage" && <UsageDialog onClose={() => { setDialog(null); onClose(); }} />}
      {dialog === "feedback" && <FeedbackDialog onClose={() => { setDialog(null); onClose(); }} />}
    </>
  );
}
