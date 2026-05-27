import { useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { buildPendingDues, getFlatStats } from '../utils/calculations';

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function PendingDues() {
  const { config } = useConfig();
  const { data: rawOwners } = useSupabaseTable('owners');
  const { data: rawPayments, loading } = useSupabaseTable('payments');

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const month = selectedMonth ?? config?.current_month ?? 'May';
  const year = selectedYear ?? config?.current_year ?? 2026;

  const owners = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const dues = buildPendingDues(owners, payments, month, year);
  const stats = getFlatStats(owners, payments, month, year);

  const pending = dues.filter(d => !d.paid);
  const paid = dues.filter(d => d.paid);
  const totalPending = pending.reduce((s, d) => s + d.monthlyCharge, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>⏳ Pending Dues</h1>
          <p className="page-subtitle">Outstanding maintenance dues report</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={month} onChange={e => setSelectedMonth(e.target.value)} id="dues-month-select">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={year} onChange={e => setSelectedYear(Number(e.target.value))} id="dues-year-select">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Badges */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="stat-card red" style={{ flex: 1, minWidth: 180 }}>
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pending} flats</div>
            <div className="stat-change down">{formatCurrency(totalPending)} due</div>
          </div>
        </div>
        <div className="stat-card green" style={{ flex: 1, minWidth: 180 }}>
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-label">Paid</div>
            <div className="stat-value">{stats.paid} flats</div>
            <div className="stat-change up">{formatCurrency(paid.reduce((s, d) => s + d.amountPaid, 0))} collected</div>
          </div>
        </div>
        <div className="stat-card gold" style={{ flex: 1, minWidth: 180 }}>
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <div className="stat-label">Inactive</div>
            <div className="stat-value">{stats.inactive} flats</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Excluded from dues</div>
          </div>
        </div>
      </div>

      {/* Pending Table */}
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>❌ Pending Flats</h3>
            <span className="badge badge-danger">{pending.length}</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Flat No</th><th>Owner</th><th>Amount Due</th><th>Status</th></tr></thead>
              <tbody>
                {pending.map(d => (
                  <tr key={d.flatNo}>
                    <td><strong>Flat {d.flatNo}</strong></td>
                    <td>{d.ownerName}</td>
                    <td className="rupee" style={{ color: 'var(--danger)' }}>{formatCurrency(d.monthlyCharge)}</td>
                    <td><span className="badge badge-danger">❌ PENDING</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>✅ Paid Flats</h3>
          <span className="badge badge-success">{paid.length}</span>
        </div>
        {loading ? <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner" /></div> :
          paid.length === 0 ? <div className="empty-state"><div className="empty-icon">📭</div><p>No payments recorded yet for {month} {year}.</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Flat No</th><th>Owner</th><th>Amount Paid</th><th>Date</th><th>Mode</th></tr></thead>
              <tbody>
                {paid.map(d => (
                  <tr key={d.flatNo}>
                    <td><strong>Flat {d.flatNo}</strong></td>
                    <td>{d.ownerName}</td>
                    <td className="rupee" style={{ color: 'var(--success)' }}>{formatCurrency(d.amountPaid)}</td>
                    <td>{d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td><span className="badge badge-accent">{d.paymentMode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
