/**
 * Client-side security helpers (defense in depth — RLS remains authoritative on Supabase).
 */

const FLAT_PATTERN = /^[0-9]{1,4}[A-Za-z]?$/;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const STORAGE_KEY = 'ska_login_lock';

export function sanitizeFlatNo(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, '').slice(0, 8);
}

export function isValidFlatNo(flatNo) {
  return FLAT_PATTERN.test(flatNo);
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 4 && password.length <= 128;
}

export function getLoginLockout() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() >= data.until) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function recordFailedLogin() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : { count: 0, until: 0 };
    const count = (prev.count || 0) + 1;
    if (count >= MAX_LOGIN_ATTEMPTS) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count, until: Date.now() + LOCKOUT_MS })
      );
      return { locked: true, remainingMs: LOCKOUT_MS };
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count, until: 0 }));
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - count };
  } catch {
    return { locked: false };
  }
}

export function clearLoginLockout() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function formatLockoutMessage(remainingMs) {
  const mins = Math.ceil(remainingMs / 60000);
  return `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
}
