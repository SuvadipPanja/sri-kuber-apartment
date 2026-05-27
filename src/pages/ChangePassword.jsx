import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';

export default function ChangePassword() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleShow = key => setShow(s => ({ ...s, [key]: !s[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPass.length < 4) { addToast('New password must be at least 4 characters.', 'error'); return; }
    if (form.newPass !== form.confirm) { addToast('New passwords do not match.', 'error'); return; }

    setLoading(true);
    try {
      // Verify current password
      const { data: auth } = await supabase.from('auth_users').select('password_hash').eq('flat_no', user.flatNo).single();
      const isMatch = await bcrypt.compare(form.current, auth.password_hash);
      if (!isMatch) { addToast('Current password is incorrect.', 'error'); setLoading(false); return; }

      // Hash new password
      const newHash = await bcrypt.hash(form.newPass, 10);
      const { error } = await supabase.from('auth_users').update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq('flat_no', user.flatNo);
      if (error) throw error;

      addToast('Password changed successfully! Please login again.', 'success');
      setForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🔑 Change Password</h1>
          <p className="page-subtitle">Update your login password — Flat {user?.flatNo}</p>
        </div>
      </div>

      <div style={{ maxWidth: 500 }}>
        <div className="card">
          <form onSubmit={handleSubmit} id="change-password-form">
            {[
              { key: 'current', label: 'Current Password', placeholder: 'Enter your current password' },
              { key: 'newPass', label: 'New Password', placeholder: 'Minimum 4 characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
            ].map(({ key, label, placeholder }) => (
              <div className="form-group" key={key}>
                <label className="form-label" htmlFor={`pwd-${key}`}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id={`pwd-${key}`}
                    type={show[key] ? 'text' : 'password'}
                    className="form-input"
                    name={key}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: '3rem' }}
                  />
                  <button type="button" className="btn-icon" onClick={() => toggleShow(key)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none' }}>
                    {show[key] ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="change-pwd-btn">
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Updating...</> : '🔑 Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
