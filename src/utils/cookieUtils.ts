// Cookie utility functions
export function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; samesite=lax`;
  if (maxAgeSeconds) cookie += `; max-age=${maxAgeSeconds}`;
  if (window.location.protocol === 'https:') cookie += '; secure';
  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + encodeURIComponent(name) + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0`;
}
