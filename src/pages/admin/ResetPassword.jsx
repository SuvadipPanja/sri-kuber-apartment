import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../services/supabase';
import { useSupabaseTable } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';

export default function ResetPassword() {
  const { addToast } = useToast();
  const { data: owners } = useSupabaseTable('owners', q => q.order('flat_no'));
  const [selectedFlat, setSelectedFlat] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!selectedFlat) { addToast('Please select a flat.', 'error'); return; }
    if (newPass.length < 4) { addToast('Password must be at least 4 characters.', 'error'); return; }
    if (newPass !== confirmPass) { addToast('Passwords do not match.', 'error'); return; }

    setSaving(true);
    try {
      const hash = await bcrypt.hash(newPass, 10);
      const { error } = await supabase.from('auth_users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('flat_no', selectedFlat);
      if (error) throw error;
      addToast(`Password for Flat ${selectedFlat} has been reset successfully!`, 'success');
      setSelectedFlat('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!selectedFlat) { addToast('Please select a flat first.', 'error'); return; }
    if (!confirm(`Reset Flat ${selectedFlat}'s password to the flat number (${selectedFlat})?`)) return;
    setSaving(true);
    try {
      const hash = await bcrypt.hash(selectedFlat, 10);
      const { error } = await supabase.from('auth_users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('flat_no', selectedFlat);
      if (error) throw error;
      addToast(`Flat ${selectedFlat} password reset to default (${selectedFlat}).`, 'success');
      setSelectedFlat('');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const owner = owners.find(o => o.flat_no === selectedFlat);

  return (
    <div>
      <div className="page-header">
        <div><h1>🔐 Reset Password</h1><p className="page-subtitle">Reset password for any flat owner</p></div>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚠️ This will immediately change the flat owner's login password. The owner will need to use the new password on their next login.
        </div>

        <div className="card">
          <form onSubmit={handleReset} id="reset-password-form">
            <div className="form-group">
              <label className="form-label">Select Flat *</label>
              <select className="form-select" value={selectedFlat} onChange={e => setSelectedFlat(e.target.value)} id="reset-flat-select">
                <option value="">— Select Flat Number —</option>
                {owners.map(o => <option key={o.flat_no} value={o.flat_no}>Flat {o.flat_no} — {o.owner_name}</option>)}
              </select>
            </div>

            {owner && (
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                Selected: <strong>Flat {owner.flat_no} — {owner.owner_name}</strong>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input id="reset-new-pass" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Minimum 4 characters" value={newPass} onChange={e => setNewPass(e.target.value)} required style={{ paddingRight: '3rem' }} />
                <button type="button" className="btn-icon" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input id="reset-confirm-pass" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Re-enter new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving} id="reset-save-btn">
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Resetting...</> : '🔐 Reset Password'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleResetToDefault} disabled={saving} id="reset-default-btn" title="Reset to flat number as password">
                ↩️ Reset to Default
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>💡 Quick Tips</h3>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 2, paddingLeft: '1.25rem' }}>
            <li>Default password for any flat is the flat number (e.g., Flat 102 → password is <code>102</code>)</li>
            <li>Use "Reset to Default" to restore the flat number as password</li>
            <li>Advise owners to change their password after first login</li>
            <li>Passwords are stored securely using bcrypt hashing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
