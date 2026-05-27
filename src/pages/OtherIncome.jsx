import { useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, formatDate, MONTHS } from '../utils/formatters';
import { totalOtherIncome } from '../utils/calculations';

export default function OtherIncome() {
  const { config } = useConfig();
  const { data: rawIncome, loading } = useSupabaseTable('income');

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const month = selectedMonth ?? config?.current_month ?? 'May';
  const year = selectedYear ?? config?.current_year ?? 2026;

  const monthIncome = rawIncome.filter(i => i.month === month && i.year === Number(year));
  const total = totalOtherIncome(rawIncome, month, year);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>💵 Other Income</h1>
          <p className="page-subtitle">Additional society income sources</p>
        </div>
        <div className="flex gap-1 items-center">
          <select className="form-select" style={{ width: 'auto' }} value={month} onChange={e => setSelectedMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={year} onChange={e => setSelectedYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="kpi-grid mb-3">
        <div className="kpi-card kpi-accent">
          <div className="kpi-top">
            <div className="kpi-label">Total Other Income</div>
            <div className="kpi-icon">💰</div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(total)}</div>
          <div className="kpi-meta"><span className="kpi-trend up">For {month} {year}</span></div>
        </div>
      </div>

      <div className="card">
        <h3 className="chart-title">📋 {month} {year} — Income Records</h3>
        {loading ? <div className="flex-center p-3"><div className="spinner"></div></div> :
          monthIncome.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No Other Income</h3>
              <p>No additional income recorded for {month} {year}.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Source</th><th>Amount</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {monthIncome.map((inc, i) => (
                    <tr key={inc.id}>
                      <td className="text-muted-c">{i + 1}</td>
                      <td>{formatDate(inc.income_date)}</td>
                      <td><strong>{inc.source}</strong></td>
                      <td className="rupee text-success-c"><strong>{formatCurrency(inc.amount)}</strong></td>
                      <td className="text-muted-c">{inc.remarks || '—'}</td>
                    </tr>
                  ))}
                  <tr className="table-total-row">
                    <td colSpan={3} className="text-right">TOTAL</td>
                    <td className="rupee text-success-c">{formatCurrency(total)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
