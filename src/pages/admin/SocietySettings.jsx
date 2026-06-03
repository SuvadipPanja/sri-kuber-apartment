import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useConfig } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { MONTHS, generateId } from '../../utils/formatters';
import { normalizeGallery, galleryToPayload } from '../../utils/societyGallery';
import { uploadSocietyPhoto, deleteSocietyPhoto } from '../../utils/uploadSocietyPhoto';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';

export default function SocietySettings() {
  const { addToast } = useToast();
  const { config, refetch } = useConfig();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cfMonth, setCfMonth] = useState('');
  const [cfYear, setCfYear] = useState(2026);
  const [cfAmount, setCfAmount] = useState(0);
  const [galleryBusy, setGalleryBusy] = useState(null);
  const addPhotoRef = useRef(null);
  const replacePhotoRefs = useRef({});

  useEffect(() => {
    if (config && !form) {
      setForm({
        societyName: config.society_name,
        address: config.address || '',
        city: config.city || '',
        state: config.state || '',
        totalFlats: config.total_flats || 10,
        monthlyCharge: config.monthly_charge || 500,
        currentMonth: config.current_month || 'May',
        currentYear: config.current_year || 2026,
        announcement: config.announcement || '',
        contactEmail: config.contact_email || '',
        contactPhone: config.contact_phone || '',
        gallery: normalizeGallery(config),
        carryForward: config.carry_forward || {},
      });
    }
  }, [config]);

  const persistGallery = async (gallery, toastMsg) => {
    const payload = {
      society_gallery: galleryToPayload(gallery),
      society_photo_url: gallery[0]?.url || '',
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('config').update(payload).eq('id', 1);
    if (error) throw error;
    setForm((f) => ({ ...f, gallery }));
    refetch();
    if (toastMsg) addToast(toastMsg, 'success');
  };

  const handleAddGalleryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    e.target.value = '';

    const id = generateId('GAL');
    setGalleryBusy(id);
    try {
      const url = await uploadSocietyPhoto(file, id);
      const next = [
        ...form.gallery,
        { id, url, caption: 'Society Photo' },
      ];
      await persistGallery(next, 'Photo added to society gallery.');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setGalleryBusy(null);
    }
  };

  const handleReplaceGalleryPhoto = async (photoId, e) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    e.target.value = '';

    setGalleryBusy(photoId);
    try {
      const url = await uploadSocietyPhoto(file, photoId);
      const prev = form.gallery.find((p) => p.id === photoId);
      if (prev?.url) await deleteSocietyPhoto(prev.url);

      const next = form.gallery.map((p) =>
        p.id === photoId ? { ...p, url } : p
      );
      await persistGallery(next, 'Photo updated.');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setGalleryBusy(null);
    }
  };

  const handleDeleteGalleryPhoto = async (photoId) => {
    if (!form) return;
    const photo = form.gallery.find((p) => p.id === photoId);
    if (!photo) return;
    if (!confirm('Remove this photo from the Society Info page?')) return;

    setGalleryBusy(photoId);
    try {
      await deleteSocietyPhoto(photo.url);
      const next = form.gallery.filter((p) => p.id !== photoId);
      await persistGallery(next, 'Photo removed.');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setGalleryBusy(null);
    }
  };

  const handleGalleryCaptionBlur = async (photoId, caption) => {
    if (!form) return;
    const trimmed = caption.trim() || 'Society Photo';
    const current = form.gallery.find((p) => p.id === photoId);
    if (!current || current.caption === trimmed) return;

    const next = form.gallery.map((p) =>
      p.id === photoId ? { ...p, caption: trimmed } : p
    );
    setForm((f) => ({ ...f, gallery: next }));
    try {
      await persistGallery(next);
    } catch (err) {
      addToast('Error saving caption: ' + err.message, 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        society_name: form.societyName,
        address: form.address,
        city: form.city,
        state: form.state,
        total_flats: Number(form.totalFlats),
        monthly_charge: Number(form.monthlyCharge),
        current_month: form.currentMonth,
        current_year: Number(form.currentYear),
        announcement: form.announcement,
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone,
        society_gallery: galleryToPayload(form.gallery),
        society_photo_url: form.gallery[0]?.url || '',
        carry_forward: form.carryForward,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('config').update(payload).eq('id', 1);
      if (error) throw error;
      addToast('Society settings saved!', 'success');
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addCarryForward = () => {
    if (!cfMonth) { addToast('Select a month.', 'error'); return; }
    const key = `${cfMonth}-${cfYear}`;
    setForm(f => ({ ...f, carryForward: { ...f.carryForward, [key]: Number(cfAmount) } }));
    addToast(`Opening balance for ${cfMonth} ${cfYear} set to ₹${cfAmount}`, 'info');
  };

  if (!form) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <PageShell
      icon="settings"
      title="Society Settings"
      subtitle="Update society information and configuration"
      actions={
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-settings-btn">
          {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save All Settings'}
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Basic Info */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🏠 Basic Information</h3>
          <div className="form-group">
            <label className="form-label">Society Name</label>
            <input type="text" className="form-input" value={form.societyName} onChange={e => setForm(f => ({ ...f, societyName: e.target.value }))} id="settings-name" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} id="settings-address" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input type="text" className="form-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} id="settings-city" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input type="text" className="form-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} id="settings-state" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input type="tel" className="form-input" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} id="settings-phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input type="email" className="form-input" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} id="settings-email" />
            </div>
          </div>
        </div>

        {/* Portal Settings */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>⚙️ Portal Settings</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Active Month</label>
              <select className="form-select" value={form.currentMonth} onChange={e => setForm(f => ({ ...f, currentMonth: e.target.value }))} id="settings-month">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Active Year</label>
              <select className="form-select" value={form.currentYear} onChange={e => setForm(f => ({ ...f, currentYear: Number(e.target.value) }))} id="settings-year">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Monthly Charge (₹)</label>
              <input type="number" className="form-input" value={form.monthlyCharge} onChange={e => setForm(f => ({ ...f, monthlyCharge: e.target.value }))} id="settings-charge" />
            </div>
            <div className="form-group">
              <label className="form-label">Total Flats</label>
              <input type="number" className="form-input" value={form.totalFlats} onChange={e => setForm(f => ({ ...f, totalFlats: e.target.value }))} id="settings-flats" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Announcement</label>
            <textarea className="form-textarea" rows={3} value={form.announcement} onChange={e => setForm(f => ({ ...f, announcement: e.target.value }))} id="settings-announcement" />
          </div>
        </div>

        {/* Society Gallery */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>📷 Society Gallery Photos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            These images appear on the Society Info page. Add, change, or remove photos — JPG, PNG, WebP or GIF, max 3 MB each.
          </p>

          {form.gallery.length === 0 ? (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              No photos yet. Add at least one image for residents to see on Society Info.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {form.gallery.map((photo) => (
                <div key={photo.id} className="card" style={{ padding: '0.75rem', margin: 0 }}>
                  <div
                    style={{
                      height: 160,
                      borderRadius: 'var(--r-lg)',
                      overflow: 'hidden',
                      background: 'var(--bg-subtle)',
                      marginBottom: '0.75rem',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.target.style.opacity = '0.35'; }}
                    />
                    {galleryBusy === photo.id && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span className="spinner" style={{ width: 22, height: 22, marginRight: 8 }} />
                        Uploading…
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Caption</label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={photo.caption}
                      onBlur={(e) => handleGalleryCaptionBlur(photo.id, e.target.value)}
                      disabled={galleryBusy === photo.id}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', flex: 1 }}>
                      <Icon name="camera" size={14} /> Change
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        hidden
                        ref={(el) => { replacePhotoRefs.current[photo.id] = el; }}
                        onChange={(ev) => handleReplaceGalleryPhoto(photo.id, ev)}
                        disabled={galleryBusy === photo.id}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDeleteGalleryPhoto(photo.id)}
                      disabled={galleryBusy === photo.id}
                    >
                      <Icon name="trash" size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="btn btn-accent" style={{ cursor: 'pointer' }}>
            <Icon name="plus" size={14} /> Add Photo
            <input
              ref={addPhotoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleAddGalleryPhoto}
              disabled={!!galleryBusy}
            />
          </label>
        </div>

        {/* Carry Forward */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>💰 Opening Balance (Carry Forward)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Set the opening balance for any month. This is the balance carried forward from the previous month.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ flex: '1', minWidth: 140, margin: 0 }}>
              <label className="form-label">Month</label>
              <select className="form-select" value={cfMonth} onChange={e => setCfMonth(e.target.value)} id="cf-month-select">
                <option value="">— Select —</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: 100, margin: 0 }}>
              <label className="form-label">Year</label>
              <select className="form-select" value={cfYear} onChange={e => setCfYear(Number(e.target.value))} id="cf-year-select">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: 140, margin: 0 }}>
              <label className="form-label">Opening Balance (₹)</label>
              <input type="number" className="form-input" value={cfAmount} onChange={e => setCfAmount(e.target.value)} id="cf-amount-input" />
            </div>
            <button className="btn btn-accent" onClick={addCarryForward} id="cf-add-btn">➕ Set Balance</button>
          </div>

          {Object.keys(form.carryForward).length > 0 && (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Month-Year</th><th>Opening Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {Object.entries(form.carryForward).map(([key, val]) => (
                    <tr key={key}>
                      <td><strong>{key}</strong></td>
                      <td className="rupee" style={{ color: 'var(--success)' }}>₹{val}</td>
                      <td>
                        <button className="btn-icon" style={{ color: 'var(--danger)' }}
                          onClick={() => setForm(f => {
                            const cf = { ...f.carryForward };
                            delete cf[key];
                            return { ...f, carryForward: cf };
                          })}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
