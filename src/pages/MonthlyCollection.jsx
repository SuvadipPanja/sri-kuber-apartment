import { useSupabaseTable } from '../hooks/useSupabase';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { formatCurrency } from '../utils/formatters';
import { totalCollection, buildPendingDues } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import MonthYearFilter from '../components/ui/MonthYearFilter';

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function MonthlyCollection() {
  const { data: rawOwners, loading: ownersLoading } = useSupabaseTable('owners');
  const { data: rawPayments, loading: paymentsLoading } = useSupabaseTable('payments');

  const { month, year, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriodFilter();

  const owners = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  
  const dues = buildPendingDues(owners, payments, month, year);
  const collected = totalCollection(payments, month, year);
  const expected = owners.filter(o => o.active).reduce((sum, o) => sum + (month === 'All' ? o.monthlyCharge * 12 : o.monthlyCharge), 0);
  const pending = expected - collected;

  const paidFlats = dues.filter(d => d.paid).length;
  const pendingFlats = dues.filter(d => !d.paid).length;

  const chartData = [
    { name: 'Collected', amount: collected, fill: 'var(--success)' },
    { name: 'Pending',   amount: Math.max(0, pending), fill: 'var(--danger)' },
  ];

  return (
    <PageShell
      icon="calendar"
      title="Monthly Collection"
      subtitle="Track maintenance collection for specific periods"
      actions={
        <MonthYearFilter
          month={month}
          year={year}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      }
    >
      <div className="grid-2 mb-3">
        <div className="card">
          <h3 className="chart-title">Collection Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [formatCurrency(v), 'Amount']}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={30}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid-2" style={{ gap: '1rem' }}>
          <div className="kpi-card kpi-green flex-col justify-center h-full m-0">
            <div className="kpi-label">Total Collected</div>
            <div className="kpi-value rupee mt-1">{formatCurrency(collected)}</div>
            <div className="kpi-meta"><span className="kpi-trend up">↑ {paidFlats} flats paid</span></div>
          </div>
          <div className="kpi-card kpi-red flex-col justify-center h-full m-0">
            <div className="kpi-label">Pending Dues</div>
            <div className="kpi-value rupee mt-1">{formatCurrency(Math.max(0, pending))}</div>
            <div className="kpi-meta"><span className="kpi-trend down">↓ {pendingFlats} flats pending</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <div className="card-title"><Icon name="receipt" size={16} /> Detailed Status — {month} {year}</div>
          <span className="badge badge-primary">{owners.filter(o => o.active).length} Active Flats</span>
        </div>
        
        {(ownersLoading || paymentsLoading) ? <div className="flex-center p-3"><div className="spinner"></div></div> :
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Flat No</th><th>Owner</th><th>Expected</th><th>Status</th><th>Paid Amt</th><th>Date</th></tr></thead>
              <tbody>
                {dues.map(d => (
                  <tr key={d.flatNo}>
                    <td><strong>Flat {d.flatNo}</strong></td>
                    <td>{d.ownerName}</td>
                    <td className="rupee">{formatCurrency(d.monthlyCharge)}</td>
                    <td>
                      <span className={`badge ${d.paid ? 'badge-success' : 'badge-danger'}`}>
                        {d.paid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="rupee">{d.paid ? <span className="text-success-c">{formatCurrency(d.amountPaid)}</span> : '—'}</td>
                    <td className="text-muted-c">{d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </PageShell>
  );
}
