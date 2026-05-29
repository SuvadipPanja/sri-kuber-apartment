import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

/* ─────────────────────────────────────────────────────────────
   NIGHT CITY SKYLINE — SVG illustration with animated windows
───────────────────────────────────────────────────────────── */
function NightSkyline() {
  /* Helper: window rect generator for a building */
  const wins = (bldg, cols, rows, ox, oy, ww, wh, gx, gy, palette, anims) =>
    Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      return (
        <rect
          key={`${bldg}${i}`}
          x={ox + c * (ww + gx)}
          y={oy + r * (wh + gy)}
          width={ww} height={wh} rx="1.4"
          fill={palette[i % palette.length]}
          className={anims[i % anims.length]}
          filter="url(#wg)"
        />
      );
    });

  const WY  = ['#fbbf24','#60a5fa','white','#10b981','#fde68a','#93c5fd']; // warm + cool
  const WB  = ['white','#60a5fa','#fbbf24','white','#6ee7b7','white'];      // balanced
  const WC  = ['white','#fbbf24','#60a5fa','white','#10b981','white','#fde68a','#93c5fd']; // full mix
  const A1  = ['wl','wf1','wl','wf2','wd','wl','wf1','wl','wf3','wl','wf2','wl'];
  const A2  = ['wl','wf2','wl','wf1','wl','wd','wl','wf3','wl','wf1','wl','wl'];
  const A3  = ['wl','wf1','wl','wl','wf2','wl','wd','wl','wf1','wl','wl','wf3','wl','wl','wf2','wl'];

  return (
    <svg viewBox="0 0 340 218" className="lp-skyline" aria-hidden="true">
      <defs>
        <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#010208"/>
          <stop offset="60%"  stopColor="#030b18"/>
          <stop offset="100%" stopColor="#07121e"/>
        </linearGradient>
        <linearGradient id="lcbar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#10b981"/>
        </linearGradient>
        <radialGradient id="lgg" cx="50%" cy="100%" r="55%">
          <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0"/>
        </radialGradient>
        {/* Window glow */}
        <filter id="wg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Moon soft edge */}
        <filter id="mf">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="340" height="218" fill="url(#lsky)"/>

      {/* ── Stars ── */}
      {[[18,12,1.2,1],[52,6,0.9,2],[88,18,0.8,0],[128,5,1.1,1],[172,14,0.9,2],
        [215,9,1,0],[258,16,0.8,1],[302,6,1.1,2],[325,24,0.7,0],
        [35,36,0.7,1],[68,44,0.8,2],[108,30,0.7,0],[148,40,0.8,1],
        [195,26,0.7,2],[235,38,0.6,0],[278,28,0.8,1],[316,40,0.7,2],
        [8,60,0.6,0],[44,68,0.7,1],[90,58,0.6,2],[142,70,0.7,0],[190,62,0.5,1],
      ].map(([cx,cy,r,t],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="white"
          opacity={0.15+0.15*(i%3)} className={t===0?'sTwk':''}/>
      ))}

      {/* ── Moon (crescent) ── */}
      <circle cx="296" cy="31" r="22" fill="#fef9c3" filter="url(#mf)" opacity="0.18"/>
      <circle cx="296" cy="31" r="17" fill="#fffbeb" opacity="0.95"/>
      <circle cx="305" cy="25" r="13.5" fill="#030c1c"/>

      {/* ── Ground glow ── */}
      <ellipse cx="170" cy="218" rx="168" ry="16" fill="url(#lgg)"/>

      {/* ════ BUILDINGS ════ */}

      {/* Building A — far left, narrow, 7 floors */}
      <rect x="4"   y="112" width="34" height="106" rx="2" fill="#0e1621"/>
      <rect x="4"   y="112" width="34" height="3"   rx="1" fill="#1d4ed8" opacity="0.5"/>
      {wins('a',2,7,  10,120,  8,9,  10,5,  WY, A1)}

      {/* Building B — left, medium, 9 floors */}
      <rect x="50"  y="87"  width="50" height="131" rx="2" fill="#0b1420"/>
      <rect x="50"  y="87"  width="50" height="3"   rx="1" fill="#2563eb" opacity="0.5"/>
      {/* Rooftop water tank */}
      <rect x="62"  y="79"  width="14" height="9"   rx="1.5" fill="#080e19"/>
      <rect x="59"  y="77"  width="20" height="3"   rx="1"   fill="#060b13"/>
      {wins('b',3,9,  57,97,  9,8,  5,4,  WB, A2)}

      {/* Building C — CENTRE TOWER (tallest) */}
      <rect x="114" y="38"  width="86" height="180" rx="3" fill="#080f1e"/>
      <rect x="114" y="38"  width="86" height="5"   rx="2" fill="url(#lcbar)"/>
      {/* Antenna */}
      <rect x="155" y="22"  width="3"  height="18"  rx="1" fill="#182030"/>
      <circle cx="156.5" cy="21" r="3" fill="#ef4444" opacity="0.95" className="wf3"/>
      {/* Side depth strips */}
      <rect x="114" y="43" width="4" height="175" fill="#040a14" opacity="0.6"/>
      <rect x="196" y="43" width="4" height="175" fill="#040a14" opacity="0.6"/>
      {wins('c',4,11, 122,52, 13,9,  5,4,  WC, A3)}
      {/* Door */}
      <rect x="149" y="195" width="22" height="23" rx="2"   fill="#040c1c"/>
      <rect x="159" y="199" width="2"  height="16" rx="1"   fill="#1e3a8a" opacity="0.4"/>
      <circle cx="165" cy="209" r="2.2" fill="#2563eb" opacity="0.35"/>

      {/* Building D — right of centre, medium-high, 10 floors */}
      <rect x="214" y="82"  width="56" height="136" rx="2" fill="#0c1421"/>
      <rect x="214" y="82"  width="56" height="3"   rx="1" fill="#1d4ed8" opacity="0.45"/>
      {/* Rooftop ledge */}
      <rect x="221" y="74"  width="32" height="9"   rx="1.5" fill="#080d19"/>
      {wins('d',3,10, 221,92, 10,8,  5,4,  WY, A1)}

      {/* Building E — far right, short, 5 floors */}
      <rect x="283" y="148" width="50" height="70"  rx="2" fill="#0d1520"/>
      <rect x="283" y="148" width="50" height="3"   rx="1" fill="#1e40af" opacity="0.4"/>
      {wins('e',2,5,  291,157, 12,9, 10,4,  WB, A2)}

      {/* ── Ground line ── */}
      <rect x="0"   y="215" width="340" height="3"  fill="#08101e"/>
      <rect x="30"  y="216" width="280" height="1"  fill="#2563eb" opacity="0.1"/>

      {/* ── Ambient particle lights ── */}
      {[60,140,215,285].map((cx,i)=>(
        <circle key={`lp${i}`} cx={cx} cy={180-i*8} r="1.2"
          fill="#60a5fa" opacity="0.3" className={`lprt lp${i%3}`}/>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN LOGIN PAGE
───────────────────────────────────────────────────────────── */
export default function Login() {
  const [flatNo,       setFlatNo]       = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [flatFocused,  setFlatFocused]  = useState(false);
  const [passFocused,  setPassFocused]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flatNo.trim() || !password.trim()) {
      setError('Please enter your flat number and password.');
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

      {/* ── Ambient background ── */}
      <div className="lp-back">
        <div className="lp-orb lp-o1"/>
        <div className="lp-orb lp-o2"/>
        <div className="lp-orb lp-o3"/>
        <div className="lp-mesh"/>
      </div>

      {/* ══════════ LEFT — VISUAL PANEL ══════════ */}
      <aside className="lp-left">

        {/* Floating particles */}
        <div className="lp-particles" aria-hidden="true">
          {[...Array(12)].map((_,i) => (
            <span key={i} className={`lp-p lp-p${i%4}`}
              style={{ left: `${8+i*8}%`, animationDelay: `${i*0.7}s`, animationDuration: `${5+i*0.4}s` }}
            />
          ))}
        </div>

        <div className="lp-left-inner">
          {/* Logo stamp */}
          <div className="lp-stamp">
            <img src="/favicon.svg" alt="" width="32" height="32"/>
          </div>

          {/* Skyline illustration */}
          <div className="lp-scene">
            <div className="lp-scene-glow"/>
            <NightSkyline/>
          </div>

          {/* Society identity */}
          <h1 className="lp-soc-name">
            Sri Kuber<br/>
            <span className="lp-soc-grad">Apartment</span>
          </h1>
          <p className="lp-soc-tag">Society Management Portal</p>
        </div>
      </aside>

      {/* ══════════ RIGHT — LOGIN FORM ══════════ */}
      <main className="lp-right">
        <div className="lp-card">

          {/* Top gradient bar */}
          <div className="lp-card-bar"/>

          {/* Welcome heading */}
          <div className="lp-welcome">
            <h2 className="lp-wh">Welcome back</h2>
            <p className="lp-ws">Enter your flat credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Flat Number */}
            <div className={`lp-field ${flatFocused ? 'lf-focus' : ''}`}>
              <label className="lp-lbl" htmlFor="flatNo">Flat Number</label>
              <div className="lp-iw">
                <span className="lp-ii"><Icon name="building" size={15}/></span>
                <input
                  id="flatNo" type="text"
                  className="lp-inp"
                  placeholder="e.g. 102, 301"
                  value={flatNo}
                  onChange={e => { setFlatNo(e.target.value); setError(''); }}
                  onFocus={() => setFlatFocused(true)}
                  onBlur={() => setFlatFocused(false)}
                  autoFocus autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className={`lp-field ${passFocused ? 'lf-focus' : ''}`}>
              <label className="lp-lbl" htmlFor="password">Password</label>
              <div className="lp-iw">
                <span className="lp-ii"><Icon name="lock" size={15}/></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lp-inp"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" className="lp-eye"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide' : 'Show'}
                  tabIndex={-1}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={15}/>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="lp-err" role="alert">
                <Icon name="warning" size={13}/>
                <span>{error}</span>
              </div>
            )}

            {/* Sign In button */}
            <button type="submit" className="lp-btn" disabled={loading} id="login-btn">
              {loading
                ? <><span className="spinner sm" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }}/> Authenticating…</>
                : <><Icon name="key" size={16}/> Sign In</>
              }
            </button>

          </form>

          {/* Footer */}
          <p className="lp-credit">Developed by <strong>Suvadip Panja</strong></p>

        </div>
      </main>

      {/* ══════════ ALL STYLES ══════════ */}
      <style>{`
        /* ── Root ── */
        .lp-root {
          min-height: 100vh;
          display: flex;
          background: #05080f;
          position: relative;
          overflow: hidden;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }

        /* ── Ambient bg ── */
        .lp-back { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .lp-orb  { position:absolute; border-radius:50%; animation:lpFlt 12s ease-in-out infinite alternate; }
        .lp-o1   { width:580px; height:580px; background:radial-gradient(circle,#1a3a8a 0%,transparent 70%); top:-200px; left:-160px; opacity:.35; filter:blur(100px); }
        .lp-o2   { width:480px; height:480px; background:radial-gradient(circle,#064e3b 0%,transparent 70%); bottom:-160px; right:-140px; opacity:.28; filter:blur(90px); animation-delay:-6s; }
        .lp-o3   { width:320px; height:320px; background:radial-gradient(circle,#4c1d95 0%,transparent 70%); top:55%; left:48%; transform:translate(-50%,-50%); opacity:.14; filter:blur(80px); animation-delay:-3s; }
        @keyframes lpFlt {
          0%   { transform:translate(0,0) scale(1); }
          100% { transform:translate(28px,-28px) scale(1.06); }
        }
        .lp-mesh {
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px),
            linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px);
          background-size:44px 44px;
        }

        /* ── Left panel ── */
        .lp-left {
          flex: 0 0 54%;
          display:flex; align-items:center; justify-content:center;
          padding:2rem 1.5rem;
          position:relative; z-index:1; overflow:hidden;
        }
        .lp-left-inner {
          display:flex; flex-direction:column; align-items:center; text-align:center;
          width:100%; max-width:440px;
        }

        /* Floating particles */
        .lp-particles { position:absolute; inset:0; pointer-events:none; }
        .lp-p {
          position:absolute; bottom:-6px;
          width:3px; height:3px; border-radius:50%;
          background:#60a5fa; opacity:0;
          animation:lpPUp linear infinite;
        }
        .lp-p0 { background:#60a5fa; }
        .lp-p1 { background:#10b981; width:2px; height:2px; }
        .lp-p2 { background:#a78bfa; width:2.5px; height:2.5px; }
        .lp-p3 { background:#fbbf24; width:2px; height:2px; }
        @keyframes lpPUp {
          0%   { transform:translateY(0)  scale(1);   opacity:0; }
          10%  { opacity:.45; }
          90%  { opacity:.2; }
          100% { transform:translateY(-100vh) scale(.4); opacity:0; }
        }

        /* Logo stamp */
        .lp-stamp {
          width:48px; height:48px;
          background:rgba(59,130,246,.1);
          border:1px solid rgba(59,130,246,.2);
          border-radius:13px;
          display:flex; align-items:center; justify-content:center;
          margin-bottom:1.25rem;
          box-shadow:0 0 24px rgba(59,130,246,.18);
        }

        /* Skyline scene */
        .lp-scene {
          position:relative;
          width:100%; max-width:380px;
          margin-bottom:1.6rem;
        }
        .lp-scene-glow {
          position:absolute; inset:-30px;
          background:radial-gradient(ellipse at center,rgba(59,130,246,.14) 0%,transparent 68%);
          border-radius:50%;
          animation:lpScGlow 5s ease-in-out infinite;
        }
        @keyframes lpScGlow {
          0%,100% { opacity:.8; transform:scale(1); }
          50%      { opacity:1; transform:scale(1.06); }
        }
        .lp-skyline {
          width:100%; height:auto;
          position:relative; z-index:1;
          filter:drop-shadow(0 12px 36px rgba(59,130,246,.3));
          animation:lpSkFloat 7s ease-in-out infinite alternate;
        }
        @keyframes lpSkFloat {
          0%   { transform:translateY(0); }
          100% { transform:translateY(-9px); }
        }

        /* Society name */
        .lp-soc-name {
          font-size:2.1rem; font-weight:800; line-height:1.1;
          color:white; letter-spacing:-.03em;
          margin:0 0 .4rem;
          font-family:var(--font-display,'Outfit',sans-serif);
        }
        .lp-soc-grad {
          background:linear-gradient(135deg,#60a5fa,#10b981);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .lp-soc-tag {
          font-size:.72rem; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(255,255,255,.35); margin:0;
        }

        /* ── Window animation keyframes ── */
        .wl  { /* always lit — no animation */ }
        .wd  { opacity:.12 !important; }
        .wf1 { animation:lpWink 7.5s ease-in-out infinite; }
        .wf2 { animation:lpWink 5.2s ease-in-out infinite 2.4s; }
        .wf3 { animation:lpWink 3.8s ease-in-out infinite 1.1s; }
        @keyframes lpWink {
          0%,38%,62%,100% { opacity:.72; }
          45%,55%         { opacity:.06; }
        }
        /* Star twinkle */
        .sTwk { animation:lpStar 4s ease-in-out infinite; }
        @keyframes lpStar {
          0%,100% { opacity:.18; } 50% { opacity:.55; }
        }
        /* Ambient particles in SVG */
        .lprt { animation:lpPrt 8s ease-in-out infinite alternate; }
        .lp0  { animation-delay:0s; }
        .lp1  { animation-delay:-2.6s; }
        .lp2  { animation-delay:-5.2s; }
        @keyframes lpPrt {
          0%   { opacity:.1; transform:translateY(0); }
          100% { opacity:.4; transform:translateY(-12px); }
        }

        /* ── Right panel ── */
        .lp-right {
          flex:0 0 46%;
          display:flex; align-items:center; justify-content:center;
          padding:2rem 2.5rem;
          position:relative; z-index:1;
        }

        /* ── Card ── */
        .lp-card {
          width:100%; max-width:390px;
          background:rgba(10,14,24,.88);
          backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(255,255,255,.07);
          border-radius:24px;
          padding:2.5rem 2.25rem 2rem;
          box-shadow:0 28px 72px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05);
          animation:lpCardIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes lpCardIn {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lp-card-bar {
          height:3px;
          background:linear-gradient(90deg,#3b82f6,#10b981);
          border-radius:24px 24px 0 0;
          margin:-2.5rem -2.25rem 2.25rem;
        }

        /* Welcome */
        .lp-welcome { margin-bottom:2rem; }
        .lp-wh {
          font-size:1.7rem; font-weight:700; color:white;
          letter-spacing:-.025em; margin:0 0 .3rem;
          font-family:var(--font-display,'Outfit',sans-serif);
        }
        .lp-ws { font-size:.82rem; color:rgba(255,255,255,.38); margin:0; }

        /* Fields */
        .lp-field { margin-bottom:1.1rem; }
        .lp-lbl {
          display:block; font-size:.72rem; font-weight:600;
          text-transform:uppercase; letter-spacing:.09em;
          color:rgba(255,255,255,.35); margin-bottom:.45rem;
          transition:color .2s;
        }
        .lf-focus .lp-lbl { color:#60a5fa; }
        .lp-iw { position:relative; display:flex; align-items:center; }
        .lp-ii {
          position:absolute; left:.9rem; z-index:1;
          color:rgba(255,255,255,.22); pointer-events:none;
          display:flex; transition:color .2s;
        }
        .lf-focus .lp-ii { color:#60a5fa; }
        .lp-inp {
          width:100%; height:3rem;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.07);
          border-radius:12px; color:white; font-size:.95rem;
          padding:0 1rem 0 2.55rem; outline:none;
          transition:all .2s; font-family:inherit; box-sizing:border-box;
        }
        .lp-inp::placeholder { color:rgba(255,255,255,.18); }
        .lp-inp:focus {
          border-color:#3b82f6;
          background:rgba(59,130,246,.08);
          box-shadow:0 0 0 3px rgba(59,130,246,.16);
        }
        .lp-eye {
          position:absolute; right:.7rem;
          background:transparent; border:none; cursor:pointer;
          color:rgba(255,255,255,.28); display:flex; align-items:center;
          padding:.35rem; border-radius:6px; transition:all .15s;
        }
        .lp-eye:hover { color:white; background:rgba(255,255,255,.08); }

        /* Error */
        .lp-err {
          display:flex; align-items:center; gap:.5rem;
          padding:.6rem .85rem;
          background:rgba(239,68,68,.09);
          border:1px solid rgba(239,68,68,.22);
          border-radius:10px; color:#fca5a5; font-size:.8rem;
          margin-bottom:.9rem;
          animation:lpShk .38s ease;
        }
        @keyframes lpShk {
          0%,100% { transform:translateX(0); }
          20%,60%  { transform:translateX(-5px); }
          40%,80%  { transform:translateX(5px); }
        }

        /* Sign In button */
        .lp-btn {
          width:100%; height:3rem;
          background:linear-gradient(135deg,#3b82f6,#2563eb);
          color:white; border:none; border-radius:12px;
          font-size:.95rem; font-weight:600; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          margin-top:.4rem; font-family:inherit; letter-spacing:.01em;
          transition:all .2s;
          box-shadow:0 4px 22px rgba(59,130,246,.32);
        }
        .lp-btn:hover:not(:disabled) {
          background:linear-gradient(135deg,#60a5fa,#3b82f6);
          box-shadow:0 6px 30px rgba(59,130,246,.48);
          transform:translateY(-1px);
        }
        .lp-btn:active:not(:disabled) { transform:translateY(0); }
        .lp-btn:disabled { opacity:.6; cursor:not-allowed; }

        /* Credit */
        .lp-credit {
          text-align:center; margin-top:1.75rem; padding-top:1.2rem;
          border-top:1px solid rgba(255,255,255,.05);
          font-size:.7rem; color:rgba(255,255,255,.2);
        }
        .lp-credit strong { color:rgba(255,255,255,.35); font-weight:600; }

        /* ── Mobile ── */
        @media (max-width:800px) {
          .lp-root { flex-direction:column; }
          .lp-left { flex:none; padding:2rem 1.5rem 1rem; }
          .lp-skyline { max-height:180px; }
          .lp-soc-name { font-size:1.6rem; }
          .lp-right { flex:none; padding:1.25rem 1.25rem 2rem; }
          .lp-card { padding:2rem 1.5rem 1.75rem; }
        }
        @media (max-width:480px) {
          .lp-left { padding:1.5rem 1rem .75rem; }
          .lp-skyline { max-height:140px; }
          .lp-soc-name { font-size:1.35rem; }
          .lp-stamp { display:none; }
          .lp-particles { display:none; }
        }
      `}</style>
    </div>
  );
}
