import { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../services/supabase';
import { sanitizeFlatNo } from '../utils/security';
import { startUserSession, endUserSession } from '../services/activityLog';

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
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(userData) {
  const payload = { ...userData, loginAt: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const stored = readSession();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (stored.flatNo === SUPERADMIN_FLAT) stored.role = 'superadmin';

      try {
        const { data: owner } = await supabase
          .from('owners')
          .select('photo_url')
          .eq('flat_no', stored.flatNo)
          .maybeSingle();

        if (owner?.photo_url) stored.photoUrl = owner.photo_url;
      } catch {
        /* keep cached session */
      }

      if (!cancelled) {
        let activitySessionId = stored.activitySessionId;
        if (!activitySessionId) {
          const started = await startUserSession({
            flatNo: stored.flatNo,
            ownerName: stored.ownerName,
            role: stored.role,
          });
          activitySessionId = started.sessionId;
        }
        const payload = writeSession({ ...stored, activitySessionId });
        setUser(payload);
        setLoading(false);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

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

      const started = await startUserSession({
        flatNo: String(data.flat_no),
        ownerName: owner?.owner_name || `Flat ${trimmedFlat}`,
        role,
      });

      const userData = writeSession({
        flatNo: data.flat_no,
        role,
        ownerName: owner?.owner_name || `Flat ${trimmedFlat}`,
        photoUrl: owner?.photo_url || null,
        activitySessionId: started.sessionId,
      });

      setUser(userData);
      return {
        success: true,
        activityLogOk: started.ok,
        activityLogError: started.error || null,
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

  const logout = () => {
    if (user?.activitySessionId) {
      endUserSession(user.activitySessionId, user).catch(() => {});
    }
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const isSuperAdmin = () =>
    user?.flatNo === SUPERADMIN_FLAT || user?.role === 'superadmin';

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
