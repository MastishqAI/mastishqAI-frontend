import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/signup" element={<Onboarding />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
