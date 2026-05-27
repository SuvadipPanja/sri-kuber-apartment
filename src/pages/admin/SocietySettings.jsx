import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useConfig } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { MONTHS } from '../../utils/formatters';

export default function SocietySettings() {
  const { addToast } = useToast();
  const { config, refetch } = useConfig();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cfMonth, setCfMonth] = useState('');
  const [cfYear, setCfYear] = useState(2026);
  const [cfAmount, setCfAmount] = useState(0);

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
        societyPhotoUrl: config.society_photo_url || '',
        carryForward: config.carry_forward || {},
      });
    }
  }, [config]);

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
        society_photo_url: form.societyPhotoUrl,
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
    <div>
      <div className="page-header">
        <div><h1>🔧 Society Settings</h1><p className="page-subtitle">Update society information and configuration</p></div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-settings-btn">
          {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save All Settings'}
        </button>
      </div>

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
            <label className="form-label">Society Photo URL</label>
            <input type="url" className="form-input" placeholder="https://... direct image link" value={form.societyPhotoUrl} onChange={e => setForm(f => ({ ...f, societyPhotoUrl: e.target.value }))} id="settings-photo" />
          </div>
          <div className="form-group">
            <label className="form-label">Announcement</label>
            <textarea className="form-textarea" rows={3} value={form.announcement} onChange={e => setForm(f => ({ ...f, announcement: e.target.value }))} id="settings-announcement" />
          </div>
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
    </div>
  );
}
