import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { getInitials } from '../../utils/formatters';

const EMPTY = { flatNo: '', ownerName: '', phone: '', email: '', monthlyCharge: 500, active: true, notes: '', photoUrl: '' };

export default function ManageOwners() {
  const { addToast } = useToast();
  const { data: owners, loading, refetch } = useSupabaseTable('owners', q => q.order('flat_no'));
  const [showModal, setShowModal] = useState(false);
  const [editFlat, setEditFlat] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const openEdit = (o) => {
    setEditFlat(o.flat_no);
    setForm({ flatNo: o.flat_no, ownerName: o.owner_name, phone: o.phone || '', email: o.email || '', monthlyCharge: o.monthly_charge, active: o.active, notes: o.notes || '', photoUrl: o.photo_url || '' });
    setShowModal(true);
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
    <div>
      <div className="page-header">
        <div><h1>🏡 Manage Owners</h1><p className="page-subtitle">Edit flat owner details, contact info, and status</p></div>
      </div>

      {loading ? <div className="flex-center" style={{ height: '40vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {owners.map(o => (
            <div key={o.flat_no} className="card" style={{ opacity: o.active ? 1 : 0.7 }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                {o.photo_url ? (
                  <img src={o.photo_url} alt={o.owner_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1.1rem', flexShrink: 0 }}>
                    {getInitials(o.owner_name)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.2rem' }}>{o.owner_name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Flat {o.flat_no}</span>
                    <span className={`badge ${o.active ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '0.7rem' }}>{o.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => openEdit(o)} title="Edit">✏️</button>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {o.phone && <div>📞 {o.phone}</div>}
                {o.email && <div>📧 {o.email}</div>}
                {!o.phone && !o.email && <div style={{ color: 'var(--text-muted)' }}>No contact info</div>}
                {o.notes && <div style={{ marginTop: '0.25rem', color: 'var(--accent)' }}>📝 {o.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div className="modal-title">✏️ Edit Flat {form.flatNo} — Owner Details</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Owner Name *</label>
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
                  <option value="true">✅ Active</option>
                  <option value="false">❌ Inactive / Vacant</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo URL</label>
              <input type="url" className="form-input" placeholder="https://... (paste a direct image link)" value={form.photoUrl} onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))} id="owner-photo-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input type="text" className="form-input" placeholder="e.g. Secretary, Owner Abroad, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} id="owner-notes-input" />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-owner-btn">
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
