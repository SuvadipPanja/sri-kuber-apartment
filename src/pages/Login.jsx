import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

/* ────────────────────────────────────────────────────────────────
   CANVAS ANIMATION — Night City Skyline
   • Sky gradient  • Twinkling stars  • Crescent moon
   • 5 buildings with animated glowing windows (JS-controlled)
   • Floating firefly particles with glow
   • Mouse-parallax depth (buildings shift on hover)
──────────────────────────────────────────────────────────────── */
function NightCanvas() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    /* ── Helpers ── */
    function rr(cx, x, y, w, h, r = 2) {
      cx.beginPath();
      if (cx.roundRect) cx.roundRect(x, y, w, h, r);
      else cx.rect(x, y, w, h);
      cx.fill();
    }

    /* ── State ── */
    let W = 0, H = 0, rafId = 0, frame = 0;
    let stars = [], particles = [], windows = [];

    /* Building definitions
       [xRatio, heightRatio, widthRatio, bodyColor, accentColor, cols, rows, winW, winH] */
    const BLDGS = [
      [0.02,  0.44, 0.09,  '#0d1520', '#1d4ed8', 2,  7,  9,  8],
      [0.135, 0.60, 0.125, '#0b1320', '#2563eb', 3,  9,  9,  7],
      [0.295, 0.80, 0.225, '#070e1c', 'grad',    4, 12, 13,  9],
      [0.575, 0.62, 0.145, '#0c1421', '#1d4ed8', 3, 10,  9,  8],
      [0.765, 0.38, 0.105, '#0d1520', '#1e40af', 2,  5, 10,  8],
    ];
    const WIN_COLORS = [
      '#fbbf24','#60a5fa','white','#10b981',
      '#fde68a','#93c5fd','white','#fbbf24',
    ];
    const PARTICLES_MAX = 40;

    /* ── Init (called on mount + resize) ── */
    function init() {
      W = canvas.offsetWidth  || 500;
      H = canvas.offsetHeight || 420;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      /* Stars */
      stars = Array.from({ length: 90 }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H * 0.65,
        r:     Math.random() * 1.3 + 0.3,
        base:  Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2,
        spd:   Math.random() * 0.018 + 0.005,
      }));

      /* Pre-compute window positions */
      windows = [];
      BLDGS.forEach(([xr, hr, wr,,,cols, rows, ww, wh], bi) => {
        const bw  = W * wr;
        const bh  = H * hr;
        const bx0 = W * xr;
        const by0 = H - bh;
        const gx  = cols > 1 ? (bw - cols * ww - 8) / (cols - 1) : 0;
        const gy  = rows > 1 ? (bh - rows * wh - 18) / (rows - 1) : 0;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            windows.push({
              bx: bx0 + 4 + c * (ww + gx),
              by: by0 + 10 + r * (wh + gy),
              w:  ww, h: wh,
              bi,
              lit:      Math.random() > 0.25,
              color:    WIN_COLORS[Math.floor(Math.random() * WIN_COLORS.length)],
              nextFlip: Date.now() + Math.random() * 12000 + 3000,
            });
          }
        }
      });
    }

    /* ── Spawn firefly particle ── */
    function spawnParticle() {
      const colors = ['#60a5fa','#10b981','#fbbf24','#a78bfa','#6ee7b7','#f9a8d4'];
      particles.push({
        x:       W * 0.08 + Math.random() * W * 0.84,
        y:       H + 6,
        vx:      (Math.random() - 0.5) * 0.45,
        vy:      -(Math.random() * 0.75 + 0.3),
        r:       Math.random() * 1.8 + 0.4,
        color:   colors[Math.floor(Math.random() * colors.length)],
        life:    0,
        maxLife: Math.random() * 280 + 130,
      });
    }

    /* ── Draw loop ── */
    function draw() {
      frame++;
      ctx.clearRect(0, 0, W, H);

      /* Sky gradient */
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0,   '#010208');
      sky.addColorStop(0.5, '#030a16');
      sky.addColorStop(1,   '#07121e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      /* ── TASK B: Twinkling stars — opacity + scale pulse (PDF spec) ── */
      stars.forEach(s => {
        s.phase += s.spd;
        const t     = (Math.sin(s.phase) + 1) / 2;          // 0 → 1
        const a     = s.base * (0.2 + 0.6 * t);             // opacity 0.2×base → 0.8×base
        const scale = 0.8 + 0.2 * t;                        // scale 0.8 → 1.0
        ctx.globalAlpha = a;
        ctx.fillStyle   = 'white';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2);    // radius scaled
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* Moon — glow halo */
      const mx = W * 0.86, my = H * 0.11;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 50);
      mg.addColorStop(0, 'rgba(255,251,194,0.14)');
      mg.addColorStop(1, 'transparent');
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, W, H);
      /* Moon disk */
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath(); ctx.arc(mx, my, 21, 0, Math.PI * 2); ctx.fill();
      /* Crescent bite */
      ctx.fillStyle = '#030c1c';
      ctx.beginPath(); ctx.arc(mx + 9, my - 5, 16, 0, Math.PI * 2); ctx.fill();

      /* Mouse parallax factors */
      const ox = (mouseRef.current.x / W - 0.5) * 16;
      const oy = (mouseRef.current.y / H - 0.5) * 8;

      /* ── TASK A: smooth-float — 7s vertical levitation (PDF spec) ──
         Period 7s @ 60fps → ω = 2π/420 ≈ 0.01497
         Amplitude: 12px (matches PDF: translateY(-12px))
         Moon stays at fixed coordinates — float NOT applied there. */
      const buildFloat = Math.sin(frame * 0.01497) * 12;

      /* ── TASK C: window-glow brightness pulse — 6s alternate (PDF spec) ──
         Period 6s @ 60fps → ω = 2π/360 ≈ 0.01745
         Equivalent to CSS brightness(1) → brightness(1.4) alternate:
         Canvas has no filter per-element; we pulse shadowBlur 3 → 13 instead. */
      const glowPulse = 3 + 10 * ((Math.sin(frame * 0.01745) + 1) / 2);

      /* ── Buildings ── */
      BLDGS.forEach(([xr, hr, wr, tone, acc], bi) => {
        const bx = W * xr  + ox * (0.2 + bi * 0.1);
        const bw = W * wr;
        const bh = H * hr;
        const by = H - bh  + oy * 0.35 + buildFloat;  // ← Task A float applied

        /* Body shadow */
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur  = 22;
        ctx.fillStyle   = tone;
        rr(ctx, bx, by, bw, bh, 3);
        ctx.shadowBlur  = 0;

        /* Top accent bar */
        if (bi === 2) {
          const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
          bar.addColorStop(0, '#3b82f6');
          bar.addColorStop(1, '#10b981');
          ctx.fillStyle = bar;
        } else {
          ctx.fillStyle = acc;
        }
        ctx.globalAlpha = 0.7;
        rr(ctx, bx, by, bw, 4, 2);
        ctx.globalAlpha = 1;

        /* Centre tower extras */
        if (bi === 2) {
          /* Antenna */
          ctx.fillStyle = '#1a2535';
          ctx.fillRect(bx + bw / 2 - 1.5, by - 26, 3, 28);
          /* Blinking red light */
          if (Math.sin(frame * 0.055) > 0) {
            ctx.save();
            ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
            ctx.fillStyle   = '#ef4444';
            ctx.beginPath(); ctx.arc(bx + bw / 2, by - 27, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
          /* Side depth strips */
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(bx, by + 4, 4, bh - 4);
          ctx.fillRect(bx + bw - 4, by + 4, 4, bh - 4);
        }
      });

      /* ── Animated windows ── */
      const now = Date.now();
      windows.forEach(w => {
        /* Random flip */
        if (now > w.nextFlip) {
          w.lit      = !w.lit;
          w.nextFlip = now + Math.random() * 14000 + 4000;
        }
        const dx = ox * (0.2 + w.bi * 0.1);
        const dy = oy * 0.35 + buildFloat;  // ← Task A float applied to windows

        if (w.lit) {
          ctx.save();
          /* Task C: window-glow — glowPulse drives brightness equivalent */
          ctx.shadowColor = w.color; ctx.shadowBlur = glowPulse;
          ctx.fillStyle   = w.color; ctx.globalAlpha = 0.7 + 0.15 * ((Math.sin(frame * 0.01745) + 1) / 2);
          rr(ctx, w.bx + dx, w.by + dy, w.w, w.h, 1.5);
          ctx.restore();
        } else {
          ctx.fillStyle   = '#040a14'; ctx.globalAlpha = 0.72;
          rr(ctx, w.bx + dx, w.by + dy, w.w, w.h, 1.5);
          ctx.globalAlpha = 1;
        }
      });
      ctx.globalAlpha = 1;

      /* Ground glow */
      const gg = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.55);
      gg.addColorStop(0, 'rgba(29,78,216,0.2)');
      gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.fillRect(0, H - 30, W, 30);

      /* Ground line */
      ctx.strokeStyle = 'rgba(29,78,216,0.12)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(10, H - 2); ctx.lineTo(W - 10, H - 2);
      ctx.stroke();

      /* ── Firefly particles ── */
      if (frame % 9 === 0 && particles.length < PARTICLES_MAX) spawnParticle();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const a = Math.sin(Math.PI * p.life / p.maxLife) * 0.7;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = a;
        ctx.shadowColor  = p.color; ctx.shadowBlur = 7;
        ctx.fillStyle    = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    }

    /* ── Event listeners ── */
    const onMouse = e => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onResize = () => {
      cancelAnimationFrame(rafId);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
      init();
      draw();
    };

    canvas.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', onResize);
    init();
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-canvas" aria-hidden="true"/>;
}

/* ────────────────────────────────────────────────────────────────
   MAIN LOGIN COMPONENT
──────────────────────────────────────────────────────────────── */
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!flatNo.trim() || !password.trim()) {
      setError('Please enter your flat number and password.');
      return;
    }
    setLoading(true); setError('');
    const res = await login(flatNo.trim(), password);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div className="lp-root">

      {/* ── Ambient orbs behind everything ── */}
      <div className="lp-back" aria-hidden="true">
        <div className="lp-orb lp-o1"/>
        <div className="lp-orb lp-o2"/>
        <div className="lp-orb lp-o3"/>
      </div>

      {/* ══════════ LEFT — CANVAS PANEL ══════════ */}
      <aside className="lp-left">
        <NightCanvas/>

        {/* Text overlay — sits above canvas */}
        <div className="lp-overlay">
          <div className="lp-stamp">
            <img src="/favicon.svg" alt="" width="28" height="28"/>
          </div>
          <h1 className="lp-soc">
            Sri Kuber<br/>
            <span className="lp-soc-g">Apartment</span>
          </h1>
          <p className="lp-tag">Society Management Portal</p>
        </div>
      </aside>

      {/* ══════════ RIGHT — FORM CARD ══════════ */}
      <main className="lp-right">
        <div className="lp-card">

          <div className="lp-card-bar"/>

          <div className="lp-welcome">
            <h2 className="lp-wh">Welcome back</h2>
            <p className="lp-ws">Enter your flat credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            <div className={`lp-field ${flatFocused ? 'lf-on' : ''}`}>
              <label className="lp-lbl" htmlFor="flatNo">Flat Number</label>
              <div className="lp-iw">
                <span className="lp-ii"><Icon name="building" size={15}/></span>
                <input id="flatNo" type="text" className="lp-inp"
                  placeholder="e.g. 102, 301"
                  value={flatNo}
                  onChange={e => { setFlatNo(e.target.value); setError(''); }}
                  onFocus={() => setFlatFocused(true)}
                  onBlur={() => setFlatFocused(false)}
                  autoFocus autoComplete="username"/>
              </div>
            </div>

            <div className={`lp-field ${passFocused ? 'lf-on' : ''}`}>
              <label className="lp-lbl" htmlFor="password">Password</label>
              <div className="lp-iw">
                <span className="lp-ii"><Icon name="lock" size={15}/></span>
                <input id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lp-inp"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}/>
                <button type="button" className="lp-eye" tabIndex={-1}
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide' : 'Show'}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={15}/>
                </button>
              </div>
            </div>

            {error && (
              <div className="lp-err" role="alert">
                <Icon name="warning" size={13}/><span>{error}</span>
              </div>
            )}

            <button type="submit" className="lp-btn" disabled={loading} id="login-btn">
              {loading
                ? <><span className="spinner sm" style={{ borderColor:'rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Authenticating…</>
                : <><Icon name="key" size={16}/> Sign In</>
              }
            </button>

          </form>

          <p className="lp-credit">Developed by <strong>Suvadip Panja</strong></p>
        </div>
      </main>

      {/* ══════════ STYLES ══════════ */}
      <style>{`
        .lp-root {
          min-height:100vh; display:flex;
          background:#05080f; position:relative; overflow:hidden;
          font-family:var(--font-sans,'Inter',sans-serif);
        }

        /* Ambient orbs */
        .lp-back { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .lp-orb  { position:absolute; border-radius:50%; filter:blur(90px);
                   animation:lpFlt 12s ease-in-out infinite alternate; }
        .lp-o1   { width:560px; height:560px; background:radial-gradient(circle,#152e6e,transparent 70%);
                   top:-180px; left:-140px; opacity:.4; }
        .lp-o2   { width:480px; height:480px; background:radial-gradient(circle,#064433,transparent 70%);
                   bottom:-160px; right:-130px; opacity:.3; animation-delay:-6s; }
        .lp-o3   { width:300px; height:300px; background:radial-gradient(circle,#3b1f80,transparent 70%);
                   top:50%; left:50%; transform:translate(-50%,-50%); opacity:.14; animation-delay:-3s; }
        @keyframes lpFlt {
          0%   { transform:translate(0,0)        scale(1);    }
          100% { transform:translate(24px,-24px) scale(1.06); }
        }

        /* ── Left canvas panel ── */
        .lp-left {
          flex:0 0 55%; position:relative; z-index:1; overflow:hidden;
          display:flex; align-items:flex-end; justify-content:center;
        }
        /* QA: will-change for GPU acceleration (PDF checklist) */
        .lp-canvas {
          position:absolute; inset:0; width:100%; height:100%;
          display:block;
          will-change: transform, opacity;
        }

        /* Text overlay at bottom of canvas */
        .lp-overlay {
          position:relative; z-index:2;
          display:flex; flex-direction:column; align-items:center;
          padding-bottom:2.5rem; text-align:center;
          pointer-events:none;
        }
        .lp-stamp {
          width:44px; height:44px; border-radius:12px;
          background:rgba(59,130,246,.12);
          border:1px solid rgba(59,130,246,.25);
          display:flex; align-items:center; justify-content:center;
          margin-bottom:.85rem;
          box-shadow:0 0 20px rgba(59,130,246,.2);
        }
        .lp-soc {
          font-size:2rem; font-weight:800; line-height:1.08;
          color:white; letter-spacing:-.03em; margin:0 0 .35rem;
          font-family:var(--font-display,'Outfit',sans-serif);
          text-shadow:0 2px 20px rgba(0,0,0,.8);
        }
        .lp-soc-g {
          background:linear-gradient(135deg,#60a5fa,#10b981);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .lp-tag {
          font-size:.7rem; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(255,255,255,.35); margin:0;
          text-shadow:0 1px 8px rgba(0,0,0,.9);
        }

        /* ── Right form panel ── */
        .lp-right {
          flex:0 0 45%; display:flex; align-items:center; justify-content:center;
          padding:2rem 2.5rem; position:relative; z-index:1;
        }
        .lp-card {
          width:100%; max-width:385px;
          background:rgba(10,14,24,.9);
          backdrop-filter:blur(26px); -webkit-backdrop-filter:blur(26px);
          border:1px solid rgba(255,255,255,.07); border-radius:24px;
          padding:2.5rem 2.25rem 2rem;
          box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05);
          animation:lpIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes lpIn {
          from { opacity:0; transform:translateY(26px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .lp-card-bar {
          height:3px; background:linear-gradient(90deg,#3b82f6,#10b981);
          border-radius:24px 24px 0 0;
          margin:-2.5rem -2.25rem 2.25rem;
        }

        /* Welcome */
        .lp-welcome { margin-bottom:1.9rem; }
        .lp-wh {
          font-size:1.7rem; font-weight:700; color:white;
          letter-spacing:-.025em; margin:0 0 .3rem;
          font-family:var(--font-display,'Outfit',sans-serif);
        }
        .lp-ws { font-size:.82rem; color:rgba(255,255,255,.37); margin:0; }

        /* Fields */
        .lp-field { margin-bottom:1.1rem; }
        .lp-lbl {
          display:block; font-size:.72rem; font-weight:600;
          text-transform:uppercase; letter-spacing:.09em;
          color:rgba(255,255,255,.35); margin-bottom:.45rem;
          transition:color .2s;
        }
        .lf-on .lp-lbl { color:#60a5fa; }
        .lp-iw { position:relative; display:flex; align-items:center; }
        .lp-ii {
          position:absolute; left:.9rem; z-index:1;
          color:rgba(255,255,255,.22); pointer-events:none;
          display:flex; transition:color .2s;
        }
        .lf-on .lp-ii { color:#60a5fa; }
        .lp-inp {
          width:100%; height:3rem;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.07);
          border-radius:12px; color:white; font-size:.95rem;
          padding:0 1rem 0 2.6rem; outline:none;
          transition:all .2s; font-family:inherit; box-sizing:border-box;
        }
        .lp-inp::placeholder { color:rgba(255,255,255,.18); }
        .lp-inp:focus {
          border-color:#3b82f6; background:rgba(59,130,246,.08);
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
          margin-bottom:.9rem; animation:lpShk .38s ease;
        }
        @keyframes lpShk {
          0%,100% { transform:translateX(0);  }
          20%,60%  { transform:translateX(-5px); }
          40%,80%  { transform:translateX(5px);  }
        }

        /* Submit */
        .lp-btn {
          width:100%; height:3rem;
          background:linear-gradient(135deg,#3b82f6,#2563eb);
          color:white; border:none; border-radius:12px;
          font-size:.95rem; font-weight:600; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          margin-top:.4rem; font-family:inherit; letter-spacing:.01em;
          transition:all .2s;
          box-shadow:0 4px 24px rgba(59,130,246,.32);
        }
        .lp-btn:hover:not(:disabled) {
          background:linear-gradient(135deg,#60a5fa,#3b82f6);
          box-shadow:0 6px 32px rgba(59,130,246,.48);
          transform:translateY(-1px);
        }
        .lp-btn:active:not(:disabled)  { transform:translateY(0); }
        .lp-btn:disabled { opacity:.6; cursor:not-allowed; }

        /* Credit */
        .lp-credit {
          text-align:center; margin-top:1.75rem; padding-top:1.2rem;
          border-top:1px solid rgba(255,255,255,.05);
          font-size:.7rem; color:rgba(255,255,255,.2);
        }
        .lp-credit strong { color:rgba(255,255,255,.36); font-weight:600; }

        /* ── Responsive ── */
        @media (max-width:820px) {
          .lp-root  { flex-direction:column; }
          .lp-left  { flex:none; min-height:52vh; }
          .lp-right { flex:none; padding:1.5rem 1.25rem 2.5rem; }
          .lp-card  { padding:2rem 1.5rem 1.75rem; }
          .lp-soc   { font-size:1.65rem; }
        }
        @media (max-width:480px) {
          .lp-left  { min-height:44vh; }
          .lp-soc   { font-size:1.35rem; }
          .lp-overlay { padding-bottom:1.5rem; }
          .lp-stamp   { display:none; }
        }
      `}</style>
    </div>
  );
}
