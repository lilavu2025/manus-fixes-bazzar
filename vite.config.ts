import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// تحديد مجلد الإخراج بناءً على العميل
const client = process.env.VITE_CLIENT_KEY || null;
const outDir = client ? `dist-clients/${client}` : "dist";

export default defineConfig(({ mode }) => ({
  define: {
    global: "globalThis",
  },
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    viteCompression({ algorithm: "gzip", ext: ".gz" }),
    visualizer({
      open: false,
      filename: `${outDir}/bundle-stats.html`,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    target: "esnext",
    minify: "terser",
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production",
        pure_funcs:
          mode === "production"
            ? ["console.log", "console.info", "console.warn", "console.error"]
            : [],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        // manualChunks: ... (اختياري لاحقًا)
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "react-hook-form",
      "lucide-react",
      "date-fns",
      "recharts",
      "react-intersection-observer",
      "react-helmet-async",
      "yup",
      "clsx",
      "tailwind-merge",
      "@supabase/supabase-js",
    ],
  },
}));
