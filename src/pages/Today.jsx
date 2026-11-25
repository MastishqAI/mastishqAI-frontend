import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useGet } from "../hooks";
import { Icon } from "../components/icons.jsx";
import { useAuth } from "../auth.jsx";

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


const BAND_COLOR = { Strong: "#5aa9e6", Building: "#5aa9e6", Weak: "#f6b84a" };
const initialsOf = (n = "") => n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

function LevelsPopover({ current }) {
  const { data } = useGet("/xp/overview");
  return (
    <div className="hm-pop" role="dialog" aria-label="Levels">
      {!data ? <p style={{ padding: 12, fontSize: 12 }}>Loading…</p> : data.levels.map((l) => (
        <Link key={l.n} to="/progress?tab=levels" className={l.n === current ? "on" : ""}>
          <span className="n">{l.n}</span><span className="t"><b>Level {l.n}</b><small>From {l.from.toLocaleString("en-IN")} pts</small></span>
          {l.state === "done" && <span className="ok">✓</span>}{l.state === "current" && <span className="you">You</span>}
        </Link>
      ))}
    </div>
  );
}

function WhereIStand({ t }) {
  const { user } = useAuth();
  const [first, ...rest] = (user?.name || "").trim().split(/\s+/);
  const myName = first ? `${first[0].toUpperCase()}${first.slice(1)}${rest.length ? ` ${rest[rest.length - 1][0].toUpperCase()}.` : ""}` : "You";
  const { data: lb } = useGet("/leaderboard/around?top=3");
  const rows = lb?.rows || [];
  return (
    <>
      <h2 className="hm-h left">Where I stand</h2>
      <p className="hm-sub left">Your syllabus map moves from Weak to Strong.</p>
      <div className="hm-stand">
        <section className="hm-card hm-lb">
          <div className="hd"><span className="ic"><Icon.trophy size={18} /></span><div><b>Leaderboard</b><small>Rank by effort, not luck</small></div>
            {lb && rows.length > 0 && (lb.movedUp > 0
              ? <span className="up"><Icon.arrowUp size={14} /> {lb.movedUp} place{lb.movedUp > 1 ? "s" : ""} this week</span>
              : lb.movedUp < 0
                ? <span className="up down"><Icon.arrowUp size={14} style={{ transform: "rotate(180deg)" }} /> {-lb.movedUp} place{lb.movedUp < -1 ? "s" : ""} this week</span>
                : <span className="up flat">No change this week</span>)}</div>
          {rows.length === 0 && <p className="empty">Practise a stage to appear on the leaderboard.</p>}
          {rows.map((r, i) => (
            <div key={r.rank} className={`row ${r.me ? "me" : ""} ${r.rank <= 3 ? "top" : ""} ${r.rank === 1 ? "first" : ""} ${lb.gapAfter && i === lb.gapAfter ? "gap" : ""}`}>
              <span className="rk">#{r.rank}</span><span className="av">{initialsOf(r.me ? myName : r.name) || r.initial}</span>
              <b className="nm">{r.me ? myName : r.name}</b>{r.me && <span className="you">You</span>}
              <span className="pt">{r.points.toLocaleString("en-IN")} pts</span>
            </div>
          ))}
        </section>
        <aside className="hm-card hm-map">
          <div className="hd"><b>Syllabus map</b><small>Weak → Strong</small></div>
          {(t?.syllabus || []).length === 0 && <p className="empty">Finish a stage and your topics will appear here.</p>}
          {(t?.syllabus || []).map((x) => (
            <div key={x.topic} className="mrow">
              <div><span>{x.topic}</span><em style={{ color: x.band === "Weak" ? "#8a5200" : "#0f6fae" }}>{x.band}</em></div>
              <i className="bar"><u style={{ width: `${Math.max(6, x.pct)}%`, background: BAND_COLOR[x.band] }} /></i>
            </div>
          ))}
        </aside>
      </div>
      <div className="hm-center"><Link className="hm-btn solid" to="/progress">View Leaderboard</Link></div>
    </>
  );
}

function ReturningHome({ d, t }) {
  const [levels, setLevels] = useState(false);
  const pct = d.levelNext ? Math.round((d.points / d.levelNext) * 100) : 100;
  const resume = t?.resume;
  const go = resume ? `/quiz/${resume.attemptId}` : "/practice";
  const week = t?.week || [];
  const next = d.levelNext ? d.nextLevel : d.level;
  return (
    <>
      <section className="hm-hero">
        <span className="hm-chip"><i />Welcome back</span>
        <h1>Welcome back, {(d.firstName || "").replace(/^\w/, (c) => c.toUpperCase())}.<br />Pick up where you <em>left off</em>.</h1>
        <p>{d.levelNext ? `You are ${Math.max(0, 100 - pct)}% away from Level ${next}. ` : ""}One 10-minute session today keeps your streak going and moves your syllabus map from Weak to Strong.</p>
        <div className="hm-cta">
          <Link className="hm-btn solid" to={go}>Continue practice <Icon.arrowRight size={16} /></Link>
          <Link className="hm-btn outline" to="/mistakes">Fix my mistakes <Icon.arrowRight size={16} /></Link>
        </div>
        {resume && <small>Next up: {resume.topic} · {resume.stageLabel} stage · {resume.answered} of {resume.total} questions done</small>}
      </section>

      <section className="hm-card hm-streak">
        <div className="l">
          <div className="top"><span className="fl"><Icon.flame size={22} /></span><div><b>{d.streak} day streak</b><small>Practise today to reach a {d.streak + 1}-day streak</small></div></div>
          <div className="dots" aria-label="This week">
            {week.map((w, i) => (
              <span key={i}><em>{w.label}</em><i className={w.done ? "ok" : w.today ? "today" : ""}>{w.done && <Icon.check size={15} />}</i></span>
            ))}
          </div>
        </div>
        <div className="r">
          <div className="line"><span className="lv">Level {d.level}</span><span>{pct}% of the way to Level {next} · {d.points.toLocaleString("en-IN")} pts</span></div>
          <i className="bar"><u style={{ width: `${pct}%` }} /></i>
          <div className="pw"><button type="button" className="hm-more" aria-expanded={levels} onClick={() => setLevels(!levels)}>View levels <Icon.chevronDown size={14} /></button>{levels && <LevelsPopover current={d.level} />}</div>
        </div>
      </section>

      <h2 className="hm-h">Today's 3 steps</h2>
      <p className="hm-sub">Do these today to keep your streak and climb towards Level {next}.</p>
      <div className="hm-steps">
        <Link to={go} className="hs on"><div className="top"><span className="n">1</span><u /><span className="chip">+30 pts</span></div><h3>Practise 10 minutes of {resume?.topic || "a topic"}</h3><p>{resume ? `Pick up the ${resume.stageLabel} stage where you stopped.` : "Pick any topic, or one we suggest from your weak spots."}</p></Link>
        <Link to="/mistakes" className="hs"><div className="top"><span className="n">2</span><u /><span className="chip">+20 pts</span></div><h3>Fix 5 mistakes from your Mistake Bank</h3><p>Fresh similar questions until each mistake is Fixed.{t ? ` ${t.mistakesOpen} waiting.` : ""}</p></Link>
        <Link to="/practice" className="hs"><div className="top"><span className="n">3</span><u /><span className="chip warm">+30 pts · streak</span></div><h3>Extend your streak to {d.streak + 1} days</h3><p>Even 10 minutes a day keeps your streak going.</p></Link>
      </div>

      <WhereIStand t={t} />
    </>
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

// Soft scroll-reveal for every home section + progressive timeline for the Mistake Bank.
function useScrollAnimations(ready) {
  const tlRef = useRef(null);
  useLayoutEffect(() => {
    if (!ready) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sel = [
      ".hm > section", ".hm > h2", ".hm > p", ".hm > div", ".hm .steps > .step",
      ".band .container > h2", ".band .container > p",
      ".process > div", ".feat > div", ".faq-item",
    ].join(",");
    const els = [...document.querySelectorAll(sel)].filter((e) => !e.closest(".tl"));
    els.forEach((e) => {
      if (e.classList.contains("rv")) return;
      e.classList.add("rv");
      const sibs = e.parentElement ? [...e.parentElement.children].filter((c) => c.classList.contains("rv") || els.includes(c)) : [];
      e.style.setProperty("--rv-d", `${Math.min(Math.max(sibs.indexOf(e), 0), 4) * 90}ms`);
    });
    const tl = tlRef.current || document.querySelector(".tl");
    const rows = tl ? [...tl.querySelectorAll(".tl-row")] : [];
    rows.forEach((r) => r.classList.add("rv-row"));
    if (reduce || !("IntersectionObserver" in window)) {
      [...els, ...rows].forEach((e) => e.classList.add("in"));
      tl?.style.setProperty("--p", 1);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    [...els, ...rows].forEach((e) => io.observe(e));

    let raf = 0;
    const update = () => {
      raf = 0;
      if (!tl) return;
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height));
      tl.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [ready]);
  return tlRef;
}

export default function Today() {
  const { data: d, loading, error } = useGet("/home");
  const { data: today } = useGet("/home/today");
  const nav = useNavigate();
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState(false);
  const tlRef = useScrollAnimations(!loading && !error);

  const startDiagnostic = async () => {
    setBusy(true);
    try { const r = await api.post("/practice/diagnostic/start"); nav(`/quiz/${r.attempt.id}`); }
    catch (e) { alert(e.message); setBusy(false); }
  };

  if (loading) return <div className="container skeleton">Loading…</div>;
  if (error) return <div className="container"><div className="error">{error}</div></div>;

  const returning = d.points > 0 || d.diagnosticDone;
  const firstName = (d.firstName || "").replace(/^\w/, (c) => c.toUpperCase());
  const nextName = d.nextLevel;

  return (
    <>
      <div className="container hm">
        {returning ? <ReturningHome d={d} t={today} /> : (
          <>
            <section className="hm-hero">
              <span className="hm-chip"><i />Level {d.level} · New here</span>
              <h1>Welcome, {firstName}.<br />Your {d.exam || "learning"} <em>journey</em><br />starts today.</h1>
              <p>You are at Level {d.level}, and that is exactly where every topper started. Take one 10-minute step and we will build a study plan around what you already know.</p>
              <div className="hm-cta"><button className="hm-btn solid" disabled={busy} onClick={startDiagnostic}>{busy ? "Preparing…" : <>Take 10-minute diagnostic <Icon.arrowRight size={16} /></>}</button></div>
              <small>Free · No negative marking · Nobody sees your score</small>
            </section>
            <section className="hm-card hm-first">
              <div className="ring"><img src="/badges/rookie.png" alt="" width="64" height="64" /></div>
              <div className="grow"><b>First badge: Rookie</b><i className="bar"><u style={{ width: `${Math.min(100, (d.points / (d.levelNext || 400)) * 100)}%` }} /></i><span>{d.points} / {d.levelNext || d.points} pts to Level {nextName}</span></div>
            </section>
            <h2 className="hm-h">Your first 3 steps</h2>
            <p className="hm-sub">Do these this week and you will reach Level {nextName}.</p>
            <div className="hm-steps hm-first-steps">
              <div className={`hs ${d.diagnosticDone ? "done" : "on"}`}>
                <div className="top"><span className="n">{d.diagnosticDone ? <Icon.check size={16} /> : 1}</span><u /><span className="chip">+50 pts</span></div>
                <h3>Take the 10-minute diagnostic</h3>
                <p>20 quick questions. We draw your first "Where I stand" map.</p>
                {d.diagnosticDone
                  ? <span className="hs-state ok">Completed</span>
                  : <button type="button" className="hs-cta" disabled={busy} onClick={startDiagnostic}>{busy ? "Preparing…" : "Start now"}</button>}
              </div>
              <div className={`hs ${d.diagnosticDone ? "" : "dim"} ${d.clearedEasy ? "done" : d.diagnosticDone ? "on" : ""}`}>
                <div className="top"><span className="n">{d.clearedEasy ? <Icon.check size={16} /> : 2}</span><u /><span className="chip">+20 pts · Rookie badge</span></div>
                <h3>Clear the Easy stage of one topic</h3>
                <p>Pick any topic, or one we suggest from your diagnostic.</p>
                {d.clearedEasy ? <span className="hs-state ok">Completed</span>
                  : d.diagnosticDone ? <Link className="hs-cta" to="/practice">Start practice</Link>
                  : <span className="hs-state">🔒 Locked until step 1</span>}
              </div>
              <div className={`hs ${d.diagnosticDone ? "" : "dim"} ${d.streak3 ? "done" : ""}`}>
                <div className="top"><span className="n">{d.streak3 ? <Icon.check size={16} /> : 3}</span><u /><span className="chip warm">+30 pts · 🔥 streak</span></div>
                <h3>Practise 3 days in a row</h3>
                <p>Even 10 minutes a day starts your streak.</p>
                {d.streak3 ? <span className="hs-state ok">Completed · {d.streak} days</span>
                  : d.diagnosticDone ? <span className="hs-state">🔥 {d.streak} / 3 days</span>
                  : <span className="hs-state">🔒 Locked until step 1</span>}
              </div>
            </div>
          </>
        )}
      </div>

      <section className="band warm">
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <h2 className="h-center">From topic to <em>mastery</em> in minutes</h2>
          <p className="s-center" style={{ maxWidth: "none" }}>AI builds a personalised 3-stage quiz from any topic in seconds no prep needed.</p>
          <div className="process hmproc">
            {[
              ["Step 01", "Practice", "Topic quizzes, full mocks and weak-spot sets in your exam pattern.", "target", "#eef8fe", "#139CED"],
              ["Step 02", "See where marks went", "After every test lost marks by topic and mistake type.", "barChart", "#eef8fe", "#139CED"],
              ["Step 03", "Fix your mistakes", "Fresh similar questions until each mistake is Fixed.", "refresh", "#eef8fe", "#139CED"],
              ["Step 04", "Track Progress", "Your syllabus map moves from Weak to Strong.", "arrowUpRight", "#eef8fe", "#139CED"],
            ].map(([s, t, p, ic, bg, fg]) => {
              const C = Icon[ic];
              return (
                <div key={s}>
                  <div className="top"><div className="ico" style={{ background: bg, color: fg }}><C size={26} /></div><u /></div>
                  <small>{s}</small><h4>{t}</h4><p>{p}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="band cool">
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <h2 className="h-center">Mistake Banks help learners review, reflect, and <em>improve</em>.</h2>
          <p className="s-center">Mistake Banks collect questions learners struggle with, so they can revisit weak areas, build confidence, and reinforce learning over time.</p>
          <div className="tl" ref={tlRef}>
            <i className="rail" aria-hidden="true" />
            {[
              ["Review", "01", "Review highlights where you need more practice so you can focus on weak areas, track progress, identify gaps, and build confidence as tricky concepts become clearer.", "/home/review.png", false],
              ["Reflect", "02", "Reflection helps you understand why mistakes happened, learn from feedback, clarify confusing concepts with explanations and examples, and retake with confidence once the mistake is clear.", "/home/reflect.png", true],
              ["Improve", "03", "Improvement turns mistakes into lasting gains by focusing on weak spots, building recall through spaced practice, keeping you on track, and celebrating progress as weak areas become strengths.", "/home/improve.png", false],
            ].map(([t, n, p, img, flip]) => (
              <div key={t} className={`tl-row ${flip ? "flip" : ""}`}>
                <div className="scr"><img src={img} alt={`${t}: a screen from the Mistake Bank`} width="528" height="440" loading="lazy" /></div>
                <div className="node"><b>{n}</b></div>
                <div className="txt"><h3>{t}</h3><p>{p}</p></div>
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
