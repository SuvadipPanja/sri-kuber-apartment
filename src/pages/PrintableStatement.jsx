import { useState, useRef } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { buildPendingDues, totalCollection, totalExpenses, totalOtherIncome, calculateNetBalance } from '../utils/calculations';
import Icon from '../components/Icon';

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapExpense(e) { return { ...e, expenseType: e.expense_type, netExpense: e.net_expense }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function PrintableStatement() {
  const { config } = useConfig();
  const { data: rawOwners } = useSupabaseTable('owners');
  const { data: rawPayments } = useSupabaseTable('payments');
  const { data: rawExpenses } = useSupabaseTable('expenses');
  const { data: rawIncome } = useSupabaseTable('income');

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const printRef = useRef();

  const month = selectedMonth ?? config?.current_month ?? 'May';
  const year = selectedYear ?? config?.current_year ?? 2026;

  const owners = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const expenses = rawExpenses.map(mapExpense);
  const income = rawIncome;

  const openingBalance = config?.carry_forward?.[`${month}-${year}`] || 0;
  const collected = totalCollection(payments, month, year);
  const spent = totalExpenses(expenses, month, year);
  const otherIncome = totalOtherIncome(income, month, year);
  const netBalance = calculateNetBalance(payments, expenses, income, month, year, openingBalance);
  const dues = buildPendingDues(owners, payments, month, year);

  const monthExpenses = expenses.filter(e => e.month === month && e.year === Number(year));
  const paid = dues.filter(d => d.paid);
  const pending = dues.filter(d => !d.paid);

  const handlePrint = () => window.print();

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const societyName = config?.society_name || 'Sri Kuber Apartment';
    let msg = `*${societyName}*\n`;
    msg += `*Monthly Statement — ${month} ${year}*\n`;
    msg += `Generated: ${new Date().toLocaleDateString('en-IN')}\n`;
    msg += `─────────────────\n\n`;

    msg += `*Financial Summary*\n`;
    msg += `Opening Balance: ${formatCurrency(openingBalance)}\n`;
    msg += `(+) Collection: ${formatCurrency(collected)}\n`;
    msg += `(+) Other Income: ${formatCurrency(otherIncome)}\n`;
    msg += `(-) Expenses: ${formatCurrency(spent)}\n`;
    msg += `*Net Balance: ${formatCurrency(netBalance)}*\n\n`;

    msg += `*Payment Status (${paid.length} Paid / ${pending.length} Pending)*\n`;
    dues.forEach(d => {
      const status = d.paid ? '✅' : '❌';
      msg += `${status} Flat ${d.flatNo} — ${d.ownerName}`;
      if (d.paid) msg += ` — ${formatCurrency(d.amountPaid)}`;
      msg += `\n`;
    });

    if (monthExpenses.length > 0) {
      msg += `\n*Expenses (${monthExpenses.length} entries)*\n`;
      monthExpenses.forEach(e => {
        msg += `• ${e.expenseType}: ${formatCurrency(e.netExpense)}\n`;
      });
    }

    msg += `\n_Sent from ${societyName} Portal_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div>
      <div className="page-header no-print">
        <div className="page-header-left">
          <h1 className="page-title"><Icon name="printer" size={24} /> Statement & Reports</h1>
          <p className="page-subtitle">Print or share monthly maintenance statement</p>
        </div>
        <div className="flex gap-1 items-center flex-wrap">
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={month} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="All">All Months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={year} onChange={e => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}>
            <option value="All">All Years</option>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Icon name="printer" size={16} /> Print / PDF
          </button>
          <button className="btn btn-success" onClick={handleWhatsAppShare}>
            <Icon name="share" size={16} /> WhatsApp
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div ref={printRef} className="print-page card" style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{config?.society_name || 'Sri Kuber Apartment'}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{config?.address}, {config?.city}</p>
          <h3 style={{ marginTop: '0.75rem', fontSize: '1.1rem', color: 'var(--primary-light)' }}>
            Monthly Maintenance Statement — {month} {year}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            ['Opening Balance', formatCurrency(openingBalance), ''],
            ['(+) Collection',  formatCurrency(collected),     'var(--success)'],
            ['(+) Other Income',formatCurrency(otherIncome),   'var(--accent)'],
            ['(-) Expenses',    formatCurrency(spent),         'var(--danger)'],
            ['Net Balance',     formatCurrency(netBalance),    'var(--primary-light)'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
              <strong style={{ color: color || 'var(--text-white)' }}>{val}</strong>
            </div>
          ))}
        </div>

        {/* Payments */}
        <div className="card-title mb-2"><Icon name="wallet" size={16} /> Payment Records</div>
        <div className="table-scroll" style={{ marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead><tr><th>Flat</th><th>Owner</th><th>Amount</th><th>Date</th><th>Mode</th><th>Status</th></tr></thead>
            <tbody>
              {dues.map(d => (
                <tr key={d.flatNo}>
                  <td><strong>Flat {d.flatNo}</strong></td>
                  <td>{d.ownerName}</td>
                  <td className="rupee">{d.paid ? formatCurrency(d.amountPaid) : '—'}</td>
                  <td>{d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td>{d.paymentMode || '—'}</td>
                  <td><span className={`badge ${d.paid ? 'badge-success' : 'badge-danger'}`}>{d.paid ? 'Paid' : 'Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expenses */}
        <div className="card-title mb-2"><Icon name="expense" size={16} /> Expense Records</div>
        <div className="table-scroll" style={{ marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Description</th><th>Bill Amt</th><th>Builder</th><th>Net Expense</th><th>Paid To</th></tr></thead>
            <tbody>
              {monthExpenses.map(e => (
                <tr key={e.id}>
                  <td>{e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td>{e.expenseType}</td>
                  <td className="rupee">{formatCurrency(e.bill_amount)}</td>
                  <td className="rupee">{e.builder_contribution > 0 ? formatCurrency(e.builder_contribution) : '—'}</td>
                  <td className="rupee" style={{ color: 'var(--danger)' }}>{formatCurrency(e.netExpense)}</td>
                  <td>{e.paid_to || '—'}</td>
                </tr>
              ))}
              {monthExpenses.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No expense records</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <p>{config?.society_name || 'Sri Kuber Apartment'} — Society Maintenance Management System</p>
          <p>Secretary: Suvadip Panja (Flat 301)</p>
        </div>
      </div>
    </div>
  );
}
