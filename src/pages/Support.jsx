import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";
import { SUPPORT_EMAIL } from "../legalContent.js";

const MAX_FILES = 3;
const MAX_MB = 5;
const OK = ["application/pdf", "image/png", "image/jpeg"];
const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Support() {
  const mine = useGet("/support/mine");
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const pick = useRef(null);

  const addFiles = (list) => {
    setErr("");
    const next = [...files];
    for (const f of list) {
      if (!OK.includes(f.type)) { setErr("Only PDF, PNG and JPG files can be attached."); continue; }
      if (f.size > MAX_MB * 1048576) { setErr(`"${f.name}" is larger than ${MAX_MB} MB.`); continue; }
      if (next.length >= MAX_FILES) { setErr(`You can attach up to ${MAX_FILES} files.`); break; }
      next.push(f);
    }
    setFiles(next);
    if (pick.current) pick.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (text.trim().length < 10) return setErr("Please describe your issue (at least 10 characters).");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("message", text.trim());
      files.forEach((f) => fd.append("files", f));
      await api.post("/support", fd);
      setDone(true); setText(""); setFiles([]); mine.reload();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="container">

      <form className="card support-card" onSubmit={submit}>
        <h2>Help &amp; Support</h2>
        <p className="sub">Raise a query or report an issue. We read every one and reply to the email on your account.</p>
        {done && <div className="ok">Thanks — your query was sent. We'll get back to you by email.</div>}
        <textarea placeholder="Describe your issue..." value={text} maxLength={4000} onChange={(e) => { setText(e.target.value); setDone(false); }} />

        <button type="button" className="attach" onClick={() => pick.current?.click()} disabled={files.length >= MAX_FILES}>
          <Icon.clip size={16} /> Attach documents (PDF, PNG, JPG)
        </button>
        <input ref={pick} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple hidden onChange={(e) => addFiles([...e.target.files])} />
        {files.length > 0 && (
          <div className="files">
            {files.map((f, i) => (
              <span key={i} className="file"><b>{f.name}</b> {size(f.size)}<button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon.x size={13} /></button></span>
            ))}
          </div>
        )}
        {err && <div className="error" style={{ marginTop: 14 }}>{err}</div>}
        <div className="row-right"><button className="btn sm" disabled={busy} style={{ minWidth: 130 }}>{busy ? "Sending…" : "Submit Query"}</button></div>
      </form>

      <div className="sup-email"><Icon.mail size={15} /> <span>SUPPORT EMAIL</span><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div>

      {mine.data?.tickets?.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, margin: "34px 0 12px" }}>Your recent queries</h2>
          <div className="card" style={{ padding: "4px 22px" }}>
            {mine.data.tickets.map((t) => (
              <div key={t.id} className="row-between" style={{ padding: "14px 0", borderTop: "1px solid var(--gray-100)", gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 560 }}>{t.message}</div>
                  <small style={{ color: "var(--gray-500)" }}>{new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{t.files ? ` · ${t.files} file${t.files > 1 ? "s" : ""}` : ""}</small>
                </div>
                <span className={`pill-tag ${t.status === "resolved" ? "green" : t.status === "in_progress" ? "amber" : ""}`}>{t.status === "in_progress" ? "In progress" : t.status[0].toUpperCase() + t.status.slice(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="foot-note" style={{ marginTop: 26 }}>See also our <Link to="/legal/privacy">Privacy Policy</Link>, <Link to="/legal/terms">Terms of Service</Link> and <Link to="/legal/usage">Usage Policy</Link>.</p>
    </div>
  );
}
