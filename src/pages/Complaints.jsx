import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { useSupabaseTable } from '../hooks/useSupabase';
import { formatDate, generateId } from '../utils/formatters';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Lift / Elevator', 'Noise', 'Security', 'Water Supply', 'Other'];
const STATUS_BADGE = {
  open: 'badge-danger',
  in_progress: 'badge-warning',
  resolved: 'badge-success',
};
const STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function Complaints() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: allComplaints, loading, refetch } = useSupabaseTable('complaints', q => q.order('created_at', { ascending: false }));

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'Plumbing', subject: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Residents only see their own complaints
  const myComplaints = allComplaints.filter(c => c.flat_no === user?.flatNo);
  const filtered = filterStatus === 'all' ? myComplaints : myComplaints.filter(c => c.status === filterStatus);

  const handleSubmit = async () => {
    if (!form.subject.trim()) { addToast('Please enter a subject.', 'error'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('complaints').insert([{
        id: generateId('CMP'),
        flat_no: user.flatNo,
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        status: 'open',
      }]);
      if (error) throw error;
      addToast('Complaint submitted! The admin will review it.', 'success');
      setShowModal(false);
      setForm({ category: 'Plumbing', subject: '', description: '' });
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      icon="complaint"
      title="My Complaints"
      subtitle={`Submit and track maintenance requests — Flat ${user?.flatNo}`}
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={16} /> New Complaint
        </button>
      }
    >
      {/* Filter */}
      <div className="month-tab-bar mb-3" style={{ maxWidth: 420 }}>
        {['all', 'open', 'in_progress', 'resolved'].map(s => (
          <button
            key={s}
            className={`month-tab ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'All' : STATUS_LABEL[s]} ({s === 'all' ? myComplaints.length : myComplaints.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {loading ? <div className="flex-center" style={{ height: '30vh' }}><div className="spinner lg"></div></div> :
        filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="check"
              title="No Complaints"
              description={filterStatus === 'all' ? "You haven't submitted any complaints yet." : `No ${STATUS_LABEL[filterStatus]?.toLowerCase()} complaints.`}
            />
          </div>
        ) : (
          <div className="flex-col gap-2">
            {filtered.map(c => (
              <div key={c.id} className="card slide-up" style={{ borderLeft: `3px solid ${c.status === 'open' ? 'var(--danger)' : c.status === 'in_progress' ? 'var(--warning)' : 'var(--success)'}` }}>
                <div className="flex-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="m-0 text-white">{c.subject}</h4>
                    <span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  </div>
                  <span className="tag">{c.category}</span>
                </div>
                {c.description && <p className="text-sm text-secondary-c mb-2" style={{ whiteSpace: 'pre-wrap' }}>{c.description}</p>}
                {c.admin_remark && (
                  <div className="alert alert-info mt-2" style={{ marginBottom: 0 }}>
                    <Icon name="shield" size={14} />
                    <div><strong>Admin:</strong> {c.admin_remark}</div>
                  </div>
                )}
                <div className="flex-between mt-2">
                  <span className="text-xs text-muted-c">Submitted {formatDate(c.created_at)}</span>
                  {c.resolved_at && <span className="text-xs text-success-c">Resolved {formatDate(c.resolved_at)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* New Complaint Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
            <div className="modal-header">
              <div className="modal-title"><Icon name="plus" size={18} /> New Complaint</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category <span className="required">*</span></label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="Brief description of the issue" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Details</label>
                <textarea className="form-textarea" placeholder="Provide more details about the issue..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><span className="spinner sm" /> Submitting...</> : <><Icon name="check" size={16} /> Submit Complaint</>}
              </button>
            </div>
      </Modal>
    </PageShell>
  );
}
