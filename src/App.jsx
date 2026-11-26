import { useEffect } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Footer, TopNav } from "./components/ui.jsx";
import { Forgot, Login, ResetPassword } from "./pages/Auth.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Today from "./pages/Today.jsx";
import Practice from "./pages/Practice.jsx";
import Quiz from "./pages/Quiz.jsx";
import Result from "./pages/Result.jsx";
import Review from "./pages/Review.jsx";
import Mistakes from "./pages/Mistakes.jsx";
import Progress from "./pages/Progress.jsx";
import Ask from "./pages/Ask.jsx";
import Notifications from "./pages/Notifications.jsx";
import Legal from "./pages/Legal.jsx";
import Support from "./pages/Support.jsx";
import Profile from "./pages/Profile.jsx";
import Plans from "./pages/Plans.jsx";
import Referrals from "./pages/Referrals.jsx";

function Protected() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="auth-bg">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "student" && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return (
    <div className="app-bg">
      <TopNav />
      <main style={{ flex: 1 }}><Outlet /></main>
      {pathname !== "/ask" && <Footer />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1>Page not found</h1>
        <p className="sub">The page you're looking for doesn't exist or was moved.</p>
        <Link className="btn block" to="/">Back to Today</Link>
      </div>
    </div>
  );
}

// Each page sets its own browser-tab title (the legal pages set theirs in Legal.jsx)
const TITLES = { "/": "Today", "/practice": "Practice", "/mistakes": "Mistake Bank", "/progress": "Progress", "/ask": "Ask AI", "/notifications": "Notifications", "/support": "Help & Support", "/profile": "Profile", "/plans": "Plans", "/referrals": "Referrals", "/login": "Sign in", "/onboarding": "Set up your profile", "/forgot-password": "Forgot password", "/reset-password": "Reset password" };
function useTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith("/legal")) return;
    const t = TITLES[pathname] || (pathname.startsWith("/quiz/") ? "Quiz" : pathname.startsWith("/result/") ? "Stage result" : pathname.startsWith("/review/") ? "Review answers" : "Page not found");
    document.title = `${t} · Mastishq.ai`;
  }, [pathname]);
}

export default function App() {
  useTitle();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/legal" element={<Navigate to="/legal/about" replace />} />
      <Route path="/legal/:slug" element={<Legal />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Today />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/quiz/:attemptId" element={<Quiz />} />
        <Route path="/result/:attemptId" element={<Result />} />
        <Route path="/review/:attemptId" element={<Review />} />
        <Route path="/mistakes" element={<Mistakes />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/support" element={<Support />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/referrals" element={<Referrals />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
