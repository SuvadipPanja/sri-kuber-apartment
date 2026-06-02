import { useState } from 'react';
import { useSupabaseTable } from '../hooks/useSupabase';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { formatCurrency } from '../utils/formatters';
import { totalCollection, buildPendingDues, getFlatStats } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import MonthYearFilter from '../components/ui/MonthYearFilter';
import EmptyState from '../components/ui/EmptyState';

function mapPayment(p) {
  return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode };
}
function mapOwner(o) {
  return { ...o, flatNo: o.flat_no, ownerName: o.owner_name, monthlyCharge: o.monthly_charge };
}

export default function MonthlyCollection() {
  const { data: rawOwners, loading: ownersLoading } = useSupabaseTable('owners');
  const { data: rawPayments, loading: paymentsLoading } = useSupabaseTable('payments');

  const { month, year, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriodFilter();
  const [view, setView] = useState('all');

  const owners = rawOwners.map(mapOwner);
  const payments = rawPayments.map(mapPayment);
  const dues = buildPendingDues(owners, payments, month, year);
  const stats = getFlatStats(owners, payments, month, year);

  const collected = totalCollection(payments, month, year);
  const expected = owners.filter(o => o.active).reduce(
    (sum, o) => sum + (month === 'All' ? o.monthlyCharge * 12 : o.monthlyCharge), 0
  );
  const pendingAmount = Math.max(0, expected - collected);

  const paidList = dues.filter(d => d.paid);
  const pendingList = dues.filter(d => !d.paid);
  const totalPaid = paidList.reduce((s, d) => s + d.amountPaid, 0);
  const totalPending = pendingList.reduce((s, d) => s + d.monthlyCharge, 0);
  const collectionRate = dues.length > 0 ? Math.round((paidList.length / dues.length) * 100) : 0;

  let displayDues = dues;
  if (view === 'pending') displayDues = pendingList;
  if (view === 'paid') displayDues = paidList;
  if (view === 'all') displayDues = [...pendingList, ...paidList];

  const chartData = [
    { name: 'Collected', amount: collected, fill: '#22c55e' },
    { name: 'Pending', amount: pendingAmount, fill: '#f43f5e' },
  ];

  const isLoading = ownersLoading || paymentsLoading;

  return (
    <PageShell
      icon="calendar"
      title="Collection & Dues"
      subtitle={`Maintenance collection and pending dues — ${month} ${year}`}
      actions={
        <MonthYearFilter
          month={month}
          year={year}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      }
    >
      {/* KPI + chart */}
      <div className="grid-2 mb-2">
        <div className="card">
          <h3 className="chart-title">Collection Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 16, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [formatCurrency(v), 'Amount']}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={28}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0, gap: '0.65rem' }}>
          <div className="kpi-card kpi-green">
            <div className="kpi-top">
              <div className="kpi-label">Collected</div>
              <div className="kpi-icon"><Icon name="wallet" size={16} /></div>
            </div>
            <div className="kpi-value rupee" style={{ fontSize: '1.15rem' }}>{formatCurrency(collected)}</div>
            <div className="kpi-meta"><span className="kpi-trend up">{stats.paid} flats paid</span></div>
          </div>
          <div className="kpi-card kpi-red">
            <div className="kpi-top">
              <div className="kpi-label">Pending</div>
              <div className="kpi-icon"><Icon name="clock" size={16} /></div>
            </div>
            <div className="kpi-value rupee" style={{ fontSize: '1.15rem' }}>{formatCurrency(totalPending)}</div>
            <div className="kpi-meta"><span className="kpi-trend down">{stats.pending} flats due</span></div>
          </div>
          <div className="kpi-card kpi-blue">
            <div className="kpi-top">
              <div className="kpi-label">Collection Rate</div>
              <div className="kpi-icon"><Icon name="chart" size={16} /></div>
            </div>
            <div className="kpi-value">{collectionRate}%</div>
            <div className="kpi-meta"><span className="kpi-trend flat">{paidList.length}/{dues.length} flats</span></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-label">Inactive</div>
              <div className="kpi-icon"><Icon name="building" size={16} /></div>
            </div>
            <div className="kpi-value">{stats.inactive}</div>
            <div className="kpi-meta"><span className="kpi-trend flat">Excluded</span></div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card mb-2" style={{ padding: '0.85rem 1.15rem' }}>
        <div className="flex-between mb-1">
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
            <Icon name="chart" size={14} /> Collection Progress
          </span>
          <span style={{ fontWeight: 700, color: collectionRate === 100 ? 'var(--success)' : 'var(--text-primary)' }}>
            {collectionRate}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div
            className={`progress-fill ${collectionRate === 100 ? 'green' : collectionRate >= 60 ? 'blue' : 'red'}`}
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <div className="flex-between mt-1" style={{ fontSize: '0.78rem' }}>
          <span className="text-success-c">Collected: <strong>{formatCurrency(totalPaid)}</strong></span>
          <span className="text-danger-c">Pending: <strong>{formatCurrency(totalPending)}</strong></span>
        </div>
      </div>

      {/* Detailed table with filters */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.65rem' }}>
          <span className="card-title">
            <Icon name="receipt" size={16} /> Flat-wise Status — {month} {year}
          </span>
          <div className="dues-tab-group">
            <button type="button" className={`dues-tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>
              All <span className="tab-count">{dues.length}</span>
            </button>
            <button type="button" className={`dues-tab ${view === 'pending' ? 'active' : ''}`} onClick={() => setView('pending')}>
              Pending <span className="tab-count">{pendingList.length}</span>
            </button>
            <button type="button" className={`dues-tab ${view === 'paid' ? 'active' : ''}`} onClick={() => setView('paid')}>
              Paid <span className="tab-count">{paidList.length}</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-center p-3"><div className="spinner lg" /></div>
        ) : displayDues.length === 0 ? (
          <EmptyState
            icon="check"
            title="All Clear!"
            description={`No ${view === 'pending' ? 'pending' : ''} records for ${month} ${year}.`}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Flat</th>
                  <th>Owner</th>
                  <th>Expected</th>
                  <th>Paid</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayDues.map(d => (
                  <tr key={d.flatNo} style={!d.paid ? { background: 'rgba(239,68,68,0.04)' } : undefined}>
                    <td><strong>Flat {d.flatNo}</strong></td>
                    <td>{d.ownerName}</td>
                    <td className="rupee">{formatCurrency(d.monthlyCharge)}</td>
                    <td className="rupee">
                      {d.paid ? <span className="text-success-c">{formatCurrency(d.amountPaid)}</span> : '—'}
                    </td>
                    <td className="text-muted-c">
                      {d.paymentDate
                        ? new Date(d.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : '—'}
                    </td>
                    <td>{d.paymentMode ? <span className="tag">{d.paymentMode}</span> : '—'}</td>
                    <td>
                      <span className={`badge ${d.paid ? 'badge-success' : 'badge-danger'}`}>
                        {d.paid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
