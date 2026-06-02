import { useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { buildPendingDues, totalCollection, totalExpenses, totalOtherIncome, calculateNetBalance } from '../utils/calculations';
import { useToast } from '../context/ToastContext';

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapExpense(e) { return { ...e, expenseType: e.expense_type, netExpense: e.net_expense }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function WhatsAppShare() {
  const { addToast } = useToast();
  const { config } = useConfig();
  const { data: rawOwners } = useSupabaseTable('owners');
  const { data: rawPayments } = useSupabaseTable('payments');
  const { data: rawExpenses } = useSupabaseTable('expenses');
  const { data: rawIncome } = useSupabaseTable('income');

  const { month, year, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriodFilter();
  const [copied, setCopied] = useState(false);

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

  const paid = dues.filter(d => d.paid);
  const pending = dues.filter(d => !d.paid);
  const monthExpenses = rawExpenses.filter(e => e.month === month && e.year === Number(year)).map(mapExpense);

  const line = '─'.repeat(34);

  const message = `🏠  ${config?.society_name || 'SRI KUBER APARTMENT'}
Maintenance Report — ${month.toUpperCase()} ${year}
${line}
🔄 Carry Fwd : ${formatCurrency(openingBalance)}
➕ Collection : ${formatCurrency(collected)}
➖ Expenses  : ${formatCurrency(spent)}
💵 NET BAL   : ${formatCurrency(netBalance)}
${line}
✅ PAID (${paid.length}):
${paid.map(d => `  ${d.flatNo} • ${d.ownerName} • ${formatCurrency(d.amountPaid)} • ${d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''} • ${d.paymentMode}`).join('\n')}
${line}
❌ PENDING (${pending.length}):
${pending.length > 0 ? pending.map(d => `  ${d.flatNo} • ${d.ownerName} • ${formatCurrency(d.monthlyCharge)} due`).join('\n') : '  None! All paid ✅'}
${line}
💸 EXPENSES:
${monthExpenses.length > 0 ? monthExpenses.map(e => `  • ${e.expenseType} — ${formatCurrency(e.netExpense)}`).join('\n') : '  No expenses this month'}
${line}
🙏 Kindly clear pending dues`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      addToast('Message copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('Could not copy automatically. Please select and copy manually.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📱 WhatsApp Share</h1>
          <p className="page-subtitle">Auto-generated message for society WhatsApp group</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={month} onChange={e => setSelectedMonth(e.target.value)} id="wa-month-select">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={year} onChange={e => setSelectedYear(Number(e.target.value))} id="wa-year-select">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>📋 Copy the message below and paste into WhatsApp</h3>
          <button
            className={`btn ${copied ? 'btn-success' : 'btn-accent'}`}
            onClick={handleCopy}
            id="copy-whatsapp-btn"
          >
            {copied ? '✅ Copied!' : '📋 Copy Message'}
          </button>
        </div>

        <div style={{
          background: '#1a2a1a',
          border: '1px solid rgba(37, 211, 102, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          color: '#e8f5e9',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
          maxHeight: 500,
          overflowY: 'auto',
        }}>
          {message}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success"
            id="open-whatsapp-btn"
          >
            💬 Open in WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
