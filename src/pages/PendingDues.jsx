import { useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, formatDate, MONTHS } from '../utils/formatters';
import { buildPendingDues, getFlatStats } from '../utils/calculations';
import Icon from '../components/Icon';

function mapPayment(p) {
  return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode };
}
function mapOwner(o) {
  return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge };
}

export default function PendingDues() {
  const { config }  = useConfig();
  const { data: rawOwners }   = useSupabaseTable('owners');
  const { data: rawPayments, loading } = useSupabaseTable('payments');

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear,  setSelectedYear]  = useState(null);
  const [view, setView] = useState('all'); // 'all' | 'pending' | 'paid'

  const month = selectedMonth ?? config?.current_month ?? 'May';
  const year  = selectedYear  ?? config?.current_year  ?? 2026;

  const owners   = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const dues     = buildPendingDues(owners, payments, month, year);
  const stats    = getFlatStats(owners, payments, month, year);

  const pending      = dues.filter(d => !d.paid);
  const paid         = dues.filter(d => d.paid);
  const totalPending = pending.reduce((s, d) => s + d.monthlyCharge, 0);
  const totalPaid    = paid.reduce((s, d) => s + d.amountPaid, 0);
  const collectionRate = dues.length > 0 ? Math.round((paid.length / dues.length) * 100) : 0;

  const inactiveOwners = owners.filter(o => !o.active);

  let displayDues = dues;
  if (view === 'pending') displayDues = pending;
  if (view === 'paid')    displayDues = paid;

  // Sort: pending first in 'all' view
  if (view === 'all') {
    displayDues = [...pending, ...paid];
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Icon name="clock" size={24} /> Pending Dues</h1>
          <p className="page-subtitle">Maintenance collection status — {month} {year}</p>
        </div>
        <div className="flex gap-1 items-center">
          <select className="form-select" style={{ width: 'auto' }} value={month}
            onChange={e => setSelectedMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={year}
            onChange={e => setSelectedYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="kpi-card kpi-red">
          <div className="kpi-top">
            <div className="kpi-label">Pending</div>
            <div className="kpi-icon"><Icon name="clock" size={18} /></div>
          </div>
          <div className="kpi-value">{stats.pending}</div>
          <div className="kpi-meta">
            <span className="kpi-trend down">
              {formatCurrency(totalPending)} outstanding
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <div className="kpi-label">Paid</div>
            <div className="kpi-icon"><Icon name="check" size={18} /></div>
          </div>
          <div className="kpi-value">{stats.paid}</div>
          <div className="kpi-meta">
            <span className="kpi-trend up">
              {formatCurrency(totalPaid)} collected
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div className="kpi-label">Collection Rate</div>
            <div className="kpi-icon"><Icon name="chart" size={18} /></div>
          </div>
          <div className="kpi-value">{collectionRate}%</div>
          <div className="kpi-meta">
            <span className={`kpi-trend ${collectionRate >= 80 ? 'up' : collectionRate >= 50 ? 'flat' : 'down'}`}>
              {paid.length} of {dues.length} flats
            </span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--text-muted)' }}>
          <div className="kpi-top">
            <div className="kpi-label">Inactive Flats</div>
            <div className="kpi-icon"><Icon name="building" size={18} /></div>
          </div>
          <div className="kpi-value">{stats.inactive}</div>
          <div className="kpi-meta">
            <span className="kpi-trend flat">Excluded from dues</span>
          </div>
        </div>
      </div>

      {/* ── Collection Progress ── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            <Icon name="chart" size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Collection Progress — {month} {year}
          </span>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: collectionRate === 100 ? 'var(--success)' : 'var(--text-primary)' }}>
            {collectionRate}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div
            className={`progress-fill ${collectionRate === 100 ? 'green' : collectionRate >= 60 ? 'blue' : 'red'}`}
            style={{ width: collectionRate + '%' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--success)' }}>
            <Icon name="check" size={12} /> Collected: <strong>{formatCurrency(totalPaid)}</strong>
          </span>
          <span style={{ color: 'var(--danger)' }}>
            <Icon name="clock" size={12} /> Pending: <strong>{formatCurrency(totalPending)}</strong>
          </span>
        </div>
      </div>

      {/* ── Flat Status Grid ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title"><Icon name="building" size={16} /> Unit Status Overview</span>
          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Paid
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
              Pending
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'inline-block' }} />
              Inactive
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner lg" /></div>
        ) : (
          <div className="flat-status-grid">
            {dues.map(d => (
              <div key={d.flatNo} className={`flat-chip ${d.paid ? 'chip-paid' : 'chip-pending'}`}>
                <div className="chip-status-icon">
                  <Icon name={d.paid ? 'check' : 'clock'} size={15} />
                </div>
                <div className="chip-flat-no">Flat {d.flatNo}</div>
                <div className="chip-owner">{d.ownerName}</div>
                <div className="chip-amount">
                  {d.paid
                    ? formatCurrency(d.amountPaid)
                    : <span style={{ color: 'var(--danger)' }}>{formatCurrency(d.monthlyCharge)} due</span>
                  }
                </div>
                <span className={`badge ${d.paid ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem', marginTop: 4 }}>
                  {d.paid ? 'PAID' : 'PENDING'}
                </span>
              </div>
            ))}
            {inactiveOwners.map(o => (
              <div key={o.flatNo} className="flat-chip chip-inactive">
                <div className="chip-status-icon">
                  <Icon name="x" size={15} />
                </div>
                <div className="chip-flat-no">Flat {o.flatNo}</div>
                <div className="chip-owner">{o.ownerName || '—'}</div>
                <div className="chip-amount" style={{ color: 'var(--text-muted)' }}>—</div>
                <span className="badge" style={{ fontSize: '0.65rem', marginTop: 4, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  INACTIVE
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detailed Table ── */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <span className="card-title"><Icon name="notice" size={16} /> Detailed Report</span>
          <div className="dues-tab-group">
            <button className={`dues-tab ${view === 'all'     ? 'active' : ''}`} onClick={() => setView('all')}>
              All <span className="tab-count">{dues.length}</span>
            </button>
            <button className={`dues-tab ${view === 'pending' ? 'active' : ''}`} onClick={() => setView('pending')}>
              Pending <span className="tab-count">{pending.length}</span>
            </button>
            <button className={`dues-tab ${view === 'paid'    ? 'active' : ''}`} onClick={() => setView('paid')}>
              Paid <span className="tab-count">{paid.length}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner lg" /></div>
        ) : displayDues.length === 0 ? (
          <div className="empty-state">
            <Icon name="check" size={48} className="empty-state-icon" />
            <h3>All Clear!</h3>
            <p>No {view === 'pending' ? 'pending' : ''} records for {month} {year}.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Flat</th>
                  <th>Owner</th>
                  <th>Monthly Charge</th>
                  <th>Amount Paid</th>
                  <th>Payment Date</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayDues.map((d, i) => (
                  <tr key={d.flatNo} style={!d.paid ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td><strong>Flat {d.flatNo}</strong></td>
                    <td>{d.ownerName}</td>
                    <td className="rupee" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(d.monthlyCharge)}
                    </td>
                    <td className="rupee" style={{ color: d.paid ? 'var(--success)' : 'var(--danger)' }}>
                      <strong>{d.paid ? formatCurrency(d.amountPaid) : '—'}</strong>
                    </td>
                    <td>
                      {d.paymentDate
                        ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td>
                      {d.paymentMode
                        ? <span className="badge badge-accent">{d.paymentMode}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td>
                      {d.paid
                        ? <span className="badge badge-success"><Icon name="check" size={10} /> PAID</span>
                        : <span className="badge badge-danger"><Icon name="clock" size={10} /> PENDING</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              {displayDues.length > 1 && (
                <tfoot>
                  <tr className="table-total-row">
                    <td colSpan={3}><strong>TOTAL</strong></td>
                    <td className="rupee">
                      <strong>{formatCurrency(displayDues.reduce((s, d) => s + d.monthlyCharge, 0))}</strong>
                    </td>
                    <td className="rupee">
                      <strong style={{ color: 'var(--success)' }}>
                        {formatCurrency(displayDues.filter(d => d.paid).reduce((s, d) => s + d.amountPaid, 0))}
                      </strong>
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
