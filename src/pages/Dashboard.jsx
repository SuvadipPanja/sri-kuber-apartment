import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { getFirstName, getTimeGreeting } from '../utils/greetings';
import { totalCollection, totalExpenses, totalOtherIncome, calculateNetBalance, getFlatStats, buildPendingDues } from '../utils/calculations';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import MonthYearFilter from '../components/ui/MonthYearFilter';

const CHART = {
  paid:     '#22c55e',
  pending:  '#f43f5e',
  inactive: '#64748b',
  expected: '#0f766e',
  collected:'#22c55e',
  due:      '#f59e0b',
  expense:  '#f43f5e',
  netPos:   '#14b8a6',
  netNeg:   '#fb7185',
  opening:  '#eab308',
};

const MONTHS_ORDER = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatCompactCurrency(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
}

function ChartTooltip({ active, payload, label, isCount }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = label || item.payload?.name || item.name;
  const val = item.value ?? item.payload?.amount ?? 0;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{name}</div>
      <div className="chart-tooltip-value">{isCount ? `${val} flats` : formatCurrency(val)}</div>
    </div>
  );
}

function ChartEmpty({ message }) {
  return (
    <div className="chart-empty">
      <Icon name="chart" size={32} />
      <p>{message}</p>
    </div>
  );
}

function getPrevMonthYear(month, year) {
  if (month === 'All' || year === 'All') return null;
  const idx = MONTHS_ORDER.indexOf(month);
  if (idx <= 0) return { month: 'December', year: Number(year) - 1 };
  return { month: MONTHS_ORDER[idx - 1], year: Number(year) };
}

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapExpense(e) { return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function Dashboard() {
  const { user } = useAuth();
  const { config, loading: configLoading } = useConfig();
  const { data: rawOwners, loading: ownersLoading } = useSupabaseTable('owners');
  const { data: rawPayments, loading: paymentsLoading } = useSupabaseTable('payments');
  const { data: rawExpenses, loading: expensesLoading } = useSupabaseTable('expenses');
  const { data: rawIncome } = useSupabaseTable('income');
  const { data: notices } = useSupabaseTable('notices', q => q.order('created_at', { ascending: false }).limit(1));

  const { month, year, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriodFilter();

  const [dismissedNoticeId, setDismissedNoticeId] = useState(
    () => sessionStorage.getItem('ska_dismissed_notice') || ''
  );

  // Re-show banner when admin publishes a new notice (new id)
  const latestNotice = (() => {
    const now = new Date();
    return notices.find(n => !n.expires_at || new Date(n.expires_at) > now) || null;
  })();

  useEffect(() => {
    if (latestNotice && dismissedNoticeId && dismissedNoticeId !== latestNotice.id) {
      setDismissedNoticeId('');
      sessionStorage.removeItem('ska_dismissed_notice');
    }
  }, [latestNotice?.id, dismissedNoticeId]);

  const showNoticeBanner = latestNotice && dismissedNoticeId !== latestNotice.id;

  const dismissNotice = () => {
    if (!latestNotice) return;
    sessionStorage.setItem('ska_dismissed_notice', latestNotice.id);
    setDismissedNoticeId(latestNotice.id);
  };

  const owners   = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const expenses = rawExpenses.map(mapExpense);
  const income   = rawIncome;

  // --- Carry Forward: previous month's net balance ---
  const prev = getPrevMonthYear(month, year);
  const prevOpeningBal  = prev ? (config?.carry_forward?.[`${prev.month}-${prev.year}`] || 0) : 0;
  const prevCollected   = prev ? totalCollection(payments, prev.month, prev.year) : 0;
  const prevSpent       = prev ? totalExpenses(expenses, prev.month, prev.year) : 0;
  const prevOtherInc    = prev ? totalOtherIncome(income, prev.month, prev.year) : 0;
  const carryForward    = prev ? (prevOpeningBal + prevCollected + prevOtherInc - prevSpent) : 0;

  // Current month uses carry forward as effective opening balance
  const manualOpening   = config?.carry_forward?.[`${month}-${year}`] || 0;
  const openingBalance  = (prev && month !== 'All' && year !== 'All') ? carryForward : manualOpening;

  const collected  = totalCollection(payments, month, year);
  const spent      = totalExpenses(expenses, month, year);
  const otherIncome = totalOtherIncome(income, month, year);
  const netBalance  = calculateNetBalance(payments, expenses, income, month, year, openingBalance);
  const stats       = getFlatStats(owners, payments, month, year);
  const dues        = buildPendingDues(owners, payments, month, year);

  const isLoading = configLoading || ownersLoading || paymentsLoading || expensesLoading;

  const expectedCollection = owners
    .filter(o => o.active)
    .reduce((sum, o) => sum + (month === 'All' ? o.monthlyCharge * 12 : o.monthlyCharge), 0);
  const pendingAmount = Math.max(0, expectedCollection - collected);
  const collectionRate = stats.active > 0 ? Math.round((stats.paid / stats.active) * 100) : 0;

  const pieData = [
    { name: 'Paid', value: stats.paid, fill: CHART.paid },
    { name: 'Pending', value: stats.pending, fill: CHART.pending },
    ...(stats.inactive > 0 ? [{ name: 'Inactive', value: stats.inactive, fill: CHART.inactive }] : []),
  ].filter(d => d.value > 0);

  const financialData = [
    { name: 'Expected', amount: expectedCollection, fill: CHART.expected },
    { name: 'Collected', amount: collected, fill: CHART.collected },
    { name: 'Pending', amount: pendingAmount, fill: CHART.due },
    { name: 'Expenses', amount: spent, fill: CHART.expense },
    { name: 'Net Balance', amount: netBalance, fill: netBalance >= 0 ? CHART.netPos : CHART.netNeg },
  ];

  if (isLoading) return (
    <div className="loading-screen">
      <div className="loading-logo">SK</div>
      <div className="spinner lg"></div>
    </div>
  );

  return (
    <PageShell
      compact
      icon="dashboard"
      title="Dashboard"
      subtitle={user ? `${getTimeGreeting()}, ${getFirstName(user.ownerName)} · ${month} ${year}` : `Monthly summary for ${month} ${year}`}
      actions={
        <>
          {user && <span className="dashboard-flat-chip">Flat {user.flatNo}</span>}
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </>
      }
    >
      {/* Latest notice — dismissible; new notice id re-shows banner */}
      {showNoticeBanner && (
        <div className={`dashboard-notice-bar priority-${latestNotice.priority || 'normal'}`}>
          <Icon name="megaphone" size={14} />
          <div className="dashboard-notice-body">
            <strong>{latestNotice.title}</strong>
            <span>{latestNotice.content.length > 100 ? `${latestNotice.content.slice(0, 100)}…` : latestNotice.content}</span>
          </div>
          <button type="button" className="dashboard-notice-close" onClick={dismissNotice} aria-label="Dismiss notice">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {!showNoticeBanner && config?.announcement && !latestNotice && (
        <div className="dashboard-notice-bar priority-normal">
          <Icon name="megaphone" size={14} />
          <div className="dashboard-notice-body"><span>{config.announcement}</span></div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid dashboard-kpi-grid">

        {/* Carry Forward */}
        {month !== 'All' && year !== 'All' && prev && (
          <div className="kpi-card kpi-carry">
            <div className="kpi-top">
              <div className="kpi-label">Carry Forward</div>
              <div className="kpi-icon" style={{ color: 'var(--gold)' }}><Icon name="trendUp" size={18} /></div>
            </div>
            <div className="kpi-value rupee" style={{ color: carryForward >= 0 ? 'var(--gold)' : 'var(--danger)' }}>
              {formatCurrency(carryForward)}
            </div>
            <div className="kpi-meta">
              <span className="kpi-trend flat">From {prev.month} {prev.year}</span>
            </div>
          </div>
        )}

        <Link to="/monthly-collection" style={{ textDecoration: 'none' }}>
          <div className="kpi-card kpi-green">
            <div className="kpi-top">
              <div className="kpi-label">Collection</div>
              <div className="kpi-icon"><Icon name="wallet" size={18} /></div>
            </div>
            <div className="kpi-value rupee">{formatCurrency(collected)}</div>
            <div className="kpi-meta"><span className="kpi-trend up">{stats.paid}/{stats.active} paid</span></div>
          </div>
        </Link>

        <Link to="/expenses" style={{ textDecoration: 'none' }}>
          <div className="kpi-card kpi-red">
            <div className="kpi-top">
              <div className="kpi-label">Expenses</div>
              <div className="kpi-icon"><Icon name="expense" size={18} /></div>
            </div>
            <div className="kpi-value rupee">{formatCurrency(spent)}</div>
            <div className="kpi-meta">
              <span className="kpi-trend down">
                {month === 'All' ? expenses.length : expenses.filter(e => e.month === month && e.year === year).length} entries
              </span>
            </div>
          </div>
        </Link>

        <Link to="/other-income" style={{ textDecoration: 'none' }}>
          <div className="kpi-card kpi-accent">
            <div className="kpi-top">
              <div className="kpi-label">Other Income</div>
              <div className="kpi-icon"><Icon name="income" size={18} /></div>
            </div>
            <div className="kpi-value rupee">{formatCurrency(otherIncome)}</div>
            <div className="kpi-meta"><span className="kpi-trend up">Extra income</span></div>
          </div>
        </Link>

        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div className="kpi-label">Net Balance</div>
            <div className="kpi-icon"><Icon name="chart" size={18} /></div>
          </div>
          <div className="kpi-value rupee" style={{ color: netBalance >= 0 ? 'var(--primary-light)' : 'var(--danger)' }}>
            {formatCurrency(netBalance)}
          </div>
          <div className="kpi-meta"><span className="kpi-trend flat">Opening: {formatCurrency(openingBalance)}</span></div>
        </div>

        <Link to="/monthly-collection" style={{ textDecoration: 'none' }}>
          <div className="kpi-card" style={{ '--kpi-color': stats.pending > 0 ? 'var(--warning)' : 'var(--success)' }}>
            <div className="kpi-top">
              <div className="kpi-label">Pending Dues</div>
              <div className="kpi-icon"><Icon name="clock" size={18} /></div>
            </div>
            <div className="kpi-value">{stats.pending}</div>
            <div className="kpi-meta">
              <span className={`kpi-trend ${stats.pending > 0 ? 'down' : 'up'}`}>
                {stats.pending > 0 ? `${stats.pending} flats unpaid` : 'All paid!'}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card chart-card">
          <div className="card-header">
            <span className="card-title"><Icon name="chart" size={16} /> Flat Payment Status</span>
            <span className="badge badge-muted">{stats.paid}/{stats.active} paid</span>
          </div>
          {pieData.length === 0 ? (
            <ChartEmpty message="No active flats for this period" />
          ) : (
            <div className="chart-donut-wrap">
              <div className="chart-donut-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={3}
                      dataKey="value"
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip isCount />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-donut-center" aria-hidden>
                  <span className="chart-donut-rate">{collectionRate}%</span>
                  <span className="chart-donut-label">Flats paid</span>
                </div>
              </div>
              <ul className="chart-segment-list">
                {pieData.map((d) => (
                  <li key={d.name} className="chart-segment-item">
                    <span className="chart-segment-dot" style={{ background: d.fill }} />
                    <span className="chart-segment-name">{d.name}</span>
                    <span className="chart-segment-value">
                      {d.value} flat{d.value === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card chart-card">
          <div className="card-header">
            <span className="card-title"><Icon name="money" size={16} /> Money Flow — {month} {year}</span>
            <span className="badge badge-muted">{formatCurrency(netBalance)} net</span>
          </div>
          {financialData.every(d => d.amount === 0) ? (
            <ChartEmpty message="No financial data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={financialData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                barCategoryGap="18%"
              >
                <XAxis
                  type="number"
                  domain={['auto', 'auto']}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompactCurrency}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={26}>
                  {financialData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="chart-summary-row">
            <div className="chart-summary-item">
              <span className="chart-summary-label">Opening</span>
              <span className="chart-summary-value rupee">{formatCurrency(openingBalance)}</span>
            </div>
            {otherIncome > 0 && (
              <div className="chart-summary-item">
                <span className="chart-summary-label">Other income</span>
                <span className="chart-summary-value rupee">{formatCurrency(otherIncome)}</span>
              </div>
            )}
            <div className="chart-summary-item">
              <span className="chart-summary-label">Collection gap</span>
              <span className="chart-summary-value rupee" style={{ color: pendingAmount > 0 ? CHART.due : CHART.paid }}>
                {formatCurrency(pendingAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Carry Forward Detail Banner — only when viewing specific month */}
      {month !== 'All' && year !== 'All' && prev && (
        <div className="card mb-2" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))', borderColor: 'rgba(245,158,11,0.2)', padding: '1rem 1.5rem' }}>
          <div className="flex-between flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trendUp" size={18} color="var(--gold)" />
              </div>
              <div>
                <div className="text-sm fw-bold" style={{ color: 'var(--gold)' }}>Carry Forward from {prev.month} {prev.year}</div>
                <div className="text-xs text-muted-c">Prev collection {formatCurrency(prevCollected)} + Other {formatCurrency(prevOtherInc)} − Expenses {formatCurrency(prevSpent)}</div>
              </div>
            </div>
            <div className="text-xl fw-black rupee" style={{ color: carryForward >= 0 ? 'var(--gold)' : 'var(--danger)' }}>
              {formatCurrency(carryForward)}
            </div>
          </div>
        </div>
      )}

      {/* Collection Table */}
      <div className="card">
        <div className="flex-between mb-2">
          <div className="card-title"><Icon name="receipt" size={16} /> {month} {year} — Collection Status</div>
          <Link to="/monthly-collection" className="btn btn-outline btn-sm"><Icon name="clock" size={14} /> View Collection</Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Flat</th><th>Owner</th><th>Charge</th><th>Status</th>
                <th>Amount Paid</th><th>Date</th><th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {dues.map(d => (
                <tr key={d.flatNo}>
                  <td><strong>Flat {d.flatNo}</strong></td>
                  <td>{d.ownerName}</td>
                  <td className="rupee">{formatCurrency(d.monthlyCharge)}</td>
                  <td>
                    <span className={`badge ${d.paid ? 'badge-success' : 'badge-danger'}`}>
                      {d.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="rupee">
                    {d.paid ? <span className="text-success-c">{formatCurrency(d.amountPaid)}</span> : '—'}
                  </td>
                  <td className="text-muted-c">
                    {d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                  </td>
                  <td>{d.paymentMode ? <span className="tag">{d.paymentMode}</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
