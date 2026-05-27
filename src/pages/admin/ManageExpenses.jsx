import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable, useConfig } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, MONTHS, EXPENSE_TYPES, generateId } from '../../utils/formatters';

function mapExpense(e) { return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to }; }

const EMPTY = { expenseDate: new Date().toISOString().split('T')[0], expenseType: '', customType: '', billAmount: '', builderContribution: 0, paidTo: '', month: 'May', year: 2026, remarks: '' };

export default function ManageExpenses() {
  const { addToast } = useToast();
  const { config } = useConfig();
  const { data: rawExpenses, loading, refetch } = useSupabaseTable('expenses', q => q.order('expense_date', { ascending: false }));
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterYear, setFilterYear] = useState(null);

  const expenses = rawExpenses.map(mapExpense);
  const month = filterMonth ?? config?.current_month ?? 'May';
  const year = filterYear ?? config?.current_year ?? 2026;
  const filtered = expenses.filter(e => e.month === month && e.year === Number(year));

  const netExpense = Math.max(0, Number(form.billAmount || 0) - Number(form.builderContribution || 0));

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY, month: config?.current_month || 'May', year: config?.current_year || 2026 });
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditId(e.id);
    setForm({ expenseDate: e.expense_date || '', expenseType: EXPENSE_TYPES.includes(e.expenseType) ? e.expenseType : 'Other', customType: EXPENSE_TYPES.includes(e.expenseType) ? '' : e.expenseType, billAmount: e.billAmount, builderContribution: e.builderContribution, paidTo: e.paidTo || '', month: e.month, year: e.year, remarks: e.remarks || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const type = form.expenseType === 'Other' && form.customType ? form.customType : form.expenseType;
    if (!type || !form.billAmount || !form.expenseDate) { addToast('Please fill all required fields.', 'error'); return; }
    setSaving(true);
    try {
      const payload = { expense_date: form.expenseDate, expense_type: type, bill_amount: Number(form.billAmount), builder_contribution: Number(form.builderContribution || 0), net_expense: netExpense, paid_to: form.paidTo, month: form.month, year: Number(form.year), remarks: form.remarks, updated_at: new Date().toISOString() };
      let error;
      if (editId) {
        ({ error } = await supabase.from('expenses').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('expenses').insert([{ ...payload, id: generateId('EXP') }]));
      }
      if (error) throw error;
      addToast(editId ? 'Expense updated!' : 'Expense added!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense record?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) addToast('Error: ' + error.message, 'error');
    else { addToast('Expense deleted.', 'success'); refetch(); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>🧾 Manage Expenses</h1><p className="page-subtitle">Add, edit, or delete expense records</p></div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }} value={month} onChange={e => setFilterMonth(e.target.value)} id="exp-month-filter">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }} value={year} onChange={e => setFilterYear(Number(e.target.value))} id="exp-year-filter">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd} id="add-expense-btn">➕ Add Expense</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>{month} {year} — {filtered.length} records</h3>
          <span className="badge badge-danger">{formatCurrency(filtered.reduce((s, e) => s + Number(e.netExpense || 0), 0))} net expense</span>
        </div>
        {loading ? <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner" /></div> :
          filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">🧾</div><p>No expenses for {month} {year}.</p></div> :
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Bill</th><th>Builder</th><th>Net</th><th>Paid To</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>{formatDate(e.expense_date)}</td>
                    <td><strong>{e.expenseType}</strong></td>
                    <td className="rupee">{formatCurrency(e.billAmount)}</td>
                    <td className="rupee" style={{ color: 'var(--accent)' }}>{e.builderContribution > 0 ? formatCurrency(e.builderContribution) : '—'}</td>
                    <td className="rupee" style={{ color: 'var(--danger)' }}><strong>{formatCurrency(e.netExpense)}</strong></td>
                    <td>{e.paidTo || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => openEdit(e)} title="Edit">✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(e.id)} title="Delete" style={{ color: 'var(--danger)' }}>🗑️</button>
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
              <div className="modal-title">{editId ? '✏️ Edit Expense' : '➕ Add Expense'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} id="exp-date-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Expense Type *</label>
                <select className="form-select" value={form.expenseType} onChange={e => setForm(f => ({ ...f, expenseType: e.target.value }))} id="exp-type-select">
                  <option value="">— Select Type —</option>
                  {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {form.expenseType === 'Other' && (
              <div className="form-group">
                <label className="form-label">Custom Expense Description *</label>
                <input type="text" className="form-input" placeholder="Describe the expense..." value={form.customType} onChange={e => setForm(f => ({ ...f, customType: e.target.value }))} id="exp-custom-input" />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bill Amount (₹) *</label>
                <input type="number" className="form-input" value={form.billAmount} onChange={e => setForm(f => ({ ...f, billAmount: e.target.value }))} id="exp-bill-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Builder Contribution (₹)</label>
                <input type="number" className="form-input" value={form.builderContribution} onChange={e => setForm(f => ({ ...f, builderContribution: e.target.value }))} id="exp-builder-input" />
              </div>
            </div>

            <div className="alert alert-info" style={{ padding: '0.6rem 1rem', marginBottom: '1rem' }}>
              Net Expense = <strong style={{ color: 'var(--danger)' }}>{formatCurrency(netExpense)}</strong>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Month *</label>
                <select className="form-select" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} id="exp-month-select">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <select className="form-select" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} id="exp-year-select">
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Paid To</label>
              <input type="text" className="form-input" placeholder="e.g. Electricity Office" value={form.paidTo} onChange={e => setForm(f => ({ ...f, paidTo: e.target.value }))} id="exp-paidto-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <input type="text" className="form-input" placeholder="Optional notes..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} id="exp-remarks-input" />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-expense-btn">
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
