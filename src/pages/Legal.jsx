import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Avatar, Footer, Logo } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { LAST_UPDATED, ORDER, PAGES } from "../legalContent.js";

// Public documentation pages (About, Usage Policy, Privacy Policy, Terms of Service) — no login needed
export default function Legal() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const page = PAGES[slug];
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const initials = (user?.name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  useEffect(() => { window.scrollTo(0, 0); document.title = page ? `${page.title} · Mastishq.ai` : "Mastishq.ai"; }, [slug]);
  if (!page) return <Navigate to="/legal/about" replace />;

  return (
    <div className="legal">
      <header className="legal-nav">
        <Logo size={32} text={26} to={user ? "/" : "/login"} />
        <nav>
          {ORDER.map(([k, label]) => <Link key={k} to={`/legal/${k}`} className={k === slug ? "on" : ""}>{label}</Link>)}
        </nav>
        {user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button className="menu-wrap" onClick={() => setMenu(!menu)} aria-label="Account menu" aria-expanded={menu}>
              <Avatar user={user} size={44} />
              <Icon.chevDown size={18} style={{ color: "#6B7280" }} />
            </button>
            {menu && (
              <div className="menu">
                <div className="who">{user.email}</div>
                <Link to="/" onClick={() => setMenu(false)}>Back to app</Link>
                <Link to="/profile" onClick={() => setMenu(false)}>Profile</Link>
              </div>
            )}
          </div>
        ) : <button className="btn" onClick={() => nav("/login")}>Start learning</button>}
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
