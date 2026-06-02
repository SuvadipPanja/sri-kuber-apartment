import { useState } from 'react';
import { useSupabaseTable } from '../hooks/useSupabase';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getMonthExpenses, totalExpenses } from '../utils/calculations';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import MonthYearFilter from '../components/ui/MonthYearFilter';
import EmptyState from '../components/ui/EmptyState';

function mapExpense(e) {
  return {
    ...e,
    expenseType: e.expense_type,
    billAmount: e.bill_amount,
    builderContribution: e.builder_contribution,
    netExpense: e.net_expense,
    paidTo: e.paid_to,
    attachmentUrl: e.attachment_url || null,
  };
}

export default function Expenses() {
  const { data: rawExpenses, loading } = useSupabaseTable('expenses');

  const { month, year, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriodFilter();
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const expenses      = rawExpenses.map(mapExpense);
  const monthExpenses = getMonthExpenses(expenses, month, year);
  const total         = totalExpenses(expenses, month, year);
  const totalBill     = monthExpenses.reduce((s, e) => s + Number(e.billAmount || 0), 0);
  const totalBuilder  = monthExpenses.reduce((s, e) => s + Number(e.builderContribution || 0), 0);

  return (
    <PageShell
      icon="expense"
      title="Expenses"
      subtitle="Society expenditure records"
      actions={
        <MonthYearFilter
          month={month}
          year={year}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      }
    >
      {/* KPI Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="kpi-card kpi-red">
          <div className="kpi-top">
            <div className="kpi-label">Total Bill</div>
            <div className="kpi-icon"><Icon name="receipt" size={18} /></div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(totalBill)}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">Gross amount</span></div>
        </div>

        <div className="kpi-card kpi-accent">
          <div className="kpi-top">
            <div className="kpi-label">Builder Paid</div>
            <div className="kpi-icon"><Icon name="building" size={18} /></div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(totalBuilder)}</div>
          <div className="kpi-meta"><span className="kpi-trend up">Contribution</span></div>
        </div>

        <div className="kpi-card kpi-red" style={{ '--kpi-color': 'var(--danger)' }}>
          <div className="kpi-top">
            <div className="kpi-label">Net Expense</div>
            <div className="kpi-icon"><Icon name="expense" size={18} /></div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(total)}</div>
          <div className="kpi-meta"><span className="kpi-trend down">Paid by society</span></div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div className="kpi-label">Entries</div>
            <div className="kpi-icon"><Icon name="notice" size={18} /></div>
          </div>
          <div className="kpi-value">{monthExpenses.length}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">{month} {year}</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Icon name="receipt" size={16} /> {month} {year} — Expense Records</span>
          {monthExpenses.some(e => e.attachmentUrl) && (
            <span className="badge badge-accent">
              <Icon name="paperclip" size={11} /> {monthExpenses.filter(e => e.attachmentUrl).length} with bills
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner lg" /></div>
        ) : monthExpenses.length === 0 ? (
          <EmptyState
            icon="expense"
            title="No Expenses"
            description={`No expense records for ${month} ${year}.`}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Expense Type</th>
                  <th>Bill Amt</th><th>Builder</th><th>Net Expense</th>
                  <th>Paid To</th><th>Remarks</th><th>Bill</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
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
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{e.remarks || '—'}</td>
                    <td>
                      {e.attachmentUrl ? (
                        <button className="attach-existing" onClick={() => setLightboxUrl(e.attachmentUrl)}>
                          <Icon name="paperclip" size={13} /> View
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="table-total-row">
                  <td colSpan={3}><strong>TOTAL</strong></td>
                  <td className="rupee"><strong>{formatCurrency(totalBill)}</strong></td>
                  <td className="rupee"><strong style={{ color: 'var(--accent)' }}>{formatCurrency(totalBuilder)}</strong></td>
                  <td className="rupee"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(total)}</strong></td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          {lightboxUrl.includes('.pdf') ? (
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--r-xl)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <Icon name="paperclip" size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>PDF attachment</p>
              <a href={lightboxUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                <Icon name="externalLink" size={16} /> Open PDF
              </a>
            </div>
          ) : (
            <img src={lightboxUrl} alt="Expense bill" className="lightbox-img" onClick={e => e.stopPropagation()} />
          )}
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>
            <Icon name="x" size={20} />
          </button>
        </div>
      )}
    </PageShell>
  );
}
