 import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// الكوكي بيتحمّل حتى ~4KB، فبنقسّم الجلسة الكبيرة على أجزاء
const CHUNK = 3000;
const MAX_AGE = 60 * 60 * 24 * 7; // أسبوع

function isBrowser() {
  return typeof document !== 'undefined';
}

function readCookies(): Record<string, string> {
  if (!isBrowser()) return {};
  const out: Record<string, string> = {};
  document.cookie.split('; ').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i)] = p.slice(i + 1);
  });
  return out;
}

function setCookie(name: string, value: string, maxAge = MAX_AGE) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

const cookieStorage = {
  getItem(key: string): string | null {
    const all = readCookies();
    if (all[key] !== undefined) return decodeURIComponent(all[key]);
    // أجزاء مقسّمة: key.0 و key.1 ...
    let value = '';
    for (let i = 0; all[`${key}.${i}`] !== undefined; i++) value += all[`${key}.${i}`];
    return value ? decodeURIComponent(value) : null;
  },
  setItem(key: string, value: string) {
    if (!isBrowser()) return;
    this.removeItem(key);
    const enc = encodeURIComponent(value);
    if (enc.length <= CHUNK) {
      setCookie(key, enc);
      return;
    }
    for (let i = 0, n = 0; i < enc.length; i += CHUNK, n++) {
      setCookie(`${key}.${n}`, enc.slice(i, i + CHUNK));
    }
  },
  removeItem(key: string) {
    if (!isBrowser()) return;
    const all = readCookies();
    removeCookie(key);
    Object.keys(all).forEach((k) => {
      if (k.startsWith(`${key}.`)) removeCookie(k);
    });
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
  },
});