import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { setToken } from "../api";
import { useAuth } from "../auth.jsx";
import { useGet } from "../hooks";
import { COMPANY, SUPPORT_EMAIL } from "../legalContent.js";

const shortDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/* ---- profile picture ---- */
function resizeToJpeg(file, side = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = side;
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, side, side);
      const s = Math.min(img.width, img.height);                         // centre square crop
      g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, side, side);
      URL.revokeObjectURL(url);
      let q = 0.85, out = c.toDataURL("image/jpeg", q);
      while (out.length > 78000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }   // keep it under the 60 KB the server accepts
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't open that photo.")); };
    img.src = url;
  });
}

function PictureCard({ p, onChange }) {
  const file = useRef(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const initials = (p.name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const pick = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    setErr(""); setBusy(true);
    try { const image = await resizeToJpeg(f); await api.put("/profile/picture", { image }); await onChange(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await api.delete("/profile/picture"); await onChange(); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return (
    <section className="pf-card">
      <h2 className="pf-h"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg> Profile Picture</h2>
      <div className="pf-pic">
        <div className="pf-avatar" style={p.picture ? { backgroundImage: `url(${p.picture})` } : undefined}>
          {!p.picture && initials}
          <button type="button" className="dot" aria-label="Change photo" disabled={busy} onClick={() => file.current.click()}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
        </div>
        <div>
          <b>{p.name}</b>
          <p>{p.goalName ? `Preparing for a ${p.goalName.split(" ")[0]}` : "Learner"}</p>
          {p.picture && <button type="button" className="pf-link" onClick={remove} disabled={busy}>Remove photo</button>}
        </div>
        <input ref={file} type="file" accept="image/png,image/jpeg" hidden onChange={pick} />
      </div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
    </section>
  );
}

/* ---- learner details ---- */
const FIELDS = [
  ["name", "Name"], ["exam", "Exam"], ["phone", "Mobile Number"], ["className", "Class"], ["school", "School Name"],
  ["district", "City"], ["state", "State"], ["pincode", "Pincode"], ["country", "Country"],
];

function Field({ k, label, p, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const shown = k === "exam" ? p.goalName : p[k];
  const start = () => {
    if (k === "exam") return document.getElementById("pf-goals")?.scrollIntoView({ behavior: "smooth" });
    setVal(p[k] || ""); setErr(""); setEditing(true);
  };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api.patch("/profile", { [k]: val }); await onSaved(); setEditing(false); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="pf-field">
      <label>{label}</label>
      {editing ? (
        <form onSubmit={save}>
          <input className="pf-input" value={val} autoFocus onChange={(e) => setVal(e.target.value)} inputMode={k === "pincode" ? "numeric" : undefined} />
          {err && <small className="pf-err">{err}</small>}
          <div className="pf-btns"><button type="button" className="pf-cancel" onClick={() => setEditing(false)}>Cancel</button><button className="pf-save" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
        </form>
      ) : (
        <div className="pf-val"><span>{shown || <em>Not added</em>}</span><button type="button" className="pf-link" onClick={start}>Edit</button></div>
      )}
    </div>
  );
}

/* ---- my goals ---- */
function Goals({ p, onSaved }) {
  const goals = useGet("/onboarding/goals");
  const [goal, setGoal] = useState(p.goalName);
  const [text, setText] = useState(p.goalText);
  const [subjects, setSubjects] = useState(p.subjects);
  const [add, setAdd] = useState("");
  const [msg, setMsg] = useState({ t: "", ok: false });
  const [busy, setBusy] = useState(false);
  const addSubject = () => {
    const v = add.replace(/\s+/g, " ").trim();
    if (v && !subjects.some((s) => s.toLowerCase() === v.toLowerCase())) setSubjects([...subjects, v]);
    setAdd("");
  };
  const update = async () => {
    setBusy(true); setMsg({ t: "", ok: false });
    try { await api.patch("/profile/goals", { goalName: goal, goalText: text, subjects }); await onSaved(); setMsg({ t: "Your goals are updated.", ok: true }); }
    catch (x) { setMsg({ t: x.message, ok: false }); } finally { setBusy(false); }
  };
  return (
    <section className="pf-card" id="pf-goals">
      <h2 className="pf-h2">My goals</h2><p className="pf-sub">Update your exam goal and subjects</p>
      <label className="pf-lbl">Learning goal description</label>
      <input className="pf-input" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I want to crack NEET and score well in my boards" />
      <small className="pf-help">Briefly describe what you want to achieve with this goal</small>
      <label className="pf-lbl">Suggested goals</label>
      <div className="pf-goals">
        {goals.data?.goals.map((g) => (
          <button key={g._id} type="button" className={g.name === goal ? "on" : ""} onClick={() => setGoal(g.name)} aria-pressed={g.name === goal}><b>{g.name}</b><span>{g.description}</span></button>
        ))}
      </div>
      <label className="pf-lbl">Your Selected Subjects</label>
      <div className="pf-pills">
        {subjects.map((s) => <span key={s}>{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => setSubjects(subjects.filter((x) => x !== s))}>×</button></span>)}
        {!subjects.length && <small className="pf-help">Add at least one subject.</small>}
      </div>
      <label className="pf-lbl">Add New Subject</label>
      <div className="pf-add">
        <input className="pf-input" placeholder="e.g. Mathematics" value={add} maxLength={40} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }} />
        <button type="button" className="pf-primary" onClick={addSubject}>Add</button>
      </div>
      {msg.t && <div className={msg.ok ? "pf-ok" : "error"} style={{ marginTop: 12 }}>{msg.t}</div>}
      <div className="pf-center"><button type="button" className="pf-primary wide" disabled={busy || !goal || !subjects.length} onClick={update}>{busy ? "Updating…" : "Update"}</button></div>
    </section>
  );
}

/* ---- account ---- */
function Account({ p }) {
  const { refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ cur: "", n1: "", n2: "" });
  const [msg, setMsg] = useState({ t: "", ok: false });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setMsg({ t: "", ok: false });
    if (f.n1.length < 6) return setMsg({ t: "New password must be at least 6 characters.", ok: false });
    if (f.n1 !== f.n2) return setMsg({ t: "The new passwords don't match.", ok: false });
    setBusy(true);
    try { const r = await api.post("/auth/change-password", { currentPassword: f.cur, newPassword: f.n1 }); if (r.token) setToken(r.token); setMsg({ t: "Password changed.", ok: true }); setF({ cur: "", n1: "", n2: "" }); setOpen(false); await refresh(); }
    catch (x) { setMsg({ t: x.message, ok: false }); } finally { setBusy(false); }
  };
  return (
    <section className="pf-card pf-slim">
      <div className="pf-row">
        <div><h2 className="pf-h2">Account</h2><p className="pf-sub" style={{ margin: 0 }}>{p.email} · Signed in with {p.signIn === "google" ? "Google" : "email"}</p></div>
        {p.hasPassword ? <button type="button" className="pf-link strong" onClick={() => setOpen(!open)}>Change password</button> : <small className="pf-help">Password is managed by Google</small>}
      </div>
      {open && (
        <form className="pf-pw" onSubmit={submit}>
          <input className="pf-input" type="password" autoComplete="current-password" placeholder="Current password" value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} required />
          <input className="pf-input" type="password" autoComplete="new-password" placeholder="New password" value={f.n1} onChange={(e) => setF({ ...f, n1: e.target.value })} required />
          <input className="pf-input" type="password" autoComplete="new-password" placeholder="Confirm new password" value={f.n2} onChange={(e) => setF({ ...f, n2: e.target.value })} required />
          <div className="pf-btns"><button type="button" className="pf-cancel" onClick={() => setOpen(false)}>Cancel</button><button className="pf-save" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
        </form>
      )}
      {msg.t && <div className={msg.ok ? "pf-ok" : "error"} style={{ marginTop: 10 }}>{msg.t}</div>}
    </section>
  );
}

/* ---- active plan ---- */
function Plan({ p }) {
  const nav = useNavigate();
  const pl = p.plan;
  return (
    <section className="pf-card">
      <h2 className="pf-h2">Active Plan</h2>
      <p className="pf-sub">{pl.active ? "Pro Plan Activated" : "Free Plan"}</p>
      <span className={`pf-badge ${pl.active ? "" : "gray"}`}>{pl.active ? "Active" : "Free"}</span>
      <div className="pf-plan">
        {pl.active ? (
          <>
            <div><small>Plan Validity</small><b>{pl.days} days</b></div>
            <div><small>Start Date</small><b>{shortDate(pl.start)}</b></div>
            <div><small>Expiry Date</small><b>{shortDate(pl.expires)}</b></div>
            <div><small>Daily AI limits</small><b>{pl.limits.quiz} quizzes · {pl.limits.chat} chats</b></div>
          </>
        ) : (
          <>
            <div><small>Daily AI limits</small><b>{pl.limits.quiz} quizzes · {pl.limits.chat} chats</b></div>
            <div><small>With Pro</small><b>3× the daily limits</b></div>
          </>
        )}
      </div>
      {pl.active && <div className="pf-valid"><span>Validity</span><span>{pl.pctLeft}%</span></div>}
      {pl.active && <i className="pf-track"><u style={{ width: `${pl.pctLeft}%` }} /></i>}
      <div className="pf-end"><button type="button" className="pf-primary" onClick={() => nav("/plans")}>{pl.active ? "Manage Plan" : "Upgrade to Pro"}</button></div>
    </section>
  );
}

/* ---- your data ---- */
function DeleteDialog({ p, onClose }) {
  const [confirm, setConfirm] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api.delete("/profile", { data: { confirm, password: pw } }); setToken(null); window.location.href = "/login"; }
    catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="scan-back" onClick={onClose}>
      <form className="scan-box" onClick={(e) => e.stopPropagation()} onSubmit={go} role="dialog" aria-label="Delete account">
        <h3>Delete your account?</h3>
        <p className="pf-sub" style={{ marginTop: 0 }}>This permanently removes your profile, points, badges, answers, mistakes, chats and uploaded files. It cannot be undone. Payment records are kept because accounting rules require it.</p>
        {p.hasPassword && <input className="pf-input" type="password" autoComplete="current-password" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} required />}
        <input className="pf-input" style={{ marginTop: 10 }} placeholder="Type DELETE to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
        <div className="scan-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn outline" onClick={onClose}>Keep my account</button>
          <button className="btn pf-danger" disabled={busy || confirm.trim().toUpperCase() !== "DELETE"}>{busy ? "Deleting…" : "Delete forever"}</button>
        </div>
      </form>
    </div>
  );
}

function YourData({ p }) {
  const [del, setDel] = useState(false);
  const [err, setErr] = useState("");
  const download = async () => {
    setErr("");
    try {
      const data = await api.get("/profile/export");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: "mastishq-my-data.json" });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (x) { setErr(x.message); }
  };
  return (
    <section className="pf-card">
      <h2 className="pf-h2">Your data</h2>
      <h3 className="pf-h3">What we store</h3><p className="pf-sub">Your answers, time per question, mistakes, and the details above. Mobile, school and state only if you added them.</p>
      <h3 className="pf-h3">What we never do</h3><p className="pf-sub">Sell your data, share your number, or make sales calls.</p>
      <h3 className="pf-h3">Your controls</h3><p className="pf-sub">Delete your account and data at any time.</p>
      <div className="pf-links"><button type="button" className="pf-link strong" onClick={download}>Download my data</button><button type="button" className="pf-link danger" onClick={() => setDel(true)}>Delete account</button></div>
      {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
      {del && <DeleteDialog p={p} onClose={() => setDel(false)} />}
    </section>
  );
}

/* ---- invite friends ---- */
function Invite({ p }) {
  const [note, setNote] = useState("");
  const link = `${window.location.origin}/signup?ref=${p.invite.code}`;
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "Mastishq.ai", text: "Practice smarter with Mastishq.ai. Join with my link:", url: link }); return; }
      await navigator.clipboard.writeText(link); setNote("Link copied. Send it to a friend.");
    } catch (e) { if (e?.name !== "AbortError") { setNote(link); } }
  };
  return (
    <section className="pf-card pf-slim">
      <div className="pf-row">
        <div>
          <h2 className="pf-h2">Invite friends</h2>
          <p className="pf-sub" style={{ margin: 0 }}>You both get {p.invite.reward} extra open chats when a friend finishes their first level.{p.invite.bonusChats > 0 && <> You have <b>{p.invite.bonusChats}</b> bonus chats left.</>}</p>
        </div>
        <button type="button" className="pf-outline" onClick={share}>Share invite link</button>
      </div>
      {note && <p className="pf-help" style={{ marginTop: 8, wordBreak: "break-all" }}>{note}</p>}
    </section>
  );
}

function Help() {
  const rows = [["Address", COMPANY.address], ["Company", COMPANY.name], ["Support Email", SUPPORT_EMAIL], ["Contact Number", COMPANY.phone]].filter(([, v]) => v);
  return (
    <>
      <section className="pf-card pf-slim"><div className="pf-row"><h2 className="pf-h2" style={{ margin: 0 }}>Help &amp; support</h2><Link to="/support" className="pf-link strong">Contact us</Link></div></section>
      <section className="pf-card pf-contact">
        {rows.map(([l, v]) => <div key={l}><small>{l.toUpperCase()}</small><b>{l === "Support Email" ? <a href={`mailto:${v}`}>{v}</a> : v}</b></div>)}
      </section>
    </>
  );
}

export default function Profile() {
  const { refresh } = useAuth();
  const prof = useGet("/profile");
  const p = prof.data?.profile;
  const reload = async () => { prof.reload(); try { await refresh(); } catch { /* the nav refreshes on the next page change */ } };
  if (prof.error) return <div className="container"><div className="error" style={{ marginTop: 26 }}>{prof.error}</div></div>;
  if (!p) return <div className="container"><p className="skeleton" style={{ marginTop: 26 }}>Loading…</p></div>;
  return (
    <div className="container pf">
      <h1 className="page-title" style={{ marginTop: 8 }}>Profile</h1>
      <PictureCard p={p} onChange={reload} />
      <section className="pf-card">
        <h2 className="pf-h2">Learner details</h2>
        <div className="pf-grid">{FIELDS.map(([k, l]) => <Field key={k} k={k} label={l} p={p} onSaved={reload} />)}</div>
      </section>
      <Goals key={`${p.goalName}|${p.subjects.join(",")}`} p={p} onSaved={reload} />
      <Account p={p} />
      <Plan p={p} />
      <YourData p={p} />
      <Invite p={p} />
      <Help />
    </div>
  );
}
