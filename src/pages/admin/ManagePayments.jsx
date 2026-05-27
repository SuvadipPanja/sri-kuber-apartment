import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable, useConfig } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, MONTHS, PAYMENT_MODES, generateId } from '../../utils/formatters';

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }

const EMPTY_FORM = { flatNo: '', ownerName: '', month: 'May', year: 2026, amountPaid: 500, paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'In Cash', remarks: '' };

export default function ManagePayments() {
  const { addToast } = useToast();
  const { config } = useConfig();
  const { data: rawPayments, loading, refetch } = useSupabaseTable('payments', q => q.order('payment_date', { ascending: false }));
  const { data: rawOwners } = useSupabaseTable('owners');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, month: config?.current_month || 'May', year: config?.current_year || 2026 });
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterYear, setFilterYear] = useState(null);

  const payments = rawPayments.map(mapPayment);
  const activeOwners = rawOwners.filter(o => o.active);

  const month = filterMonth ?? config?.current_month ?? 'May';
  const year = filterYear ?? config?.current_year ?? 2026;
  const filtered = payments.filter(p => p.month === month && p.year === Number(year));

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, month: config?.current_month || 'May', year: config?.current_year || 2026 });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({ flatNo: p.flatNo, ownerName: p.ownerName, month: p.month, year: p.year, amountPaid: p.amountPaid, paymentDate: p.paymentDate, paymentMode: p.paymentMode, remarks: p.remarks || '' });
    setShowModal(true);
  };

  const handleFlatChange = (flatNo) => {
    const owner = rawOwners.find(o => o.flat_no === flatNo);
    setForm(f => ({ ...f, flatNo, ownerName: owner?.owner_name || '', amountPaid: owner?.monthly_charge || 500 }));
  };

  const handleSave = async () => {
    if (!form.flatNo || !form.month || !form.paymentDate) { addToast('Please fill all required fields.', 'error'); return; }
    setSaving(true);
    try {
      const payload = { flat_no: form.flatNo, owner_name: form.ownerName, month: form.month, year: Number(form.year), amount_paid: Number(form.amountPaid), payment_date: form.paymentDate, payment_mode: form.paymentMode, remarks: form.remarks, updated_at: new Date().toISOString() };
      let error;
      if (editId) {
        ({ error } = await supabase.from('payments').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('payments').insert([{ ...payload, id: generateId('PAY') }]));
      }
      if (error) throw error;
      addToast(editId ? 'Payment updated!' : 'Payment added!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) addToast('Error: ' + error.message, 'error');
    else { addToast('Payment deleted.', 'success'); refetch(); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>💰 Manage Payments</h1>
          <p className="page-subtitle">Add, edit, or delete maintenance payments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }} value={month} onChange={e => setFilterMonth(e.target.value)} id="payments-month-filter">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }} value={year} onChange={e => setFilterYear(Number(e.target.value))} id="payments-year-filter">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd} id="add-payment-btn">➕ Add Payment</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>{month} {year} — {filtered.length} records</h3>
          <span className="badge badge-success">{formatCurrency(filtered.reduce((s, p) => s + p.amountPaid, 0))} collected</span>
        </div>
        {loading ? <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner" /></div> :
          filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">💳</div><p>No payments for {month} {year}. Click "Add Payment" to record one.</p></div> :
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Flat</th><th>Owner</th><th>Month</th><th>Amount</th><th>Date</th><th>Mode</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><strong>Flat {p.flatNo}</strong></td>
                    <td>{p.ownerName}</td>
                    <td>{p.month} {p.year}</td>
                    <td className="rupee" style={{ color: 'var(--success)' }}>{formatCurrency(p.amountPaid)}</td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td><span className="badge badge-accent">{p.paymentMode}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(p.id)} title="Delete" style={{ color: 'var(--danger)' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? '✏️ Edit Payment' : '➕ Add Payment'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Flat Number *</label>
                <select className="form-select" value={form.flatNo} onChange={e => handleFlatChange(e.target.value)} id="pay-flat-select">
                  <option value="">— Select Flat —</option>
                  {rawOwners.filter(o => o.active).map(o => <option key={o.flat_no} value={o.flat_no}>Flat {o.flat_no} — {o.owner_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount Paid (₹) *</label>
                <input type="number" className="form-input" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} id="pay-amount-input" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Month *</label>
                <select className="form-select" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} id="pay-month-select">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <select className="form-select" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} id="pay-year-select">
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input type="date" className="form-input" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} id="pay-date-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} id="pay-mode-select">
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <input type="text" className="form-input" placeholder="Optional notes..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} id="pay-remarks-input" />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-payment-btn">
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
