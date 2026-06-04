import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import {
  sanitizeFlatNo,
  isValidFlatNo,
  isValidLoginPassword,
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
  const { addToast } = useToast();
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
    if (!isValidLoginPassword(password)) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const res = await login(flat, password);
    setLoading(false);

    if (res.success) {
      clearLoginLockout();
      if (res.activityLogOk === false) {
        addToast(
          `Logged in, but activity logging failed: ${res.activityLogError || 'check Supabase tables/RLS'}`,
          'error'
        );
      }
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
        <div className="login-aurora" aria-hidden="true">
          <span className="login-orb login-orb-1" />
          <span className="login-orb login-orb-2" />
          <span className="login-orb login-orb-3" />
        </div>

        <div className="login-brand-inner login-anim-fade-up">
          <div className="login-logo login-anim-logo">
            <img src="/favicon.svg" alt="" width="30" height="30" />
          </div>
          <h1 className="login-title login-anim-fade-up" style={{ animationDelay: '0.08s' }}>
            Sri Kuber <em>Apartment</em>
          </h1>
          <p
            className="login-tagline login-anim-fade-up"
            style={{ animationDelay: '0.16s' }}
          >
            Maintenance, collections, notices, and society records — one secure portal for every
            resident.
          </p>
          <div className="login-stats login-anim-fade-up" style={{ animationDelay: '0.24s' }}>
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
        <div className="login-card login-anim-card">
          <div className="login-card-accent" aria-hidden="true" />
          <div className="login-card-body">
            <div className="login-card-header login-anim-fade-up" style={{ animationDelay: '0.12s' }}>
              <div>
                <h2>Sign in</h2>
                <p className="login-sub">Flat number and society password</p>
              </div>
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

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div
                className="form-group login-anim-fade-up"
                style={{ animationDelay: '0.2s' }}
              >
                <label className="form-label" htmlFor="flatNo">
                  Flat number
                </label>
                <input
                  id="flatNo"
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="e.g. 102, 301"
                  value={flatNo}
                  onChange={(e) => {
                    setFlatNo(e.target.value);
                    setError('');
                  }}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div
                className="form-group login-anim-fade-up"
                style={{ animationDelay: '0.28s' }}
              >
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="login-field-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-field-toggle"
                    tabIndex={-1}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error login-anim-shake" role="alert">
                  <Icon name="warning" size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary login-btn-submit login-anim-fade-up"
                style={{ animationDelay: '0.36s' }}
                disabled={loading}
                id="login-btn"
              >
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
          </div>

          <p className="login-footer login-anim-fade-up" style={{ animationDelay: '0.44s' }}>
            Developed by <strong>Suvadip Panja</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
