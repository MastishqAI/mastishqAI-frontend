import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth.jsx";
import { Icon } from "../components/icons.jsx";

function Shell({ step, children }) {
  return (
    <div className="auth-bg">
      <div className="onb-card">
        <div className="bar-track" />
        <div className="bar" style={{ width: `${step * 25}%` }} />
        <span className="step-pill">STEP {step} OF 4</span>
        {children}
      </div>
    </div>
  );
}

const Pw = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="input-wrap">
        <input className="input fill" type={show ? "text" : "password"} value={value} onChange={onChange} />
        <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label="Toggle password">
          {show ? <Icon.eye size={18} /> : <Icon.eyeOff size={18} />}
        </button>
      </div>
    </div>
  );
};

const FALLBACK_GOALS = [];

export default function Onboarding() {
  const { user, register, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(user ? 2 : 1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [a, setA] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "", phone: "" });
  const [b, setB] = useState({ school: "", className: "", district: "", state: "", pincode: "" });
  const [goals, setGoals] = useState(FALLBACK_GOALS);
  const [c, setC] = useState({ goalText: "", goalName: "", dailyGoal: "" });
  const [subjects, setSubjects] = useState([]);
  const [picked, setPicked] = useState([]);
  const [custom, setCustom] = useState("");
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get("/onboarding/goals").then((r) => setGoals(r.goals)).catch(() => {});
    api.get("/onboarding/subjects").then((r) => setSubjects(r.subjects)).catch(() => {});
  }, [user]);

  const wrap = (fn) => async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    try { await fn(); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const step1 = wrap(async () => {
    if (a.password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (a.password !== a.confirm) throw new Error("Passwords don't match.");
    await register({ firstName: a.firstName, lastName: a.lastName, email: a.email, password: a.password, phone: a.phone ? `+91 ${a.phone}` : "" });
    setStep(2);
  });
  const step2 = wrap(async () => { await api.post("/onboarding/academic", b); setStep(3); });
  const step3 = wrap(async () => { await api.post("/onboarding/goals", c); setStep(4); });
  const step4 = wrap(async () => {
    await api.post("/onboarding/subjects", { subjects: picked });
    setFinishing(true);
  });

  const toggle = (s) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const addCustom = (e) => {
    if (e.key === "Enter" && custom.trim()) { e.preventDefault(); if (!picked.includes(custom.trim())) setPicked([...picked, custom.trim()]); setCustom(""); }
  };

  if (finishing) return <AlmostThere count={picked.length} onDone={async () => { await refresh(); nav("/"); }} />;

  if (step === 1)
    return (
      <Shell step={1}>
        <h1 style={{ marginTop: 28 }}>Personal Information</h1>
        <p className="desc">Please provide accurate details to personalize your experience.</p>
        <form onSubmit={step1}>
          <div className="two">
            <div className="field"><label>First Name</label><input className="input fill" value={a.firstName} onChange={(e) => setA({ ...a, firstName: e.target.value })} required /></div>
            <div className="field"><label>Last Name</label><input className="input fill" value={a.lastName} onChange={(e) => setA({ ...a, lastName: e.target.value })} /></div>
          </div>
          <div className="field"><label>Email Address</label><input className="input fill" type="email" value={a.email} onChange={(e) => setA({ ...a, email: e.target.value })} required /></div>
          <Pw label="Create a new Password" value={a.password} onChange={(e) => setA({ ...a, password: e.target.value })} />
          <Pw label="Confirm Password" value={a.confirm} onChange={(e) => setA({ ...a, confirm: e.target.value })} />
          <div className="field">
            <label>Mobile Number</label>
            <div className="phone">
              <div className="input fill cc">+91 <Icon.chevDown size={16} /></div>
              <input className="input" placeholder="9876543210" inputMode="numeric" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
            </div>
          </div>
          {err && <div className="error">{err}</div>}
          <button className="btn block" disabled={busy}>Next</button>
          <button type="button" className="btn block outline" style={{ marginTop: 14, color: "var(--gray-600)" }} onClick={() => nav("/login")}>Back</button>
        </form>
      </Shell>
    );

  if (step === 2)
    return (
      <Shell step={2}>
        <h1 style={{ marginTop: 28 }}>Academic Details</h1>
        <p className="desc">Please provide accurate details to personalize your experience.</p>
        <form onSubmit={step2}>
          <div className="field"><label>School Or College Name</label><input className="input" placeholder="e.g. Delhi Public School / IIT Bombay" value={b.school} onChange={(e) => setB({ ...b, school: e.target.value })} required /></div>
          <div className="field"><label>Standard Or Course</label><input className="input" placeholder="10th / B.tech Computer Science" value={b.className} onChange={(e) => setB({ ...b, className: e.target.value })} required /></div>
          <div className="two">
            <div className="field"><label>District</label><input className="input" placeholder="e.g. Lucknow" value={b.district} onChange={(e) => setB({ ...b, district: e.target.value })} /></div>
            <div className="field"><label>State</label><input className="input" placeholder="e.g. Uttar Pradesh" value={b.state} onChange={(e) => setB({ ...b, state: e.target.value })} /></div>
          </div>
          <div className="field"><label>Pin Code</label><input className="input" placeholder="400001" inputMode="numeric" value={b.pincode} onChange={(e) => setB({ ...b, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></div>
          {err && <div className="error">{err}</div>}
          <button className="btn block" disabled={busy}>Next</button>
          <button type="button" className="btn block outline" style={{ marginTop: 14, color: "var(--gray-600)" }} onClick={() => setStep(1)} disabled={!!user}>Back</button>
        </form>
      </Shell>
    );

  if (step === 3)
    return (
      <Shell step={3}>
        <h1 style={{ marginTop: 28 }}>What are your goals?</h1>
        <p className="desc">We'll tailor your content and quizzes around this</p>
        <form onSubmit={step3}>
          <div className="field">
            <label>Describe Your Goals (30 Words)</label>
            <textarea className="input fill" rows={3} placeholder="e.g. My Goal is Prepare for my board exams ..." value={c.goalText}
              onChange={(e) => setC({ ...c, goalText: e.target.value.split(/\s+/).slice(0, 30).join(" ") })} />
          </div>
          <div className="overline">Goal Suggestions</div>
          <div className="goal-grid">
            {goals.map((g) => (
              <div key={g._id} className={`goal ${c.goalName === g.name ? "sel" : ""}`} onClick={() => setC({ ...c, goalName: g.name })}>
                <b>{g.name}</b><span>{g.description}</span>
              </div>
            ))}
          </div>
          <div className="field"><label>Daily Practice Questions</label><input className="input fill" placeholder="e.g. 10 questions per day" inputMode="numeric" value={c.dailyGoal} onChange={(e) => setC({ ...c, dailyGoal: e.target.value.replace(/\D/g, "") })} /></div>
          {err && <div className="error">{err}</div>}
          <button className="btn block" disabled={busy || !c.goalName}>Next</button>
          <button type="button" className="btn block outline" style={{ marginTop: 14, color: "var(--gray-600)" }} onClick={() => setStep(2)}>Back</button>
        </form>
      </Shell>
    );

  return (
    <Shell step={4}>
      <h1 style={{ marginTop: 28 }}>Pick Your Subjects</h1>
      <p className="desc">Choose as many as you like</p>
      <form onSubmit={step4}>
        <p style={{ fontSize: 12, marginBottom: 10 }}>Pick or enter your subjects <b style={{ color: "var(--blue-700)", marginLeft: 6 }}>{picked.length} Selected</b></p>
        <div className="tagbox">
          {picked.map((s) => <span key={s} className="chip sel" onClick={() => toggle(s)}>{s}</span>)}
          <input placeholder={picked.length ? "" : "Type a subject and press Enter"} value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={addCustom} />
        </div>
        <div className="chips" style={{ marginBottom: 26 }}>
          {subjects.map((s) => <button type="button" key={s} className={`chip ${picked.includes(s) ? "sel" : ""}`} onClick={() => toggle(s)}>{s}</button>)}
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn block" disabled={busy || !picked.length}>Finish</button>
        <button type="button" className="btn block outline" style={{ marginTop: 14, color: "var(--gray-600)" }} onClick={() => setStep(3)}>Back</button>
      </form>
    </Shell>
  );
}

function AlmostThere({ count, onDone }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(100, p + 7)), 180);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (pct >= 100) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); } }, [pct]);
  const rows = [
    ["Account Created", "Email verified & password set"],
    ["Personal Details Saved", "Name, email & mobile number confirmed"],
    ["Subjects Selected", `${count} subjects added to your curriculum`],
  ];
  const finalising = pct < 100;
  return (
    <div className="auth-bg">
      <div className="card" style={{ width: "100%", maxWidth: 560, padding: "44px 40px", borderRadius: 24 }}>
        <h1 style={{ textAlign: "center", fontSize: 24 }}>Almost There!</h1>
        <p style={{ textAlign: "center", color: "var(--gray-500)", fontWeight: 600, margin: "10px 0 28px" }}>We're setting up your personalized learning experience</p>
        {rows.map(([t, s]) => (
          <div key={t} className="prog-row"><span className="ic"><Icon.check size={18} /></span><div><b>{t}</b><small>{s}</small></div><span className="st done">Done</span></div>
        ))}
        <div className={`prog-row ${finalising ? "active" : ""}`}>
          <span className="ic">{finalising ? <Icon.sparkle size={18} /> : <Icon.check size={18} />}</span>
          <div><b>Finalizing Profile</b><small>Configuring your dashboard & recommendations</small></div>
          <span className={`st ${finalising ? "pct" : "done"}`}>{finalising ? `${pct}%` : "Done"}</span>
        </div>
        <div className={`prog-row ${finalising ? "pending" : ""}`}>
          <span className="ic">{finalising ? <Icon.clock size={18} /> : <Icon.check size={18} />}</span>
          <div><b>Ready to Learn!</b><small>Your personalized dashboard awaits</small></div>
          <span className={`st ${finalising ? "pend" : "done"}`}>{finalising ? "Pending" : "Done"}</span>
        </div>
      </div>
    </div>
  );
}
