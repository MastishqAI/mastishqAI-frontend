import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // lets Google's sign-in popup talk back to the page without the "Cross-Origin-Opener-Policy" console error
    headers: { "Cross-Origin-Opener-Policy": "same-origin-allow-popups" },
    port: 5173,
    proxy: { "/api": "http://localhost:4000" },
  },
});
