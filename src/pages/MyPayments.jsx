import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, formatDate, MONTHS } from '../utils/formatters';
import { getFlatPayments } from '../utils/calculations';
import Icon from '../components/Icon';
import { generateReceipt } from '../utils/receiptUtils';

function mapPayment(p) {
  return {
    ...p,
    flatNo:      p.flat_no,
    ownerName:   p.owner_name,
    amountPaid:  p.amount_paid,
    paymentDate: p.payment_date,
    paymentMode: p.payment_mode,
  };
}

export default function MyPayments() {
  const { user }    = useAuth();
  const { config }  = useConfig();
  const { data: rawPayments, loading } = useSupabaseTable('payments');

  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear,  setSelectedYear]  = useState('All');

  const payments    = rawPayments.map(mapPayment);
  const allMine     = getFlatPayments(payments, user?.flatNo);
  const allTimePaid = allMine.reduce((s, p) => s + Number(p.amountPaid || 0), 0);

  let myPayments = allMine;
  if (selectedMonth !== 'All') myPayments = myPayments.filter(p => p.month === selectedMonth);
  if (selectedYear  !== 'All') myPayments = myPayments.filter(p => p.year === Number(selectedYear));

  const filteredTotal = myPayments.reduce((s, p) => s + Number(p.amountPaid || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Icon name="wallet" size={24} /> My Payments</h1>
          <p className="page-subtitle">Flat {user?.flatNo} &mdash; {user?.ownerName}</p>
        </div>
        <div className="flex gap-1 items-center">
          <select className="form-select" style={{ width: 'auto' }} value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}>
            <option value="All">All Months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={selectedYear}
            onChange={e => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}>
            <option value="All">All Years</option>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <div className="kpi-label">Total Paid (All Time)</div>
            <div className="kpi-icon"><Icon name="money" size={18} /></div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(allTimePaid)}</div>
          <div className="kpi-meta"><span className="kpi-trend up">{allMine.length} payment{allMine.length !== 1 ? 's' : ''}</span></div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div className="kpi-label">
              {selectedMonth === 'All' && selectedYear === 'All' ? 'All Payments' : 'Filtered Total'}
            </div>
            <div className="kpi-icon"><Icon name="filter" size={18} /></div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(filteredTotal)}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">{myPayments.length} record{myPayments.length !== 1 ? 's' : ''}</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Icon name="receipt" size={16} /> Payment History
          </span>
          {myPayments.length > 0 && (
            <span className="badge badge-success">
              <Icon name="check" size={11} /> {myPayments.length} records
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner lg" /></div>
        ) : myPayments.length === 0 ? (
          <div className="empty-state">
            <Icon name="wallet" size={48} className="empty-state-icon" />
            <h3>No Payments Found</h3>
            <p>No payment records for Flat {user?.flatNo}{selectedMonth !== 'All' ? ` in ${selectedMonth}` : ''}.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Period</th>
                  <th>Amount Paid</th>
                  <th>Payment Date</th>
                  <th>Mode</th>
                  <th>Remarks</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {myPayments.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td><strong>{p.month} {p.year}</strong></td>
                    <td className="rupee" style={{ color: 'var(--success)' }}>
                      <strong>{formatCurrency(p.amountPaid)}</strong>
                    </td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td><span className="badge badge-accent">{p.paymentMode}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {p.remarks || '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem', gap: '0.35rem', display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => generateReceipt(p, config)}
                        title="Download / Print Receipt"
                      >
                        <Icon name="download" size={13} /> Receipt
                      </button>
                    </td>
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
