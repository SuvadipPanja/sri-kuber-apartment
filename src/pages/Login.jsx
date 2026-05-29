import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

/* ─────────────────────────────────────────────
   Inline building illustration (scaled-up SVG)
   Same design as favicon but larger + enhanced
───────────────────────────────────────────── */
function BuildingIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className="lp-building-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id="lt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#1d4ed8"/>
        </linearGradient>
        <linearGradient id="lw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#1e40af"/>
        </linearGradient>
        <filter id="lglow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softglow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="baseGlow" cx="50%" cy="100%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Ground glow */}
      <ellipse cx="100" cy="178" rx="80" ry="12" fill="url(#baseGlow)"/>

      {/* Ground line */}
      <rect x="20" y="174" width="160" height="2" rx="1" fill="#3b82f6" opacity="0.25"/>

      {/* ── Left wing ── */}
      <rect x="22" y="96" width="40" height="78" rx="4" fill="url(#lw)"/>
      {/* Left wing windows */}
      {[104,116,128,140,152].map((y,i) => (
        <g key={i}>
          <rect x="28" y={y} width="10" height="9" rx="1.5"
            fill={i%2===0 ? 'white' : '#10b981'} opacity={0.6 + i*0.05}
            filter="url(#lglow)"/>
          <rect x="44" y={y} width="10" height="9" rx="1.5"
            fill={i%2!==0 ? 'white' : '#60a5fa'} opacity={0.55 + i*0.04}
            filter="url(#lglow)"/>
        </g>
      ))}

      {/* ── Right wing ── */}
      <rect x="138" y="96" width="40" height="78" rx="4" fill="url(#lw)"/>
      {/* Right wing windows */}
      {[104,116,128,140,152].map((y,i) => (
        <g key={i}>
          <rect x="144" y={y} width="10" height="9" rx="1.5"
            fill={i%2!==0 ? 'white' : '#10b981'} opacity={0.55 + i*0.05}
            filter="url(#lglow)"/>
          <rect x="160" y={y} width="10" height="9" rx="1.5"
            fill={i%2===0 ? 'white' : '#60a5fa'} opacity={0.6 + i*0.04}
            filter="url(#lglow)"/>
        </g>
      ))}

      {/* ── Center tower ── */}
      <rect x="65" y="30" width="70" height="144" rx="4" fill="url(#lt)"/>

      {/* Tower top accent */}
      <rect x="65" y="30" width="70" height="8" rx="4" fill="#93c5fd" opacity="0.3"/>

      {/* Center tower windows – 2 col × 7 row */}
      {[40,58,76,94,112,130,148].map((y, row) => (
        <g key={row}>
          <rect x="74" y={y} width="18" height="13" rx="2"
            fill={row===0 || row===3 ? '#10b981' : 'white'}
            opacity={row < 2 ? 0.9 : 0.7}
            filter="url(#lglow)"/>
          <rect x="108" y={y} width="18" height="13" rx="2"
            fill={row===1 || row===4 ? '#10b981' : 'white'}
            opacity={row < 2 ? 0.85 : 0.65}
            filter="url(#lglow)"/>
        </g>
      ))}

      {/* Door */}
      <rect x="87" y="155" width="26" height="19" rx="3" fill="#1e3a8a"/>
      <rect x="99" y="158" width="2" height="13" rx="1" fill="#93c5fd" opacity="0.3"/>
      <circle cx="104" cy="166" r="2.5" fill="#93c5fd" opacity="0.5"/>

      {/* Top gradient bar across building */}
      <rect x="65" y="30" width="70" height="3" rx="1.5" fill="url(#lt)" opacity="0.8"/>

      {/* Stars / ambient dots */}
      {[
        [15,20],[170,15],[185,60],[10,90],[190,130],
        [30,50],[155,40],[8,140],[175,100]
      ].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={i%3===0?1.5:1}
          fill="white" opacity={0.2 + (i%3)*0.1}/>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Feature pill component
───────────────────────────────────────────── */
function Feature({ icon, label }) {
  return (
    <div className="lp-feature">
      <span className="lp-feature-icon"><Icon name={icon} size={14} /></span>
      <span>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main login page
───────────────────────────────────────────── */
export default function Login() {
  const [flatNo,       setFlatNo]       = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [flatFocused,  setFlatFocused]  = useState(false);
  const [passFocused,  setPassFocused]  = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

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
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  return (
    <div className="lp-root">
      {/* ── Animated background ── */}
      <div className="lp-backdrop">
        <div className="lp-orb lp-orb1"/>
        <div className="lp-orb lp-orb2"/>
        <div className="lp-orb lp-orb3"/>
        <div className="lp-mesh"/>
      </div>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <aside className="lp-left">
        <div className="lp-left-inner">
          {/* Logo mark */}
          <div className="lp-logo-mark">
            <img src="/favicon.svg" alt="SKA" width="40" height="40" />
          </div>

          {/* Building illustration */}
          <div className="lp-illus-wrap">
            <div className="lp-illus-glow"/>
            <BuildingIllustration />
          </div>

          {/* Brand name */}
          <h1 className="lp-brand">
            Sri Kuber<br/>
            <span className="lp-brand-accent">Apartment</span>
          </h1>
          <p className="lp-tagline">Society Maintenance Portal</p>

          {/* Stats row */}
          <div className="lp-stats">
            <div className="lp-stat"><span className="lp-stat-val">10</span><span className="lp-stat-lbl">Flats</span></div>
            <div className="lp-stat-sep"/>
            <div className="lp-stat"><span className="lp-stat-val">2025</span><span className="lp-stat-lbl">Est.</span></div>
            <div className="lp-stat-sep"/>
            <div className="lp-stat"><span className="lp-stat-val">KOL</span><span className="lp-stat-lbl">Kolkata</span></div>
          </div>

          {/* Features */}
          <div className="lp-features">
            <Feature icon="wallet"   label="Track Payments & Dues" />
            <Feature icon="expense"  label="Monthly Expense Reports" />
            <Feature icon="notice"   label="Society Notices & Alerts" />
            <Feature icon="receipt"  label="Download Payment Receipts" />
          </div>
        </div>
      </aside>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <main className="lp-right">
        <div className="lp-card">
          {/* Card top accent line */}
          <div className="lp-card-topbar"/>

          {/* Welcome */}
          <div className="lp-welcome">
            <h2 className="lp-welcome-h">Welcome back</h2>
            <p className="lp-welcome-sub">Sign in with your flat credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Flat No. field */}
            <div className={`lp-field ${flatFocused ? 'focused' : ''} ${flatNo ? 'filled' : ''}`}>
              <label className="lp-label" htmlFor="flatNo">Flat Number</label>
              <div className="lp-input-wrap">
                <span className="lp-iicon"><Icon name="building" size={15}/></span>
                <input
                  id="flatNo"
                  type="text"
                  className="lp-input"
                  placeholder="e.g. 102, 301"
                  value={flatNo}
                  onChange={e => { setFlatNo(e.target.value); setError(''); }}
                  onFocus={() => setFlatFocused(true)}
                  onBlur={() => setFlatFocused(false)}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div className={`lp-field ${passFocused ? 'focused' : ''} ${password ? 'filled' : ''}`}>
              <label className="lp-label" htmlFor="password">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-iicon"><Icon name="lock" size={15}/></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lp-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={15}/>
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="lp-error" role="alert">
                <Icon name="warning" size={13}/>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="lp-submit"
              disabled={loading}
              id="login-btn"
            >
              {loading ? (
                <><span className="spinner sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}/> Authenticating…</>
              ) : (
                <><Icon name="key" size={16}/> Sign In</>
              )}
            </button>

          </form>

          {/* Card footer */}
          <div className="lp-card-footer">
            <span className="lp-hint">
              <Icon name="shield" size={11}/>
              &nbsp;Flat 101–310 &nbsp;·&nbsp; Secure access
            </span>
            <span className="lp-credit">
              By <strong>Suvadip Panja</strong>
            </span>
          </div>
        </div>
      </main>

      {/* ── Inline styles ── */}
      <style>{`
        /* ── Root layout ── */
        .lp-root {
          min-height: 100vh;
          display: flex;
          background: #080a12;
          position: relative;
          overflow: hidden;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }

        /* ── Animated background ── */
        .lp-backdrop {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          animation: lpFloat 10s ease-in-out infinite alternate;
        }
        .lp-orb1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #1d4ed8 0%, transparent 70%);
          top: -180px; left: -120px;
          opacity: 0.35;
        }
        .lp-orb2 {
          width: 460px; height: 460px;
          background: radial-gradient(circle, #065f46 0%, transparent 70%);
          bottom: -150px; right: -120px;
          opacity: 0.3;
          animation-delay: -5s;
        }
        .lp-orb3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          opacity: 0.12;
          animation-delay: -2.5s;
        }
        @keyframes lpFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -30px) scale(1.05); }
        }
        .lp-mesh {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* ══ LEFT PANEL ══ */
        .lp-left {
          flex: 0 0 52%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
        }
        .lp-left-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        /* Logo mark */
        .lp-logo-mark {
          width: 52px; height: 52px;
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.25);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 24px rgba(59,130,246,0.2);
        }

        /* Building illustration */
        .lp-illus-wrap {
          position: relative;
          margin-bottom: 1.75rem;
        }
        .lp-illus-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, transparent 70%);
          border-radius: 50%;
          animation: lpPulse 4s ease-in-out infinite;
        }
        @keyframes lpPulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        .lp-building-svg {
          width: 200px;
          height: 200px;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 8px 32px rgba(59,130,246,0.35));
          animation: lpBuildingFloat 6s ease-in-out infinite alternate;
        }
        @keyframes lpBuildingFloat {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }

        /* Brand name */
        .lp-brand {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.1;
          color: white;
          letter-spacing: -0.03em;
          margin-bottom: 0.4rem;
          font-family: var(--font-display, 'Outfit', sans-serif);
        }
        .lp-brand-accent {
          background: linear-gradient(135deg, #60a5fa, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-tagline {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        /* Stats row */
        .lp-stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.75rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 50px;
          padding: 0.55rem 1.5rem;
        }
        .lp-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
        }
        .lp-stat-val {
          font-size: 0.92rem;
          font-weight: 700;
          color: white;
        }
        .lp-stat-lbl {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .lp-stat-sep {
          width: 1px; height: 28px;
          background: rgba(255,255,255,0.1);
        }

        /* Features */
        .lp-features {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          width: 100%;
        }
        .lp-feature {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.55rem 1rem;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.65);
          text-align: left;
          transition: all 0.2s ease;
        }
        .lp-feature:hover {
          background: rgba(59,130,246,0.08);
          border-color: rgba(59,130,246,0.2);
          color: rgba(255,255,255,0.85);
        }
        .lp-feature-icon {
          width: 26px; height: 26px;
          background: rgba(59,130,246,0.15);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: #60a5fa;
          flex-shrink: 0;
        }

        /* ══ RIGHT PANEL ══ */
        .lp-right {
          flex: 0 0 48%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 2.5rem;
          position: relative;
          z-index: 1;
        }

        /* Card */
        .lp-card {
          width: 100%;
          max-width: 400px;
          background: rgba(14, 17, 28, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 2.5rem 2.25rem 2rem;
          box-shadow:
            0 24px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: lpCardIn 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes lpCardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-card-topbar {
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 2px;
          margin: -2.5rem -2.25rem 2rem;
          border-radius: 24px 24px 0 0;
        }

        /* Welcome */
        .lp-welcome { margin-bottom: 2rem; }
        .lp-welcome-h {
          font-size: 1.65rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
          font-family: var(--font-display, 'Outfit', sans-serif);
        }
        .lp-welcome-sub {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.4);
        }

        /* Fields */
        .lp-field {
          margin-bottom: 1.1rem;
          position: relative;
        }
        .lp-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }
        .lp-field.focused .lp-label { color: #60a5fa; }

        .lp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .lp-iicon {
          position: absolute;
          left: 0.9rem;
          color: rgba(255,255,255,0.25);
          transition: color 0.2s;
          pointer-events: none;
          z-index: 1;
          display: flex;
        }
        .lp-field.focused .lp-iicon { color: #60a5fa; }

        .lp-input {
          width: 100%;
          height: 3rem;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: white;
          font-size: 0.95rem;
          padding: 0 1rem 0 2.6rem;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .lp-input::placeholder { color: rgba(255,255,255,0.2); }
        .lp-input:focus {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.07);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.18);
        }

        .lp-eye {
          position: absolute;
          right: 0.75rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          display: flex; align-items: center;
          padding: 0.35rem;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .lp-eye:hover { color: white; background: rgba(255,255,255,0.08); }

        /* Error */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 0.9rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.82rem;
          margin-bottom: 1rem;
          animation: lpShake 0.35s ease;
        }
        @keyframes lpShake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-5px); }
          40%,80%  { transform: translateX(5px); }
        }

        /* Submit button */
        .lp-submit {
          width: 100%;
          height: 3rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
          font-family: inherit;
          letter-spacing: 0.01em;
        }
        .lp-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          box-shadow: 0 6px 28px rgba(59,130,246,0.5);
          transform: translateY(-1px);
        }
        .lp-submit:active:not(:disabled) { transform: translateY(0); }
        .lp-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Card footer */
        .lp-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .lp-hint {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.25);
        }
        .lp-credit {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.22);
        }
        .lp-credit strong {
          color: rgba(255,255,255,0.4);
          font-weight: 600;
        }

        /* ── Responsive: collapse to single column on mobile ── */
        @media (max-width: 768px) {
          .lp-root { flex-direction: column; }
          .lp-left {
            flex: none;
            padding: 2.5rem 1.5rem 1.5rem;
          }
          .lp-building-svg { width: 140px; height: 140px; }
          .lp-brand { font-size: 1.5rem; }
          .lp-features { display: none; }
          .lp-right {
            flex: none;
            padding: 1.5rem;
          }
        }
        @media (max-width: 480px) {
          .lp-left { padding: 1.75rem 1rem 1rem; }
          .lp-building-svg { width: 110px; height: 110px; }
          .lp-stats { display: none; }
        }
      `}</style>
    </div>
  );
}
