import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import {
  sanitizeFlatNo,
  isValidFlatNo,
  isValidPassword,
  getLoginLockout,
  recordFailedLogin,
  clearLoginLockout,
  formatLockoutMessage,
} from '../utils/security';

export default function Login() {
  const [flatNo, setFlatNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  useEffect(() => {
    const onStorage = () => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ska_theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  const isLight = theme === 'light';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const lock = getLoginLockout();
    if (lock?.until) {
      setError(formatLockoutMessage(lock.until - Date.now()));
      return;
    }

    const flat = sanitizeFlatNo(flatNo);
    if (!isValidFlatNo(flat)) {
      setError('Enter a valid flat number (e.g. 102 or 301).');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be between 4 and 128 characters.');
      return;
    }

    setLoading(true);
    const res = await login(flat, password);
    setLoading(false);

    if (res.success) {
      clearLoginLockout();
      navigate('/dashboard');
      return;
    }

    const fail = recordFailedLogin();
    if (fail.locked) {
      setError(formatLockoutMessage(fail.remainingMs));
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  return (
    <div className="login-page">
      <aside className="login-brand" aria-label="Sri Kuber Apartment">
        <div className="login-brand-inner">
          <div className="login-logo" aria-hidden="true">
            <img src="/favicon.svg" alt="" width="28" height="28" />
          </div>
          <h1 className="login-title">
            Sri Kuber <em>Apartment</em>
          </h1>
          <p className="login-tagline">
            Maintenance, collections, notices, and society records — one secure portal for every resident.
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <strong>24/7</strong>
              <span>Access</span>
            </div>
            <div className="login-stat">
              <strong>Secure</strong>
              <span>Flat login</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-card">
          <div className="login-theme-row">
            <button
              type="button"
              className="login-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle light or dark theme"
            >
              <Icon name={isLight ? 'moon' : 'sun'} size={14} />
              {isLight ? 'Dark' : 'Light'}
            </button>
          </div>

          <h2>Sign in</h2>
          <p className="login-sub">Use your flat number and society password</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="flatNo">Flat number</label>
              <input
                id="flatNo"
                type="text"
                className="form-input"
                placeholder="e.g. 102, 301"
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.35rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                  }}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                <Icon name="warning" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} id="login-btn">
              {loading ? (
                <>
                  <span className="spinner sm" />
                  Signing in…
                </>
              ) : (
                <>
                  <Icon name="key" size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="login-footer">
            Developed by <strong>Suvadip Panja</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
