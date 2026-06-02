import { useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency } from '../utils/formatters';
import {
  buildPendingDues, totalCollection, totalExpenses,
  totalOtherIncome, calculateNetBalance,
} from '../utils/calculations';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import MonthYearFilter from '../components/ui/MonthYearFilter';

const MONTHS_ORDER = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function getPrevMonthYear(month, year) {
  if (month === 'All' || year === 'All') return null;
  const idx = MONTHS_ORDER.indexOf(month);
  if (idx <= 0) return { month: 'December', year: Number(year) - 1 };
  return { month: MONTHS_ORDER[idx - 1], year: Number(year) };
}

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapExpense(e) { return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

const fmtDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function PrintableStatement() {
  const { config } = useConfig();
  const { data: rawOwners }   = useSupabaseTable('owners');
  const { data: rawPayments } = useSupabaseTable('payments');
  const { data: rawExpenses } = useSupabaseTable('expenses');
  const { data: rawIncome }   = useSupabaseTable('income');

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear,  setSelectedYear]  = useState(null);

  const month = selectedMonth ?? config?.current_month ?? 'May';
  const year  = selectedYear  ?? config?.current_year  ?? 2026;

  const owners   = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const expenses = rawExpenses.map(mapExpense);
  const income   = rawIncome;

  const prev          = getPrevMonthYear(month, year);
  const prevOpenBal   = prev ? (config?.carry_forward?.[`${prev.month}-${prev.year}`] || 0) : 0;
  const prevCollected = prev ? totalCollection(payments, prev.month, prev.year) : 0;
  const prevSpent     = prev ? totalExpenses(expenses, prev.month, prev.year) : 0;
  const prevOtherInc  = prev ? totalOtherIncome(income, prev.month, prev.year) : 0;
  const carryForward  = prev ? (prevOpenBal + prevCollected + prevOtherInc - prevSpent) : 0;

  const manualOpening  = config?.carry_forward?.[`${month}-${year}`] || 0;
  const openingBalance = (prev && month !== 'All' && year !== 'All') ? carryForward : manualOpening;

  const collected   = totalCollection(payments, month, year);
  const spent       = totalExpenses(expenses, month, year);
  const otherIncome = totalOtherIncome(income, month, year);
  const netBalance  = calculateNetBalance(payments, expenses, income, month, year, openingBalance);
  const dues        = buildPendingDues(owners, payments, month, year);

  const monthExpenses = expenses.filter(e => e.month === month && e.year === Number(year));
  const paid    = dues.filter(d => d.paid);
  const pending = dues.filter(d => !d.paid);

  const societyName = config?.society_name || 'Sri Kuber Apartment';
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => window.print();

  const handleWhatsAppShare = () => {
    let msg = `*${societyName}*\n`;
    msg += `*Monthly Statement — ${month} ${year}*\n`;
    msg += `Generated: ${generatedOn}\n`;
    msg += `─────────────────────\n\n`;
    if (prev) msg += `(→) Carry Forward (${prev.month}): ${formatCurrency(carryForward)}\n`;
    msg += `(+) Collection:   ${formatCurrency(collected)}\n`;
    msg += `(+) Other Income: ${formatCurrency(otherIncome)}\n`;
    msg += `(-) Expenses:     ${formatCurrency(spent)}\n`;
    msg += `*Net Balance:     ${formatCurrency(netBalance)}*\n\n`;
    msg += `*Payment Status (${paid.length} Paid / ${pending.length} Pending)*\n`;
    dues.forEach(d => {
      msg += `${d.paid ? '✅' : '❌'} Flat ${d.flatNo} — ${d.ownerName}`;
      if (d.paid) msg += ` — ${formatCurrency(d.amountPaid)}`;
      msg += '\n';
    });
    if (monthExpenses.length > 0) {
      msg += `\n*Expenses (${monthExpenses.length} entries)*\n`;
      monthExpenses.forEach(e => { msg += `• ${e.expenseType}: ${formatCurrency(e.netExpense)}\n`; });
    }
    msg += `\n_Sent from ${societyName} Portal_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const pCell = { padding: '0.55rem 1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.84rem', color: 'var(--text-primary)', verticalAlign: 'middle' };
  const pHead = { padding: '0.55rem 1rem', fontSize: '0.69rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' };

  return (
    <div>
      <div className="no-print">
        <PageShell
          icon="printer"
          title="Statement & Reports"
          subtitle="Print or share the monthly maintenance statement"
          actions={
            <>
              <MonthYearFilter
                month={month}
                year={year}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
                showAllMonths={false}
                showAllYears={false}
              />
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <Icon name="printer" size={16} /> Print / PDF
              </button>
              <button type="button" className="btn btn-success" onClick={handleWhatsAppShare}>
                <Icon name="share" size={16} /> WhatsApp
              </button>
            </>
          }
        />
      </div>

      {/* Document */}
      <div className="card" style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Document Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-white)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            {societyName}
          </div>
          {config?.address && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
              {config.address}{config.city ? `, ${config.city}` : ''}
            </div>
          )}
          <div style={{ marginTop: '0.8rem', display: 'inline-block', background: 'var(--primary-glow)', border: '1px solid var(--border-bright)', borderRadius: 'var(--r-lg)', padding: '0.4rem 1.25rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-light)' }}>
              Monthly Maintenance Statement — {month} {year}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Generated: {generatedOn}
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="card-title" style={{ marginBottom: '0.85rem' }}>
            <Icon name="chart" size={15} /> Financial Summary
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <tbody>
              {prev && (
                <tr style={{ background: 'rgba(245,158,11,0.06)' }}>
                  <td style={{ ...pCell, color: 'var(--gold)', fontWeight: 600 }}>
                    <Icon name="trendUp" size={14} style={{ display:'inline', verticalAlign:'middle', marginRight: 6 }} />
                    Carry Forward (from {prev.month} {prev.year})
                  </td>
                  <td style={{ ...pCell, textAlign:'right', fontWeight:700, color: carryForward >= 0 ? 'var(--gold)' : 'var(--danger)', fontFamily:'var(--font-display)', fontSize:'0.95rem' }}>
                    {formatCurrency(carryForward)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={pCell}><span style={{ color:'var(--success)', marginRight:6, fontWeight:700 }}>+</span> Maintenance Collection</td>
                <td style={{ ...pCell, textAlign:'right', fontWeight:600, color:'var(--success)', fontFamily:'var(--font-display)' }}>{formatCurrency(collected)}</td>
              </tr>
              <tr>
                <td style={pCell}><span style={{ color:'var(--accent)', marginRight:6, fontWeight:700 }}>+</span> Other Income</td>
                <td style={{ ...pCell, textAlign:'right', fontWeight:600, color:'var(--accent)', fontFamily:'var(--font-display)' }}>{formatCurrency(otherIncome)}</td>
              </tr>
              <tr>
                <td style={pCell}><span style={{ color:'var(--danger)', marginRight:6, fontWeight:700 }}>−</span> Total Expenses</td>
                <td style={{ ...pCell, textAlign:'right', fontWeight:600, color:'var(--danger)', fontFamily:'var(--font-display)' }}>{formatCurrency(spent)}</td>
              </tr>
              <tr style={{ background:'rgba(59,130,246,0.07)', borderTop:'2px solid var(--border)' }}>
                <td style={{ ...pCell, fontWeight:800, color:'var(--text-white)', fontSize:'0.96rem' }}>
                  <Icon name="wallet" size={15} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />
                  Net Balance
                </td>
                <td style={{ ...pCell, textAlign:'right', fontWeight:800, color: netBalance >= 0 ? 'var(--primary-light)' : 'var(--danger)', fontSize:'1.1rem', fontFamily:'var(--font-display)' }}>
                  {formatCurrency(netBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Records */}
        <div style={{ marginBottom:'1.75rem' }}>
          <div className="flex-between mb-2">
            <div className="card-title">
              <Icon name="wallet" size={15} /> Payment Records
            </div>
            <div className="flex gap-1">
              <span className="badge badge-success">{paid.length} Paid</span>
              {pending.length > 0 && <span className="badge badge-danger">{pending.length} Pending</span>}
            </div>
          </div>
          <div className="table-scroll">
            <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
              <thead>
                <tr>{['Flat','Owner','Amount','Date','Mode','Status'].map(h => <th key={h} style={pHead}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {dues.map(d => (
                  <tr key={d.flatNo}>
                    <td style={{ ...pCell, fontWeight:700 }}>Flat {d.flatNo}</td>
                    <td style={pCell}>{d.ownerName}</td>
                    <td style={{ ...pCell, fontFamily:'var(--font-display)', fontWeight:600 }}>{d.paid ? formatCurrency(d.amountPaid) : '—'}</td>
                    <td style={{ ...pCell, color:'var(--text-muted)' }}>{fmtDate(d.paymentDate)}</td>
                    <td style={pCell}>{d.paymentMode ? <span className="tag">{d.paymentMode}</span> : '—'}</td>
                    <td style={pCell}><span className={`badge ${d.paid ? 'badge-success' : 'badge-danger'}`}>{d.paid ? 'Paid' : 'Pending'}</span></td>
                  </tr>
                ))}
                <tr style={{ background:'var(--bg-elevated)', fontWeight:700 }}>
                  <td colSpan={2} style={{ ...pCell, fontWeight:700 }}>Total Collected</td>
                  <td style={{ ...pCell, fontFamily:'var(--font-display)', fontWeight:800, color:'var(--success)' }} colSpan={4}>{formatCurrency(collected)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Records */}
        <div style={{ marginBottom:'1.75rem' }}>
          <div className="flex-between mb-2">
            <div className="card-title">
              <Icon name="expense" size={15} /> Expense Records
            </div>
            <span className="badge badge-muted">{monthExpenses.length} entries</span>
          </div>
          {monthExpenses.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', padding:'0.5rem 0' }}>No expense records for this month.</p>
          ) : (
            <div className="table-scroll">
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
                <thead>
                  <tr>{['Date','Description','Bill Amt','Builder','Net Expense','Paid To'].map(h => <th key={h} style={pHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {monthExpenses.map(e => (
                    <tr key={e.id}>
                      <td style={{ ...pCell, color:'var(--text-muted)' }}>{fmtDate(e.expense_date)}</td>
                      <td style={{ ...pCell, fontWeight:600 }}>{e.expenseType}</td>
                      <td style={{ ...pCell, fontFamily:'var(--font-display)' }}>{formatCurrency(e.billAmount)}</td>
                      <td style={{ ...pCell, fontFamily:'var(--font-display)', color:'var(--accent)' }}>{e.builderContribution > 0 ? formatCurrency(e.builderContribution) : '—'}</td>
                      <td style={{ ...pCell, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--danger)' }}>{formatCurrency(e.netExpense)}</td>
                      <td style={{ ...pCell, color:'var(--text-muted)' }}>{e.paidTo || '—'}</td>
                    </tr>
                  ))}
                  <tr style={{ background:'var(--bg-elevated)', fontWeight:700 }}>
                    <td colSpan={4} style={{ ...pCell, fontWeight:700 }}>Total Net Expense</td>
                    <td style={{ ...pCell, fontFamily:'var(--font-display)', fontWeight:800, color:'var(--danger)' }} colSpan={2}>{formatCurrency(spent)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signature Footer */}
        <div style={{ borderTop:'2px solid var(--border)', paddingTop:'1.25rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3rem', marginBottom:'1rem' }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'2.5rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Prepared By</div>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:'0.4rem', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                Secretary — {societyName}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'2.5rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Verified By</div>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:'0.4rem', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                Date: {generatedOn}
              </div>
            </div>
          </div>
          <div style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--text-muted)', borderTop:'1px solid var(--border-subtle)', paddingTop:'0.75rem' }}>
            {societyName} · Society Maintenance Management System · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
