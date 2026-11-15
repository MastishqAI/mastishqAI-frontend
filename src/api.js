import axios from "axios";

// The access token lives ONLY in memory (never localStorage), so injected scripts can't steal it.
// Staying logged in across reloads is done by the httpOnly refresh cookie (see refreshSession).
let accessToken = null;
let timer = null;
let inflight = null;
const listeners = new Set();

const api = axios.create({ baseURL: "/api", withCredentials: true });
const raw = axios.create({ baseURL: "/api", withCredentials: true }); // no interceptors (used for refresh)

export const getToken = () => accessToken;
export const onSession = (fn) => (listeners.add(fn), () => listeners.delete(fn));

function expiryOf(token) {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp * 1000; } catch { return 0; }
}

export function setToken(token) {
  accessToken = token || null;
  clearTimeout(timer);
  if (token) {
    // refresh a minute before expiry so requests never hit a 401
    const wait = Math.max(5000, expiryOf(token) - Date.now() - 60000);
    timer = setTimeout(() => refreshSession().catch(() => {}), wait);
  }
}

// One shared in-flight request, so React StrictMode / parallel calls can't double-rotate the cookie.
export function refreshSession() {
  if (!inflight) {
    inflight = raw.post("/auth/refresh")
      .then((r) => {
        const d = r.data;
        if (d.authenticated) { setToken(d.token); listeners.forEach((fn) => fn(d.user)); return d; }
        setToken(null);
        return null;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r.data,
  async (err) => {
    const cfg = err.config;
    if (err.response?.status === 401 && cfg && !cfg._retried) {
      cfg._retried = true;
      const s = await refreshSession().catch(() => null);
      if (s) { cfg.headers.Authorization = `Bearer ${accessToken}`; return api(cfg); }
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(new Error(err.response?.data?.message || err.message));
  }
);

export default api;
