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
      {/* 3D Modern Background with floating orbs and mesh */}
      <div className="login-bg">
        <div className="login-grid-mesh"></div>
        <div className="login-bg-orb orb1"></div>
        <div className="login-bg-orb orb2"></div>
        <div className="login-bg-orb orb3"></div>
      </div>

      <div className="login-container">
        {/* 3D Glassmorphism Card */}
        <div className="login-card slide-up">
          <div className="login-logo">
            <div className="login-3d-icon">
              <div className="building-icon">🏢</div>
            </div>
            <h1 className="login-title">Sri Kuber</h1>
            <p className="login-subtitle">Apartment Portal</p>
          </div>

          <form onSubmit={handleSubmit} id="login-form" noValidate className="login-form">
            <div className="form-group mb-2">
              <label className="form-label text-muted-c tracking-wider" htmlFor="flatNo">Flat Number</label>
              <div className="input-3d-wrapper">
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
              <div className="input-3d-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input"
                  placeholder="••••••••"
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
              <div className="alert alert-error login-error slide-up" role="alert">
                <span className="alert-icon">⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              id="login-btn"
              className="btn-3d-primary"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner sm" style={{ borderTopColor: 'white' }} /> Authenticating...</>
              ) : (
                'Secure Login →'
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
        /* Login Page Specific 3D Styles */
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05050f; /* Very deep dark background */
          position: relative;
          overflow: hidden;
          font-family: var(--font-sans);
        }

        .login-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        
        .login-grid-mesh {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(124, 106, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(124, 106, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
          animation: gridMove 20s linear infinite;
          opacity: 0.5;
        }

        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(40px) translateZ(-200px); }
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.2;
          animation: floatOrb 10s ease-in-out infinite;
        }
        
        .orb1 {
          width: 500px; height: 500px;
          background: #7c6aff;
          top: -100px; left: -150px;
        }
        .orb2 {
          width: 400px; height: 400px;
          background: #00e5b0;
          bottom: -150px; right: -50px;
          animation-delay: -3s;
          animation-duration: 12s;
        }
        .orb3 {
          width: 300px; height: 300px;
          background: #ff4757;
          top: 30%; right: 20%;
          animation-delay: -5s;
          opacity: 0.15;
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          padding: 1.5rem;
          position: relative;
          z-index: 10;
          perspective: 1000px;
        }

        /* 3D Glass Card */
        .login-card {
          background: linear-gradient(145deg, rgba(22, 22, 48, 0.7), rgba(13, 13, 30, 0.9));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(124, 106, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform-style: preserve-3d;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .login-card:hover {
          transform: translateY(-5px) rotateX(2deg) rotateY(-2deg);
          box-shadow: 
            0 30px 60px -12px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(124, 106, 255, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .login-logo {
          text-align: center;
          margin-bottom: 2.5rem;
          transform: translateZ(30px);
        }

        .login-3d-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.25rem;
          background: linear-gradient(135deg, #7c6aff, #00e5b0);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 10px 25px rgba(124, 106, 255, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.4),
            inset 0 -2px 0 rgba(0, 0, 0, 0.2);
          transform: rotate(-10deg) translateZ(40px);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .login-card:hover .login-3d-icon {
          transform: rotate(0deg) scale(1.1) translateZ(50px);
        }

        .building-icon {
          font-size: 2.8rem;
          filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
        }

        .login-title {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.2rem;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .login-subtitle {
          color: var(--accent);
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .login-form {
          transform: translateZ(20px);
        }

        /* 3D Inputs */
        .input-3d-wrapper {
          position: relative;
          border-radius: 12px;
          background: rgba(10, 10, 20, 0.6);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }
        
        .input-3d-wrapper:focus-within {
          box-shadow: 
            inset 0 2px 4px rgba(0,0,0,0.5), 
            0 0 0 2px rgba(124, 106, 255, 0.4),
            0 0 15px rgba(124, 106, 255, 0.2);
        }

        .login-input {
          background: transparent !important;
          border: 1px solid transparent !important;
          box-shadow: none !important;
          height: 3.2rem;
          font-size: 1rem;
          font-weight: 500;
          color: white;
        }
        
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
        .login-input:focus { border-color: transparent !important; background: transparent !important; }

        .password-toggle {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent !important;
          border: none !important;
          color: var(--text-muted);
        }
        .password-toggle:hover { color: white; background: rgba(255,255,255,0.1) !important; }

        .login-error {
          margin-bottom: 1.5rem;
          background: rgba(255, 71, 87, 0.15);
          border: 1px solid rgba(255, 71, 87, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        /* 3D Button */
        .btn-3d-primary {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #7c6aff, #5a48e0);
          color: white;
          font-weight: 700;
          font-size: 1.05rem;
          font-family: var(--font-display);
          letter-spacing: 0.05em;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          transform-style: preserve-3d;
          transition: all 0.2s ease;
          box-shadow: 
            0 6px 0 #4633b5,
            0 10px 20px rgba(124, 106, 255, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .btn-3d-primary:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 0 #4633b5,
            0 15px 25px rgba(124, 106, 255, 0.5),
            inset 0 1px 1px rgba(255, 255, 255, 0.5);
        }
        
        .btn-3d-primary:active {
          transform: translateY(4px);
          box-shadow: 
            0 2px 0 #4633b5,
            0 5px 10px rgba(124, 106, 255, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-primary:disabled {
          background: #44446a;
          box-shadow: 0 4px 0 #2a2a45;
          transform: translateY(2px);
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 2.5rem;
          transform: translateZ(10px);
        }

        .developer-credit {
          display: inline-block;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }

        .developer-credit:hover {
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 0 15px rgba(0, 229, 176, 0.1);
        }

        .dev-name {
          color: var(--accent);
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
