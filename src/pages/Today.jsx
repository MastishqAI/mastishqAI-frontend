import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";

function RookieBadge() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <path d="M48 6 86 20v28c0 22-16 36-38 42C26 84 10 70 10 48V20L48 6Z" fill="#8FA3C8" opacity=".55" />
      <path d="M48 12 80 24v24c0 18-13 30-32 36C29 78 16 66 16 48V24l32-12Z" fill="#B6C4DE" opacity=".8" />
      <path d="m48 30 5.4 11 12.1 1.7-8.8 8.5 2.1 12L48 57.4 37.2 63.2l2.1-12-8.8-8.5 12.1-1.7L48 30Z" fill="#7E92BB" />
      <rect x="30" y="60" width="36" height="9" rx="2" fill="#6F82AA" />
      <text x="48" y="67.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#DCE5F5" fontFamily="Inter, sans-serif">ROOKIE</text>
    </svg>
  );
}

const FAQ = [
  ["What is the 10-minute diagnostic?", "A quick 20-question quiz that maps your current strengths and weaknesses across the syllabus."],
  ["Can I add extra questions to a stage?", "Yes. Before starting, you can add extra questions to any stage. A higher question count increases your score multiplier risk and reward."],
  ["How do I level up from Level 0?", "Complete the diagnostic and clear the Easy stage of any topic. Points from correct answers move you toward Level 1."],
  ["How do I earn points?", "You earn points for every correct answer, completing stages, and maintaining your daily streak."],
  ["Can I retake the diagnostic later?", "Your first diagnostic sets your starting map. You can keep practising any topic to refresh it."],
  ["Is my progress private?", "Yes. Points appear on the leaderboard, but your accuracy and scores stay private unless you choose to show them."],
  ["How do I unlock the Rookie badge?", "Complete the diagnostic and clear the Easy stage of any topic to earn your first badge."],
  ["What are the 3 stages of a topic?", "Easy, Medium, and Hard. Each stage unlocks as you master the previous one."],
  ["What is the Mistake Bank?", "A personalized collection of questions you struggled with, helping you focus on weak areas."],
  ["How does the leaderboard work?", "Your score is calculated from points earned divided by time taken, multiplied by questions attempted."],
  ["Is there negative marking in the diagnostic?", "No. The diagnostic has no negative marking and nobody sees your score."],
  ["Where can I find explanations for mistakes?", "Open any attempt in Review and tap Ask why — Mastishq AI explains the answer step by step."],
];

export default function Today() {
  const { data: d, loading, error } = useGet("/home");
  const nav = useNavigate();
  const [open, setOpen] = useState({ 0: true, 3: true, 6: true, 7: true, 8: true, 9: true });
  const [busy, setBusy] = useState(false);

  const startDiagnostic = async () => {
    setBusy(true);
    try { const r = await api.post("/practice/diagnostic/start"); nav(`/quiz/${r.attempt.id}`); }
    catch (e) { alert(e.message); setBusy(false); }
  };

  if (loading) return <div className="container skeleton">Loading…</div>;
  if (error) return <div className="container"><div className="error">{error}</div></div>;

  const returning = d.points > 0 || d.diagnosticDone;
  const nextName = d.nextLevel;

  return (
    <>
      <div className="container">
        <div className="level-bar">
          <span className="lv">Level {d.level}</span>
          <span>{d.pct}% of the way to Level {nextName} · {d.points.toLocaleString()} pts</span>
          <div className="track"><i style={{ width: `${d.pct}%` }} /></div>
          <Link to="/progress" style={{ fontWeight: 600, fontSize: 13 }}>View levels</Link>
        </div>

        <section className="hero">
          <div>
            <span className="tagline">Level {d.level} · {d.levelName}</span>
            {returning ? (
              <>
                <h2>Welcome back, {d.firstName}. {d.streak > 0 ? `You're on a ${d.streak}-day streak.` : "Let's get a streak going."}</h2>
                <p>Every correct answer moves you closer to Level {nextName}. Pick up where you left off, or fix a few mistakes to turn weak spots into strengths.</p>
                <Link className="btn white" to="/practice" style={{ height: 44 }}>Continue practising</Link>
                <small>{d.toNext.toLocaleString()} pts to Level {nextName}</small>
              </>
            ) : (
              <>
                <h2>Welcome, {d.firstName}. Your {d.exam || "learning"} journey starts today.</h2>
                <p>You are at Level 0, and that is exactly where every topper started. Take one 10-minute step and we will build a study plan around what you already know.</p>
                <button className="btn white" style={{ height: 44 }} disabled={busy} onClick={startDiagnostic}>{busy ? "Preparing…" : "Take 10-minute diagnostic"}</button>
                <small>Free · No negative marking · Nobody sees your score</small>
              </>
            )}
          </div>
          <div className="badge-card">
            <div className="badge-art"><RookieBadge /></div>
            <div>{d.badges.includes("Rookie") ? "Badge earned: Rookie" : "First badge: Rookie"}</div>
            <div className="track"><i style={{ width: `${Math.min(100, (d.points / (d.levelNext || 100)) * 100)}%` }} /></div>
            <div style={{ fontWeight: 500, fontSize: 12 }}>{d.points} / {d.levelNext || d.points} pts to Level {nextName}</div>
          </div>
        </section>

        <h2 className="section-title">Your first 3 steps</h2>
        <p className="muted" style={{ color: "var(--gray-500)", fontSize: 14 }}>Do these this week and you will reach Level 1.</p>
        <div className="steps">
          <div className={`step ${d.diagnosticDone ? "done" : ""}`}>
            <span className="num">{d.diagnosticDone ? <Icon.check size={14} /> : 1}</span>
            <span className="reward">+50 pts</span>
            <h3>Take the 10-minute diagnostic</h3>
            <p>20 quick questions. We draw your first "Where I stand" map.</p>
            {d.diagnosticDone
              ? <p className="locked" style={{ color: "var(--green-600)", fontWeight: 600 }}>Completed</p>
              : <button className="btn" style={{ width: "100%", marginTop: 16, height: 44 }} disabled={busy} onClick={startDiagnostic}>Start now</button>}
          </div>
          <div className={`step ${d.diagnosticDone ? "" : "dim"} ${d.clearedEasy ? "done" : ""}`}>
            <span className="num">{d.clearedEasy ? <Icon.check size={14} /> : 2}</span>
            <span className="reward">+20 pts · Rookie badge</span>
            <h3>Clear the Easy stage of one topic</h3>
            <p>Pick any topic, or one we suggest from your diagnostic.</p>
            {d.diagnosticDone && !d.clearedEasy
              ? <Link className="btn" to="/practice" style={{ width: "100%", marginTop: 16, height: 44 }}>Start practice</Link>
              : d.clearedEasy ? <p className="locked" style={{ color: "var(--green-600)", fontWeight: 600 }}>Completed</p>
              : <p className="locked">🔒 Locked until step 1</p>}
          </div>
          <div className={`step ${d.diagnosticDone ? "" : "dim"} ${d.streak3 ? "done" : ""}`}>
            <span className="num">{d.streak3 ? <Icon.check size={14} /> : 3}</span>
            <span className="reward">+30 pts · 🔥 streak</span>
            <h3>Practise 3 days in a row</h3>
            <p>Even 10 minutes a day starts your streak.</p>
            {d.streak3 ? <p className="locked" style={{ color: "var(--green-600)", fontWeight: 600 }}>Completed · {d.streak} days</p> : d.diagnosticDone ? <p className="locked">🔥 {d.streak} / 3 days</p> : <p className="locked">🔒 Locked until step 1</p>}
          </div>
        </div>
      </div>

      <section className="band warm">
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <span className="eyebrow">The Process</span>
          <h2 className="h-center">From topic to mastery in minutes</h2>
          <p className="s-center" style={{ maxWidth: "none" }}>AI builds a personalised 3-stage quiz from any topic in seconds no prep needed.</p>
          <div className="process">
            {[
              ["Step 01", "Practice", "Topic quizzes, full mocks and weak-spot sets in your exam pattern.", "brain", "#E7F5FD", "#139CED"],
              ["Step 02", "See where marks went", "After every test lost marks by topic and mistake type.", "sparkle", "#FEF3C7", "#D97706"],
              ["Step 03", "Fix Your mistakes", "Fresh similar questions until each mistake is Fixed.", "xCircle", "#FEE2E2", "#DC2626"],
              ["Step 04", "Track Progress", "Your syllabus map moves from Weak to Strong.", "chart", "#F5F3FF", "#7C3AED"],
            ].map(([s, t, p, ic, bg, fg]) => {
              const C = Icon[ic];
              return (
                <div key={s}>
                  <div className="ico" style={{ background: bg, color: fg }}><C size={24} /></div>
                  <small>{s}</small><h4>{t}</h4><p>{p}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="band cool">
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <span className="eyebrow">Mistake Banks</span>
          <h2 className="h-center">Mistake Banks help learners<br />review, reflect, and improve.</h2>
          <p className="s-center">Mistake Banks collect questions learners struggle with, so they can revisit weak areas, build confidence, and reinforce learning over time.</p>
          <div className="mb-grid">
            {[
              ["Review", "Review highlights where you need more practice so you can focus on weak areas, track progress, identify gaps, and build confidence as tricky concepts become clearer.", "#E8F1FB"],
              ["Reflect", "Reflection helps you understand why mistakes happened, learn from feedback, clarify confusing concepts with explanations and examples, and retake with confidence once the mistake is clear.", "#FDF2E4"],
              ["Improve", "Improvement turns mistakes into lasting gains by focusing on weak spots, building recall through spaced practice, keeping you on track, and celebrating progress as weak areas become strengths.", "#EAF6EE"],
            ].map(([t, p, bg]) => (
              <div key={t} className="mb">
                <div className="img" style={{ background: bg }}><Icon.brain size={44} style={{ color: "#0C6498", opacity: .55 }} /></div>
                <h4>{t}</h4><p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" style={{ background: "#fff" }}>
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <h2 className="h-center">Built for competitive learners</h2>
          <p className="s-center">Score higher by learning smarter, not just longer.</p>
          <div className="feat">
            {[
              ["Leaderboard", "Rank by effort, not luck", "Your score is calculated from points earned divided by time taken, multiplied by questions attempted. The more you push, the higher you climb.", "trophy"],
              ["Level System", "Progress topic by topic", "Complete all 3 difficulty stages of a topic to level up your overall level and unlocks new achievement milestones.", "bolt"],
              ["Point Bonus", "More questions, bigger rewards", "Before starting, you can add extra questions to any stage. A higher question count increases your score multiplier risk and earn more.", "target"],
            ].map(([k, t, p, ic]) => {
              const C = Icon[ic];
              return <div key={k}><div className="ico"><C size={20} style={{ color: "var(--blue-500)" }} /></div><small>{k}</small><h4>{t}</h4><p>{p}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="band cool">
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <span className="eyebrow">FAQ</span>
          <h2 className="h-center">Frequently Asked Questions</h2>
          <p className="s-center">Everything you need to know about your {d.exam || "learning"} journey, from diagnostics to leveling up.</p>
          <div className="faq">
            {[0, 1].map((col) => (
              <div key={col} style={{ display: "grid", gap: 16 }}>
                {FAQ.map((f, i) => ({ f, i })).filter(({ i }) => i % 2 === col).map(({ f, i }) => (
                  <div key={i} className="faq-item" onClick={() => setOpen({ ...open, [i]: !open[i] })}>
                    <div className="q">{f[0]}<span>{open[i] ? "−" : "+"}</span></div>
                    {open[i] && <p>{f[1]}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
