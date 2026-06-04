import JSZip from 'jszip';
import { supabase } from './supabase';
import { rowsToCsv, downloadTextFile } from '../utils/csv';
import {
  totalCollection,
  totalExpenses,
  totalOtherIncome,
  calculateNetBalance,
} from '../utils/calculations';
import { MONTHS } from '../utils/formatters';

export const BACKUP_VERSION = '1.0.0';

export const BACKUP_TABLES = [
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

const TABLE_FETCH_ORDER = [
  { key: 'config', query: () => supabase.from('config').select('*') },
  { key: 'owners', query: () => supabase.from('owners').select('*').order('flat_no') },
  { key: 'auth_users', query: () => supabase.from('auth_users').select('*').order('flat_no') },
  { key: 'payments', query: () => supabase.from('payments').select('*').order('payment_date', { ascending: false }) },
  { key: 'expenses', query: () => supabase.from('expenses').select('*').order('expense_date', { ascending: false }) },
  { key: 'income', query: () => supabase.from('income').select('*').order('created_at', { ascending: false }) },
  { key: 'notices', query: () => supabase.from('notices').select('*').order('created_at', { ascending: false }) },
  { key: 'complaints', query: () => supabase.from('complaints').select('*').order('created_at', { ascending: false }) },
  { key: 'contacts', query: () => supabase.from('contacts').select('*').order('name') },
  { key: 'user_sessions', query: () => supabase.from('user_sessions').select('*').order('login_at', { ascending: false }) },
  { key: 'user_activity_events', query: () => supabase.from('user_activity_events').select('*').order('created_at', { ascending: false }) },
];

async function fetchTable(key, queryFn) {
  const { data, error } = await queryFn();
  if (error) throw new Error(`${key}: ${error.message}`);
  return data || [];
}

/** Fetch all society data from Supabase. */
export async function fetchFullBackupData(onProgress) {
  const tables = {};
  for (let i = 0; i < TABLE_FETCH_ORDER.length; i += 1) {
    const { key, query } = TABLE_FETCH_ORDER[i];
    onProgress?.(`Loading ${key}…`, i, TABLE_FETCH_ORDER.length);
    tables[key] = await fetchTable(key, query);
  }
  return tables;
}

function periodKeysFromData(tables) {
  const keys = new Set();
  const add = (month, year) => {
    if (month && year != null && month !== 'All') keys.add(`${month}-${year}`);
  };
  tables.payments?.forEach((p) => add(p.month, p.year));
  tables.expenses?.forEach((e) => add(e.month, e.year));
  tables.income?.forEach((i) => add(i.month, i.year));
  const cf = tables.config?.[0]?.carry_forward || {};
  Object.keys(cf).forEach((k) => keys.add(k));
  return [...keys].sort((a, b) => {
    const [m1, y1] = a.split('-');
    const [m2, y2] = b.split('-');
    if (y1 !== y2) return Number(y1) - Number(y2);
    return MONTHS.indexOf(m1) - MONTHS.indexOf(m2);
  });
}

function buildMonthlySummary(tables) {
  const config = tables.config?.[0] || {};
  const carryForward = config.carry_forward || {};
  const periods = periodKeysFromData(tables);

  return periods.map((key) => {
    const [month, yearStr] = key.split('-');
    const year = Number(yearStr);
    const opening = carryForward[key] ?? 0;
    const collected = totalCollection(tables.payments || [], month, year);
    const spent = totalExpenses(tables.expenses || [], month, year);
    const other = totalOtherIncome(tables.income || [], month, year);
    const net = calculateNetBalance(
      tables.payments || [],
      tables.expenses || [],
      tables.income || [],
      month,
      year,
      opening
    );
    return {
      period: key,
      month,
      year,
      opening_balance: opening,
      maintenance_collected: collected,
      other_income: other,
      total_expenses: spent,
      net_balance: net,
    };
  });
}

function buildPaymentsLedger(tables) {
  return (tables.payments || []).map((p) => ({
    id: p.id,
    flat_no: p.flat_no,
    owner_name: p.owner_name,
    month: p.month,
    year: p.year,
    amount_paid: p.amount_paid,
    payment_date: p.payment_date,
    payment_mode: p.payment_mode,
    remarks: p.remarks || '',
  }));
}

function buildExpensesLedger(tables) {
  return (tables.expenses || []).map((e) => ({
    id: e.id,
    expense_date: e.expense_date,
    month: e.month,
    year: e.year,
    expense_type: e.expense_type,
    bill_amount: e.bill_amount,
    builder_contribution: e.builder_contribution,
    net_expense: e.net_expense,
    paid_to: e.paid_to || '',
    remarks: e.remarks || '',
  }));
}

function buildIncomeLedger(tables) {
  return (tables.income || []).map((i) => ({
    id: i.id,
    month: i.month,
    year: i.year,
    source: i.source || '',
    amount: i.amount,
    income_date: i.income_date || '',
    remarks: i.remarks || '',
  }));
}

export function buildBackupBundle(tables, meta = {}) {
  const config = tables.config?.[0] || {};
  const reports = {
    monthly_summary: buildMonthlySummary(tables),
    payments_ledger: buildPaymentsLedger(tables),
    expenses_ledger: buildExpensesLedger(tables),
    income_ledger: buildIncomeLedger(tables),
  };

  const counts = Object.fromEntries(
    BACKUP_TABLES.map((t) => [t, (tables[t] || []).length])
  );

  return {
    backupVersion: BACKUP_VERSION,
    app: 'Sri Kuber Apartment Society Portal',
    exportedAt: new Date().toISOString(),
    societyName: config.society_name || 'Sri Kuber Apartment',
    recordCounts: counts,
    tables,
    reports,
    ...meta,
  };
}

export async function createFullBackup(onProgress) {
  const tables = await fetchFullBackupData(onProgress);
  onProgress?.('Building reports…', TABLE_FETCH_ORDER.length, TABLE_FETCH_ORDER.length);
  return buildBackupBundle(tables);
}

function readmeText(bundle) {
  return `SRI KUBER APARTMENT — FULL DATA BACKUP
=====================================
Exported: ${bundle.exportedAt}
Version: ${bundle.backupVersion}
Society: ${bundle.societyName}

CONTENTS
--------
- full-backup.json     → Complete database export (use Restore in Admin → Data Backup)
- data/*.json          → Each Supabase table separately
- reports/*.csv        → Human-readable ledgers (Excel / Google Sheets)

RECORD COUNTS
-------------
${Object.entries(bundle.recordCounts)
  .map(([k, v]) => `  ${k}: ${v}`)
  .join('\n')}

GOOGLE DRIVE (recommended)
--------------------------
1. Download the ZIP from the portal.
2. Open https://drive.google.com → New → Folder upload (or upload ZIP).
3. Keep at least 2 copies (Drive + this PC).

DISASTER RECOVERY
-----------------
See DISASTER_RECOVERY.md in the GitHub repo, or full-backup.json meta.
Rebuild order: Supabase tables → Restore backup → Redeploy app from GitHub → Vercel env vars.

⚠ auth_users contains password hashes — store this ZIP securely.
`;
}

/** Download one JSON file (full bundle). */
export function downloadBackupJson(bundle) {
  const stamp = bundle.exportedAt.slice(0, 10);
  const safeName = (bundle.societyName || 'Sri-Kuber').replace(/\s+/g, '-');
  downloadTextFile(
    JSON.stringify(bundle, null, 2),
    `${safeName}-full-backup-${stamp}.json`,
    'application/json'
  );
}

/** Download ZIP: JSON tables + CSV reports + README. */
export async function downloadBackupZip(bundle) {
  const zip = new JSZip();
  const stamp = bundle.exportedAt.slice(0, 10);
  const folder = `Sri-Kuber-Backup-${stamp}`;

  zip.file(`${folder}/README.txt`, readmeText(bundle));
  zip.file(`${folder}/full-backup.json`, JSON.stringify(bundle, null, 2));

  const dataFolder = zip.folder(`${folder}/data`);
  for (const table of BACKUP_TABLES) {
    dataFolder.file(`${table}.json`, JSON.stringify(bundle.tables[table] || [], null, 2));
  }

  const reportsFolder = zip.folder(`${folder}/reports`);
  const ms = bundle.reports.monthly_summary;
  if (ms.length) {
    reportsFolder.file(
      'monthly-summary.csv',
      rowsToCsv(
        ['period', 'month', 'year', 'opening_balance', 'maintenance_collected', 'other_income', 'total_expenses', 'net_balance'],
        ms
      )
    );
  }

  const pay = bundle.reports.payments_ledger;
  if (pay.length) {
    reportsFolder.file(
      'payments-who-paid-when.csv',
      rowsToCsv(
        ['flat_no', 'owner_name', 'month', 'year', 'amount_paid', 'payment_date', 'payment_mode', 'remarks', 'id'],
        pay
      )
    );
  }

  const exp = bundle.reports.expenses_ledger;
  if (exp.length) {
    reportsFolder.file(
      'expenses.csv',
      rowsToCsv(
        ['expense_date', 'month', 'year', 'expense_type', 'bill_amount', 'builder_contribution', 'net_expense', 'paid_to', 'remarks', 'id'],
        exp
      )
    );
  }

  const inc = bundle.reports.income_ledger;
  if (inc.length) {
    reportsFolder.file(
      'other-income.csv',
      rowsToCsv(
        ['month', 'year', 'source', 'amount', 'income_date', 'remarks', 'id'],
        inc
      )
    );
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folder}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const BACKUP_PREFS_KEY = 'ska_backup_prefs';

export function getBackupPrefs() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setBackupPrefs(prefs) {
  localStorage.setItem(BACKUP_PREFS_KEY, JSON.stringify({ ...getBackupPrefs(), ...prefs }));
}

export function shouldOfferAutoBackup() {
  const prefs = getBackupPrefs();
  if (!prefs.autoDownloadOnVisit) return false;
  const last = prefs.lastDownloadAt ? new Date(prefs.lastDownloadAt).getTime() : 0;
  const dayMs = 24 * 60 * 60 * 1000;
  return Date.now() - last > dayMs;
}

export function markBackupDownloaded() {
  setBackupPrefs({ lastDownloadAt: new Date().toISOString() });
}
