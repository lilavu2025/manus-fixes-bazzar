import config from "@/configs/activeConfig";

// تحميل فلتر Console في جميع البيئات
import("@/utils/devConsoleFilter");

// تحميل الحماية في بيئة الإنتاج فقط
if (import.meta.env.PROD) {
  import("@/utils/productionSecurity");
}

const faviconPath = config.visual?.logo || "/favicon.ico";
const faviconElement = document.getElementById("dynamic-favicon") as HTMLLinkElement;
if (faviconElement) {
  faviconElement.href = faviconPath;
}

// Polyfill for crypto.randomUUID if not available
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  // @ts-expect-error: ignore template literal type mismatch
  crypto.randomUUID = function () {
    // Simple polyfill using Math.random and Date.now (not cryptographically secure)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyThemeColors } from "@/lib/applyThemeColors";
applyThemeColors();

createRoot(document.getElementById("root")!).render(<App />);
