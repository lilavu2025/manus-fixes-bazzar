// src/utils/textCompression.ts
// دوال ضغط وفك ضغط النصوص (gzip + base64)
import pako from 'pako';

export function compressText(text: string): string {
  if (!text) return '';
  try {
    const compressed = pako.gzip(text);
    return btoa(String.fromCharCode(...new Uint8Array(compressed)));
  } catch {
    return text;
  }
}

export function decompressText(compressed: string): string {
  if (!compressed) return '';
  try {
    const binaryString = atob(compressed);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return pako.ungzip(bytes, { to: 'string' });
  } catch {
    return compressed;
  }
}
