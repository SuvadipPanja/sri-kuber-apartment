import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable, useConfig } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, MONTHS, generateId } from '../../utils/formatters';

const EMPTY = { incomeDate: new Date().toISOString().split('T')[0], source: '', amount: '', month: 'May', year: 2026, remarks: '' };

export default function ManageIncome() {
  const { addToast } = useToast();
  const { config } = useConfig();
  const { data: rawIncome, loading, refetch } = useSupabaseTable('income', q => q.order('income_date', { ascending: false }));
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterYear, setFilterYear] = useState(null);

  const month = filterMonth ?? config?.current_month ?? 'May';
  const year = filterYear ?? config?.current_year ?? 2026;
  const filtered = rawIncome.filter(i => i.month === month && i.year === Number(year));

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY, month: config?.current_month || 'May', year: config?.current_year || 2026 });
    setShowModal(true);
  };

  const openEdit = (inc) => {
    setEditId(inc.id);
    setForm({ incomeDate: inc.income_date, source: inc.source, amount: inc.amount, month: inc.month, year: inc.year, remarks: inc.remarks || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.source || !form.amount || !form.incomeDate) { addToast('Please fill all required fields.', 'error'); return; }
    setSaving(true);
    try {
      const payload = { income_date: form.incomeDate, source: form.source, amount: Number(form.amount), month: form.month, year: Number(form.year), remarks: form.remarks };
      let error;
      if (editId) {
        ({ error } = await supabase.from('income').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('income').insert([{ ...payload, id: generateId('INC') }]));
      }
      if (error) throw error;
      addToast(editId ? 'Income updated!' : 'Income added!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this income record?')) return;
    const { error } = await supabase.from('income').delete().eq('id', id);
    if (error) addToast('Error: ' + error.message, 'error');
    else { addToast('Income deleted.', 'success'); refetch(); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>💵 Manage Other Income</h1><p className="page-subtitle">Add, edit, or delete additional income records</p></div>
        <div className="flex gap-1 items-center">
          <select className="form-select" style={{ width: 'auto' }} value={month} onChange={e => setFilterMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={year} onChange={e => setFilterYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>➕ Add Income</button>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <h3 className="text-base m-0">{month} {year} — {filtered.length} records</h3>
          <span className="badge badge-accent">{formatCurrency(filtered.reduce((s, i) => s + Number(i.amount), 0))} total</span>
        </div>
        
        {loading ? <div className="flex-center p-3"><div className="spinner" /></div> :
          filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💵</div><p>No other income for {month} {year}.</p></div> :
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Remarks</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(inc => (
                  <tr key={inc.id}>
                    <td>{formatDate(inc.income_date)}</td>
                    <td><strong>{inc.source}</strong></td>
                    <td className="rupee text-success-c">{formatCurrency(inc.amount)}</td>
                    <td className="text-muted-c">{inc.remarks || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-icon" onClick={() => openEdit(inc)} title="Edit">✏️</button>
                        <button className="btn-icon danger" onClick={() => handleDelete(inc.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? '✏️ Edit Income' : '➕ Add Income'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Date <span className="required">*</span></label>
                <input type="date" className="form-input" value={form.incomeDate} onChange={e => setForm(f => ({ ...f, incomeDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Source <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="e.g. Scrap Sale, Late Fine" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) <span className="required">*</span></label>
                <input type="number" className="form-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Month <span className="required">*</span></label>
                  <select className="form-select" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year <span className="required">*</span></label>
                  <select className="form-select" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input type="text" className="form-input" placeholder="Optional notes..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner sm" /> Saving...</> : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
