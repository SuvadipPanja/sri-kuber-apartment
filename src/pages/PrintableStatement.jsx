import { useRef, useState } from 'react';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import {
  buildPendingDues, totalCollection, totalExpenses,
  totalOtherIncome, calculateNetBalance,
} from '../utils/calculations';
import { shareReportAsImage } from '../utils/shareReportImage';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import MonthYearFilter from '../components/ui/MonthYearFilter';
import MonthlyReportDocument, { buildReportShareTitle } from '../components/reports/MonthlyReportDocument';
import { useToast } from '../context/ToastContext';

const MONTHS_ORDER = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function getPrevMonthYear(month, year) {
  if (month === 'All' || year === 'All') return null;
  const idx = MONTHS_ORDER.indexOf(month);
  if (idx <= 0) return { month: 'December', year: Number(year) - 1 };
  return { month: MONTHS_ORDER[idx - 1], year: Number(year) };
}

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapExpense(e) { return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to, expenseDate: e.expense_date }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function PrintableStatement() {
  const { addToast } = useToast();
  const { config } = useConfig();
  const { data: rawOwners }   = useSupabaseTable('owners');
  const { data: rawPayments } = useSupabaseTable('payments');
  const { data: rawExpenses } = useSupabaseTable('expenses');
  const { data: rawIncome }   = useSupabaseTable('income');

  const { month, year, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriodFilter();
  const reportRef = useRef(null);
  const [sharing, setSharing] = useState(false);

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

  const societyName = config?.society_name || 'SRI KUBER APARTMENT';
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const shareTitle = buildReportShareTitle(month, year);

  const handlePrint = () => window.print();

  const handleWhatsAppShare = async () => {
    setSharing(true);
    try {
      const result = await shareReportAsImage(reportRef.current, {
        title: shareTitle,
        filename: `Monthly-Report-${month}-${year}.png`,
      });
      addToast(
        result.method === 'share'
          ? 'Report shared — select WhatsApp from the share menu'
          : 'Report image downloaded — attach it in WhatsApp',
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Could not share report image', 'error');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <div className="no-print">
        <PageShell
          icon="printer"
          title="Statement & Reports"
          subtitle="Print or share the monthly maintenance statement as one-page report"
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
              <button type="button" className="btn btn-success" onClick={handleWhatsAppShare} disabled={sharing}>
                <Icon name="share" size={16} /> {sharing ? 'Preparing…' : 'WhatsApp'}
              </button>
            </>
          }
        />
      </div>

      <div className="monthly-report-wrap">
        <MonthlyReportDocument
          reportRef={reportRef}
          societyName={societyName}
          month={month}
          year={year}
          generatedOn={generatedOn}
          carryForward={openingBalance}
          carryForwardLabel={prev ? `(From ${prev.month} ${prev.year} closing)` : null}
          collected={collected}
          otherIncome={otherIncome}
          spent={spent}
          netBalance={netBalance}
          dues={dues}
          monthExpenses={monthExpenses}
        />
      </div>
    </div>
  );
}
