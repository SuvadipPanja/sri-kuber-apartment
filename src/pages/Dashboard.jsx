import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { totalCollection, totalExpenses, totalOtherIncome, calculateNetBalance, getFlatStats, buildPendingDues } from '../utils/calculations';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const CHART_COLORS = ['#22c55e', '#ef4444', '#6b7280'];
const MONTHS_ORDER = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
  const { config, loading: configLoading } = useConfig();
  const { data: rawOwners, loading: ownersLoading } = useSupabaseTable('owners');
  const { data: rawPayments, loading: paymentsLoading } = useSupabaseTable('payments');
  const { data: rawExpenses, loading: expensesLoading } = useSupabaseTable('expenses');
  const { data: rawIncome } = useSupabaseTable('income');
  const { data: notices } = useSupabaseTable('notices', q => q.order('created_at', { ascending: false }).limit(5));

  const defaultMonth = config?.current_month || 'May';
  const defaultYear = config?.current_year || 2026;
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const month = selectedMonth ?? defaultMonth;
  const year = selectedYear ?? defaultYear;

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

  const now = new Date();
  const activeNotices = notices.filter(n => !n.expires_at || new Date(n.expires_at) > now);

  const pieData = [
    { name: 'Paid',     value: stats.paid },
    { name: 'Pending',  value: stats.pending },
    { name: 'Inactive', value: stats.inactive },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Carry Fwd', amount: openingBalance,            fill: 'var(--gold)' },
    { name: 'Collected', amount: collected,                 fill: 'var(--success)' },
    { name: 'Other Inc', amount: otherIncome,               fill: 'var(--accent)' },
    { name: 'Expenses',  amount: spent,                     fill: 'var(--danger)' },
    { name: 'Net Bal',   amount: Math.max(0, netBalance),   fill: 'var(--primary-light)' },
  ].filter(d => d.amount > 0);

  if (isLoading) return (
    <div className="loading-screen">
      <div className="loading-logo">SK</div>
      <div className="spinner lg"></div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Icon name="dashboard" size={24} /> Dashboard</h1>
          <p className="page-subtitle">Monthly summary for {month} {year}</p>
        </div>
        <div className="flex gap-1 items-center flex-wrap">
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

      {/* Active Notices */}
      {activeNotices.slice(0, 2).map(n => (
        <div key={n.id} className="alert alert-info mb-1" style={{ borderLeft: n.priority === 'urgent' ? '3px solid var(--danger)' : n.priority === 'important' ? '3px solid var(--warning)' : '3px solid var(--primary)' }}>
          <Icon name="megaphone" size={16} />
          <div>
            <strong>{n.title}</strong>
            <span className="text-sm text-secondary-c" style={{ marginLeft: '0.75rem' }}>
              {n.content.length > 120 ? n.content.substring(0, 120) + '…' : n.content}
            </span>
          </div>
        </div>
      ))}
      {config?.announcement && !activeNotices.length && (
        <div className="alert alert-info">
          <Icon name="megaphone" size={16} />
          <div>{config.announcement}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>

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

        <Link to="/pending-dues" style={{ textDecoration: 'none' }}>
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
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Icon name="chart" size={16} /> Collection Status</span>
            <span className="badge badge-muted">{month} {year}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="var(--bg-card)" strokeWidth={2}>
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)' }} itemStyle={{ color: 'var(--text-white)' }} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Icon name="chart" size={16} /> Financial Summary</span>
            <span className="badge badge-muted">{month} {year}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={28} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [formatCurrency(v), 'Amount']}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
          <Link to="/pending-dues" className="btn btn-outline btn-sm"><Icon name="clock" size={14} /> View Pending</Link>
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
    </div>
  );
}
