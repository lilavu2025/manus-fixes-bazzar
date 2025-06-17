import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    global: 'globalThis',
  },
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    allowedHosts: ["8080-iulzih0nq0la09tlfsfr2-f4845436.manusvm.computer"],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    viteCompression({ algorithm: 'brotliCompress' }),
    viteCompression({ algorithm: 'gzip' }),
    visualizer({ open: false, filename: 'dist/bundle-stats.html' }),
    // VitePWA({ ... }) معطل مؤقتاً
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        // manualChunks: (id) => { ... } // تم التعطيل مؤقتًا لحل مشكلة React
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hook-form',
      'lucide-react',
      'date-fns',
      'recharts',
      'react-intersection-observer',
      'react-helmet-async',
      'yup',
      'clsx',
      'tailwind-merge',
      '@supabase/supabase-js'
    ]
  },
}));
