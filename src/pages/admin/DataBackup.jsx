import { useState, useEffect, useRef } from 'react';
import {
  createFullBackup,
  downloadBackupJson,
  downloadBackupZip,
  getBackupPrefs,
  setBackupPrefs,
  shouldOfferAutoBackup,
  markBackupDownloaded,
} from '../../services/backupExport';
import { parseBackupFile, restoreFromBackup, getBackupSummaryLines } from '../../services/backupRestore';
import { useToast } from '../../context/ToastContext';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';

export default function DataBackup() {
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [prefs, setPrefs] = useState(getBackupPrefs);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const autoRan = useRef(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (autoRan.current || !shouldOfferAutoBackup()) return;
    autoRan.current = true;
    addToast('Scheduled backup: download will start when you click "Download ZIP backup".', 'info');
  }, [addToast]);

  const runExport = async (format) => {
    setBusy(true);
    setProgress('Starting…');
    try {
      const bundle = await createFullBackup((msg) => setProgress(msg));
      if (format === 'zip') {
        setProgress('Creating ZIP…');
        await downloadBackupZip(bundle);
      } else {
        downloadBackupJson(bundle);
      }
      markBackupDownloaded();
      setPrefs(getBackupPrefs());
      addToast(
        format === 'zip'
          ? 'Full backup ZIP downloaded — save a copy to Google Drive.'
          : 'Full backup JSON downloaded.',
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Backup failed: ' + err.message, 'error');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    try {
      const bundle = await parseBackupFile(file);
      setRestorePreview(bundle);
    } catch (err) {
      setRestorePreview(null);
      addToast(err.message, 'error');
    }
  };

  const handleRestore = async () => {
    if (!restorePreview) return;
    if (!confirm('Restore will upsert all records from this backup into Supabase. Continue?')) return;
    if (!confirm('Last chance: wrong file can duplicate or overwrite data. Proceed?')) return;

    setBusy(true);
    setProgress('Restoring…');
    try {
      const result = await restoreFromBackup(restorePreview, (msg) => setProgress(msg));
      addToast(`Restore complete. Backup from ${result.backupExportedAt}`, 'success');
      setRestoreFile(null);
      setRestorePreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      addToast('Restore failed: ' + err.message, 'error');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const toggleAuto = (key, value) => {
    setBackupPrefs({ [key]: value });
    setPrefs(getBackupPrefs());
  };

  const lastDl = prefs.lastDownloadAt
    ? new Date(prefs.lastDownloadAt).toLocaleString('en-IN')
    : 'Never';

  return (
    <PageShell
      icon="download"
      title="Data Backup & Restore"
      subtitle="Download full society records — payments, expenses, owners, config — for laptop or Google Drive"
    >
      <div className="alert alert-info mb-3">
        <span className="alert-icon"><Icon name="info" size={18} /></span>
        <div>
          <strong>Protect against GitHub, Vercel, or Supabase issues.</strong> Download a ZIP weekly.
          Upload the same ZIP folder to Google Drive. If the live app fails, restore using{' '}
          <code>DISASTER_RECOVERY.md</code> in the GitHub repo.
        </div>
      </div>

      {progress && (
        <div className="card mb-3 flex items-center gap-2">
          <span className="spinner" style={{ width: 22, height: 22 }} />
          <span className="text-sm">{progress}</span>
        </div>
      )}

      <div className="grid-2 mb-3">
        <div className="card">
          <h3 className="text-base mb-2">Download backup</h3>
          <p className="text-sm text-muted-c mb-2">
            ZIP includes JSON (full restore), CSV reports (who paid, expenses by month), and README.
          </p>
          <p className="text-xs text-muted-c mb-2">Last download: {lastDl}</p>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => runExport('zip')}
            >
              <Icon name="download" size={16} /> Download ZIP backup
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => runExport('json')}>
              JSON only
            </button>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!prefs.autoDownloadOnVisit}
              onChange={(e) => toggleAuto('autoDownloadOnVisit', e.target.checked)}
            />
            Remind me to backup when I open this page (once per day)
          </label>
        </div>

        <div className="card">
          <h3 className="text-base mb-2">Google Drive (manual)</h3>
          <ol className="text-sm text-muted-c" style={{ paddingLeft: '1.2rem', margin: 0 }}>
            <li>Click <strong>Download ZIP backup</strong></li>
            <li>Open <a href="https://drive.google.com" target="_blank" rel="noreferrer">drive.google.com</a></li>
            <li>Create folder: <em>Sri Kuber Backups</em></li>
            <li>Upload the ZIP file each month</li>
          </ol>
        </div>
      </div>

      <div className="card mb-3">
        <h3 className="text-base mb-2 text-danger-c">Restore from backup</h3>
        <p className="text-sm text-muted-c mb-2">
          Upload <code>full-backup.json</code> from a previous ZIP. Merges records by id into Supabase.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="form-input mb-2"
          onChange={handleFileSelect}
        />
        {restorePreview && (
          <div className="mb-2 p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)' }}>
            <div className="text-xs fw-bold mb-1">Backup preview</div>
            <div className="text-sm">Exported: {restorePreview.exportedAt}</div>
            <div className="text-sm">Society: {restorePreview.societyName}</div>
            <ul className="text-xs text-muted-c mt-1 mb-0" style={{ paddingLeft: '1.2rem' }}>
              {getBackupSummaryLines(restorePreview).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          className="btn btn-ghost text-danger-c"
          disabled={busy || !restorePreview}
          onClick={handleRestore}
        >
          <Icon name="upload" size={16} /> Restore into Supabase
        </button>
      </div>

      <div className="card">
        <h3 className="text-base mb-2">What is included</h3>
        <div className="grid-2 text-sm text-muted-c">
          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
            <li>All maintenance payments (flat, month, amount, date)</li>
            <li>All expenses (type, bill, net amount)</li>
            <li>Other income, owners, notices, complaints</li>
          </ul>
          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
            <li>Society config & carry-forward balances</li>
            <li>Login accounts (password hashes)</li>
            <li>Activity logs (optional)</li>
            <li>Monthly summary CSV report</li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
