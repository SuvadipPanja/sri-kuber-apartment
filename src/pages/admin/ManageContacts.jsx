import { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { generateId, getInitials } from '../../utils/formatters';
import { uploadContactPhoto, deleteContactPhoto } from '../../utils/uploadContactPhoto';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';

const CATEGORIES = [
  'Plumber', 'Electrician', 'Carpenter', 'Security Guard',
  'Lift Maintenance', 'Pest Control', 'Cleaner / Sweeper',
  'Water Supply', 'Generator', 'Fire Safety', 'Internet / Cable', 'Other',
];

const EMPTY = {
  name: '', phone: '', category: 'Plumber',
  available: '24/7', notes: '', active: true,
};

export default function ManageContacts() {
  const { addToast } = useToast();
  const { data: contacts, loading, refetch } = useSupabaseTable('contacts', q =>
    q.order('category').order('name')
  );

  const [showModal, setShowModal]     = useState(false);
  const [editId,    setEditId]        = useState(null);
  const [form,      setForm]          = useState({ ...EMPTY });
  const [saving,    setSaving]        = useState(false);
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const fileRef = useRef(null);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY });
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhoto(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name, phone: c.phone, category: c.category,
      available: c.available || '24/7', notes: c.notes || '', active: c.active,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhoto(c.photo_url || null);
    setShowModal(true);
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('Name and Phone are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const id = editId || generateId('CON');

      /* Upload photo if new file chosen */
      let photoUrl = existingPhoto;
      if (photoFile) {
        photoUrl = await uploadContactPhoto(photoFile, id);
      }

      const payload = {
        name:      form.name.trim(),
        phone:     form.phone.trim(),
        category:  form.category,
        available: form.available.trim() || '24/7',
        notes:     form.notes.trim() || null,
        active:    form.active,
        photo_url: photoUrl || null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editId) {
        ({ error } = await supabase.from('contacts').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('contacts').insert([{ id, ...payload, created_at: new Date().toISOString() }]));
      }
      if (error) throw error;

      addToast(editId ? 'Contact updated!' : 'Contact added!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      if (c.photo_url) await deleteContactPhoto(c.photo_url);
      const { error } = await supabase.from('contacts').delete().eq('id', c.id);
      if (error) throw error;
      addToast('Contact deleted.', 'success');
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    }
  };

  const toggleActive = async (c) => {
    const { error } = await supabase.from('contacts').update({ active: !c.active }).eq('id', c.id);
    if (error) addToast('Error: ' + error.message, 'error');
    else refetch();
  };

  /* Group by category for display */
  const grouped = contacts.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  return (
    <PageShell
      icon="headphone"
      title="Manage Contacts"
      subtitle="Add, edit or remove important building contacts"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={16}/> Add Contact
        </button>
      }
    >
      {/* Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top"><div className="kpi-label">Total</div><div className="kpi-icon"><Icon name="contactBook" size={18}/></div></div>
          <div className="kpi-value">{contacts.length}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">All contacts</span></div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-top"><div className="kpi-label">Active</div><div className="kpi-icon"><Icon name="check" size={18}/></div></div>
          <div className="kpi-value">{contacts.filter(c => c.active).length}</div>
          <div className="kpi-meta"><span className="kpi-trend up">Visible to residents</span></div>
        </div>
        <div className="kpi-card kpi-red">
          <div className="kpi-top"><div className="kpi-label">Inactive</div><div className="kpi-icon"><Icon name="x" size={18}/></div></div>
          <div className="kpi-value">{contacts.filter(c => !c.active).length}</div>
          <div className="kpi-meta"><span className="kpi-trend down">Hidden</span></div>
        </div>
      </div>

      {/* Contact list grouped by category */}
      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner lg"/></div>
      ) : contacts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Icon name="headphone" size={48} className="empty-state-icon"/>
            <h3>No Contacts Yet</h3>
            <p>Click "Add Contact" to add your first building contact.</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <div className="card" key={cat} style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <span className="card-title"><Icon name="wrench" size={15}/> {cat}</span>
              <span className="badge badge-accent">{list.length}</span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Photo</th><th>Name</th><th>Phone</th>
                    <th>Available</th><th>Notes</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c.id} style={!c.active ? { opacity: 0.5 } : {}}>
                      <td>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {c.photo_url
                            ? <img src={c.photo_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                            : getInitials(c.name)
                          }
                        </div>
                      </td>
                      <td><strong>{c.name}</strong></td>
                      <td>
                        <a href={`tel:${c.phone}`} style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {c.phone}
                        </a>
                      </td>
                      <td><span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{c.available || '—'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 180 }}>{c.notes || '—'}</td>
                      <td>
                        <button
                          className={`badge ${c.active ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer', border: 'none', fontSize: '0.7rem' }}
                          onClick={() => toggleActive(c)}
                          title="Toggle visibility"
                        >
                          {c.active ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => openEdit(c)} title="Edit"><Icon name="edit" size={15}/></button>
                          <button className="btn-icon" onClick={() => handleDelete(c)} title="Delete" style={{ color: 'var(--danger)' }}><Icon name="trash" size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Icon name={editId ? 'edit' : 'plus'} size={16}/>
                {editId ? ' Edit Contact' : ' Add Contact'}
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><Icon name="x" size={16}/></button>
            </div>

            {/* Photo upload */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  border: '3px solid var(--border)',
                  overflow: 'hidden', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text-muted)',
                  fontSize: '1.5rem', fontWeight: 700
                }}>
                  {photoPreview || existingPhoto
                    ? <img src={photoPreview || existingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : (form.name ? getInitials(form.name) : <Icon name="camera" size={24}/>)
                  }
                </div>
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  background: 'var(--primary)', borderRadius: '50%',
                  width: 26, height: 26, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white',
                }}>
                  <Icon name="camera" size={13}/>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto}/>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: '1.25rem' }}>
              Click to upload photo (JPG/PNG, max 3 MB)
            </p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Rajesh Kumar"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input type="tel" className="form-input" placeholder="e.g. 9876543210"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Available Hours</label>
                <input type="text" className="form-input" placeholder="e.g. 24/7  or  Mon–Sat 9am–6pm"
                  value={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.value }))}/>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Remarks</label>
              <input type="text" className="form-input" placeholder="Any extra info about this contact…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Show to residents</label>
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}/>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {form.active ? 'Visible in Important Contacts' : 'Hidden from residents'}
              </span>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }}/> Saving…</> : <><Icon name="check" size={15}/> Save Contact</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
