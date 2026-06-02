import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useSupabaseTable } from '../../hooks/useSupabase';
import { useToast } from '../../context/ToastContext';
import { formatDate, generateId } from '../../utils/formatters';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';

const EMPTY = { title: '', content: '', priority: 'normal', expiresAt: '' };

export default function ManageNotices() {
  const { addToast } = useToast();
  const { data: notices, loading, refetch } = useSupabaseTable('notices', q => q.order('created_at', { ascending: false }));

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit = (n) => {
    setEditId(n.id);
    setForm({ title: n.title, content: n.content, priority: n.priority, expiresAt: n.expires_at ? n.expires_at.split('T')[0] : '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { addToast('Title and content are required.', 'error'); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, content: form.content, priority: form.priority, expires_at: form.expiresAt || null };
      let error;
      if (editId) {
        ({ error } = await supabase.from('notices').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('notices').insert([{ ...payload, id: generateId('NTC'), posted_by: '301' }]));
      }
      if (error) throw error;
      addToast(editId ? 'Notice updated!' : 'Notice posted!', 'success');
      setShowModal(false);
      refetch();
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) addToast('Error: ' + error.message, 'error');
    else { addToast('Notice deleted.', 'success'); refetch(); }
  };

  const prBadge = { urgent: 'badge-danger', important: 'badge-warning', normal: 'badge-info' };

  return (
    <PageShell
      icon="notice"
      title="Manage Notices"
      subtitle="Post, edit, or delete society announcements"
      actions={
        <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={16} /> Post Notice</button>
      }
    >
      {loading ? <div className="flex-center" style={{ height: '30vh' }}><div className="spinner lg" /></div> :
        notices.length === 0 ? (
          <div className="card"><div className="empty-state"><Icon name="megaphone" size={48} className="empty-state-icon" /><h3>No Notices</h3><p>Post the first notice for your residents.</p></div></div>
        ) : (
          <div className="flex-col gap-2">
            {notices.map(n => (
              <div key={n.id} className="card flex-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-white">{n.title}</strong>
                    <span className={`badge ${prBadge[n.priority] || 'badge-info'}`}>{n.priority}</span>
                  </div>
                  <p className="text-sm text-secondary-c mb-1" style={{ whiteSpace: 'pre-wrap' }}>{n.content.length > 150 ? n.content.substring(0, 150) + '...' : n.content}</p>
                  <span className="text-xs text-muted-c">Posted {formatDate(n.created_at)} {n.expires_at ? ` • Expires ${formatDate(n.expires_at)}` : ''}</span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button className="btn-icon" onClick={() => openEdit(n)} title="Edit"><Icon name="edit" size={14} /></button>
                  <button className="btn-icon danger" onClick={() => handleDelete(n.id)} title="Delete"><Icon name="trash" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><Icon name="megaphone" size={18} /> {editId ? 'Edit Notice' : 'Post Notice'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="Notice title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Content <span className="required">*</span></label>
                <textarea className="form-textarea" placeholder="Write the notice content here..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5}></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Expires On (Optional)</label>
                  <input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner sm" /> Saving...</> : <><Icon name="check" size={16} /> {editId ? 'Update' : 'Post Notice'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
