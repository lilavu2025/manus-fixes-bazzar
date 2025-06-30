import config from "@/configs/activeConfig"; // غيره حسب اسمك الفعلي

export function applyThemeColors() {
  const root = document.documentElement;
  const { primaryColor, secondaryColor, fontFamily } = config.visual;

  // إعداد اللون الأساسي
  if (primaryColor) {
    root.style.setProperty("--primary", hexToHsl(primaryColor));
    root.style.setProperty("--primary-foreground", "0 0% 100%"); // أبيض دائمًا
  }

  // إعداد اللون الثانوي
  if (secondaryColor) {
    root.style.setProperty("--secondary", hexToHsl(secondaryColor));
    root.style.setProperty("--secondary-foreground", "0 0% 0%"); // أسود، فرضًا
  }

  // إعداد الخط
  if (fontFamily) {
    root.style.setProperty("--font-family", fontFamily);
  }
}

// دالة تحويل HEX إلى HSL
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}
