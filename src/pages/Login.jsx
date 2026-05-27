import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [flatNo, setFlatNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flatNo.trim() || !password.trim()) {
      setError('Please enter both Flat Number and Password.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(flatNo.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb orb1" />
        <div className="login-bg-orb orb2" />
        <div className="login-bg-orb orb3" />
      </div>

      <div className="login-container">
        <div className="login-card slide-up">
          <div className="login-logo">
            <div className="login-logo-icon">🏠</div>
            <h1 className="login-title">Sri Kuber Apartment</h1>
            <p className="login-subtitle">Society Maintenance Portal</p>
          </div>

          <form onSubmit={handleSubmit} id="login-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="flatNo">Flat Number</label>
              <input
                id="flatNo"
                type="text"
                className="form-input"
                placeholder="e.g. 102, 301"
                value={flatNo}
                onChange={e => setFlatNo(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', border: 'none', background: 'none'
                  }}
                  aria-label="Toggle password"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              id="login-btn"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying...</>
              ) : (
                '🔓 Login to Portal'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>🏠 Flat 301 has Super Admin access</p>
            <p style={{ marginTop: '0.5rem' }}>Default password = your flat number</p>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-base);
          position: relative;
          overflow: hidden;
        }
        .login-bg { position: absolute; inset: 0; pointer-events: none; }
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
          animation: pulse 6s ease-in-out infinite;
        }
        .orb1 {
          width: 500px; height: 500px;
          background: var(--primary);
          top: -150px; left: -150px;
          animation-delay: 0s;
        }
        .orb2 {
          width: 400px; height: 400px;
          background: var(--accent);
          bottom: -100px; right: -100px;
          animation-delay: 2s;
        }
        .orb3 {
          width: 300px; height: 300px;
          background: var(--gold);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }
        .login-container {
          width: 100%;
          max-width: 420px;
          padding: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .login-card {
          background: rgba(26, 26, 53, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 2.5rem 2rem;
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }
        .login-logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .login-logo-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
          display: block;
          filter: drop-shadow(0 0 20px rgba(108, 99, 255, 0.4));
        }
        .login-title {
          font-size: 1.5rem;
          background: linear-gradient(135deg, var(--primary-light), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.25rem;
        }
        .login-subtitle {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .login-footer {
          text-align: center;
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-size: 0.78rem;
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
}
