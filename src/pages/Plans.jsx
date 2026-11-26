import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useGet } from "../hooks";
import { buyPro } from "../upgrade.js";

const Check = ({ tone = "green" }) => (
  <span className={`pl-check ${tone}`} aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
);

// Free vs Pro. The lists describe what the app really does: everything below is available on Free except the higher daily limits.
export default function Plans() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const cfg = useGet("/payments/config");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const isPro = user?.plan === "pro";
  const price = cfg.data?.amount ?? 499, listPrice = cfg.data?.listAmount ?? 999, days = cfg.data?.days ?? 30;

  const upgrade = async () => {
    setBusy(true); setMsg("");
    try { const r = await buyPro(user); if (r) { await refresh(); nav("/profile"); } } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="container pl">
      <Link to="/profile" className="pl-back">← Back to Profile</Link>
      <header className="pl-head">
        <span className="pl-chip">Plans</span>
        <h1>Start free. Upgrade only if it helps.</h1>
        <p>Everything you need to find and fix lost marks is free. Pro adds more AI quizzes and chats each day.</p>
      </header>

      <div className="pl-cards">
        <section className="pl-card">
          <div className="pl-top"><h2>Free</h2>{!isPro && <span className="pl-your">Your plan</span>}</div>
          <p className="pl-price"><b>₹0</b><span>forever</span></p>
          <p className="pl-note">No card needed. No trial that runs out.</p>
          <hr />
          <ul>
            {["Daily limits on AI quizzes and Ask AI chats", "Mistake Bank and weak-spot practice", "My best, Levels, Points and Badges", "Upload your own material (daily limit)"].map((t) => <li key={t}><Check />{t}</li>)}
          </ul>
          <Link className="pl-btn outline" to="/">Continue with Free</Link>
        </section>

        <section className="pl-card pro">
          <div className="pl-top"><h2>Pro</h2>{isPro && <span className="pl-your blue">Your plan</span>}</div>
          <p className="pl-price"><b>₹{price}</b>{listPrice > price && <s className="pl-was" aria-label={`was ₹${listPrice}`}>₹{listPrice}</s>}<span>/ {days} days</span></p>
          <p className="pl-note">One payment for {days} days. No auto-renewal.</p>
          <hr />
          <ul>
            {["3× the daily AI quiz limit", "3× the daily Ask AI chat limit", "3× the daily limit for reading your uploaded files", "Everything in Free"].map((t) => <li key={t}><Check tone="blue" />{t}</li>)}
          </ul>
          {msg && <p className="pl-err" role="alert">{msg}</p>}
          <button type="button" className="pl-btn solid" disabled={busy || (cfg.data && !cfg.data.enabled)} onClick={upgrade}>
            {busy ? "Opening payment…" : isPro ? `Add ${days} more days · ₹${price}` : `Upgrade to Pro · ₹${price}`}
          </button>
        </section>
      </div>

      <div className="pl-trust"><span><Check />Pay once, no auto-renewal</span><span><Check />Secure Payment via Razorpay</span></div>
    </div>
  );
}
