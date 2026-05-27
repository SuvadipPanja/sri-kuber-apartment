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
        <div className="login-bg-orb orb1"></div>
        <div className="login-bg-orb orb2"></div>
      </div>

      <div className="login-container">
        <div className="login-card slide-up">
          <div className="login-logo">
            <div className="login-icon-wrapper">
              🏠
            </div>
            <h1 className="login-title">Sri Kuber Apartment</h1>
            <p className="login-subtitle">Society Maintenance Portal</p>
          </div>

          <form onSubmit={handleSubmit} id="login-form" noValidate>
            <div className="form-group mb-2">
              <label className="form-label text-muted-c tracking-wider" htmlFor="flatNo">Flat Number</label>
              <div className="input-wrapper">
                <input
                  id="flatNo"
                  type="text"
                  className="form-input login-input"
                  placeholder="e.g. 102, 301"
                  value={flatNo}
                  onChange={e => setFlatNo(e.target.value)}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label text-muted-c tracking-wider" htmlFor="password">Password</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="btn-icon password-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label="Toggle password"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error slide-up" style={{ marginBottom: '1.5rem', borderRadius: '8px' }} role="alert">
                <span className="alert-icon">⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              id="login-btn"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{
                borderRadius: '8px',
                height: '3.2rem',
                fontSize: '1rem',
                boxShadow: 'var(--shadow-primary)'
              }}
            >
              {loading ? (
                <><span className="spinner sm" style={{ borderTopColor: 'white' }} /> Authenticating...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="developer-credit">
              Developed by <span className="dev-name">Suvadip Panja</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080813;
          position: relative;
          overflow: hidden;
          font-family: var(--font-sans);
        }

        .login-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          animation: floatOrb 8s ease-in-out infinite alternate;
        }
        
        .orb1 {
          width: 600px; height: 600px;
          background: #7c6aff;
          top: -200px; left: -200px;
        }
        .orb2 {
          width: 500px; height: 500px;
          background: #00e5b0;
          bottom: -150px; right: -150px;
          animation-delay: -4s;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, -40px); }
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 1.5rem;
          position: relative;
          z-index: 10;
        }

        .login-card {
          background: rgba(22, 22, 48, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .login-logo {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-icon-wrapper {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.25rem;
          background: linear-gradient(135deg, rgba(124, 106, 255, 0.2), rgba(0, 229, 176, 0.15));
          border: 1px solid rgba(124, 106, 255, 0.3);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(124, 106, 255, 0.2);
        }

        .login-title {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.3rem;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 400;
        }

        .input-wrapper {
          position: relative;
          border-radius: 8px;
        }

        .login-input {
          height: 3.2rem;
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white;
          font-size: 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .login-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        
        .login-input:focus { 
          border-color: var(--primary) !important; 
          background: rgba(124, 106, 255, 0.05) !important;
          box-shadow: 0 0 0 3px rgba(124, 106, 255, 0.2);
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent !important;
          border: none !important;
          color: var(--text-muted);
        }
        .password-toggle:hover { color: white; background: transparent !important; }

        .login-footer {
          text-align: center;
          margin-top: 2rem;
        }

        .developer-credit {
          display: inline-block;
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .dev-name {
          color: var(--text-secondary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
