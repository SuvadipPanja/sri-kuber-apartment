import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { totalCollection, totalExpenses, totalOtherIncome, calculateNetBalance, getFlatStats, buildPendingDues } from '../utils/calculations';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#2ed573', '#ff4757', '#5a48e0', '#ffc107', '#00e5b0'];

function mapPayment(p) { return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode }; }
function mapExpense(e) { return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to }; }
function mapOwner(o)   { return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge }; }

export default function Dashboard() {
  const { config, loading: configLoading } = useConfig();
  const { data: rawOwners, loading: ownersLoading } = useSupabaseTable('owners');
  const { data: rawPayments, loading: paymentsLoading } = useSupabaseTable('payments');
  const { data: rawExpenses, loading: expensesLoading } = useSupabaseTable('expenses');
  const { data: rawIncome } = useSupabaseTable('income');

  const defaultMonth = config?.current_month || 'May';
  const defaultYear = config?.current_year || 2026;
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const month = selectedMonth ?? defaultMonth;
  const year = selectedYear ?? defaultYear;

  const owners = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const expenses = rawExpenses.map(mapExpense);
  const income = rawIncome;

  const openingBalance = config?.carry_forward?.[`${month}-${year}`] || 0;
  const collected = totalCollection(payments, month, year);
  const spent = totalExpenses(expenses, month, year);
  const otherIncome = totalOtherIncome(income, month, year);
  const netBalance = calculateNetBalance(payments, expenses, income, month, year, openingBalance);
  const stats = getFlatStats(owners, payments, month, year);
  const dues = buildPendingDues(owners, payments, month, year);

  const isLoading = configLoading || ownersLoading || paymentsLoading || expensesLoading;

  const pieData = [
    { name: 'Paid', value: stats.paid },
    { name: 'Pending', value: stats.pending },
    { name: 'Inactive', value: stats.inactive },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Collected', amount: collected, fill: 'var(--success)' },
    { name: 'Other Inc', amount: otherIncome, fill: 'var(--accent)' },
    { name: 'Expenses',  amount: spent,     fill: 'var(--danger)' },
    { name: 'Net Bal',   amount: Math.max(0, netBalance), fill: 'var(--primary-light)' },
  ];

  if (isLoading) return <div className="loading-screen"><div className="loading-logo">SK</div><div className="spinner lg"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p className="page-subtitle">Monthly summary for {month} {year}</p>
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

      {config?.announcement && (
        <div className="alert alert-info shadow-primary">
          <span className="alert-icon">📢</span>
          <div>{config.announcement}</div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="kpi-grid">
        <Link to="/monthly-collection" style={{ textDecoration: 'none' }}>
          <div className="kpi-card kpi-green">
            <div className="kpi-top">
              <div className="kpi-label">Collection</div>
              <div className="kpi-icon">💰</div>
            </div>
            <div className="kpi-value rupee">{formatCurrency(collected)}</div>
            <div className="kpi-meta"><span className="kpi-trend up">↑ {stats.paid} paid</span></div>
          </div>
        </Link>
        <Link to="/expenses" style={{ textDecoration: 'none' }}>
          <div className="kpi-card kpi-red">
            <div className="kpi-top">
              <div className="kpi-label">Expenses</div>
              <div className="kpi-icon">📉</div>
            </div>
            <div className="kpi-value rupee">{formatCurrency(spent)}</div>
            <div className="kpi-meta"><span className="kpi-trend down">↓ {expenses.filter(e => e.month === month && e.year === year).length} entries</span></div>
          </div>
        </Link>
        <Link to="/other-income" style={{ textDecoration: 'none' }}>
          <div className="kpi-card kpi-accent">
            <div className="kpi-top">
              <div className="kpi-label">Other Income</div>
              <div className="kpi-icon">💵</div>
            </div>
            <div className="kpi-value rupee">{formatCurrency(otherIncome)}</div>
            <div className="kpi-meta"><span className="kpi-trend up">Extra income</span></div>
          </div>
        </Link>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div className="kpi-label">Net Balance</div>
            <div className="kpi-icon">💳</div>
          </div>
          <div className="kpi-value rupee">{formatCurrency(netBalance)}</div>
          <div className="kpi-meta"><span className="kpi-trend flat">Opening: {formatCurrency(openingBalance)}</span></div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 className="chart-title">💳 Collection Status</h3>
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
          <h3 className="chart-title">📊 Financial Summary</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => [formatCurrency(v), 'Amount']} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <h3 className="text-base m-0">📋 {month} {year} — Collection Status</h3>
          <Link to="/pending-dues" className="btn btn-outline btn-sm">View Pending ⏳</Link>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Flat No</th><th>Owner</th><th>Charge</th><th>Status</th>
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
                      {d.paid ? '✅ Paid' : '❌ Pending'}
                    </span>
                  </td>
                  <td className="rupee">{d.paid ? <span className="text-success-c">{formatCurrency(d.amountPaid)}</span> : '—'}</td>
                  <td className="text-muted-c">{d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
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
