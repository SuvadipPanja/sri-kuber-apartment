import { useRef, useLayoutEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import './monthly-report.css';

const fmtDateShort = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-IN', { month: 'short' });
  return `${day}-${mon}`;
};

/**
 * Monthly maintenance statement — matches society PDF/WhatsApp report layout.
 */
export default function MonthlyReportDocument({
  reportRef,
  societyName = 'SRI KUBER APARTMENT',
  month,
  year,
  generatedOn,
  carryForward = 0,
  carryForwardLabel,
  collected = 0,
  otherIncome = 0,
  spent = 0,
  netBalance = 0,
  dues = [],
  monthExpenses = [],
  fitOnePage = true,
}) {
  const innerRef = useRef(null);

  const setRef = (node) => {
    innerRef.current = node;
    if (reportRef) {
      if (typeof reportRef === 'function') reportRef(node);
      else reportRef.current = node;
    }
  };

  const paid = dues.filter((d) => d.paid);
  const pending = dues.filter((d) => !d.paid);
  const totalBill = monthExpenses.reduce((s, e) => s + Number(e.billAmount || e.bill_amount || 0), 0);
  const totalBuilder = monthExpenses.reduce((s, e) => s + Number(e.builderContribution || e.builder_contribution || 0), 0);
  const totalNetExp = monthExpenses.reduce((s, e) => s + Number(e.netExpense || e.net_expense || 0), 0);

  const rowCount = dues.length + monthExpenses.length;

  useLayoutEffect(() => {
    if (!fitOnePage || !innerRef.current) return;

    const el = innerRef.current;
    const SCREEN_BASE = 14;

    const fit = (forPrint = false) => {
      const isPrint = forPrint || window.matchMedia('print').matches;

      if (!isPrint) {
        el.style.setProperty('--mr-base', `${SCREEN_BASE}px`);
        return;
      }

      el.style.fontSize = '';
      const maxH = 1050;
      let size = rowCount > 12 ? 9 : rowCount > 8 ? 9.5 : rowCount > 5 ? 10 : 10.5;
      el.style.setProperty('--mr-base', `${size}px`);
      let guard = 0;
      while (el.scrollHeight > maxH && size > 6 && guard < 20) {
        size -= 0.4;
        el.style.setProperty('--mr-base', `${size}px`);
        guard += 1;
      }
    };

    const onBeforePrint = () => fit(true);
    const onAfterPrint = () => fit(false);

    fit();
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [fitOnePage, rowCount, month, year, dues.length, monthExpenses.length]);

  return (
    <div ref={setRef} className="monthly-report">
      <header className="mr-header">
        <div className="mr-header-icon" aria-hidden>🏠</div>
        <h1 className="mr-header-title">{societyName.toUpperCase()}</h1>
        <p className="mr-header-sub">Monthly Maintenance Statement</p>
      </header>
      <div className="mr-info-bar">
        <span className="mr-month-pill">📅 Month: {month} {year}</span>
        <span>Generated: {generatedOn}</span>
      </div>

      {/* Financial Summary */}
      <section>
        <div className="mr-section-bar financial">💰 Financial Summary</div>
        <div className="mr-section-body">
          <div className="mr-fin-row">
            <span className="mr-fin-label">Previous Month Carry Forward</span>
            <span className="mr-fin-amt neutral">{formatCurrency(carryForward)}</span>
          </div>
          {carryForwardLabel && (
            <div className="mr-fin-subnote">{carryForwardLabel}</div>
          )}
          <div className="mr-fin-row">
            <span className="mr-fin-label"><span className="mr-fin-amt pos">+</span> Maintenance Collection</span>
            <span className="mr-fin-amt pos">{formatCurrency(collected)}</span>
          </div>
          <div className="mr-fin-row">
            <span className="mr-fin-label"><span className="mr-fin-amt pos">+</span> Other Income / Donations</span>
            <span className="mr-fin-amt pos">{formatCurrency(otherIncome)}</span>
          </div>
          <div className="mr-fin-row">
            <span className="mr-fin-label"><span className="mr-fin-amt neg">−</span> Total Expenses</span>
            <span className="mr-fin-amt neg">{formatCurrency(spent)}</span>
          </div>
          <div className="mr-fin-net">
            <span>💵 NET BALANCE (Closing)</span>
            <span>{formatCurrency(netBalance)}</span>
          </div>
        </div>
      </section>

      {/* Payment Details */}
      <section>
        <div className="mr-section-bar payments">📋 Maintenance Payment Details</div>
        <div className="mr-section-body">
          {dues.length === 0 ? (
            <p className="mr-empty-note">No payment records for this month.</p>
          ) : (
            <>
              <table className="mr-table payments">
                <thead>
                  <tr>
                    <th>Flat No</th>
                    <th>Owner Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.map((d) => (
                    <tr key={d.flatNo}>
                      <td><strong>Flat-{d.flatNo}</strong></td>
                      <td>{d.ownerName}</td>
                      <td className="amt">{d.paid ? formatCurrency(d.amountPaid) : '—'}</td>
                      <td>{fmtDateShort(d.paymentDate)}</td>
                      <td>{d.paymentMode || '—'}</td>
                      <td>
                        {d.paid ? (
                          <span className="mr-status-paid">✅ Paid</span>
                        ) : (
                          <span className="mr-status-pending">❌ Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mr-table-footer payments">
                <span>TOTAL Collected so far</span>
                <span>{formatCurrency(collected)}</span>
                <span>Paid: {paid.length} / Pending: {pending.length}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Expense Details */}
      <section>
        <div className="mr-section-bar expenses">🧾 Expense Details</div>
        <div className="mr-section-body">
          {monthExpenses.length === 0 ? (
            <p className="mr-empty-note">No expense records for this month.</p>
          ) : (
            <>
              <table className="mr-table expenses">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Type</th>
                    <th>Bill Amt</th>
                    <th>Builder Contribution</th>
                    <th>Net Amount</th>
                    <th>Paid To</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.map((e) => (
                    <tr key={e.id}>
                      <td>{fmtDateShort(e.expense_date || e.expenseDate)}</td>
                      <td>{e.expenseType || e.expense_type}</td>
                      <td className="amt">{formatCurrency(e.billAmount ?? e.bill_amount)}</td>
                      <td className="amt">
                        {(e.builderContribution ?? e.builder_contribution) > 0
                          ? formatCurrency(e.builderContribution ?? e.builder_contribution)
                          : '₹0'}
                      </td>
                      <td className="amt">{formatCurrency(e.netExpense ?? e.net_expense)}</td>
                      <td>{e.paidTo || e.paid_to || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mr-table-footer expenses">
                <span>TOTAL</span>
                <div className="mr-table-footer-totals">
                  <span>Bill: {formatCurrency(totalBill)}</span>
                  <span>Builder: {formatCurrency(totalBuilder)}</span>
                  <span>Net: {formatCurrency(totalNetExp)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export function buildReportShareTitle(month, year) {
  return `Monthly Report '${month} ${year}'`;
}
