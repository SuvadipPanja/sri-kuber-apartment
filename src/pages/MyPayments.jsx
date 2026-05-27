import { useAuth } from '../context/AuthContext';
import { useSupabaseTable } from '../hooks/useSupabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getFlatPayments } from '../utils/calculations';

function mapPayment(p) {
  return { ...p, flatNo: p.flat_no, ownerName: p.owner_name, amountPaid: p.amount_paid, paymentDate: p.payment_date, paymentMode: p.payment_mode };
}

export default function MyPayments() {
  const { user } = useAuth();
  const { data: rawPayments, loading } = useSupabaseTable('payments');
  const payments = rawPayments.map(mapPayment);
  const myPayments = getFlatPayments(payments, user?.flatNo);
  const totalPaid = myPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>💳 My Payments</h1>
          <p className="page-subtitle">Flat {user?.flatNo} — Payment History</p>
        </div>
        <div className="stat-card blue" style={{ padding: '0.75rem 1.25rem', gap: '0.75rem' }}>
          <div className="stat-icon" style={{ width: 36, height: 36, fontSize: '1rem' }}>💰</div>
          <div>
            <div className="stat-label">Total Paid (All Time)</div>
            <div className="stat-value rupee" style={{ fontSize: '1.2rem' }}>{formatCurrency(totalPaid)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : myPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>No Payments Found</h3>
            <p>No payment records exist for Flat {user?.flatNo}.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Month</th><th>Year</th><th>Amount Paid</th>
                  <th>Payment Date</th><th>Payment Mode</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {myPayments.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><strong>{p.month}</strong></td>
                    <td>{p.year}</td>
                    <td className="rupee">{formatCurrency(p.amountPaid)}</td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>
                      <span className="badge badge-accent">{p.paymentMode}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
