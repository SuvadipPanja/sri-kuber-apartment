import { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { getInitials } from '../../utils/formatters';
import { uploadProfilePhoto } from '../../utils/uploadPhoto';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';

const EMPTY = { flatNo: '', ownerName: '', phone: '', email: '', monthlyCharge: 500, active: true, notes: '', photoUrl: '' };

export default function ManageOwners() {
  const { addToast } = useToast();
  const { data: owners, loading, refetch } = useSupabaseTable('owners', q => q.order('flat_no'));
  const [showModal, setShowModal] = useState(false);
  const [editFlat, setEditFlat] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const openEdit = (o) => {
    setEditFlat(o.flat_no);
    setForm({ flatNo: o.flat_no, ownerName: o.owner_name, phone: o.phone || '', email: o.email || '', monthlyCharge: o.monthly_charge, active: o.active, notes: o.notes || '', photoUrl: o.photo_url || '' });
    setPreview(null);
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast('Image must be under 2 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadProfilePhoto(file, editFlat);
    setUploading(false);
    if (result.error) {
      addToast(result.error, 'error');
    } else {
      setForm(f => ({ ...f, photoUrl: result.url }));
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      addToast('Photo uploaded!', 'success');
    }
  };

  const handleSave = async () => {
    if (!form.ownerName) { addToast('Owner name is required.', 'error'); return; }
    setSaving(true);
    try {
      const payload = { owner_name: form.ownerName, phone: form.phone, email: form.email, monthly_charge: Number(form.monthlyCharge), active: form.active, notes: form.notes, photo_url: form.photoUrl, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('owners').update(payload).eq('flat_no', editFlat);
      if (error) throw error;
      addToast('Owner details updated!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      icon="home"
      title="Manage Owners"
      subtitle="Edit flat owner details, contact info, and status"
    >
      {loading ? <div className="flex-center" style={{ height: '40vh' }}><div className="spinner lg" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {owners.map(o => (
            <div key={o.flat_no} className="card" style={{ opacity: o.active ? 1 : 0.6 }}>
              <div className="flex gap-2 items-start mb-2">
                {o.photo_url ? (
                  <img src={o.photo_url} alt={o.owner_name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1rem', flexShrink: 0 }}>
                    {getInitials(o.owner_name)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-bold text-white truncate">{o.owner_name}</div>
                  <div className="flex gap-1 flex-wrap">
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Flat {o.flat_no}</span>
                    <span className={`badge ${o.active ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '0.65rem' }}>{o.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => openEdit(o)} title="Edit"><Icon name="edit" size={14} /></button>
              </div>
              <div className="text-sm text-secondary-c">
                {o.phone && <div className="flex items-center gap-1"><Icon name="phone" size={12} /> {o.phone}</div>}
                {o.email && <div className="flex items-center gap-1"><Icon name="mail" size={12} /> {o.email}</div>}
                {!o.phone && !o.email && <div className="text-muted-c">No contact info</div>}
                {o.notes && <div className="text-accent-c mt-1 text-xs"><Icon name="info" size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {o.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><Icon name="edit" size={18} /> Edit Flat {form.flatNo} — Owner Details</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><Icon name="x" size={16} /></button>
            </div>

            <div className="modal-body">
              {/* Photo Upload */}
              <div className="flex gap-2 items-center mb-3" style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-lg)' }}>
                {(preview || form.photoUrl) ? (
                  <img src={preview || form.photoUrl} alt="Owner" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} onError={e => { e.target.style.display='none'; }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1.2rem', flexShrink: 0 }}>
                    {getInitials(form.ownerName)}
                  </div>
                )}
                <div className="flex-1">
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    <Icon name="upload" size={14} /> Choose Photo
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
                  </label>
                  {preview && (
                    <button className="btn btn-primary btn-sm ml-2" onClick={handlePhotoUpload} disabled={uploading}>
                      {uploading ? <><span className="spinner sm" /> Uploading...</> : <><Icon name="check" size={14} /> Upload</>}
                    </button>
                  )}
                  <p className="text-xs text-muted-c mt-1">JPG, PNG, WebP • Max 2MB</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owner Name <span className="required">*</span></label>
                <input type="text" className="form-input" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} id="owner-name-input" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} id="owner-phone-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} id="owner-email-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Monthly Charge (₹)</label>
                  <input type="number" className="form-input" value={form.monthlyCharge} onChange={e => setForm(f => ({ ...f, monthlyCharge: e.target.value }))} id="owner-charge-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))} id="owner-status-select">
                    <option value="true">Active</option>
                    <option value="false">Inactive / Vacant</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input type="text" className="form-input" placeholder="e.g. Secretary, Owner Abroad, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} id="owner-notes-input" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-owner-btn">
                {saving ? <><span className="spinner sm" /> Saving...</> : <><Icon name="check" size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
