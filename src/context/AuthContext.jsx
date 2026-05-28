import { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

// ============================================================
// SECURITY: Flat 301 is ALWAYS the Super Admin.
// This is enforced at CODE level — cannot be changed from DB.
// Even if the society secretary changes in the future,
// Flat 301 will always retain Super Admin privileges.
// ============================================================
const SUPERADMIN_FLAT = '301';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('ska_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Re-enforce superadmin on session restore
        if (parsed.flatNo === SUPERADMIN_FLAT) parsed.role = 'superadmin';
        setUser(parsed);
      } catch {
        sessionStorage.removeItem('ska_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (flatNo, password) => {
    const trimmedFlat = flatNo.trim();
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('flat_no, password_hash, role')
        .eq('flat_no', trimmedFlat)
        .single();

      if (error || !data) return { success: false, error: 'Flat number not registered in the system.' };

      const isMatch = await bcrypt.compare(password, data.password_hash);
      if (!isMatch) return { success: false, error: 'Incorrect password. Please try again.' };

      const { data: owner } = await supabase
        .from('owners')
        .select('owner_name, photo_url')
        .eq('flat_no', trimmedFlat)
        .single();

      // ALWAYS assign superadmin to flat 301 — regardless of DB value
      const role = trimmedFlat === SUPERADMIN_FLAT ? 'superadmin' : 'resident';

      const userData = {
        flatNo: data.flat_no,
        role,
        ownerName: owner?.owner_name || `Flat ${trimmedFlat}`,
        photoUrl: owner?.photo_url || null,
      };

      setUser(userData);
      sessionStorage.setItem('ska_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Connection error. Please check your internet and try again.' };
    }
  };

  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      sessionStorage.setItem('ska_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('ska_user');
  };

  // Superadmin check — also enforced at code level
  const isSuperAdmin = () => user?.flatNo === SUPERADMIN_FLAT || user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isSuperAdmin, SUPERADMIN_FLAT }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
