import { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable, useConfig } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, MONTHS, EXPENSE_TYPES, generateId } from '../../utils/formatters';
import { uploadExpenseAttachment } from '../../utils/uploadExpenseAttachment';
import Icon from '../../components/Icon';

function mapExpense(e) {
  return {
    ...e,
    expenseType: e.expense_type,
    billAmount: e.bill_amount,
    builderContribution: e.builder_contribution,
    netExpense: e.net_expense,
    paidTo: e.paid_to,
    attachmentUrl: e.attachment_url || null,
  };
}

const EMPTY = {
  expenseDate: new Date().toISOString().split('T')[0],
  expenseType: '', customType: '', billAmount: '',
  builderContribution: 0, paidTo: '', month: 'May', year: 2026, remarks: '',
};

export default function ManageExpenses() {
  const { addToast } = useToast();
  const { config } = useConfig();
  const { data: rawExpenses, loading, refetch } = useSupabaseTable('expenses', q => q.order('expense_date', { ascending: false }));

  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ ...EMPTY });
  const [saving, setSaving]         = useState(false);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterYear, setFilterYear]   = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileRef = useRef(null);

  const expenses = rawExpenses.map(mapExpense);
  const month = filterMonth ?? config?.current_month ?? 'May';
  const year  = filterYear  ?? config?.current_year  ?? 2026;
  const filtered = expenses.filter(e => e.month === month && e.year === Number(year));

  const netExpense = Math.max(0, Number(form.billAmount || 0) - Number(form.builderContribution || 0));

  const resetModal = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY, month: config?.current_month || 'May', year: config?.current_year || 2026 });
    resetModal();
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditId(e.id);
    setForm({
      expenseDate: e.expense_date || '',
      expenseType: EXPENSE_TYPES.includes(e.expenseType) ? e.expenseType : 'Other',
      customType: EXPENSE_TYPES.includes(e.expenseType) ? '' : e.expenseType,
      billAmount: e.billAmount,
      builderContribution: e.builderContribution,
      paidTo: e.paidTo || '',
      month: e.month, year: e.year,
      remarks: e.remarks || '',
      existingAttachment: e.attachmentUrl || null,
    });
    resetModal();
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setAttachmentPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleSave = async () => {
    const type = form.expenseType === 'Other' && form.customType ? form.customType : form.expenseType;
    if (!type || !form.billAmount || !form.expenseDate) {
      addToast('Please fill all required fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      const expenseId = editId || generateId('EXP');
      const payload = {
        expense_date: form.expenseDate,
        expense_type: type,
        bill_amount: Number(form.billAmount),
        builder_contribution: Number(form.builderContribution || 0),
        net_expense: netExpense,
        paid_to: form.paidTo,
        month: form.month,
        year: Number(form.year),
        remarks: form.remarks,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editId) {
        ({ error } = await supabase.from('expenses').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('expenses').insert([{ ...payload, id: expenseId }]));
      }
      if (error) throw error;

      // Upload attachment if a new file was selected
      if (attachmentFile) {
        const result = await uploadExpenseAttachment(attachmentFile, expenseId);
        if (result.error) {
          addToast('Expense saved, but attachment upload failed: ' + result.error, 'warning');
        } else {
          await supabase.from('expenses').update({ attachment_url: result.url }).eq('id', expenseId);
        }
      }

      addToast(editId ? 'Expense updated!' : 'Expense added!', 'success');
      setShowModal(false);
      resetModal();
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
        <div>
          <h1 className="page-title"><Icon name="receipt" size={24} /> Manage Expenses</h1>
          <p className="page-subtitle">Add, edit, or delete expense records with bill attachments</p>
        </div>
        <div className="flex gap-1 items-center flex-wrap">
          <select className="form-select" style={{ width: 'auto' }} value={month} onChange={e => setFilterMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={year} onChange={e => setFilterYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <h3 style={{ fontSize: '1rem' }}>{month} {year} — {filtered.length} records</h3>
          <span className="badge badge-danger">
            {formatCurrency(filtered.reduce((s, e) => s + Number(e.netExpense || 0), 0))} net expense
          </span>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Icon name="receipt" size={48} className="empty-state-icon" />
            <h3>No Expenses</h3>
            <p>No expense records for {month} {year}. Click "Add Expense" to record one.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Bill</th><th>Builder</th>
                  <th>Net</th><th>Paid To</th><th>Attachment</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>{formatDate(e.expense_date)}</td>
                    <td><strong>{e.expenseType}</strong></td>
                    <td className="rupee">{formatCurrency(e.billAmount)}</td>
                    <td className="rupee" style={{ color: 'var(--accent)' }}>
                      {e.builderContribution > 0 ? formatCurrency(e.builderContribution) : '—'}
                    </td>
                    <td className="rupee" style={{ color: 'var(--danger)' }}>
                      <strong>{formatCurrency(e.netExpense)}</strong>
                    </td>
                    <td>{e.paidTo || '—'}</td>
                    <td>
                      {e.attachmentUrl ? (
                        <button className="attach-existing" onClick={() => setLightboxUrl(e.attachmentUrl)}>
                          <Icon name="paperclip" size={13} /> View Bill
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-icon" onClick={() => openEdit(e)} title="Edit">
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="btn-icon danger" onClick={() => handleDelete(e.id)} title="Delete">
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox for attachment */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          {lightboxUrl.includes('.pdf') ? (
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', textAlign: 'center' }}>
              <Icon name="paperclip" size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>PDF attachment</p>
              <a href={lightboxUrl} target="_blank" rel="noreferrer" className="btn btn-primary" onClick={e => e.stopPropagation()}>
                <Icon name="externalLink" size={16} /> Open PDF
              </a>
            </div>
          ) : (
            <img src={lightboxUrl} alt="Bill attachment" className="lightbox-img" onClick={e => e.stopPropagation()} />
          )}
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>
            <Icon name="x" size={20} />
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box wide" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Icon name={editId ? 'edit' : 'plus'} size={18} />
                {editId ? 'Edit Expense' : 'Add Expense'}
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date <span className="required">*</span></label>
                  <input type="date" className="form-input" value={form.expenseDate}
                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expense Type <span className="required">*</span></label>
                  <select className="form-select" value={form.expenseType}
                    onChange={e => setForm(f => ({ ...f, expenseType: e.target.value }))}>
                    <option value="">— Select Type —</option>
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {form.expenseType === 'Other' && (
                <div className="form-group">
                  <label className="form-label">Custom Description <span className="required">*</span></label>
                  <input type="text" className="form-input" placeholder="Describe the expense…"
                    value={form.customType} onChange={e => setForm(f => ({ ...f, customType: e.target.value }))} />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bill Amount (₹) <span className="required">*</span></label>
                  <input type="number" className="form-input" value={form.billAmount}
                    onChange={e => setForm(f => ({ ...f, billAmount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Builder Contribution (₹)</label>
                  <input type="number" className="form-input" value={form.builderContribution}
                    onChange={e => setForm(f => ({ ...f, builderContribution: e.target.value }))} />
                </div>
              </div>

              <div className="alert alert-info" style={{ padding: '0.6rem 1rem', marginBottom: '1rem' }}>
                <Icon name="info" size={15} />
                Net Expense = <strong style={{ color: 'var(--danger)', marginLeft: 4 }}>{formatCurrency(netExpense)}</strong>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Month <span className="required">*</span></label>
                  <select className="form-select" value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year <span className="required">*</span></label>
                  <select className="form-select" value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Paid To</label>
                  <input type="text" className="form-input" placeholder="e.g. Electricity Office"
                    value={form.paidTo} onChange={e => setForm(f => ({ ...f, paidTo: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input type="text" className="form-input" placeholder="Optional notes…"
                    value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>

              {/* Attachment Section */}
              <div className="form-group">
                <label className="form-label"><Icon name="paperclip" size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Bill Attachment (Photo / PDF)</label>

                {form.existingAttachment && !attachmentFile && (
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current:</span>
                    <button className="attach-existing" onClick={() => setLightboxUrl(form.existingAttachment)}>
                      <Icon name="eye" size={13} /> View Existing
                    </button>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· Choose a new file to replace</span>
                  </div>
                )}

                {attachmentFile ? (
                  <div className="attach-preview">
                    {attachmentPreview ? (
                      <img src={attachmentPreview} alt="Preview" />
                    ) : (
                      <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--r-sm)' }}>
                        <Icon name="paperclip" size={22} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate fw-semi text-sm" style={{ color: 'var(--text-primary)' }}>{attachmentFile.name}</div>
                      <div className="text-xs text-muted-c">{(attachmentFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button className="btn-icon danger" onClick={() => { setAttachmentFile(null); setAttachmentPreview(null); if (fileRef.current) fileRef.current.value = ''; }} title="Remove">
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="attach-zone">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={handleFileSelect} />
                    <div className="attach-zone-label">
                      <Icon name="upload" size={24} style={{ color: 'var(--primary-light)', opacity: 0.7 }} />
                      <span>Click or drag to upload bill photo / PDF</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WebP, PDF · Max 5 MB</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner sm" /> Saving…</> : <><Icon name="check" size={16} /> Save Expense</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
