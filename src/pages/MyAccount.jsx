import { useState, useEffect, useRef } from 'react';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';
import { uploadProfilePhoto } from '../utils/uploadPhoto';
import { getInitials } from '../utils/formatters';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';

export default function MyAccount() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Password state
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.flatNo) return;
      try {
        const { data } = await supabase.from('owners').select('photo_url, owner_name, phone, email').eq('flat_no', user.flatNo).single();
        if (data) {
          setPhotoUrl(data.photo_url || '');
          setOwnerName(data.owner_name || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
        }
      } catch (err) { console.error(err); }
      finally { setFetchingProfile(false); }
    }
    fetchProfile();
  }, [user]);

  // Photo handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Image must be smaller than 2 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { addToast('Please select a photo first.', 'error'); return; }

    setUploading(true);
    const result = await uploadProfilePhoto(file, user.flatNo);
    setUploading(false);

    if (result.error) {
      addToast(result.error, 'error');
    } else {
      setPhotoUrl(result.url);
      setPreview(null);
      updateUser({ photoUrl: result.url });
      if (fileInputRef.current) fileInputRef.current.value = '';
      addToast('Profile photo updated!', 'success');
    }
  };

  // Contact info save
  const handleSaveContact = async () => {
    try {
      const { error } = await supabase.from('owners').update({ phone, email, updated_at: new Date().toISOString() }).eq('flat_no', user.flatNo);
      if (error) throw error;
      addToast('Contact info updated!', 'success');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    }
  };

  // Password handlers
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleShow = key => setShow(s => ({ ...s, [key]: !s[key] }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (form.newPass.length < 4) { addToast('New password must be at least 4 characters.', 'error'); return; }
    if (form.newPass !== form.confirm) { addToast('New passwords do not match.', 'error'); return; }

    setLoadingPwd(true);
    try {
      const { data: auth } = await supabase.from('auth_users').select('password_hash').eq('flat_no', user.flatNo).single();
      const isMatch = await bcrypt.compare(form.current, auth.password_hash);
      if (!isMatch) { addToast('Current password is incorrect.', 'error'); setLoadingPwd(false); return; }

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

  if (fetchingProfile) return <div className="loading-screen"><div className="spinner lg"></div></div>;

  return (
    <PageShell
      icon="user"
      title="My Account"
      subtitle={`Manage your profile, photo and security — Flat ${user?.flatNo}`}
    >
      <div className="grid-2 mb-3">
        {/* Profile Photo Section */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Icon name="camera" size={16} /> Profile Photo</span>
          </div>

          <div className="flex gap-2 items-center mb-3">
            {(preview || photoUrl) ? (
              <img
                src={preview || photoUrl}
                alt="Profile"
                className="rounded-full"
                style={{ width: 96, height: 96, objectFit: 'cover', border: '3px solid var(--border-bright)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div
                className="rounded-full flex-center fw-bold text-xl"
                style={{ width: 96, height: 96, background: 'var(--grad-primary)', color: 'white', border: '3px solid var(--border-bright)' }}
              >
                {getInitials(ownerName)}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-secondary-c mb-1">{ownerName}</p>
              <p className="text-xs text-muted-c">Flat {user?.flatNo} • JPG, PNG, WebP • Max 2MB</p>
            </div>
          </div>

          <div className="flex gap-1">
            <label className="btn btn-ghost flex-1" style={{ cursor: 'pointer' }}>
              <Icon name="upload" size={16} /> Choose Photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
            {preview && (
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? <><span className="spinner sm"></span> Uploading...</> : <><Icon name="check" size={16} /> Save</>}
              </button>
            )}
          </div>

          {uploading && (
            <div className="progress-bar mt-2">
              <div className="progress-fill blue" style={{ width: '60%', animation: 'shimmer 1.5s infinite' }}></div>
            </div>
          )}
        </div>

        {/* Contact Info Section */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Icon name="phone" size={16} /> Contact Info</span>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" placeholder="+91 XXXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary w-full" onClick={handleSaveContact}>
            <Icon name="check" size={16} /> Save Contact Info
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-header">
          <span className="card-title"><Icon name="lock" size={16} /> Change Password</span>
        </div>
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
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none' }}>
                  <Icon name={show[key] ? 'x' : 'eye'} size={16} />
                </button>
              </div>
            </div>
          ))}
          <button type="submit" className="btn btn-danger w-full" disabled={loadingPwd} id="change-pwd-btn">
            {loadingPwd ? <><span className="spinner sm" /> Updating...</> : <><Icon name="key" size={16} /> Update Password</>}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
