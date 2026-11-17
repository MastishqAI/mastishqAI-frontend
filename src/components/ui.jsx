import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useGet } from "../hooks";
import { Icon } from "./icons.jsx";

/* ---------- Logo ---------- */
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 40 42" fill="none">
      <path
        d="M7 2h9.5L20 6l3.5-4H33a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H25l-5 6-5-6H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        fill="#139CED"
      />
      <path d="M13 22c2 3.2 12 3.2 14 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
export function Logo({ size = 28, text = 22, stack = false, to }) {
  const inner = (
    <span className={`logo ${stack ? "stack" : ""}`}>
      <LogoMark size={size} />
      <b style={{ fontSize: text }}>Mastishq.ai</b>
    </span>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function GoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.7-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
  );
}

/* ---------- app shell ---------- */
export function Footer() {
  return (
    <footer className="footer">
      <Logo size={26} text={18} />
      <span>© 2026 Mashtishq.AI · AI-powered learning</span>
      <span className="links"><Link to="/legal/privacy">Privacy</Link><i /><Link to="/legal/terms">Terms</Link><i /><Link to="/support">Support</Link></span>
    </footer>
  );
}

export function TopNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const home = useGet(`/home?r=${encodeURIComponent(pathname)}`); // refetch points when the page changes
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const initials = (user?.name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const d = home.data;
  return (
    <header className="topnav">
      <Logo size={26} text={21} to="/" />
      <nav>
        {[["/", "Today"], ["/practice", "Practice"], ["/mistakes", "Mistakes"], ["/progress", "Progress"], ["/ask", "Ask AI"]].map(([to, l]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{l}</NavLink>
        ))}
      </nav>
      <div className="right">
        <div className="pts-chip"><Icon.bolt size={15} /> Lvl {d?.level ?? 0}<i /><b>{(d?.points ?? 0).toLocaleString()} pts</b></div>
        <div ref={ref} style={{ position: "relative" }}>
          <button className="menu-wrap" onClick={() => setOpen(!open)} aria-label="Account menu">
            <span className="avatar" style={user?.picture ? { backgroundImage: `url(${user.picture})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined}>{initials}</span><Icon.chevDown size={16} style={{ color: "#6B7280" }} />
          </button>
          {open && (
            <div className="menu">
              <div className="who">{user?.email}</div>
              <Link to="/profile" onClick={() => setOpen(false)}>Profile</Link>
              <Link to="/progress" onClick={() => setOpen(false)}>My progress</Link>
              <Link to="/notifications" onClick={() => setOpen(false)}>Notifications</Link>
              <Link to="/support" onClick={() => setOpen(false)}>Help &amp; Support</Link>
              <Link to="/legal/privacy" onClick={() => setOpen(false)}>Privacy Policy</Link>
              <Link to="/legal/terms" onClick={() => setOpen(false)}>Terms of Service</Link>
              <button onClick={async () => { await logout(); nav("/login"); }}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Stepper({ stages, current }) {
  const order = ["easy", "medium", "hard"];
  const label = { easy: "Easy", medium: "Medium", hard: "Hard" };
  return (
    <div className="stepper">
      {order.map((k, i) => {
        const st = stages?.[k]?.status;
        const cls = k === current ? "current" : st === "cleared" ? "cleared" : "";
        return (
          <span key={k} style={{ display: "contents" }}>
            {i > 0 && <span className={`line ${stages?.[order[i - 1]]?.status === "cleared" ? "on" : ""}`} />}
            <span className={`s ${cls}`}>
              <span className="dot">{cls === "cleared" && <Icon.check size={14} />}</span>{label[k]}
            </span>
          </span>
        );
      })}
    </div>
  );
}
