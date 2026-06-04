import { supabase } from './supabase';
import { BACKUP_VERSION, BACKUP_TABLES } from './backupExport';

const RESTORE_ORDER = [
  'config',
  'owners',
  'auth_users',
  'payments',
  'expenses',
  'income',
  'notices',
  'complaints',
  'contacts',
  'user_sessions',
  'user_activity_events',
];

export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result);
        validateBackupBundle(bundle);
        resolve(bundle);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

export function validateBackupBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Invalid backup file.');
  }
  if (!bundle.tables || typeof bundle.tables !== 'object') {
    throw new Error('Backup missing "tables" section.');
  }
  if (!bundle.backupVersion) {
    throw new Error('Backup missing version — file may be incomplete.');
  }
  if (bundle.backupVersion !== BACKUP_VERSION) {
    console.warn(`Backup version ${bundle.backupVersion} differs from app ${BACKUP_VERSION}`);
  }
}

async function upsertRows(table, rows, onProgress) {
  if (!rows?.length) return 0;
  const batchSize = 50;
  let done = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`${table}: ${error.message}`);
    done += batch.length;
    onProgress?.(table, done, rows.length);
  }
  return done;
}

/** Restore config singleton (id=1). */
async function restoreConfig(rows) {
  if (!rows?.length) return;
  const row = rows.find((r) => r.id === 1) || rows[0];
  const { error } = await supabase.from('config').upsert({ ...row, id: 1 }, { onConflict: 'id' });
  if (error) throw new Error(`config: ${error.message}`);
}

/**
 * Restore database from a full backup bundle.
 * Merges by id (upsert) — does not delete rows missing from backup.
 */
export async function restoreFromBackup(bundle, onProgress) {
  validateBackupBundle(bundle);
  const tables = bundle.tables;
  const summary = {};

  for (const table of RESTORE_ORDER) {
    const rows = tables[table];
    if (!rows) continue;

    if (table === 'config') {
      await restoreConfig(rows);
      summary[table] = rows.length;
      onProgress?.(`Restored ${table}`, 1, 1);
      continue;
    }

    const count = await upsertRows(table, rows, (t, done, total) => {
      onProgress?.(`Restoring ${t}…`, done, total);
    });
    summary[table] = count;
  }

  return {
    restoredAt: new Date().toISOString(),
    summary,
    backupExportedAt: bundle.exportedAt,
  };
}

export function getBackupSummaryLines(bundle) {
  const counts = bundle.recordCounts || {};
  return BACKUP_TABLES.map((t) => {
    const n = counts[t] ?? (bundle.tables?.[t]?.length ?? 0);
    return `${t}: ${n} records`;
  });
}
