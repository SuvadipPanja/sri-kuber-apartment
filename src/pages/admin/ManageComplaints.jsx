import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';

const STATUS_BADGE = { open: 'badge-danger', in_progress: 'badge-warning', resolved: 'badge-success' };
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

export default function ManageComplaints() {
  const { addToast } = useToast();
  const { data: complaints, loading, refetch } = useSupabaseTable('complaints', q => q.order('created_at', { ascending: false }));

  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = filterStatus === 'all' ? complaints : complaints.filter(c => c.status === filterStatus);

  const openRespond = (c) => {
    setSelected(c);
    setNewStatus(c.status);
    setRemark(c.admin_remark || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        status: newStatus,
        admin_remark: remark,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from('complaints').update(payload).eq('id', selected.id);
      if (error) throw error;
      addToast('Complaint updated!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this complaint permanently?')) return;
    const { error } = await supabase.from('complaints').delete().eq('id', id);
    if (error) addToast('Error: ' + error.message, 'error');
    else { addToast('Complaint deleted.', 'success'); refetch(); }
  };

  return (
    <PageShell
      icon="complaint"
      title="Manage Complaints"
      subtitle="View and respond to resident complaints"
      actions={
        <div className="flex gap-1">
          <span className="badge badge-danger">{complaints.filter(c => c.status === 'open').length} Open</span>
          <span className="badge badge-warning">{complaints.filter(c => c.status === 'in_progress').length} In Progress</span>
          <span className="badge badge-success">{complaints.filter(c => c.status === 'resolved').length} Resolved</span>
        </div>
      }
    >
      <div className="month-tab-bar mb-3" style={{ maxWidth: 500 }}>
        {['all', 'open', 'in_progress', 'resolved'].map(s => (
          <button key={s} className={`month-tab ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]} ({s === 'all' ? complaints.length : complaints.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {loading ? <div className="flex-center" style={{ height: '30vh' }}><div className="spinner lg" /></div> :
        filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><Icon name="check" size={48} className="empty-state-icon" /><h3>No Complaints</h3></div></div>
        ) : (
          <div className="flex-col gap-2">
            {filtered.map(c => (
              <div key={c.id} className="card" style={{ borderLeft: `3px solid ${c.status === 'open' ? 'var(--danger)' : c.status === 'in_progress' ? 'var(--warning)' : 'var(--success)'}` }}>
                <div className="flex-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary">Flat {c.flat_no}</span>
                    <strong className="text-white">{c.subject}</strong>
                    <span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-outline btn-sm" onClick={() => openRespond(c)}><Icon name="edit" size={14} /> Respond</button>
                    <button className="btn-icon danger" onClick={() => handleDelete(c.id)} title="Delete"><Icon name="trash" size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="tag">{c.category}</span>
                  <span className="text-xs text-muted-c">{formatDate(c.created_at)}</span>
                </div>
                {c.description && <p className="text-sm text-secondary-c mb-1" style={{ whiteSpace: 'pre-wrap' }}>{c.description}</p>}
                {c.admin_remark && (
                  <div className="alert alert-info mt-1" style={{ marginBottom: 0 }}>
                    <Icon name="shield" size={14} />
                    <div><strong>Your Response:</strong> {c.admin_remark}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><Icon name="edit" size={18} /> Respond to Complaint</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-3">
                <div>
                  <strong>Flat {selected.flat_no}</strong> — {selected.subject}<br />
                  <span className="text-sm">{selected.description || 'No details provided.'}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Remark</label>
                <textarea className="form-textarea" placeholder="Add a response or note for the resident..." value={remark} onChange={e => setRemark(e.target.value)} rows={3}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner sm" /> Saving...</> : <><Icon name="check" size={16} /> Update</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
