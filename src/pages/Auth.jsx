import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import api from "../api";
import { GoogleG, Logo } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";

function Card({ children }) {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <Logo stack size={36} text={32} />
        {children}
      </div>
    </div>
  );
}


// Loads Google Identity Services once
let gsiPromise;
const loadGsi = () => (gsiPromise ||= new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve();
  const sc = document.createElement("script");
  sc.src = "https://accounts.google.com/gsi/client"; sc.async = true; sc.defer = true;
  sc.onload = resolve; sc.onerror = () => { gsiPromise = null; reject(new Error("Couldn't load Google sign-in")); };
  document.head.appendChild(sc);
}));

// Looks like the Figma "Continue With Google" button; Google's real (invisible) button sits on top and handles the click.
function GoogleButton({ onToken, onError }) {
  const overlay = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const cfg = await api.get("/auth/config");
        if (!cfg.googleClientId) return;
        await loadGsi();
        if (dead || !overlay.current) return;
        window.google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: (r) => onToken(r.credential), ux_mode: "popup" });
        window.google.accounts.id.renderButton(overlay.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", width: Math.min(400, overlay.current.offsetWidth || 366) });
        setReady(true);
      } catch (e) { onError?.(e.message); }
    })();
    return () => { dead = true; };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button className="google" type="button" onClick={() => !ready && onError?.("Google sign-in isn't available right now. Please try again in a moment.")}>
        <GoogleG /> Continue With Google
      </button>
      <div ref={overlay} className="gsi" style={{ position: "absolute", inset: 0, opacity: 0.0001, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }} />
    </div>
  );
}

export function Login() {
  const { user, google } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [scale, setScale] = useState(1);
  // Scale the illustration so the whole login page fits in one screen, no scrolling
  useEffect(() => {
    const fit = () => setScale(Math.min(1, Math.max(0.42, (window.innerHeight - 330) / 560)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  if (user) return <Navigate to="/" replace />;

  // One Google entry point for both sign-in and sign-up; new learners are sent on to onboarding for the remaining details
  const googleSignIn = async (credential) => {
    setErr("");
    try { const u = await google(credential); nav(u.role === "student" && !u.onboarded ? "/onboarding" : "/"); }
    catch (e2) { setErr(e2.message); }
  };

  return (
    <div className="login-split" style={{ "--s": scale }}>
      <section className="login-art" aria-hidden="true">
        <span className="eyebrow-chip">AI exam prep for every aspirant</span>
        <h2>Practice smarter.<br />Crack your exam.</h2>
        <p>Adaptive quizzes, instant doubt-solving with AI and a Mistake Bank that turns every wrong answer into marks.</p>
        <div className="art-stage">
          <img className="student" src="/login-learner-3d.png" alt="" width="560" height="560" />
          <div className="art-card acc">
            <span className="lab">Weekly accuracy <em>+12%</em></span>
            <b>82%</b>
            <div className="bars">{[16, 22, 20, 30, 26, 36, 44].map((h, i) => <i key={i} className={i < 2 ? "lt" : ""} style={{ height: h }} />)}</div>
          </div>
          <div className="art-card ai">
            <div className="who"><span className="av">AI</span><div><b>Mastishq AI</b><small>Your study mentor</small></div></div>
            <p>Right! Speed = distance ÷ time. Want a similar question to lock it in?</p>
            <div className="acts"><span className="pri">Practice similar</span><span>Explain</span></div>
          </div>
          <div className="art-card mini mb"><span className="ico red">12</span><div><b>Mistake Bank</b><small>12 questions to fix</small></div></div>
          <div className="art-card mini st"><span className="ico orange"><i /></span><div><b>7-day streak</b><small>Keep it going</small></div></div>
        </div>
        <ul>{["10-minute diagnostic", "Adaptive practice", "Instant AI doubt-solving"].map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
      <main className="login-side">
        <div className="login-card">
          <Logo stack size={36} text={32} />
          <p className="tag2">Make every lesson count with AI-powered education.</p>
          <p className="help2">Sign in or create your account in one tap.</p>
          {err && <div className="error" role="alert">{err}</div>}
          <GoogleButton onToken={googleSignIn} onError={setErr} />
          <p className="terms2">By continuing, you agree to our <a href="/legal/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
        </div>
      </main>
    </div>
  );
}

export function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api.post("/auth/forgot-password", { email });
      setDevLink(r.devResetLink || "");
      setSent(true);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  if (sent)
    return (
      <Card>
        <div className="icon-circle"><Icon.mail size={34} style={{ color: "var(--blue-500)" }} /></div>
        <h1 style={{ marginTop: 22 }}>Check Your Email</h1>
        <p className="sub" style={{ maxWidth: 320 }}>We've sent a password reset link to your email address. Please check your inbox and click the link to continue.</p>
        <p style={{ fontSize: 14, color: "var(--gray-500)", margin: "22px 0 18px" }}>
          Didn't receive the email? <button className="link" onClick={() => send()} style={{ fontWeight: 700 }}>Resend</button>
        </p>
        <Link className="center-link" to="/login">Back to login</Link>
        {devLink && (
          <p style={{ marginTop: 18, fontSize: 11, color: "var(--gray-400)", wordBreak: "break-all" }}>
            Dev only — email isn't connected yet: <a href={devLink}>open reset link</a>
          </p>
        )}
      </Card>
    );

  return (
    <Card>
      <h1>Forgot Password?</h1>
      <p className="sub">Enter your registered email address and we'll send you a link to reset your password.</p>
      <form onSubmit={send}>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" placeholder="e.g akash@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn block" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      </form>
      <Link className="center-link" to="/login">Back to login</Link>
    </Card>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState({ p1: "", p2: "" });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.p1.length < 6) return setErr("Password must be at least 6 characters.");
    if (f.p1 !== f.p2) return setErr("Passwords don't match.");
    try { await api.post("/auth/reset-password", { token: sp.get("token"), newPassword: f.p1 }); setDone(true); }
    catch (e2) { setErr(e2.message); }
  };

  if (done)
    return (
      <Card>
        <div className="icon-circle green"><Icon.check size={34} style={{ color: "var(--green-600)" }} /></div>
        <h1 style={{ marginTop: 22 }}>Password Changed!</h1>
        <p className="sub">Your password has been changed successfully. You can now log in with your new password.</p>
        <button className="btn block" onClick={() => nav("/login")}>Login</button>
      </Card>
    );

  return (
    <Card>
      <h1>Create New Password</h1>
      <p className="sub">Your new password must be different from previously used passwords.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label>New Password</label>
          <input className="input" type="password" autoComplete="new-password" placeholder="Enter New Password" value={f.p1} onChange={(e) => setF({ ...f, p1: e.target.value })} required />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input className="input" type="password" autoComplete="new-password" placeholder="Confirm New Password" value={f.p2} onChange={(e) => setF({ ...f, p2: e.target.value })} required />
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn block">Reset password</button>
      </form>
      <Link className="center-link" to="/login">Cancel</Link>
    </Card>
  );
}
