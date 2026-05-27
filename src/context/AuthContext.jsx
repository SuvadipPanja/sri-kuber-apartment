import { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('ska_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { sessionStorage.removeItem('ska_user'); }
    }
    setLoading(false);
  }, []);

  const login = async (flatNo, password) => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('flat_no, password_hash, role')
        .eq('flat_no', flatNo.trim())
        .single();

      if (error || !data) return { success: false, error: 'Flat number not registered.' };

      const isMatch = await bcrypt.compare(password, data.password_hash);
      if (!isMatch) return { success: false, error: 'Incorrect password. Please try again.' };

      // Fetch owner name for display
      const { data: owner } = await supabase
        .from('owners')
        .select('owner_name')
        .eq('flat_no', flatNo.trim())
        .single();

      const userData = {
        flatNo: data.flat_no,
        role: data.role,
        ownerName: owner?.owner_name || `Flat ${flatNo}`,
      };
      setUser(userData);
      sessionStorage.setItem('ska_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('ska_user');
  };

  const isSuperAdmin = () => user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
