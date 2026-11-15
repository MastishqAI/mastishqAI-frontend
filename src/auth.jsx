import { createContext, useContext, useEffect, useState } from "react";
import api, { onSession, refreshSession, setToken } from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On every page load, restore the session from the httpOnly refresh cookie (if there is one).
  useEffect(() => {
    let live = true;
    refreshSession()
      .then((d) => { if (live) setUser(d ? d.user : null); })
      .catch(() => { if (live) setUser(null); })
      .finally(() => { if (live) setLoading(false); });
    const off = onSession((u) => live && u && setUser(u));
    return () => { live = false; off(); };
  }, []);

  const refresh = async () => {
    const r = await api.get("/auth/me");
    setUser(r.user);
  };
  const finish = (r) => { setToken(r.token); setUser(r.user); return r.user; };
  const login = async (email, password) => finish(await api.post("/auth/login", { email, password }));
  const google = async (credential) => finish(await api.post("/auth/google", { credential }));
  const register = async (body) => finish(await api.post("/auth/register", body));
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, google, register, logout, refresh }}>{children}</Ctx.Provider>;
}
