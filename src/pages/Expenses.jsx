import { useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, formatDate, MONTHS } from '../utils/formatters';
import { getMonthExpenses, totalExpenses } from '../utils/calculations';

function mapExpense(e) {
  return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to };
}

export default function Expenses() {
  const { config } = useConfig();
  const { data: rawExpenses, loading } = useSupabaseTable('expenses');

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const month = selectedMonth ?? config?.current_month ?? 'May';
  const year = selectedYear ?? config?.current_year ?? 2026;

  const expenses = rawExpenses.map(mapExpense);
  const monthExpenses = getMonthExpenses(expenses, month, year);
  const total = totalExpenses(expenses, month, year);
  const totalBill = monthExpenses.reduce((s, e) => s + Number(e.billAmount || 0), 0);
  const totalBuilder = monthExpenses.reduce((s, e) => s + Number(e.builderContribution || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📉 Expenses</h1>
          <p className="page-subtitle">Society expenditure records</p>
        </div>
        <div className="flex gap-1 items-center">
          <select className="form-select" style={{ width: 'auto' }} value={month} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="All">All Months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={year} onChange={e => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}>
            <option value="All">All Years</option>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="stat-card red" style={{ flex: 1, minWidth: 160 }}>
          <div className="stat-icon">🧾</div>
          <div className="stat-info">
            <div className="stat-label">Total Bill Amount</div>
            <div className="stat-value rupee">{formatCurrency(totalBill)}</div>
          </div>
        </div>
        <div className="stat-card blue" style={{ flex: 1, minWidth: 160 }}>
          <div className="stat-icon">🏗️</div>
          <div className="stat-info">
            <div className="stat-label">Builder Contribution</div>
            <div className="stat-value rupee">{formatCurrency(totalBuilder)}</div>
          </div>
        </div>
        <div className="stat-card red" style={{ flex: 1, minWidth: 160 }}>
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <div className="stat-label">Net Expense</div>
            <div className="stat-value rupee">{formatCurrency(total)}</div>
          </div>
        </div>
        <div className="stat-card gold" style={{ flex: 1, minWidth: 160 }}>
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-label">Total Entries</div>
            <div className="stat-value">{monthExpenses.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>
          📋 {month} {year} — Expense Records
        </h3>
        {loading ? <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner" /></div> :
          monthExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Expenses</h3>
              <p>No expense records for {month} {year}.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Expense Type</th><th>Bill Amt</th>
                    <th>Builder</th><th>Net Expense</th><th>Paid To</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.map((e, i) => (
                    <tr key={e.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
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
                      <td style={{ color: 'var(--text-muted)' }}>{e.remarks || '—'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <td colSpan={3}><strong>TOTAL</strong></td>
                    <td className="rupee"><strong>{formatCurrency(totalBill)}</strong></td>
                    <td className="rupee"><strong style={{ color: 'var(--accent)' }}>{formatCurrency(totalBuilder)}</strong></td>
                    <td className="rupee"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(total)}</strong></td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
