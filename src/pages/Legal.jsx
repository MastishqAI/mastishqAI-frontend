import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Footer } from "../components/ui.jsx";
import { LAST_UPDATED, ORDER, PAGES } from "../legalContent.js";

// Public documentation pages (About, Usage Policy, Privacy Policy, Terms of Service) — no login needed
export default function Legal() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const page = PAGES[slug];
  useEffect(() => { window.scrollTo(0, 0); document.title = page ? `${page.title} · Mastishq.ai` : "Mastishq.ai"; }, [slug]);
  if (!page) return <Navigate to="/legal/about" replace />;

  return (
    <div className="legal">
      <header className="legal-nav">
        <Link to={user ? "/" : "/login"} className="wm">Mastishq.ai</Link>
        <nav>
          {ORDER.map(([k, label]) => <Link key={k} to={`/legal/${k}`} className={k === slug ? "on" : ""}>{label}</Link>)}
        </nav>
        <button className="btn" onClick={() => nav(user ? "/" : "/login")}>{user ? "Back to app" : "Start learning"}</button>
      </header>

      <section className="legal-hero">
        <div className="wrap">
          <span className="doc-pill">OFFICIAL DOCUMENTATION</span>
          <h1>{page.title}</h1>
          <p className="lead">{page.lead}</p>
          {(slug === "privacy" || slug === "terms" || slug === "usage") && <p className="stamp">Last updated {LAST_UPDATED} · Draft pending legal review</p>}
        </div>
      </section>

      <section className="legal-body">
        <div className="wrap">
          {page.sections.map((s) => (
            <div key={s.h} className="lsec">
              <h2>{s.h}</h2>
              {s.p?.map((t, i) => <p key={i}>{t}</p>)}
              {s.ul && <ul>{s.ul.map((t, i) => <li key={i}>{t}</li>)}</ul>}
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
