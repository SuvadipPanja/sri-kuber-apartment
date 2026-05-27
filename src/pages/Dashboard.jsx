import { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useSupabaseTable, useConfig } from '../hooks/useSupabase';
import { formatCurrency, MONTHS } from '../utils/formatters';
import {
  totalCollection, totalExpenses, totalOtherIncome,
  calculateNetBalance, getFlatStats, buildPendingDues
} from '../utils/calculations';

const CHART_COLORS = ['#4caf50', '#ff5252', '#5a5a80', '#f4b942', '#00d4aa'];

function mapPayment(p) {
  return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode };
}
function mapExpense(e) {
  return { ...e, expenseType: e.expense_type, billAmount: e.bill_amount, builderContribution: e.builder_contribution, netExpense: e.net_expense, paidTo: e.paid_to };
}
function mapOwner(o) {
  return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge };
}

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
    { name: 'Collected', amount: collected, fill: '#4caf50' },
    { name: 'Expenses',  amount: spent,     fill: '#ff5252' },
    { name: 'Balance',   amount: Math.max(0, netBalance), fill: '#6c63ff' },
  ];

  const years = [2025, 2026, 2027];

  if (isLoading) return (
    <div className="flex-center" style={{ height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 1rem' }} />
        <p>Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p className="page-subtitle">Monthly summary for {month} {year}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={month}
            onChange={e => setSelectedMonth(e.target.value)}
            id="dashboard-month-select"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={year}
            onChange={e => setSelectedYear(Number(e.target.value))}
            id="dashboard-year-select"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {config?.announcement && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          📢 {config.announcement}
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value rupee">{formatCurrency(collected)}</div>
            <div className="stat-change up">↑ {stats.paid} flats paid</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value rupee">{formatCurrency(spent)}</div>
            <div className="stat-change down">↓ {expenses.filter(e => e.month === month && e.year === year).length} entries</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <div className="stat-label">Net Balance</div>
            <div className="stat-value rupee">{formatCurrency(netBalance)}</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Opening: {formatCurrency(openingBalance)}</div>
          </div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-label">Pending Dues</div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-change down">{stats.pending > 0 ? `${formatCurrency(stats.pending * 500)} due` : '✅ All clear'}</div>
          </div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <div className="stat-label">Active Flats</div>
            <div className="stat-value">{stats.active} / {stats.total}</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{stats.inactive} inactive</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>💳 Collection Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>📊 Financial Summary</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => [formatCurrency(v), 'Amount']} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flat Status Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>📋 {month} {year} — Flat Status</h3>
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
                  <td className="rupee">{d.paid ? formatCurrency(d.amountPaid) : '—'}</td>
                  <td>{d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td>{d.paymentMode || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
