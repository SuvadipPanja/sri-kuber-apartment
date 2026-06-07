import { createContext, useContext, useState, useEffect, useRef } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../services/supabase';
import { sanitizeFlatNo } from '../utils/security';
import {
  startUserSession,
  endUserSession,
  endUserSessionKeepalive,
} from '../services/activityLog';

const AuthContext = createContext(null);

const SUPERADMIN_FLAT = '301';
const SESSION_KEY = 'ska_user';
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.loginAt && Date.now() - parsed.loginAt > SESSION_MAX_AGE_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (parsed.flatNo != null) parsed.flatNo = String(parsed.flatNo);
    if (String(parsed.flatNo) === SUPERADMIN_FLAT) parsed.role = 'superadmin';
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(userData) {
  const payload = {
    ...userData,
    flatNo: userData.flatNo != null ? String(userData.flatNo) : userData.flatNo,
    loginAt: Date.now(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  return payload;
}

/** Refresh activity session id in background — never block UI. */
async function ensureActivitySession(user) {
  let activitySessionId = user.activitySessionId;
  let sessionStillOpen = false;

  if (activitySessionId) {
    try {
      const { data: sess } = await supabase
        .from('user_sessions')
        .select('logout_at')
        .eq('id', activitySessionId)
        .maybeSingle();
      sessionStillOpen = !!sess && !sess.logout_at;
    } catch {
      sessionStillOpen = false;
    }
  }

  if (!activitySessionId || !sessionStillOpen) {
    const started = await startUserSession({
      flatNo: user.flatNo,
      ownerName: user.ownerName,
      role: user.role,
    });
    activitySessionId = started.sessionId;
  }

  return activitySessionId;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const skipPageHideEndRef = useRef(false);
  const authEpochRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const epoch = authEpochRef.current;

    const initAuth = async () => {
      const stored = readSession();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled && epoch === authEpochRef.current) {
        setUser(stored);
        setLoading(false);
      }

      try {
        const { data: owner } = await supabase
          .from('owners')
          .select('photo_url')
          .eq('flat_no', stored.flatNo)
          .maybeSingle();

        const activitySessionId = await ensureActivitySession(stored);

        if (!cancelled && epoch === authEpochRef.current) {
          const payload = writeSession({
            ...stored,
            activitySessionId,
            photoUrl: owner?.photo_url || stored.photoUrl || null,
          });
          setUser(payload);
        }
      } catch (err) {
        console.warn('Session refresh failed', err);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.activitySessionId) return undefined;

    const sessionId = user.activitySessionId;
    const snapshot = {
      flatNo: user.flatNo,
      ownerName: user.ownerName,
    };

    const onPageHide = () => {
      if (skipPageHideEndRef.current) return;
      endUserSessionKeepalive(sessionId);
    };

    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [user?.activitySessionId, user?.flatNo, user?.ownerName]);

  const login = async (flatNo, password) => {
    const trimmedFlat = sanitizeFlatNo(flatNo);
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('flat_no, password_hash, role')
        .eq('flat_no', trimmedFlat)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Flat number not registered in the system.' };
      }

      const isMatch = await bcrypt.compare(password, data.password_hash);
      if (!isMatch) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      const { data: owner } = await supabase
        .from('owners')
        .select('owner_name, photo_url')
        .eq('flat_no', trimmedFlat)
        .maybeSingle();

      const role = trimmedFlat === SUPERADMIN_FLAT ? 'superadmin' : 'resident';
      const flatStr = String(data.flat_no);

      authEpochRef.current += 1;

      const userData = writeSession({
        flatNo: flatStr,
        role,
        ownerName: owner?.owner_name || `Flat ${trimmedFlat}`,
        photoUrl: owner?.photo_url || null,
        activitySessionId: null,
      });

      setUser(userData);
      setLoading(false);

      const loginEpoch = authEpochRef.current;

      startUserSession({
        flatNo: flatStr,
        ownerName: userData.ownerName,
        role,
      }).then((started) => {
        if (loginEpoch !== authEpochRef.current) return;
        const updated = writeSession({
          ...userData,
          activitySessionId: started.sessionId,
        });
        setUser(updated);
        if (!started.ok) {
          console.warn('Activity log failed:', started.error);
        }
      });

      return {
        success: true,
        activityLogOk: true,
        activityLogError: null,
      };
    } catch {
      return {
        success: false,
        error: 'Connection error. Please check your internet and try again.',
      };
    }
  };

  const updateUser = (updates) => {
    if (user) {
      const updatedUser = writeSession({ ...user, ...updates });
      setUser(updatedUser);
    }
  };

  const logout = async () => {
    const sessionId = user?.activitySessionId;
    const snapshot = user
      ? { flatNo: user.flatNo, ownerName: user.ownerName, role: user.role }
      : null;

    authEpochRef.current += 1;
    skipPageHideEndRef.current = true;

    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    setLoading(false);

    if (sessionId && snapshot) {
      await endUserSession(sessionId, snapshot);
    }

    skipPageHideEndRef.current = false;
  };

  const isSuperAdmin = () =>
    String(user?.flatNo) === SUPERADMIN_FLAT || user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, isSuperAdmin, SUPERADMIN_FLAT }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
