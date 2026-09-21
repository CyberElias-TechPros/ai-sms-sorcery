import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// The browser always calls relative `/api/*`:
//  - dev/preview: proxied here to the Cloudflare Worker (local wrangler dev, or a deployed URL)
//  - production (Vercel): same-origin rewrite via vercel.json → VITE_API_URL
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-tabs"],
        },
      },
    },
  },
}));
