import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';

export default function MyAccount() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // Password State
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });

  // Photo State
  const [photoUrl, setPhotoUrl] = useState('');
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [fetchingPhoto, setFetchingPhoto] = useState(true);

  useEffect(() => {
    async function fetchPhoto() {
      if (!user?.flatNo) return;
      try {
        const { data } = await supabase.from('owners').select('photo_url').eq('flat_no', user.flatNo).single();
        if (data && data.photo_url) {
          setPhotoUrl(data.photo_url);
        }
      } catch (err) {
        console.error('Error fetching photo', err);
      } finally {
        setFetchingPhoto(false);
      }
    }
    fetchPhoto();
  }, [user]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleShow = key => setShow(s => ({ ...s, [key]: !s[key] }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (form.newPass.length < 4) { addToast('New password must be at least 4 characters.', 'error'); return; }
    if (form.newPass !== form.confirm) { addToast('New passwords do not match.', 'error'); return; }

    setLoadingPwd(true);
    try {
      // Verify current password
      const { data: auth } = await supabase.from('auth_users').select('password_hash').eq('flat_no', user.flatNo).single();
      const isMatch = await bcrypt.compare(form.current, auth.password_hash);
      if (!isMatch) { addToast('Current password is incorrect.', 'error'); setLoadingPwd(false); return; }

      // Hash new password
      const newHash = await bcrypt.hash(form.newPass, 10);
      const { error } = await supabase.from('auth_users').update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq('flat_no', user.flatNo);
      if (error) throw error;

      addToast('Password changed successfully!', 'success');
      setForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setLoadingPwd(false);
    }
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    setLoadingPhoto(true);
    try {
      const { error } = await supabase.from('owners').update({ photo_url: photoUrl }).eq('flat_no', user.flatNo);
      if (error) throw error;
      addToast('Profile picture updated!', 'success');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setLoadingPhoto(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👤 My Account</h1>
          <p className="page-subtitle">Manage your profile and security — Flat {user?.flatNo}</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile Picture Section */}
        <div className="card h-full">
          <h3 className="text-base mb-2">📸 Profile Picture</h3>
          <p className="text-sm text-muted-c mb-3">Add a photo URL to show in the Flat Directory.</p>
          
          {fetchingPhoto ? <div className="spinner mb-2"></div> : (
            <div className="flex gap-2 items-start mb-3">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="Profile Preview" 
                  className="rounded-full shadow-md"
                  style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid var(--border-bright)' }}
                  onError={(e) => { e.target.style.display = 'none'; addToast('Invalid image URL preview', 'error'); }}
                />
              ) : (
                <div className="rounded-full bg-elevated flex-center text-xl text-muted-c border-top" style={{ width: 80, height: 80, border: '1px dashed var(--border)' }}>
                  ?
                </div>
              )}
            </div>
          )}

          <form onSubmit={handlePhotoSubmit}>
            <div className="form-group mb-2">
              <label className="form-label" htmlFor="photoUrl">Image URL</label>
              <input
                id="photoUrl"
                type="url"
                className="form-input"
                placeholder="https://example.com/my-photo.jpg"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loadingPhoto || fetchingPhoto}>
              {loadingPhoto ? <><span className="spinner sm"></span> Saving...</> : '💾 Update Photo'}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="card h-full">
          <h3 className="text-base mb-2">🔑 Change Password</h3>
          <form onSubmit={handlePasswordSubmit} id="change-password-form">
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

            <button type="submit" className="btn btn-danger mt-1 w-full" disabled={loadingPwd} id="change-pwd-btn">
              {loadingPwd ? <><span className="spinner sm" style={{ borderTopColor: 'white' }} /> Updating...</> : '🔑 Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
