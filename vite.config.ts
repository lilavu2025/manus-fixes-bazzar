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
    hmr: {
      overlay: true
    },
    // إزالة allowedHosts المحدد للسماح بمرونة أكبر
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    viteCompression({ 
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    viteCompression({ 
      algorithm: 'gzip',
      ext: '.gz'
    }),
    visualizer({ 
      open: false, 
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
      brotliSize: true
    }),
    // PWA Support - يمكن تفعيلها لاحقاً
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
    //   }
    // })
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
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('radix-ui')) {
              return 'ui-vendor';
            }
            // Charts and data viz
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts-vendor';
            }
            // Supabase and backend
            if (id.includes('supabase') || id.includes('@tanstack')) {
              return 'backend-vendor';
            }
            // Other vendors
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('/admin/')) {
            return 'admin';
          }
          if (id.includes('/pages/')) {
            return 'pages';
          }
          if (id.includes('/components/ui/')) {
            return 'ui';
          }
        },
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
